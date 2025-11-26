"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { useCountryVerification } from "@/hooks/useCountryVerification";
import { parseStripeFields, FieldGroup } from "@/utils/stripeFieldParser";
import DynamicFormStep from "./(components)/DynamicFormStep";
import BankAccountForm from "./(components)/BankAccountForm";
import TOSAcceptance from "./(components)/TOSAcceptance";
import { useProductStore } from "@/stores/useProductStore";
import { getCountryConfig } from "@/config/countryVerificationFields";
import IdentityVerification from "./(components)/IdentityVerification";
import BusinessVerification from "./(components)/BusinessVerification";


export default function CountryVerification() {
  const { country } = useParams<{ country: string }>();
  const { user } = useUserStore();
  const { vendor, setVendor } = useProductStore();
  const { data, isLoading } = useCountryVerification(country);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  
  const vendorType = vendor?.accountType === 'business' ? 'company' : 'individual';

  // Check KYC status on mount
  useEffect(() => {
    if (vendor?.kycStatus === 'verified') {
      window.location.href = '/vendor/verification/complete';
    }
  }, [vendor]);

  useEffect(() => {
    if (data?.verification_fields) {
      const fields = data.verification_fields[vendorType]?.minimum || [];
      
      if (fields.length <= 3 && fields.includes('external_account')) {
        const customGroups: FieldGroup[] = [
          {
            id: vendorType === 'individual' ? 'identity' : 'business',
            title: vendorType === 'individual' ? 'Identity Verification' : 'Business Verification',
            fields: [],
          },
          { id: 'bank', title: 'Bank Account', fields: [] },
          { id: 'tos', title: 'Terms of Service', fields: [] },
        ];
        console.log('Page - Using custom groups:', customGroups);
        setFieldGroups(customGroups);
      } else {
        const groups = parseStripeFields(fields, vendorType);
        console.log('Page - Using parsed groups:', groups);
        setFieldGroups(groups);
      }
    }
  }, [data, vendorType]);

  const handleNext = (stepData: Record<string, any>) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);
    
    if (currentStep < fieldGroups.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit(updatedFormData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;
    // If already in E.164 format, return as-is
    if (phone.startsWith('+')) return phone;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If 10 digits, assume US and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // If 11 digits starting with 1, it's US with country code
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // Otherwise add + to whatever digits we have
    return `+${digits}`;
  };

  const handleSubmit = async (data: Record<string, any>) => {
    console.log('Submitting verification:', data);
    
    // Structure data for backend
    const payload: any = {
      country,
      vendorType,
    };

    // Map company fields
    if (vendorType === 'company') {
      payload.company = {};
      if (data['company.name']) payload.company.name = data['company.name'];
      if (data['company.tax_id']) payload.company.tax_id = data['company.tax_id'];
      if (data['company.phone']) payload.company.phone = formatPhoneNumber(data['company.phone']);
      if (data['company.structure']) payload.company.structure = data['company.structure'];
      
      // Company address
      if (data['company.address.line1']) {
        payload.company.address = {
          line1: data['company.address.line1'],
          city: data['company.address.city'],
          state: data['company.address.state'],
          postal_code: data['company.address.postal_code'],
          country: data['company.address.country'] || country,
        };
        if (data['company.address.line2']) payload.company.address.line2 = data['company.address.line2'];
      }
      
      // Company verification document
      if (data['company.verification.document']) {
        payload.company.verification = {
          document: { front: data['company.verification.document'] }
        };
      }
    }

    // Map individual fields
    if (vendorType === 'individual') {
      payload.individual = {};
      if (data['individual.first_name']) payload.individual.first_name = data['individual.first_name'];
      if (data['individual.last_name']) payload.individual.last_name = data['individual.last_name'];
      if (data['individual.email']) payload.individual.email = data['individual.email'];
      if (data['individual.phone']) payload.individual.phone = formatPhoneNumber(data['individual.phone']);
      if (data['individual.ssn_last_4']) payload.individual.ssn_last_4 = data['individual.ssn_last_4'];
      if (data['individual.id_number']) payload.individual.id_number = data['individual.id_number'];
      
      // Individual DOB
      if (data['individual.dob.day']) {
        payload.individual.dob = {
          day: parseInt(data['individual.dob.day']),
          month: parseInt(data['individual.dob.month']),
          year: parseInt(data['individual.dob.year']),
        };
      }
      
      // Individual address
      if (data['individual.address.line1']) {
        payload.individual.address = {
          line1: data['individual.address.line1'],
          city: data['individual.address.city'],
          state: data['individual.address.state'],
          postal_code: data['individual.address.postal_code'],
          country: data['individual.address.country'] || country,
        };
        if (data['individual.address.line2']) payload.individual.address.line2 = data['individual.address.line2'];
      }
      
      // Individual verification document
      if (data['individual.verification.document']) {
        payload.individual.verification = {
          document: { front: data['individual.verification.document'] }
        };
      }
    }

    // Map owners fields
    if (data['owners_provided']) {
      payload.owners_provided = data['owners_provided'];
    }
    
    // Map directors fields
    if (data['directors_provided']) {
      payload.directors_provided = data['directors_provided'];
    }
    
    // Map executives fields
    if (data['executives_provided']) {
      payload.executives_provided = data['executives_provided'];
    }

    // Map representative fields
    if (data['representative.first_name']) {
      payload.representative = {
        first_name: data['representative.first_name'],
        last_name: data['representative.last_name'],
        email: data['representative.email'],
        phone: formatPhoneNumber(data['representative.phone']),
      };
      
      if (data['representative.ssn_last_4']) payload.representative.ssn_last_4 = data['representative.ssn_last_4'];
      if (data['representative.id_number']) payload.representative.id_number = data['representative.id_number'];
      
      // Representative DOB
      if (data['representative.dob.day']) {
        payload.representative.dob = {
          day: parseInt(data['representative.dob.day']),
          month: parseInt(data['representative.dob.month']),
          year: parseInt(data['representative.dob.year']),
        };
      }
      
      // Representative address
      if (data['representative.address.line1']) {
        payload.representative.address = {
          line1: data['representative.address.line1'],
          city: data['representative.address.city'],
          state: data['representative.address.state'],
          postal_code: data['representative.address.postal_code'],
          country: data['representative.address.country'] || country,
        };
        if (data['representative.address.line2']) payload.representative.address.line2 = data['representative.address.line2'];
      }
      
      // Representative relationship
      if (data['representative.relationship.title']) {
        payload.representative.relationship = {
          title: data['representative.relationship.title'],
        };
      }
    }

    // Map business profile
    if (data['business_profile.mcc']) {
      payload.business_profile = {
        mcc: data['business_profile.mcc'],
      };
      if (data['business_profile.url']) payload.business_profile.url = data['business_profile.url'];
      if (data['business_profile.product_description']) payload.business_profile.product_description = data['business_profile.product_description'];
      if (data['business_profile.statement_descriptor']) payload.business_profile.statement_descriptor = data['business_profile.statement_descriptor'];
      if (data['business_profile.statement_descriptor_prefix']) payload.business_profile.statement_descriptor_prefix = data['business_profile.statement_descriptor_prefix'];
    }

    // Bank account data (external_account)
    payload.external_account = {
      object: data.object || 'bank_account',
      country: data.country || country,
      currency: data.currency,
      account_holder_name: data.account_holder_name,
      account_holder_type: data.account_holder_type,
      account_number: data.account_number,
    };
    if (data.routing_number) payload.external_account.routing_number = data.routing_number;

    // TOS acceptance
    if (data.acceptTerms || data['tos_acceptance.date']) {
      payload.tos_acceptance = {
        date: Math.floor(Date.now() / 1000),
        ip: '', // Backend will capture this
      };
    }

    console.log('Structured payload for backend:', payload);
    
    try {
      const response = await fetch('http://localhost:5800/api/v1/verification/stripe/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Fetch updated vendor data
        const vendorResponse = await fetch('http://localhost:5800/api/v1/vendor/profile', {
          credentials: 'include',
        });
        const vendorData = await vendorResponse.json();
        if (vendorData.success) {
          setVendor(vendorData.vendor);
        }
        
        alert('Verification submitted successfully!');
        window.location.href = '/vendor/verification/complete';
      } else {
        alert(`Error: ${result.message || 'Failed to submit verification'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting verification.');
    }
  };

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Verification - {country}
          </h1>
          <p className="text-gray-600 mt-2">
            Step {currentStep + 1} of {fieldGroups.length}
          </p>
        </div>

        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / fieldGroups.length) * 100}%` }}
            />
          </div>
        </div>

        {fieldGroups[currentStep] && (
          <>
            {fieldGroups[currentStep].id === 'identity' && (
              <IdentityVerification
                user={user}
                accountData={null}
                countryConfig={getCountryConfig(country)}
                onComplete={(data) => handleNext(data || {})}
                onBack={handleBack}
              />
            )}
            
            {fieldGroups[currentStep].id === 'business' && (
              <BusinessVerification
                user={user}
                accountData={null}
                countryConfig={getCountryConfig(country)}
                onComplete={(data) => handleNext(data || {})}
                onBack={handleBack}
              />
            )}
            
            {(fieldGroups[currentStep].id === 'bank' || fieldGroups[currentStep].id.includes('_bank')) && (
              <BankAccountForm
                country={country}
                vendorType={vendorType}
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {(fieldGroups[currentStep].id === 'tos' || fieldGroups[currentStep].id.includes('_tos')) && (
              <TOSAcceptance
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
                isLast={true}
              />
            )}
            
            {!['identity', 'business', 'bank', 'tos'].includes(fieldGroups[currentStep].id) && 
             !fieldGroups[currentStep].id.includes('_bank') && 
             !fieldGroups[currentStep].id.includes('_tos') && (
              <DynamicFormStep
                group={fieldGroups[currentStep]}
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
                isFirst={currentStep === 0}
                isLast={currentStep === fieldGroups.length - 1}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
