'use client';

import { useState } from 'react';
import { StripeAccountData, VerificationDocument } from '@/types/stripe.type';
import { User } from '@/types/user.type';
import { CountryVerificationConfig } from '@/config/countryVerificationFields';
import { uploadVerificationDocument } from '@/utils/uploadDocument';

interface IdentityVerificationProps {
  user: User | null;
  accountData: StripeAccountData | null;
  countryConfig: CountryVerificationConfig | null;
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function IdentityVerification({ user, accountData, countryConfig, onComplete, onBack }: IdentityVerificationProps) {
  const [document, setDocument] = useState<VerificationDocument>({
    type: (countryConfig?.personal.documents[0]?.value as VerificationDocument['type']) || 'passport',
    frontFile: null,
    backFile: null,
    documentNumber: '',
  });
  const [additionalData, setAdditionalData] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState({
    frontFile: "",
    documentNumber: "",
    backFile: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (side: 'frontFile' | 'backFile', file: File | null) => {
    setDocument(prev => ({
      ...prev,
      [side]: file
    }));
  };

  const handleInputChange = (field: keyof VerificationDocument, value: string | VerificationDocument['type']) => {
    setDocument(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
        frontFile: '',
        documentNumber: '',
        backFile: '',
    };

    if (!document.frontFile) {
      newErrors.frontFile = 'Document front is required';
    }
    if (!document.documentNumber.trim()) {
      newErrors.documentNumber = 'Document number is required';
    }
    if (document.type === 'drivers_license' && !document.backFile) {
      newErrors.backFile = 'Document back is required for driver\'s license';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const frontUrl = document.frontFile 
        ? await uploadVerificationDocument(document.frontFile, `${document.type}_front`)
        : null;
      
      const backUrl = document.backFile
        ? await uploadVerificationDocument(document.backFile, `${document.type}_back`)
        : null;

      onComplete({
        documentType: document.type,
        documentNumber: document.documentNumber,
        frontUrl,
        backUrl,
        ...additionalData,
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Identity Verification</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Selection */}
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
            Identity Document Type *
          </label>
          <select
            id="documentType"
            value={document.type}
            onChange={(e) => handleInputChange('type', e.target.value as VerificationDocument['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {countryConfig?.personal.documents.map((doc) => (
              <option key={doc.value} value={doc.value}>
                {doc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Document Number */}
        <div>
          <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Document Number *
          </label>
          <input
            type="text"
            id="documentNumber"
            value={document.documentNumber}
            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.documentNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your document number"
          />
          {errors.documentNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
          )}
        </div>

        {/* File Upload - Front */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Front of Document *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange('frontFile', e.target.files?.[0] || null)}
              className="hidden"
              id="frontFile"
            />
            <label htmlFor="frontFile" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {document.frontFile ? document.frontFile.name : 'Click to upload front of document'}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                PNG, JPG, PDF up to 10MB
              </span>
            </label>
          </div>
          {errors.frontFile && (
            <p className="mt-1 text-sm text-red-600">{errors.frontFile}</p>
          )}
        </div>

        {/* Additional Fields */}
        {countryConfig?.personal.additionalFields?.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type="text"
              id={field.name}
              value={additionalData[field.name] || ''}
              onChange={(e) => setAdditionalData(prev => ({ ...prev, [field.name]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter your ${field.label.toLowerCase()}`}
            />
          </div>
        ))}

        {/* File Upload - Back (for certain document types) */}
        {countryConfig?.personal.documents.find(d => d.value === document.type)?.requiresBack && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Back of Document {document.type === 'drivers_license' && '*'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('backFile', e.target.files?.[0] || null)}
                className="hidden"
                id="backFile"
              />
              <label htmlFor="backFile" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {document.backFile ? document.backFile.name : 'Click to upload back of document'}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PNG, JPG, PDF up to 10MB
                </span>
              </label>
            </div>
            {errors.backFile && (
              <p className="mt-1 text-sm text-red-600">{errors.backFile}</p>
            )}
          </div>
        )}

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
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Uploading...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}