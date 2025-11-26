import { fetchWithAuth } from './fetchWithAuth';

export const uploadVerificationDocument = async (
  file: File,
  documentType: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await fetchWithAuth('http://localhost:5800/api/v1/verification/upload-verification-document', {
    method: 'POST',
    body: formData,
    headers: {},
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to upload document');
  }

  return result.url;
};
