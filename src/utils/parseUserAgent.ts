/**
 * Parse User Agent string to extract browser and OS information
 */

export const parseUserAgent = (userAgent: string) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  // Detect Browser
  let browser = 'Unknown';
  
  if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  
  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows NT 6.3')) {
    os = 'Windows 8.1';
  } else if (userAgent.includes('Windows NT 6.2')) {
    os = 'Windows 8';
  } else if (userAgent.includes('Windows NT 6.1')) {
    os = 'Windows 7';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  return { browser, os };
};

export const formatActivityDescription = (activity: any): string => {
  const metadata = activity.metadata || {};
  const userAgent = metadata.userAgent || '';
  const location = metadata.location || 'Unknown';
  const deviceType = metadata.device || 'desktop';
  
  const { browser, os } = parseUserAgent(userAgent);
  
  // Extract the base activity (e.g., "User logged in")
  const baseActivity = activity.activity?.split(' from ')[0] || activity.activity;
  
  return `${baseActivity} from ${location} on ${deviceType} with ${browser}`;
};
