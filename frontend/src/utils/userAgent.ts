
export interface UserAgentInfo {
    browser: string;
    os: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
}

export const parseUserAgent = (ua: string): UserAgentInfo => {
    const lowerUA = ua.toLowerCase();

    // OS Detection
    let os = 'Unknown OS';
    if (lowerUA.includes('windows')) os = 'Windows';
    else if (lowerUA.includes('mac') && !lowerUA.includes('iphone') && !lowerUA.includes('ipad')) os = 'macOS';
    else if (lowerUA.includes('android')) os = 'Android';
    else if (lowerUA.includes('ios') || lowerUA.includes('iphone') || lowerUA.includes('ipad')) os = 'iOS';
    else if (lowerUA.includes('linux')) os = 'Linux';

    // Browser Detection
    let browser = 'Unknown Browser';
    if (lowerUA.includes('chrome') && !lowerUA.includes('edge') && !lowerUA.includes('opr')) browser = 'Chrome';
    else if (lowerUA.includes('firefox')) browser = 'Firefox';
    else if (lowerUA.includes('safari') && !lowerUA.includes('chrome')) browser = 'Safari';
    else if (lowerUA.includes('edge')) browser = 'Edge';
    else if (lowerUA.includes('opr') || lowerUA.includes('opera')) browser = 'Opera';

    // Device Type Detection
    let deviceType: UserAgentInfo['deviceType'] = 'desktop';
    if (lowerUA.includes('mobile')) deviceType = 'mobile';
    if (lowerUA.includes('tablet') || lowerUA.includes('ipad')) deviceType = 'tablet';

    // Android tablets often don't have 'mobile' but have 'android'
    if (os === 'Android' && !lowerUA.includes('mobile')) deviceType = 'tablet';

    return { browser, os, deviceType };
};
