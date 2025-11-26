'use client';

import { useState } from 'react';
import { StripeAccountData } from '@/types/stripe.type';
import  nigerianBanksUtils  from '@/utils/nigerianBanks';
import { User } from '@/types/user.type';

interface StripeAccountCreationProps {
  user: User | null;
  onComplete: (data: StripeAccountData) => void;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function StripeAccountCreation({ user, onComplete }: StripeAccountCreationProps) {
  const [formData, setFormData] = useState<StripeAccountData>({
    // Pre-fill with user data if available
    firstName: user?.profile.firstName || '',
    lastName: user?.profile.lastName || '',
    email: user?.email || '',
    phone: user?.profile.phoneNumber || '',
    
    // Address Information
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    
    // Date of Birth
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    
    // Bank Information
    accountNumber: '',
    bankCode: '',
    
    // Terms Acceptance
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StripeAccountData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof StripeAccountData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StripeAccountData, string>> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    
    // Date of Birth validation
    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      newErrors.dobDay = 'Date of birth is required';
    } else {
      const dob = new Date(
        parseInt(formData.dobYear),
        parseInt(formData.dobMonth) - 1,
        parseInt(formData.dobDay)
      );
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.dobDay = 'You must be at least 18 years old';
      }
    }
    
    // Bank validation
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.bankCode.trim()) newErrors.bankCode = 'Bank is required';
    
    // Terms acceptance
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';

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
      // Here you would make the API call to create the Stripe account
      const response = await fetch('/api/stripe/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          country: 'NG',
          businessType: 'individual'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        onComplete(formData);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('An error occurred while creating your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Stripe Account Setup</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+2348012345678"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Date of Birth *</h3>
          {errors.dobDay && (
            <p className="text-sm text-red-600 mb-2">{errors.dobDay}</p>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="dobDay" className="block text-sm font-medium text-gray-700 mb-1">
                Day
              </label>
              <input
                type="number"
                id="dobDay"
                name="dobDay"
                min="1"
                max="31"
                placeholder="DD"
                value={formData.dobDay}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dobMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <input
                type="number"
                id="dobMonth"
                name="dobMonth"
                min="1"
                max="12"
                placeholder="MM"
                value={formData.dobMonth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dobYear" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="dobYear"
                name="dobYear"
                min="1900"
                max="2005"
                placeholder="YYYY"
                value={formData.dobYear}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
              )}
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {nigerianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700 mb-1">
                Bank *
              </label>
              <select
                id="bankCode"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankCode ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Bank</option>
                {nigerianBanksUtils.getBanksSortedByName().map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bankCode && (
                <p className="mt-1 text-sm text-red-600">{errors.bankCode}</p>
              )}
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto mb-4">
            <h4 className="font-semibold text-lg mb-3">Stripe Connected Account Agreement</h4>
            
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                By creating a Stripe Connected Account, you agree to comply with Stripe's 
                Terms of Service and the Stripe Connected Account Agreement. This includes:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing accurate and complete information about your business</li>
                <li>Complying with all applicable laws and regulations in Nigeria</li>
                <li>Maintaining the security of your account credentials</li>
                <li>Authorizing Stripe to verify your information through third parties</li>
                <li>Accepting Stripe's pricing and fee structure for payment processing</li>
                <li>Understanding that payouts may be delayed for verification purposes</li>
                <li>Agreeing to Stripe's data processing and privacy policies</li>
              </ul>
              
              <p className="font-semibold">
                For Nigerian merchants, please note:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must have a valid Nigerian bank account for payouts</li>
                <li>All transactions will be processed in NGN (Nigerian Naira)</li>
                <li>You are responsible for understanding and complying with CBN regulations</li>
                <li>Stripe may require additional verification documents</li>
              </ul>
              
              <p>
                By ticking the box below, you acknowledge that you have read, understood, 
                and agree to be bound by these terms and conditions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              I have read and agree to the Stripe Connected Account Agreement, 
              Terms of Service, and Privacy Policy. I confirm that all information 
              provided is accurate and complete.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="mt-2 text-sm text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Account...' : 'Continue to Verification'}
          </button>
        </div>
      </form>
    </div>
  );
}