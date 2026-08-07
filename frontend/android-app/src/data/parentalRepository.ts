import { Platform } from 'react-native';

const BASE_URL = 'http://192.168.39.211:8002';
const AUTH_HEADER = {
  'Authorization': 'Bearer mock_secure_jwt_token_for_1',
  'Content-Type': 'application/json',
};

export interface BackendChild {
  child_id: string;
  parent_id: number;
  name: string;
  age: number;
  device: string;
  battery: string;
  is_active_online: boolean;
  linking_code: string | null;
}

export interface ScreentimeDashboard {
  child_id: string;
  daily_limit_minutes: number;
  current_usage_minutes: number;
  is_locked_remotely: boolean;
}

export interface BackendApp {
  app_id: string;
  app_name: string;
  category: string;
  is_blocked: boolean;
}

export interface FilterRules {
  status: string;
  child_id: string;
  blocked_categories: { [key: string]: boolean };
  blacklisted_urls: string[];
}

export interface GeofenceZone {
  id: any;
  child_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: string;
}

export interface LocationTelemetry {
  status: string;
  child_id: string;
  latitude: number;
  longitude: number;
  current_address: string;
  battery_percentage: number;
  message: string;
}

export interface ReportSummary {
  status: string;
  child_id: string;
  generated_timestamp: string;
  device_status: {
    battery_percentage: number;
    last_known_address: string;
    coordinates: number[];
  };
  activity_metrics: {
    total_geofences_monitored: number;
    active_screentime_hours_used: number;
    screentime_remaining_hours: number;
    security_threats_blocked: number;
  };
  compliance_summary: string;
}

export const ParentalRepository = {
  /**
   * Check if backend is available
   */
  async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Children Profile APIs
   */
  async listChildren(): Promise<BackendChild[]> {
    const res = await fetch(`${BASE_URL}/api/child`, { headers: AUTH_HEADER });
    if (!res.ok) throw new Error('Failed to list children');
    return res.json();
  },

  async createChild(name: string, age: number): Promise<BackendChild> {
    const res = await fetch(`${BASE_URL}/api/child`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ name, age }),
    });
    if (!res.ok) throw new Error('Failed to create child profile');
    return res.json();
  },

  async generateLinkingCode(childId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/child/${childId}/generate-code`, {
      method: 'POST',
      headers: AUTH_HEADER,
    });
    if (!res.ok) throw new Error('Failed to generate linking code');
    return res.json();
  },

  async pairDevice(linkingCode: string, deviceName: string, osType: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/child/pair-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linking_code: linkingCode, device_name: deviceName, os_type: osType }),
    });
    if (!res.ok) throw new Error('Failed to pair device');
    return res.json();
  },

  /**
   * Screentime APIs
   */
  async getScreentime(childId: string): Promise<ScreentimeDashboard> {
    const res = await fetch(`${BASE_URL}/api/screentime/${childId}/dashboard`);
    if (!res.ok) throw new Error('Failed to get screentime details');
    return res.json();
  },

  async remoteLock(childId: string, isLocked: boolean): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/screentime/${childId}/remote-lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: isLocked }),
    });
    if (!res.ok) throw new Error('Failed to lock/unlock device');
    return res.json();
  },

  // Note: Backend doesn't have a daily-limit endpoint, so we can save daily limit locally or implement a mock save in our repository wrapper.
  // We can add a custom endpoint if needed, or handle it gracefully. We'll support it locally or let backend mock it.

  /**
   * Apps APIs
   */
  async listApps(childId: string): Promise<BackendApp[]> {
    const res = await fetch(`${BASE_URL}/api/apps/${childId}`);
    if (!res.ok) throw new Error('Failed to list apps');
    return res.json();
  },

  async toggleAppLockout(childId: string, appId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/apps/${childId}/toggle/${appId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle app block');
    return res.json();
  },

  async addApp(childId: string, appName: string, category: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/apps/${childId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_name: appName, category }),
    });
    if (!res.ok) throw new Error('Failed to add app');
    return res.json();
  },

  /**
   * Content Moderation Filters APIs
   */
  async getFilterRules(childId: string): Promise<FilterRules> {
    const res = await fetch(`${BASE_URL}/api/filters/${childId}/rules`);
    if (!res.ok) throw new Error('Failed to get filter rules');
    return res.json();
  },

  async toggleFilterCategory(childId: string, categoryName: string, isBlocked: boolean): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/filters/${childId}/category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_name: categoryName, is_blocked: isBlocked }),
    });
    if (!res.ok) throw new Error('Failed to toggle category filter');
    return res.json();
  },

  async blacklistUrl(childId: string, url: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/filters/${childId}/blacklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to blacklist URL');
    return res.json();
  },

  /**
   * Location & Geofencing APIs
   */
  async getLiveLocation(childId: string): Promise<LocationTelemetry> {
    const res = await fetch(`${BASE_URL}/api/location/${childId}/live`);
    if (!res.ok) throw new Error('Failed to get live location');
    return res.json();
  },

  async pingLocation(childId: string, lat: number, lng: number, address: string, battery: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/location/${childId}/live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_id: childId,
        latitude: lat,
        longitude: lng,
        current_address: address,
        battery_percentage: battery,
      }),
    });
    if (!res.ok) throw new Error('Failed to ping location');
    return res.json();
  },

  async listGeofences(childId: string): Promise<GeofenceZone[]> {
    const res = await fetch(`${BASE_URL}/api/location/${childId}/geofences`);
    if (!res.ok) throw new Error('Failed to list geofences');
    return res.json();
  },

  async createGeofence(childId: string, name: string, lat: number, lng: number, radius: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/location/${childId}/geofences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        latitude: lat,
        longitude: lng,
        radius_meters: radius,
      }),
    });
    if (!res.ok) throw new Error('Failed to create geofence');
    return res.json();
  },

  /**
   * Reports APIs
   */
  async getReportSummary(childId: string): Promise<ReportSummary> {
    const res = await fetch(`${BASE_URL}/api/reports/${childId}/summary`);
    if (!res.ok) throw new Error('Failed to get report summary');
    return res.json();
  },

  /**
   * SOS Emergency Alerts APIs
   */
  async updateSOSPreferences(childId: string, emailEnabled: boolean, email: string, phoneEnabled: boolean, phone: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/sos/preferences/${childId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_enabled: emailEnabled,
        parent_email: email,
        phone_enabled: phoneEnabled,
        parent_phone: phone,
      }),
    });
    if (!res.ok) throw new Error('Failed to update SOS preferences');
    return res.json();
  },

  async triggerSOS(childId: string, lat: number, lng: number, message: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/sos/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_id: childId,
        current_latitude: lat,
        current_longitude: lng,
        emergency_message: message,
      }),
    });
    if (!res.ok) throw new Error('Failed to trigger SOS');
    return res.json();
  },

  async getActiveSOS(childId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/sos/active/${childId}`);
    if (!res.ok) throw new Error('Failed to check active SOS alerts');
    return res.json();
  },
};
