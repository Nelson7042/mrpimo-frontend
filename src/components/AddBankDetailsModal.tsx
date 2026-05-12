"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useVendorStore } from '@/stores/useVendorStore';

interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  country: string;
}

interface AddBankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryCode: string;
}

const PAYSTACK_COUNTRIES = ['NG', 'GH', 'ZA', 'KE', 'UG', 'TZ', 'RW', 'CI', 'SN'];

// South Africa uses the Validate Account API instead of Resolve Account
const VALIDATE_ACCOUNT_COUNTRIES = ['ZA'];

const AddBankDetailsModal: React.FC<AddBankDetailsModalProps> = ({ isOpen, onClose, countryCode }) => {
  const { vendor, setVendor } = useVendorStore();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // South Africa-specific fields for Validate Account API
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [documentType, setDocumentType] = useState<'identityNumber' | 'passportNumber' | 'businessRegistrationNumber'>('identityNumber');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  const isSouthAfrica = VALIDATE_ACCOUNT_COUNTRIES.includes(countryCode);

  // Fetch bank list on mount
  useEffect(() => {
    if (isOpen && PAYSTACK_COUNTRIES.includes(countryCode)) {
      fetchBanks();
    }
  }, [isOpen, countryCode]);

  // Auto-resolve account when both bank and account number are provided (Nigeria/Ghana only)
  useEffect(() => {
    if (isSouthAfrica) {
      // South Africa uses validate-account which requires extra fields, no auto-resolve
      return;
    }
    if (selectedBankCode && accountNumber.length >= 10) {
      const timer = setTimeout(() => {
        resolveAccount();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResolvedAccountName('');
      setResolveError('');
    }
  }, [selectedBankCode, accountNumber]);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/paystack/banks?country=${countryCode}`
      );
      const data = await response.json();
      if (data.success) {
        setBanks(data.banks || []);
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const resolveAccount = async () => {
    setIsResolving(true);
    setResolveError('');
    setResolvedAccountName('');
    try {
      const response = await fetch(`${API_BASE_URL}/paystack/resolve-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBankCode,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.account_name) {
        setResolvedAccountName(data.data.account_name);
      } else {
        setResolveError('Could not resolve account. Please check the details.');
      }
    } catch (error) {
      setResolveError('Failed to verify account. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const validateAccountZA = async () => {
    if (!accountName || !accountNumber || !selectedBankCode || !documentNumber) {
      setResolveError('Please fill in all required fields.');
      return;
    }
    setIsResolving(true);
    setResolveError('');
    setResolvedAccountName('');
    setIsValidated(false);
    try {
      const response = await fetch(`${API_BASE_URL}/paystack/validate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          accountNumber,
          accountType,
          bankCode: selectedBankCode,
          countryCode,
          documentType,
          documentNumber,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.verified) {
        setResolvedAccountName(accountName);
        setIsValidated(true);
      } else {
        setResolveError(data.data?.verificationMessage || data.message || 'Account validation failed. Please check your details.');
      }
    } catch (error) {
      console.error('Account validation error:', error);
      setResolveError('Failed to validate account. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSubmit = async () => {
    if (!resolvedAccountName || !selectedBankCode || !accountNumber) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const selectedBank = banks.find(b => b.code === selectedBankCode);
      const response = await fetchWithAuth(`${API_BASE_URL}/paystack/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: countryCode,
          businessName: vendor?.businessInfo?.name || resolvedAccountName,
          accountNumber,
          bankCode: selectedBankCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        // Update vendor store with new paystack details
        if (vendor) {
          setVendor({
            ...vendor,
            payStack: {
              ...vendor.payStack,
              paystackSubAccountCode: data.subaccountCode,
              paystackAccountName: data.accountName || resolvedAccountName,
              paystackBankCode: selectedBankCode,
              paystackBankName: selectedBank?.name,
              paystackStatus: 'verified',
              paystackVerificationStatus: 'verified',
            },
            bankDetails: {
              accountHolder: data.accountName || resolvedAccountName,
              accountNumber,
              bankName: selectedBank?.name || '',
              bankCode: selectedBankCode,
            },
          });
        }
      } else {
        setSubmitError(data.message || 'Failed to set up bank account. Please try again.');
      }
    } catch (error: any) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedBankCode('');
    setAccountNumber('');
    setResolvedAccountName('');
    setResolveError('');
    setSubmitError('');
    setIsSuccess(false);
    setAccountName('');
    setAccountType('personal');
    setDocumentType('identityNumber');
    setDocumentNumber('');
    setIsValidated(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-[440px] max-h-[90vh] overflow-y-auto m-4 shadow-xl font-roboto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Bank Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set up your payout account to receive payments</p>
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Account Added!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your bank account has been verified and linked. You can now receive payouts.
              </p>
              <button
                onClick={handleClose}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Bank <span className="text-red-500">*</span>
                </label>
                {loadingBanks ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading banks...
                  </div>
                ) : (
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="">Choose your bank</option>
                    {banks.map((bank, index) => (
                      <option key={`${bank.code}-${index}`} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder={isSouthAfrica ? "Enter your account number" : "Enter your 10-digit account number"}
                  maxLength={isSouthAfrica ? 20 : 10}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {/* South Africa-specific fields */}
              {isSouthAfrica && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Enter account holder's full name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as 'personal' | 'business')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as 'identityNumber' | 'passportNumber' | 'businessRegistrationNumber')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    >
                      <option value="identityNumber">SA Identity Number</option>
                      <option value="passportNumber">Passport Number</option>
                      {accountType === 'business' && (
                        <option value="businessRegistrationNumber">Business Registration Number</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {documentType === 'identityNumber' ? 'SA ID Number' : documentType === 'passportNumber' ? 'Passport Number' : 'Registration Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder={
                        documentType === 'identityNumber' ? 'Enter your 13-digit SA ID number'
                          : documentType === 'passportNumber' ? 'Enter your passport number'
                          : 'Enter your business registration number'
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  {/* Validate button for South Africa */}
                  {!isValidated && (
                    <button
                      onClick={validateAccountZA}
                      disabled={isResolving || !selectedBankCode || !accountNumber || !accountName || !documentNumber}
                      className="w-full px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResolving ? 'Validating...' : 'Validate Account'}
                    </button>
                  )}
                </>
              )}

              {/* Account Resolution Status */}
              {isResolving && !isSouthAfrica && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-md p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying account...
                </div>
              )}

              {resolvedAccountName && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{resolvedAccountName}</span>
                  {isSouthAfrica && <span className="text-xs text-green-600 ml-auto">Validated ✓</span>}
                </div>
              )}

              {resolveError && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md p-3">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {resolveError}
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md p-3">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!resolvedAccountName || isSubmitting}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Bank Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBankDetailsModal;
