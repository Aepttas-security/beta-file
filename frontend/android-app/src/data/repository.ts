import { Platform } from 'react-native';

export interface DashboardMetrics {
  total_scanned: number;
  threats_detected: number;
  quarantined_files: number;
  device_security_score: number;
}

// Set this to your local server IP or domain when deploying on a physical device.
const BASE_URL = 'http://192.168.39.211:8001';

export const ScannerRepository = {
  /**
   * Uploads and scans the APK by sending it to the backend server.
   * Saves the result to the cloud PostgreSQL database.
   */
  async scanApk(filePath: string): Promise<any> {
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    
    // Create multipart form-data payload
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      name: fileName,
      type: 'application/vnd.android.package-archive',
    } as any);

    const response = await fetch(`${BASE_URL}/api/scan`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to scan file on server. Status: ${response.status}`);
    }

    return response.json();
  },

  async getScanDetails(scanId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/scans/${scanId}`);
    if (!response.ok) throw new Error('Failed to retrieve scan details.');
    return response.json();
  },

  async listScans(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/api/scans`);
    if (!response.ok) throw new Error('Failed to retrieve scans list.');
    return response.json();
  },

  async listQuarantinedApks(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/api/quarantine`);
    if (!response.ok) throw new Error('Failed to retrieve quarantined files.');
    return response.json();
  },

  async listScanHistory(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/api/history`);
    if (!response.ok) throw new Error('Failed to retrieve scan history.');
    return response.json();
  },

  /**
   * Triggers the quarantine action on the backend server.
   */
  async quarantineFile(scanId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/scans/${scanId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'quarantine' }),
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Triggers file restoration on the backend server.
   */
  async restoreFile(quarantineId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/quarantine/${quarantineId}/restore`, {
        method: 'POST',
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Permanently deletes the file on the backend server.
   */
  async deletePermanently(quarantineId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/quarantine/${quarantineId}/delete`, {
        method: 'POST',
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Direct deletion of a scanned file.
   */
  async deleteScannedFileDirectly(scanId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/scans/${scanId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete' }),
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Ignores the threat.
   */
  async ignoreThreat(scanId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/scans/${scanId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'ignore' }),
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  /**
   * Submits the quarantined file for cloud analysis.
   */
  async submitForAnalysis(quarantineId: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/quarantine/${quarantineId}/analyze`, {
        method: 'POST',
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};

export const DashboardRepository = {
  /**
   * Retrieves dashboard aggregation metrics directly from the server.
   */
  async getDashboardMetrics(): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/dashboard`);
    if (!response.ok) throw new Error('Failed to retrieve dashboard metrics.');
    return response.json();
  },

  /**
   * Retrieves active warnings/alerts.
   */
  async getActiveAlerts(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/api/alerts`);
    if (!response.ok) throw new Error('Failed to retrieve active alerts.');
    return response.json();
  }
};

const GEO_BASE_URL = 'http://192.168.39.211:8003/api/v1/geolocation';

export const GeolocationRepository = {
  async getCurrentLocation(): Promise<any> {
    const response = await fetch(`${GEO_BASE_URL}/current`);
    if (!response.ok) throw new Error('Failed to retrieve current location.');
    return response.json();
  },

  async updateCurrentLocation(payload: {
    latitude: number;
    longitude: number;
    ip?: string;
    is_mock_location?: boolean;
    accuracy?: number;
    provider?: string;
    timestamp?: string;
    device_id?: string;
  }): Promise<any> {
    const response = await fetch(`${GEO_BASE_URL}/current`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update current location.');
    return response.json();
  },

  async getLocationHistory(): Promise<any[]> {
    const response = await fetch(`${GEO_BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to retrieve location history.');
    const json = await response.json();
    return json.history || [];
  },

  async deleteHistoryEntry(): Promise<any> {
    const response = await fetch(`${GEO_BASE_URL}/history`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear location history.');
    return response.json();
  },

  async getNearbyPlaces(payload: { latitude: number; longitude: number; radius_km: number }): Promise<any[]> {
    const response = await fetch(`${GEO_BASE_URL}/nearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to fetch nearby places.');
    const json = await response.json();
    return json.places || [];
  }
};
