"use client";

import { useState } from "react";
import { FieldGroup } from "@/utils/stripeFieldParser";
import { uploadVerificationDocument } from "@/utils/uploadDocument";

interface DynamicFormStepProps {
  group: FieldGroup;
  initialData: Record<string, any>;
  onNext: (data: Record<string, any>) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function DynamicFormStep({
  group,
  initialData,
  onNext,
  onBack,
  isFirst,
  isLast,
}: DynamicFormStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadStates, setUploadStates] = useState<Record<string, { uploading: boolean; success: boolean; url?: string; preview?: string }>>({});

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleFileChange = async (fieldName: string, file: File | null) => {
    if (!file) return;

    setUploadStates(prev => ({ ...prev, [fieldName]: { uploading: true, success: false } }));

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    try {
      const url = await uploadVerificationDocument(file, 'verification');
      setFormData(prev => ({ ...prev, [fieldName]: url }));
      setUploadStates(prev => ({ ...prev, [fieldName]: { uploading: false, success: true, url, preview } }));
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStates(prev => ({ ...prev, [fieldName]: { uploading: false, success: false } }));
      setErrors(prev => ({ ...prev, [fieldName]: 'Upload failed. Please try again.' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    group.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DynamicFormStep - Form data:', formData);
    console.log('DynamicFormStep - Group fields:', group.fields);
    console.log('DynamicFormStep - Validation result:', validate());
    if (validate()) {
      console.log('DynamicFormStep - Calling onNext with:', formData);
      onNext(formData);
    } else {
      console.log('DynamicFormStep - Validation errors:', errors);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || "";

    if (field.type === "checkbox") {
      return (
        <div key={field.name} className="flex items-center space-x-3">
          <input
            type="checkbox"
            id={field.name}
            checked={!!formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={field.name} className="text-sm text-gray-700">
            {field.label} {field.required && "*"}
          </label>
          {errors[field.name] && <p className="ml-2 text-sm text-red-600">{errors[field.name]}</p>}
        </div>
      );
    }

    if (field.type === "file") {
      const uploadState = uploadStates[field.name];
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && "*"}
          </label>
          
          {uploadState?.success && uploadState.preview ? (
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 font-medium">✓ Uploaded successfully</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadStates(prev => ({ ...prev, [field.name]: { uploading: false, success: false } }));
                    setFormData(prev => ({ ...prev, [field.name]: undefined }));
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Change
                </button>
              </div>
              <img src={uploadState.preview} alt="Preview" className="max-h-40 rounded" />
            </div>
          ) : uploadState?.uploading ? (
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-blue-700">Uploading...</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                className="hidden"
                id={field.name}
              />
              <label htmlFor={field.name} className="cursor-pointer block text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 block text-sm text-gray-600">Click to upload</span>
              </label>
            </div>
          )}
          {errors[field.name] && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && "*"}
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="5734">Computer Software</option>
            <option value="5735">Music Stores</option>
            <option value="5815">Digital Goods: Media</option>
            <option value="5816">Digital Goods: Games</option>
            <option value="5817">Digital Goods: Applications</option>
            <option value="5818">Digital Goods: Large Digital Goods Merchant</option>
            <option value="5912">Drug Stores and Pharmacies</option>
            <option value="5941">Sporting Goods Stores</option>
            <option value="5942">Book Stores</option>
            <option value="5943">Stationery Stores</option>
            <option value="5944">Jewelry Stores</option>
            <option value="5945">Hobby, Toy, and Game Shops</option>
            <option value="5946">Camera and Photographic Supply Stores</option>
            <option value="5947">Gift, Card, Novelty, and Souvenir Shops</option>
            <option value="5977">Cosmetic Stores</option>
            <option value="5978">Clothing Stores</option>
            <option value="5999">Miscellaneous Retail</option>
            <option value="7230">Beauty and Barber Shops</option>
            <option value="7299">Miscellaneous Personal Services</option>
            <option value="7372">Computer Programming Services</option>
            <option value="7379">Computer Maintenance and Repair</option>
            <option value="8011">Doctors and Physicians</option>
            <option value="8021">Dentists and Orthodontists</option>
            <option value="8099">Medical Services and Health Practitioners</option>
          </select>
          {errors[field.name] && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label} {field.required && "*"}
        </label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        {errors[field.name] && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{group.title}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {group.fields.map(renderField)}

        <div className="flex justify-between pt-6 border-t mt-6">
          {!isFirst && (
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-400"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 ml-auto"
          >
            {isLast ? "Submit" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
