"use client";

import React, { useState } from 'react';
import { X, Upload, User, Building2, CheckCircle, Clock } from 'lucide-react';
import { useKybStore } from '@/stores/useKybStore';
import { useKybRegistration, useKybStep2Registration } from '@/hooks/useKybRegistration';
import { useVendorStore } from '@/stores/useVendorStore';

interface KybModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KybModal: React.FC<KybModalProps> = ({ isOpen, onClose }) => {
  const { formData, currentStep, setFormData, setCurrentStep, resetForm, initializeFromUser } = useKybStore();
  const { vendor } = useVendorStore();
  const kycMutation = useKybRegistration();
  const kybMutation = useKybStep2Registration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if KYC is already verified (for upgraded accounts)
  const kycAlreadyVerified = vendor?.kycStatus === 'verified';

  React.useEffect(() => {
    if (isOpen) {
      initializeFromUser();
      // Ensure account type is business for this modal
      setFormData({ accountType: 'business' });
      
      // If KYC is already verified (upgraded from personal), skip to KYB step
      if (kycAlreadyVerified && currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [isOpen, initializeFromUser, setFormData, kycAlreadyVerified, currentStep, setCurrentStep]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: 'idCardFront' | 'idCardBack' | 'businessDocument' | 'selfieImage', file: File | null) => {
    setFormData({ [field]: file });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Country-specific field requirements for KYC
  const getCountryRequirements = (countryCode: string) => {
    const requirements: Record<string, { dateOfBirth?: boolean; phoneNumber?: boolean; voterCardType?: boolean; civIdType?: boolean }> = {
      'NG': { dateOfBirth: true },
      'ZA': { dateOfBirth: true, phoneNumber: true },
      'KE': { dateOfBirth: true },
      'GH': { dateOfBirth: true, voterCardType: true },
      'CI': { dateOfBirth: true, civIdType: true },
      'US': {},
      'GB': {},
      'DE': {},
      'FR': {},
      'CA': {},
      'AU': {},
    };
    return requirements[countryCode] || {};
  };

  const countryReqs = getCountryRequirements(formData.countryCode);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const reqs = getCountryRequirements(formData.countryCode);
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.countryCode.trim()) newErrors.countryCode = 'Country is required';
    if (!formData.nationalIDNumber.trim()) newErrors.nationalIDNumber = 'National ID number is required';
    
    // Country-specific validations
    if (reqs.dateOfBirth && !formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (reqs.phoneNumber && !formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (reqs.voterCardType && !formData.voterCardType) newErrors.voterCardType = 'Voter card type is required';
    if (reqs.civIdType && !formData.civIdType) newErrors.civIdType = 'ID type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStep1 = async () => {
    if (!validateStep1()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('firstName', formData.firstName);
    if (formData.middleName) formDataToSend.append('middleName', formData.middleName);
    formDataToSend.append('lastName', formData.lastName);
    formDataToSend.append('countryCode', formData.countryCode);
    formDataToSend.append('nationalIDNumber', formData.nationalIDNumber);
    formDataToSend.append('accountType', 'business');
    
    // Country-specific fields
    if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth);
    if (formData.phoneNumber) formDataToSend.append('phoneNumber', formData.phoneNumber);
    if (formData.voterCardType) formDataToSend.append('voterCardType', formData.voterCardType);
    if (formData.civIdType) formDataToSend.append('civIdType', formData.civIdType);
    
    // Optional files
    if (formData.idCardFront) formDataToSend.append('idFront', formData.idCardFront);
    if (formData.idCardBack) formDataToSend.append('idBack', formData.idCardBack);
    if (formData.selfieImage) formDataToSend.append('selfieImage', formData.selfieImage);

    try {
      const result = await kycMutation.mutateAsync(formDataToSend);
      if (result.success) {
        setCurrentStep(2); // Go to KYB step
      } else if (result.requiresReview) {
        setCurrentStep(4); // Go to pending review step
      }
    } catch (error) {
      console.error('KYC submission error:', error);
    }
  };

  // Countries that require state/region for business verification
  const countriesRequiringState = ['US', 'CA', 'IN', 'AE'];
  const requiresState = countriesRequiringState.includes(formData.shippingZone);

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.shippingZone.trim()) newErrors.shippingZone = 'Country of registration is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.businessDocument) newErrors.businessDocument = 'Business registration document is required';
    // State is required for US, CA, IN, AE
    if (requiresState && !formData.state?.trim()) {
      newErrors.state = 'State/Region is required for this country';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStep2 = async () => {
    if (!validateStep2()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('businessName', formData.businessName);
    formDataToSend.append('shippingZone', formData.shippingZone);
    formDataToSend.append('registrationNumber', formData.registrationNumber);
    if (formData.registrationName) formDataToSend.append('registrationName', formData.registrationName);
    if (formData.state) formDataToSend.append('state', formData.state);
    if (formData.businessDocument) formDataToSend.append('businessRegistration', formData.businessDocument);

    try {
      const result = await kybMutation.mutateAsync(formDataToSend);
      if (result.success) {
        setCurrentStep(3); // Success
      }
    } catch (error) {
      console.error('KYB submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto m-4 shadow-xl font-roboto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentStep === 1 ? 'Identity Verification (KYC)' : 
                 currentStep === 2 ? 'Business Verification (KYB)' : 
                 'Verification'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentStep === 1 ? 'Step 1: Verify your identity' :
                 currentStep === 2 ? 'Step 2: Verify your business registration' :
                 ''}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Step Indicator - only show for steps 1 and 2 */}
          {currentStep <= 2 && (
            <div className="flex items-center justify-center mb-5">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 || kycAlreadyVerified ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {kycAlreadyVerified ? <CheckCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <span className="ml-1.5 text-xs font-medium">
                  KYC {kycAlreadyVerified && <span className="text-green-600">(Done)</span>}
                </span>
              </div>
              <div className={`w-10 h-0.5 mx-2 ${kycAlreadyVerified ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="ml-1.5 text-xs font-medium">KYB</span>
              </div>
            </div>
          )}

          {/* Step 1: KYC - Identity Verification */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.countryCode ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select country</option>
                  <optgroup label="African Countries">
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="GH">🇬🇭 Ghana</option>
                    <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                  </optgroup>
                  <optgroup label="Global Countries">
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                  </optgroup>
                </select>
                {errors.countryCode && <p className="text-red-500 text-xs mt-0.5">{errors.countryCode}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  National ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nationalIDNumber}
                  onChange={(e) => handleInputChange('nationalIDNumber', e.target.value)}
                  placeholder="Enter your national ID number"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.nationalIDNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.nationalIDNumber && <p className="text-red-500 text-xs mt-0.5">{errors.nationalIDNumber}</p>}
              </div>

              {/* Country-specific fields */}
              {countryReqs.dateOfBirth && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-0.5">{errors.dateOfBirth}</p>}
                </div>
              )}

              {countryReqs.phoneNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-0.5">{errors.phoneNumber}</p>}
                </div>
              )}

              {countryReqs.voterCardType && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Voter Card Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.voterCardType || ''}
                    onChange={(e) => handleInputChange('voterCardType', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.voterCardType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select type</option>
                    <option value="new_voter_card">New Voter Card</option>
                    <option value="old_voter_card">Old Voter Card</option>
                  </select>
                  {errors.voterCardType && <p className="text-red-500 text-xs mt-0.5">{errors.voterCardType}</p>}
                </div>
              )}

              {countryReqs.civIdType && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.civIdType || ''}
                    onChange={(e) => handleInputChange('civIdType', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.civIdType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select type</option>
                    <option value="national_id">National ID</option>
                    <option value="old_national_id">Old National ID</option>
                  </select>
                  {errors.civIdType && <p className="text-red-500 text-xs mt-0.5">{errors.civIdType}</p>}
                </div>
              )}

              {/* Optional ID uploads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID Card (Front) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div
                    className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30"
                    onClick={() => document.getElementById('kybIdCardFront')?.click()}
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Click to upload</p>
                    {formData.idCardFront && (
                      <p className="text-xs text-green-600 mt-1 truncate">✓ {formData.idCardFront.name}</p>
                    )}
                  </div>
                  <input
                    id="kybIdCardFront"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('idCardFront', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID Card (Back) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div
                    className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30"
                    onClick={() => document.getElementById('kybIdCardBack')?.click()}
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Click to upload</p>
                    {formData.idCardBack && (
                      <p className="text-xs text-green-600 mt-1 truncate">✓ {formData.idCardBack.name}</p>
                    )}
                  </div>
                  <input
                    id="kybIdCardBack"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('idCardBack', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">ID uploads are optional - verification is done via government database</p>

              {/* Selfie for countries that support it (NG, GH, CI) - optional */}
              {['NG', 'GH', 'CI'].includes(formData.countryCode) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Selfie Photo <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div
                    className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30"
                    onClick={() => document.getElementById('kybSelfieImage')?.click()}
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Take a clear selfie photo for face matching</p>
                    {formData.selfieImage && (
                      <p className="text-xs text-green-600 mt-1 truncate">✓ {formData.selfieImage.name}</p>
                    )}
                  </div>
                  <input
                    id="kybSelfieImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfieImage', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-1">Selfie helps verify your identity faster</p>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitStep1}
                  disabled={kycMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {kycMutation.isPending ? 'Verifying...' : 'Next: Business Verification'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: KYB - Business Verification */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-2.5 mb-3">
                <p className="text-xs text-green-700">✓ Identity verification (KYC) completed. Now verify your business.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.businessName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.businessName && <p className="text-red-500 text-xs mt-0.5">{errors.businessName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country of Registration <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shippingZone}
                  onChange={(e) => handleInputChange('shippingZone', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.shippingZone ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select country</option>
                  <optgroup label="African Countries">
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="GH">🇬🇭 Ghana</option>
                    <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                  </optgroup>
                  <optgroup label="Global Countries">
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                  </optgroup>
                </select>
                {errors.shippingZone && <p className="text-red-500 text-xs mt-0.5">{errors.shippingZone}</p>}
              </div>

              {/* State/Region field for US, CA, IN, AE */}
              {requiresState && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    State/Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder={formData.shippingZone === 'US' ? 'e.g., IL for Illinois' : 'State or region code'}
                    maxLength={10}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-0.5">{errors.state}</p>}
                  <p className="text-xs text-gray-400 mt-1">Enter the state/region code where your business is registered</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  placeholder="Business registration number"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.registrationNumber && <p className="text-red-500 text-xs mt-0.5">{errors.registrationNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Registered Business Name <span className="text-gray-400 text-xs">(if different)</span>
                </label>
                <input
                  type="text"
                  value={formData.registrationName}
                  onChange={(e) => handleInputChange('registrationName', e.target.value)}
                  placeholder="Name as registered with authorities"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business Registration Document <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border border-dashed rounded-md p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 ${errors.businessDocument ? 'border-red-500' : 'border-gray-300'}`}
                  onClick={() => document.getElementById('kybBusinessDocument')?.click()}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Upload registration certificate</p>
                  {formData.businessDocument && (
                    <p className="text-xs text-green-600 mt-1 truncate">✓ {formData.businessDocument.name}</p>
                  )}
                </div>
                <input
                  id="kybBusinessDocument"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => handleFileChange('businessDocument', e.target.files?.[0] || null)}
                  className="hidden"
                />
                {errors.businessDocument && <p className="text-red-500 text-xs mt-0.5">{errors.businessDocument}</p>}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitStep2}
                  disabled={kybMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {kybMutation.isPending ? 'Verifying...' : 'Verify Business'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Complete!</h3>
              <p className="text-sm text-gray-600 mb-4">Your identity and business have been verified successfully.</p>
              <p className="text-xs text-gray-500 mb-4">You can now start selling on Mprimo.</p>
              <button
                onClick={() => { resetForm(); onClose(); }}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Selling
              </button>
            </div>
          )}

          {/* Step 4: Pending Review */}
          {currentStep === 4 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Review</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your verification requires manual review due to a minor discrepancy.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                An administrator will review your information shortly. You&apos;ll be notified once approved.
              </p>
              <button
                onClick={() => { resetForm(); onClose(); }}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KybModal;
