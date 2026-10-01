// src/utils/device.js
// High-fidelity client device detection for TechFEST '26 Operations Calling & Audit Trail

const CUSTOM_DEVICE_KEY = 'tf_device_custom_name';

/**
 * Clean and format Android hardware models into recognizable consumer names
 */
function cleanAndroidModel(rawModel) {
  if (!rawModel) return 'Android Device';
  const m = rawModel.trim().replace(/Build\/.*$/, '').trim();

  // Samsung Galaxy Series
  if (/^SM-S92[0-9]/i.test(m)) return 'Samsung Galaxy S24';
  if (/^SM-S91[0-9]/i.test(m)) return 'Samsung Galaxy S23';
  if (/^SM-S90[0-9]/i.test(m)) return 'Samsung Galaxy S22';
  if (/^SM-G9[0-9]{2}/i.test(m)) return 'Samsung Galaxy S-Series';
  if (/^SM-A[0-9]{3}/i.test(m)) return `Samsung Galaxy A${m.substring(4, 6)}`;
  if (/^SM-M[0-9]{3}/i.test(m)) return `Samsung Galaxy M${m.substring(4, 6)}`;
  if (/^SM-F[0-9]{3}/i.test(m)) return 'Samsung Galaxy Z Fold/Flip';
  if (/^SM-/i.test(m)) return `Samsung Galaxy (${m})`;

  // Google Pixel Series
  if (/Pixel\s*[0-9]+[a-z\s]*/i.test(m)) {
    const match = m.match(/Pixel\s*[0-9]+[a-z\s]*/i);
    return `Google ${match[0]}`.trim();
  }

  // OnePlus
  if (/OnePlus|NE2211|CPH2449|CPH2451/i.test(m)) {
    if (/OnePlus\s+[0-9]+/i.test(m)) return m;
    return `OnePlus Device (${m})`;
  }

  // Xiaomi / Redmi / POCO
  if (/Redmi/i.test(m)) return m;
  if (/POCO/i.test(m)) return m;
  if (/2201|2304|2312|2405/i.test(m)) return `Xiaomi (${m})`;

  // Vivo / iQOO
  if (/vivo|V2\d{3}|iQOO/i.test(m)) return `Vivo / iQOO (${m})`;

  // Motorola
  if (/moto|motorola/i.test(m)) return m;

  return `${m} (Android)`;
}

/**
 * Analyze navigator and userAgent to identify exact physical hardware, OS & browser
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceName: 'Central Operations Terminal',
      deviceModel: 'Web Terminal',
      browser: 'Web App',
      os: 'Cloud',
      deviceType: 'desktop',
      isMobile: false
    };
  }

  const ua = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // OS & Device Type flags
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Macintosh') && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !isIOS;
  const isWindows = /Windows NT/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;

  let os = 'Unknown OS';
  let deviceModel = 'Unknown Device';
  let deviceType = 'desktop';

  // 1. Device Hardware Identification
  if (/iPhone/i.test(ua)) {
    deviceModel = 'Apple iPhone';
    deviceType = 'mobile';
    os = 'iOS';
  } else if (/iPad/i.test(ua) || (ua.includes('Macintosh') && maxTouchPoints > 1)) {
    deviceModel = 'Apple iPad';
    deviceType = 'tablet';
    os = 'iPadOS';
  } else if (isAndroid) {
    deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
    os = 'Android';
    const match = ua.match(/Android[^;]+;\s*([^;)]+)/i);
    deviceModel = match && match[1] ? cleanAndroidModel(match[1]) : 'Android Device';
  } else if (isMac) {
    // Distinguish MacBook from Desktop Mac if possible
    deviceModel = 'MacBook / Mac';
    deviceType = 'desktop';
    os = 'macOS';
  } else if (isWindows) {
    if (ua.includes('Windows NT 10.0')) {
      deviceModel = 'Windows 11/10 PC';
    } else {
      deviceModel = 'Windows PC';
    }
    deviceType = 'desktop';
    os = 'Windows';
  } else if (isLinux) {
    deviceModel = 'Linux Workstation';
    deviceType = 'desktop';
    os = 'Linux';
  }

  // 2. Browser Identification
  let browser = 'Web Browser';
  if (/Edg\//i.test(ua) || /EdgiOS\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/CriOS\//i.test(ua)) {
    browser = 'Chrome (iOS)';
  } else if (/Chrome\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/FxiOS\//i.test(ua)) {
    browser = 'Firefox (iOS)';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(ua)) {
    browser = 'Safari';
  }

  const baseDeviceName = `${deviceModel} • ${browser}`;

  // Check if user set a custom station nickname (e.g. "Plexus Desk #1" or "Sagar's Phone")
  let customStation = '';
  try {
    customStation = localStorage.getItem(CUSTOM_DEVICE_KEY) || '';
  } catch (e) {
    // ignore
  }

  const finalDeviceName = customStation.trim() 
    ? `${customStation.trim()} (${baseDeviceName})` 
    : baseDeviceName;

  return {
    deviceName: finalDeviceName,
    baseDeviceName,
    customStation: customStation.trim(),
    deviceModel,
    browser,
    os,
    deviceType,
    isMobile: deviceType === 'mobile' || deviceType === 'tablet'
  };
}

/**
 * Get custom device nickname if set
 */
export function getCustomDeviceName() {
  try {
    return localStorage.getItem(CUSTOM_DEVICE_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Set custom device nickname
 */
export function setCustomDeviceName(name) {
  try {
    if (!name || !name.trim()) {
      localStorage.removeItem(CUSTOM_DEVICE_KEY);
    } else {
      localStorage.setItem(CUSTOM_DEVICE_KEY, name.trim());
    }
  } catch (e) {
    console.error('Error saving device nickname:', e);
  }
}
