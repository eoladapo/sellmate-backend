export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}