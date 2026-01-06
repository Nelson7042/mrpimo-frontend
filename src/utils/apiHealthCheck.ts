import { API_BASE_URL } from './config';

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't include credentials for health check
    });
    
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};

export const logApiStatus = async () => {
  const isHealthy = await checkApiHealth();
  console.log(`API Status: ${isHealthy ? 'Healthy' : 'Unhealthy'} - ${API_BASE_URL}`);
  return isHealthy;
};