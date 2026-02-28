/**
 * Device Detection Utility
 * Detects browser, OS, and device type from user agent
 */

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceModel?: string;
}

export const detectDevice = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'desktop',
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect Browser
  let browser = 'Unknown';
  let browserVersion = '';

  if (userAgent.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = userAgent.match(/Edg\/([\d.]+)/)?.[1] || '';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    browser = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = userAgent.match(/Version\/([\d.]+)/)?.[1] || '';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
    browserVersion = userAgent.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || '';
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion = '';

  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows';
    osVersion = '10/11';
  } else if (userAgent.includes('Windows NT 6.3')) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (userAgent.includes('Windows NT 6.2')) {
    os = 'Windows';
    osVersion = '8';
  } else if (userAgent.includes('Windows NT 6.1')) {
    os = 'Windows';
    osVersion = '7';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    const match = userAgent.match(/Android ([\d.]+)/);
    osVersion = match?.[1] || '';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    const match = userAgent.match(/OS ([\d_]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  // Detect Device Type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let deviceModel: string | undefined;

  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = 'mobile';
    
    // Try to detect phone model
    if (userAgent.includes('iPhone')) {
      deviceModel = 'iPhone';
    } else if (userAgent.includes('Android')) {
      const modelMatch = userAgent.match(/Android.*;\s*([^)]+)\s*Build/);
      deviceModel = modelMatch?.[1]?.trim();
    }
  } else if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
    deviceModel = 'iPad';
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceModel,
  };
};

export const formatDeviceInfo = (deviceInfo: DeviceInfo): string => {
  const parts: string[] = [];

  // Browser info
  if (deviceInfo.browser !== 'Unknown') {
    parts.push(`${deviceInfo.browser}${deviceInfo.browserVersion ? ` ${deviceInfo.browserVersion}` : ''}`);
  }

  // OS info
  if (deviceInfo.os !== 'Unknown') {
    parts.push(`${deviceInfo.os}${deviceInfo.osVersion ? ` ${deviceInfo.osVersion}` : ''}`);
  }

  // Device type
  parts.push(deviceInfo.deviceType);

  // Device model if available
  if (deviceInfo.deviceModel) {
    parts.push(deviceInfo.deviceModel);
  }

  return parts.join(' • ');
};

export const getDeviceIcon = (deviceType: string): string => {
  switch (deviceType.toLowerCase()) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
};

export const logDeviceInfo = () => {
  const deviceInfo = detectDevice();
  
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Device Information');
    console.groupEnd();
  }

  return deviceInfo;
};
