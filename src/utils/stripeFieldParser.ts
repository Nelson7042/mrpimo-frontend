// Parse Stripe verification field requirements into form structure

export interface ParsedField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'file' | 'select' | 'number' | 'checkbox';
  required: boolean;
  group: string;
  placeholder?: string;
  validation?: string;
}

export interface FieldGroup {
  id: string;
  title: string;
  fields: ParsedField[];
}

const FIELD_LABELS: Record<string, string> = {
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'email': 'Email Address',
  'phone': 'Phone Number',
  'id_number': 'ID Number',
  'ssn_last_4': 'Last 4 digits of SSN',
  'tax_id': 'Tax ID',
  'title': 'Job Title',
  'mcc': 'Business Category (MCC)',
  'url': 'Website URL',
  'product_description': 'Product Description',
  'statement_descriptor': 'Statement Descriptor',
  'statement_descriptor_prefix': 'Statement Descriptor Prefix',
  'city': 'City',
  'line1': 'Address Line 1',
  'line2': 'Address Line 2',
  'postal_code': 'Postal Code',
  'state': 'State/Province',
  'day': 'Day',
  'month': 'Month',
  'year': 'Year',
  'document': 'Verification Document',
  'additional_document': 'Additional Document',
  'owners_provided': 'Owners Information Provided',
  'directors_provided': 'Directors Information Provided',
  'executives_provided': 'Executives Information Provided',
};

export const parseStripeFields = (
  fields: string[],
  accountType: 'individual' | 'company'
): FieldGroup[] => {
  const parsed: ParsedField[] = fields.map(field => {
    const parts = field.split('.');
    const fieldName = parts[parts.length - 1];
    
    let group = 'basic';
    let entity = accountType;
    
    // Determine entity first (more specific)
    if (field.includes('owners')) { entity = 'owner'; }
    else if (field.includes('directors')) { entity = 'director'; }
    else if (field.includes('executives')) { entity = 'executive'; }
    else if (field.includes('representative')) { entity = 'representative'; }
    
    // Then determine group
    if (field.includes('address')) group = 'address';
    else if (field.includes('dob')) group = 'dob';
    else if (field.includes('verification')) group = 'verification';
    else if (field.includes('business_profile')) group = 'business';
    else if (field.includes('external_account')) group = 'bank';
    else if (field.includes('tos_acceptance')) group = 'tos';
    else if (field.includes('owners')) group = 'basic';
    else if (field.includes('directors')) group = 'basic';
    else if (field.includes('executives')) group = 'basic';
    else if (field.includes('representative')) group = 'basic';
    
    let type: ParsedField['type'] = 'text';
    if (fieldName === 'email') type = 'email';
    else if (fieldName === 'phone') type = 'tel';
    else if (['day', 'month', 'year'].includes(fieldName)) type = 'number';
    else if (fieldName === 'document' || fieldName === 'additional_document') type = 'file';
    else if (fieldName === 'mcc') type = 'select';
    else if (fieldName.includes('_provided')) type = 'checkbox';
    
    return {
      name: field,
      label: FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' '),
      type,
      required: true,
      group: `${entity}_${group}`,
      placeholder: `Enter ${FIELD_LABELS[fieldName]?.toLowerCase() || fieldName}`,
    };
  });
  
  // Group fields and remove duplicates
  const grouped = parsed.reduce((acc, field) => {
    if (!acc[field.group]) {
      acc[field.group] = [];
    }
    // Check if field already exists in group
    const exists = acc[field.group].some(f => f.name === field.name);
    if (!exists) {
      acc[field.group].push(field);
    }
    return acc;
  }, {} as Record<string, ParsedField[]>);
  
  // Convert to FieldGroup array
  const groups: FieldGroup[] = Object.entries(grouped).map(([id, fields]) => ({
    id,
    title: formatGroupTitle(id),
    fields,
  }));
  
  return groups;
};

const formatGroupTitle = (groupId: string): string => {
  const titles: Record<string, string> = {
    'individual_basic': 'Personal Information',
    'individual_address': 'Personal Address',
    'individual_dob': 'Date of Birth',
    'individual_verification': 'Identity Verification',
    'company_basic': 'Company Information',
    'company_address': 'Company Address',
    'company_bank': 'Bank Account',
    'individual_bank': 'Bank Account',
    'company_tos': 'Terms of Service',
    'individual_tos': 'Terms of Service',
    'owner_basic': 'Business Owner Information',
    'owner_address': 'Business Owner Address',
    'owner_dob': 'Business Owner Date of Birth',
    'director_basic': 'Director Information',
    'director_address': 'Director Address',
    'executive_basic': 'Executive Information',
    'executive_address': 'Executive Address',
    'representative_basic': 'Representative Information',
    'representative_address': 'Representative Address',
    'representative_dob': 'Representative Date of Birth',
    'business': 'Business Profile',
    'bank': 'Bank Account',
    'tos': 'Terms of Service',
  };
  
  return titles[groupId] || groupId.replace(/_/g, ' ');
};
