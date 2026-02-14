"use client";

import React, { useState } from 'react';
import { X, Upload, User } from 'lucide-react';
import { useKybStore } from '@/stores/useKybStore';
import { useKybRegistration, useKybStep2Registration, useKybStep3Registration } from '@/hooks/useKybRegistration';

interface KybModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KybModal: React.FC<KybModalProps> = ({ isOpen, onClose }) => {
  const { formData, currentStep, setFormData, setCurrentStep, resetForm, initializeFromUser } = useKybStore();
  const kybMutation = useKybRegistration();
  const kybStep2Mutation = useKybStep2Registration();
  const kybStep3Mutation = useKybStep3Registration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen && currentStep === 1) {
      initializeFromUser();
    }
  }, [isOpen, currentStep, initializeFromUser]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: 'idCardFront' | 'idCardBack' | 'businessDocument' | 'bankStatement' | 'selfieImage', file: File | null) => {
    setFormData({ [field]: file });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Country-specific field requirements
  const getCountryRequirements = (countryCode: string) => {
    const requirements: Record<string, { dateOfBirth?: boolean; selfieImage?: boolean; phoneNumber?: boolean; addressLine1?: boolean; city?: boolean; postalCode?: boolean; state?: boolean; houseNumber?: boolean; street?: boolean; voterCardType?: boolean; civIdType?: boolean }> = {
      'NG': { dateOfBirth: true, selfieImage: true },
      'ZA': { dateOfBirth: true, phoneNumber: true },
      'KE': { dateOfBirth: true },
      'GH': { dateOfBirth: true, voterCardType: true, selfieImage: true },
      'CI': { dateOfBirth: true, civIdType: true },
      'US': { addressLine1: true, city: true, postalCode: true },
      'GB': { addressLine1: true, city: true, postalCode: true },
      'DE': { addressLine1: true, city: true, postalCode: true, houseNumber: true, street: true },
      'FR': { addressLine1: true, city: true, postalCode: true, houseNumber: true },
      'CA': { addressLine1: true, street: true, postalCode: true, state: true, houseNumber: true },
      'AU': { addressLine1: true, city: true, postalCode: true, state: true, houseNumber: true, street: true },
      'SG': { dateOfBirth: true },
      'IN': {},
      'BR': {},
      'JP': {},
      'NO': { phoneNumber: true, city: true, postalCode: true },
      'PH': { dateOfBirth: true, phoneNumber: true },
      'AR': {},
      'AT': { addressLine1: true, city: true, postalCode: true, state: true, houseNumber: true, street: true },
      'BE': { dateOfBirth: true },
      'CL': { dateOfBirth: true },
      'CN': {},
      'CO': {},
      'CZ': { city: true },
      'DK': {},
      'FI': {},
      'HK': { dateOfBirth: true },
      'IE': { dateOfBirth: true, city: true, postalCode: true, street: true, houseNumber: true },
      'IT': { city: true, postalCode: true, state: true, houseNumber: true, street: true },
      'MY': { dateOfBirth: true, city: true, postalCode: true, state: true },
      'MX': {},
      'NL': { street: true, city: true, postalCode: true, houseNumber: true },
      'PL': { city: true, postalCode: true, street: true, houseNumber: true },
      'PT': { houseNumber: true, city: true, postalCode: true, street: true },
      'SE': {},
      'TR': { dateOfBirth: true },
    };
    return requirements[countryCode] || {};
  };

  const countryReqs = getCountryRequirements(formData.countryCode);

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.bankCode.trim()) newErrors.bankCode = 'Bank code is required';
    if (!formData.bankStatement) newErrors.bankStatement = 'Bank statement is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStep3 = async () => {
    if (!validateStep3()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('vendorId', formData.vendorId || '');
    formDataToSend.append('accountName', formData.accountName);
    formDataToSend.append('accountNumber', formData.accountNumber);
    formDataToSend.append('bankName', formData.bankName);
    formDataToSend.append('routingNumber', formData.routingNumber);
    formDataToSend.append('bankCode', formData.bankCode);
    
    if (formData.bankStatement) formDataToSend.append('bankStatement', formData.bankStatement);

    try {
      const result = await kybStep3Mutation.mutateAsync(formDataToSend);
      if (result.success) {
        setCurrentStep(4);
        // Registration complete
      }
    } catch (error) {
      console.error('Step 3 submission error:', error);
    }
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.shippingZone.trim()) newErrors.shippingZone = 'Shipping zone is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.registrationName.trim()) newErrors.registrationName = 'Registration name is required';
    if (!formData.businessDocument) newErrors.businessDocument = 'Business registration document is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStep2 = async () => {
    if (!validateStep2()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('businessName', formData.businessName);
    formDataToSend.append('shippingZone', formData.shippingZone);
    formDataToSend.append('registrationNumber', formData.registrationNumber);
    formDataToSend.append('registrationName', formData.registrationName);
    formDataToSend.append('premium', formData.premium.toString());
    
    // API expects businessRegistration, not businessDocument
    if (formData.businessDocument) formDataToSend.append('businessRegistration', formData.businessDocument);

    try {
      const result = await kybStep2Mutation.mutateAsync(formDataToSend);
      if (result.success) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Step 2 submission error:', error);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const reqs = getCountryRequirements(formData.countryCode);
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.countryCode.trim()) newErrors.countryCode = 'Country code is required';
    if (!formData.nationalIDNumber.trim()) newErrors.nationalIDNumber = 'National ID number is required';
    if (!formData.idCardFront) newErrors.idCardFront = 'ID card front is required';
    if (!formData.idCardBack) newErrors.idCardBack = 'ID card back is required';
    
    // Country-specific validations
    if (reqs.dateOfBirth && !formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (reqs.selfieImage && !formData.selfieImage) newErrors.selfieImage = 'Selfie image is required';
    if (reqs.phoneNumber && !formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (reqs.addressLine1 && !formData.addressLine1?.trim()) newErrors.addressLine1 = 'Address is required';
    if (reqs.city && !formData.city?.trim()) newErrors.city = 'City is required';
    if (reqs.postalCode && !formData.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';

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
    formDataToSend.append('accountType', formData.accountType);
    
    // Country-specific fields
    if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth);
    if (formData.phoneNumber) formDataToSend.append('phoneNumber', formData.phoneNumber);
    if (formData.addressLine1) formDataToSend.append('addressLine1', formData.addressLine1);
    if (formData.city) formDataToSend.append('city', formData.city);
    if (formData.postalCode) formDataToSend.append('postalCode', formData.postalCode);
    if (formData.state) formDataToSend.append('state', formData.state);
    if (formData.houseNumber) formDataToSend.append('houseNumber', formData.houseNumber);
    if (formData.street) formDataToSend.append('street', formData.street);
    if (formData.voterCardType) formDataToSend.append('voterCardType', formData.voterCardType);
    if (formData.civIdType) formDataToSend.append('civIdType', formData.civIdType);
    
    // Files
    if (formData.idCardFront) formDataToSend.append('idFront', formData.idCardFront);
    if (formData.idCardBack) formDataToSend.append('idBack', formData.idCardBack);
    if (formData.selfieImage) formDataToSend.append('selfieImage', formData.selfieImage);

    try {
      const result = await kybMutation.mutateAsync(formDataToSend);
      if (result.success) {
        setFormData({ vendorId: result.vendorId || result.data?.vendorId });
        
        // If individual account, skip to step 3 (bank account)
        // If business account, go to step 2 (business info)
        if (formData.accountType === 'personal') {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    } catch (error) {
      console.error('Step 1 submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto m-4 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sell on Mprimo</h2>
            <p className="text-sm text-gray-600">Provide your information to continue</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= step
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                </div>
                {index < 3 && (
                  <div className="w-16 h-[2px] border-t-2 border-dashed border-gray-300 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Icon and Title */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0F172A] flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="personal">Individual (Personal)</option>
                    <option value="business">Business</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose individual for personal selling or business for company registration</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Middle Name</label>
                  <input
                    type="text"
                    placeholder="Enter your middle name (optional)"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                    className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.countryCode ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <option value="">Choose your country</option>
                    <optgroup label="African Countries">
                      <option value="NG">🇳🇬 Nigeria</option>
                      <option value="ZA">🇿🇦 South Africa</option>
                      <option value="KE">🇰🇪 Kenya</option>
                      <option value="GH">🇬🇭 Ghana</option>
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                    </optgroup>
                    <optgroup label="Global Countries">
                      <option value="US">🇺🇸 United States</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="SG">🇸🇬 Singapore</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="BR">🇧🇷 Brazil</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="NO">🇳🇴 Norway</option>
                      <option value="PH">🇵🇭 Philippines</option>
                      <option value="AR">🇦🇷 Argentina</option>
                      <option value="AT">🇦🇹 Austria</option>
                      <option value="BE">🇧🇪 Belgium</option>
                      <option value="CL">🇨🇱 Chile</option>
                      <option value="CN">🇨🇳 China</option>
                      <option value="CO">🇨🇴 Colombia</option>
                      <option value="CZ">🇨🇿 Czech Republic</option>
                      <option value="DK">🇩🇰 Denmark</option>
                      <option value="FI">🇫🇮 Finland</option>
                      <option value="HK">🇭🇰 Hong Kong</option>
                      <option value="IE">🇮🇪 Ireland</option>
                      <option value="IT">🇮🇹 Italy</option>
                      <option value="MY">🇲🇾 Malaysia</option>
                      <option value="MX">🇲🇽 Mexico</option>
                      <option value="NL">🇳🇱 Netherlands</option>
                      <option value="PL">🇵🇱 Poland</option>
                      <option value="PT">🇵🇹 Portugal</option>
                      <option value="SE">🇸🇪 Sweden</option>
                      <option value="TR">🇹🇷 Turkey</option>
                    </optgroup>
                  </select>
                  {errors.countryCode && <p className="text-red-500 text-xs mt-1">{errors.countryCode}</p>}
                  <p className="text-xs text-gray-500 mt-1">Choose the country of your origin</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    National ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your national ID number"
                    value={formData.nationalIDNumber}
                    onChange={(e) => handleInputChange('nationalIDNumber', e.target.value)}
                    className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nationalIDNumber ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.nationalIDNumber && <p className="text-red-500 text-xs mt-1">{errors.nationalIDNumber}</p>}
                </div>

                {/* Country-specific fields */}
                {countryReqs.dateOfBirth && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                  </div>
                )}

                {countryReqs.phoneNumber && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+234..."
                      value={formData.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                  </div>
                )}

                {countryReqs.voterCardType && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Voter Card Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.voterCardType || ''}
                      onChange={(e) => handleInputChange('voterCardType', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="new_voter_card">New Voter Card</option>
                      <option value="old_voter_card">Old Voter Card</option>
                    </select>
                  </div>
                )}

                {countryReqs.civIdType && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      ID Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.civIdType || ''}
                      onChange={(e) => handleInputChange('civIdType', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="national_id">National ID</option>
                      <option value="old_national_id">Old National ID</option>
                    </select>
                  </div>
                )}

                {countryReqs.addressLine1 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Street address"
                      value={formData.addressLine1 || ''}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.addressLine1 ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>
                )}

                {countryReqs.street && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Street</label>
                    <input
                      type="text"
                      value={formData.street || ''}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {countryReqs.houseNumber && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">House Number</label>
                    <input
                      type="text"
                      value={formData.houseNumber || ''}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {countryReqs.city && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                )}

                {countryReqs.state && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">State/Province</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {countryReqs.postalCode && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode || ''}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.postalCode ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ID Card (Front) <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors ${errors.idCardFront ? 'border-red-500' : 'border-gray-300'}`}
                    onClick={() => document.getElementById('idCardFront')?.click()}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900">Click to Upload</span>
                      <span className="text-gray-500"> National ID (Front)</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
                    {formData.idCardFront && (
                      <p className="text-xs text-green-600 mt-2">✓ {formData.idCardFront.name}</p>
                    )}
                  </div>
                  <input
                    id="idCardFront"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('idCardFront', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {errors.idCardFront && <p className="text-red-500 text-xs mt-1">{errors.idCardFront}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ID Card (Back) <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors ${errors.idCardBack ? 'border-red-500' : 'border-gray-300'}`}
                    onClick={() => document.getElementById('idCardBack')?.click()}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900">Click to Upload</span>
                      <span className="text-gray-500"> National ID (Back)</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
                    {formData.idCardBack && (
                      <p className="text-xs text-green-600 mt-2">✓ {formData.idCardBack.name}</p>
                    )}
                  </div>
                  <input
                    id="idCardBack"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('idCardBack', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {errors.idCardBack && <p className="text-red-500 text-xs mt-1">{errors.idCardBack}</p>}
                  <p className="text-xs text-gray-500 mt-2">The name on your ID should match your name</p>
                </div>

                {countryReqs.selfieImage && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Selfie Image <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors ${errors.selfieImage ? 'border-red-500' : 'border-gray-300'}`}
                      onClick={() => document.getElementById('selfieImage')?.click()}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">Click to Upload</span>
                        <span className="text-gray-500"> Selfie Photo</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG</p>
                      {formData.selfieImage && (
                        <p className="text-xs text-green-600 mt-2">✓ {formData.selfieImage.name}</p>
                      )}
                    </div>
                    <input
                      id="selfieImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('selfieImage', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {errors.selfieImage && <p className="text-red-500 text-xs mt-1">{errors.selfieImage}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-8">
                <button
                  onClick={handleSubmitStep1}
                  disabled={kybMutation.isPending}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {kybMutation.isPending ? 'Submitting...' : 'Next'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full border-2 border-orange-400 text-orange-500 font-semibold py-3 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.businessName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Shipping Zone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., NG, GH, ZA"
                    value={formData.shippingZone}
                    onChange={(e) => handleInputChange('shippingZone', e.target.value.toUpperCase())}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.shippingZone ? 'border-red-500' : 'border-gray-300'}`}
                    maxLength={2}
                  />
                  {errors.shippingZone && <p className="text-red-500 text-xs mt-1">{errors.shippingZone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Registration Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Name as registered with authorities"
                    value={formData.registrationName}
                    onChange={(e) => handleInputChange('registrationName', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.registrationName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.registrationName && <p className="text-red-500 text-xs mt-1">{errors.registrationName}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Business Registration Document <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFileChange('businessDocument', e.target.files?.[0] || null)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.businessDocument ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.businessDocument && <p className="text-red-500 text-xs mt-1">{errors.businessDocument}</p>}
                  <p className="text-xs text-gray-500 mt-1">Accepted: PDF, DOC, DOCX, Images (Max 10MB)</p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.premium}
                      onChange={(e) => setFormData({ premium: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Premium Account</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitStep2}
                  disabled={kybStep2Mutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {kybStep2Mutation.isPending ? 'Submitting...' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Bank Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Account holder name"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.accountName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.accountName && <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bank code/sort code"
                    value={formData.bankCode}
                    onChange={(e) => handleInputChange('bankCode', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.bankCode ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.bankCode && <p className="text-red-500 text-xs mt-1">{errors.bankCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.routingNumber}
                    onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Bank Statement <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFileChange('bankStatement', e.target.files?.[0] || null)}
                    className={`w-full border rounded-lg px-3 py-2 ${errors.bankStatement ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.bankStatement && <p className="text-red-500 text-xs mt-1">{errors.bankStatement}</p>}
                  <p className="text-xs text-gray-500 mt-1">Accepted: PDF, DOC, DOCX, Images (Max 10MB)</p>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => setCurrentStep(formData.accountType === 'personal' ? 1 : 2)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitStep3}
                  disabled={kybStep3Mutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {kybStep3Mutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Registration Complete!</h3>
              <p className="text-gray-600">Your KYB registration has been submitted successfully.</p>
              <p className="text-sm text-gray-500">We'll review your information and notify you once approved.</p>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
