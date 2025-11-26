'use client';

import { useState } from 'react';
import { StripeAccountData, BusinessVerificationData } from '@/types/stripe.type';
import { User } from '@/types/user.type';
import { CountryVerificationConfig } from '@/config/countryVerificationFields';
import { uploadVerificationDocument } from '@/utils/uploadDocument';

interface BusinessVerificationProps {
  user: User | null;
  accountData: StripeAccountData | null;
  countryConfig: CountryVerificationConfig | null;
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function BusinessVerification({ user, accountData, countryConfig, onComplete, onBack }: BusinessVerificationProps) {
  const [businessData, setBusinessData] = useState<BusinessVerificationData>({
    businessName: '',
    businessRegistrationNumber: '',
    businessType: 'sole_proprietorship',
    registrationDocument: null,
    taxId: '',
  });
  const [additionalData, setAdditionalData] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: keyof BusinessVerificationData, value: string) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setBusinessData(prev => ({
      ...prev,
      registrationDocument: file
    }));

    setIsUploading(true);
    try {
      const url = await uploadVerificationDocument(file, 'business_registration');
      setUploadedUrl(url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
      setBusinessData(prev => ({ ...prev, registrationDocument: null }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!uploadedUrl) {
      newErrors.registrationDocument = 'Registration document is required';
    }

    // Validate required additional fields
    countryConfig?.business.additionalFields?.forEach(field => {
      if (field.required && !additionalData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onComplete({
      businessName: businessData.businessName,
      businessRegistrationNumber: businessData.businessRegistrationNumber,
      businessType: businessData.businessType,
      taxId: businessData.taxId,
      registrationDocumentUrl: uploadedUrl,
      ...additionalData,
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Verification</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            id="businessName"
            value={businessData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your registered business name"
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
          )}
        </div>

        {/* Dynamic Additional Fields */}
        {countryConfig?.business.additionalFields?.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                value={additionalData[field.name] || ''}
                onChange={(e) => setAdditionalData(prev => ({ ...prev, [field.name]: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>
                    {typeof option === 'string' ? option : option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id={field.name}
                value={additionalData[field.name] || ''}
                onChange={(e) => setAdditionalData(prev => ({ ...prev, [field.name]: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Enter your ${field.label.toLowerCase()}`}
              />
            )}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        ))}

        {/* Registration Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Business Registration Document *
          </label>
          
          {!uploadedUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                id="registrationDocument"
                disabled={isUploading}
              />
              <label htmlFor="registrationDocument" className={isUploading ? "cursor-not-allowed" : "cursor-pointer"}>
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="mt-2 block text-sm font-medium text-gray-900">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload registration document
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-900">Document uploaded successfully</p>
                    <p className="text-xs text-green-700">{businessData.registrationDocument?.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedUrl(null);
                    setBusinessData(prev => ({ ...prev, registrationDocument: null }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              {uploadedUrl.endsWith('.pdf') ? (
                <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm">
                  View PDF
                </a>
              ) : (
                <img src={uploadedUrl} alt="Registration document" className="mt-3 max-h-40 rounded" />
              )}
            </div>
          )}
          
          {errors.registrationDocument && (
            <p className="mt-1 text-sm text-red-600">{errors.registrationDocument}</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!uploadedUrl}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}