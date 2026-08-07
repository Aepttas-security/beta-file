import { useState, useEffect, useCallback, useRef } from 'react';
import { ParentalRepository, BackendChild, ScreentimeDashboard, BackendApp, FilterRules, GeofenceZone, LocationTelemetry, ReportSummary } from '../data/parentalRepository';

export function useParentalControl() {
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Core profiles state
  const [children, setChildren] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Screentime state
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [limitMinutes, setLimitMinutes] = useState(240);
  const [currentUsageMinutes, setCurrentUsageMinutes] = useState(0);

  // Apps state
  const [apps, setApps] = useState<BackendApp[]>([]);

  // Filter state
  const [blockedUrls, setBlockedUrls] = useState<string[]>([]);
  const [blockedCategories, setBlockedCategories] = useState<{ [key: string]: boolean }>({});

  // Location & Geofencing state
  const [location, setLocation] = useState<any | null>(null);
  const [geofences, setGeofences] = useState<GeofenceZone[]>([]);

  // Reports state
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Offline/Local fallbacks (Ref-based store for persistence across renders)
  const localChildrenRef = useRef<any[]>([
    {
      id: '1',
      name: 'Alex',
      age: 12,
      avatarColor: '#A855F7',
      battery: '84%',
      batteryLevel: 84,
      device: 'Samsung S23 Ultra',
      deviceName: 'Samsung S23 Ultra',
      lastActive: 'Active Now',
      is_active_online: true,
      linking_code: null,
      appUsage: [
        { name: 'Roblox', time: '1h 15m', color: '#EC4899' },
        { name: 'YouTube', time: '45m', color: '#A855F7' },
        { name: 'Chrome', time: '15m', color: '#06B6D4' }
      ]
    },
    {
      id: '2',
      name: 'Emma',
      age: 8,
      avatarColor: '#EC4899',
      battery: '92%',
      batteryLevel: 92,
      device: 'iPad Mini 6',
      deviceName: 'iPad Mini 6',
      lastActive: 'Active 5m ago',
      is_active_online: true,
      linking_code: null,
      appUsage: [
        { name: 'YouTube Kids', time: '45m', color: '#F97316' },
        { name: 'Minecraft', time: '30m', color: '#10B981' }
      ]
    }
  ]);

  const localScreentimeRef = useRef<{ [key: string]: ScreentimeDashboard }>({
    '1': { child_id: '1', daily_limit_minutes: 240, current_usage_minutes: 135, is_locked_remotely: false },
    '2': { child_id: '2', daily_limit_minutes: 120, current_usage_minutes: 75, is_locked_remotely: false },
  });

  const localAppsRef = useRef<{ [key: string]: BackendApp[] }>({
    '1': [
      { app_id: '101', app_name: 'Roblox', category: 'Games', is_blocked: false },
      { app_id: '102', app_name: 'YouTube', category: 'Entertainment', is_blocked: false },
      { app_id: '103', app_name: 'Chrome', category: 'Browsers', is_blocked: false },
      { app_id: '104', app_name: 'Discord', category: 'Social', is_blocked: true },
      { app_id: '105', app_name: 'TikTok', category: 'Social', is_blocked: true },
    ],
    '2': [
      { app_id: '201', app_name: 'YouTube Kids', category: 'Entertainment', is_blocked: false },
      { app_id: '202', app_name: 'Minecraft', category: 'Games', is_blocked: false },
      { app_id: '203', app_name: 'Roblox', category: 'Games', is_blocked: true },
      { app_id: '204', app_name: 'YouTube', category: 'Entertainment', is_blocked: true },
      { app_id: '205', app_name: 'Safari', category: 'Browsers', is_blocked: false },
    ]
  });

  const localFiltersRef = useRef<{ [key: string]: FilterRules }>({
    '1': {
      status: 'success',
      child_id: '1',
      blocked_categories: {
        'All Apps and Categories': false,
        'Action': false,
        'Business': false,
        'Communication': false,
        'Entertainment': false,
        'Finance': false,
        'Health & Fitness': false,
        'Music & Audio': false,
        'Photography': false,
        'Productivity': false,
        'Shopping': false,
        'Social': false,
        'Strategy': false
      },
      blacklisted_urls: ['tiktok.com', 'instagram.com', 'snapchat.com', 'reddit.com']
    },
    '2': {
      status: 'success',
      child_id: '2',
      blocked_categories: {
        'All Apps and Categories': false,
        'Action': false,
        'Business': false,
        'Communication': false,
        'Entertainment': false,
        'Finance': false,
        'Health & Fitness': false,
        'Music & Audio': false,
        'Photography': false,
        'Productivity': false,
        'Shopping': false,
        'Social': false,
        'Strategy': false
      },
      blacklisted_urls: ['tiktok.com', 'instagram.com', 'youtube.com']
    }
  });

  const localGeofencesRef = useRef<{ [key: string]: GeofenceZone[] }>({
    '1': [
      { id: 'g1', child_id: '1', name: 'Greenwood School Campus Zone', latitude: 13.0827, longitude: 80.2707, radius_meters: 200.0, status: 'ACTIVE' }
    ],
    '2': [
      { id: 'g2', child_id: '2', name: 'Home Sweet Home', latitude: 13.0827, longitude: 80.2707, radius_meters: 150.0, status: 'ACTIVE' }
    ]
  });

  const localLocationRef = useRef<{ [key: string]: any }>({
    '1': { latitude: 13.0827, longitude: 80.2707, current_address: 'Near Greenwood School Campus Zone', battery_percentage: 84 },
    '2': { latitude: 13.0827, longitude: 80.2707, current_address: 'Near Home Sweet Home', battery_percentage: 92 }
  });

  const localSosPreferencesRef = useRef<{ [key: string]: any }>({
    '1': { email_enabled: true, parent_email: 'parent1@gmail.com', phone_enabled: true, parent_phone: '+15550199' },
    '2': { email_enabled: true, parent_email: 'parent2@gmail.com', phone_enabled: false, parent_phone: '+15550299' },
  });

  /**
   * Check backend server availability
   */
  const checkBackend = useCallback(async (): Promise<boolean> => {
    const isOnline = await ParentalRepository.checkBackend();
    setBackendAvailable(isOnline);
    return isOnline;
  }, []);

  /**
   * Synchronize local memory data to UI state
   */
  const syncLocalToState = useCallback((profileId: string) => {
    const targetId = profileId || localChildrenRef.current[0].id;
    setChildren(prev => (prev && prev.length > 0 ? prev : [...localChildrenRef.current]));

    const sc = localScreentimeRef.current[targetId];
    if (sc) {
      setLimitMinutes(sc.daily_limit_minutes);
      setCurrentUsageMinutes(sc.current_usage_minutes);
      setDeviceLocked(sc.is_locked_remotely);
    }

    const appsList = localAppsRef.current[targetId] || [];
    setApps([...appsList]);

    const filters = localFiltersRef.current[targetId];
    if (filters) {
      setBlockedCategories({ ...filters.blocked_categories });
      setBlockedUrls([...filters.blacklisted_urls]);
    }

    const fences = localGeofencesRef.current[targetId] || [];
    setGeofences([...fences]);

    const loc = localLocationRef.current[targetId];
    setLocation(loc ? { ...loc } : null);

    // Mock reports sync
    setReportSummary({
      status: 'success',
      child_id: targetId,
      generated_timestamp: new Date().toISOString(),
      device_status: {
        battery_percentage: loc ? loc.battery_percentage : 90,
        last_known_address: loc ? loc.current_address : 'Unknown',
        coordinates: loc ? [loc.latitude, loc.longitude] : [0, 0]
      },
      activity_metrics: {
        total_geofences_monitored: fences.length,
        active_screentime_hours_used: sc ? Number((sc.current_usage_minutes / 60).toFixed(1)) : 1.5,
        screentime_remaining_hours: sc ? Number(((sc.daily_limit_minutes - sc.current_usage_minutes) / 60).toFixed(1)) : 2.5,
        security_threats_blocked: 0
      },
      compliance_summary: 'Device operating within normal parameters.'
    });

    setSosActive(false);
    setActiveAlerts([]);
  }, []);

  /**
   * Refresh all child data from the backend server
   */
  const refreshChildData = useCallback(async (childId: string) => {
    if (!childId) return;
    setIsLoading(true);

    try {
      const [screentime, appsList, filters, locationData, geofenceList, summary, activeSos] = await Promise.all([
        ParentalRepository.getScreentime(childId),
        ParentalRepository.listApps(childId),
        ParentalRepository.getFilterRules(childId),
        ParentalRepository.getLiveLocation(childId),
        ParentalRepository.listGeofences(childId),
        ParentalRepository.getReportSummary(childId),
        ParentalRepository.getActiveSOS(childId),
      ]);

      setLimitMinutes(screentime.daily_limit_minutes);
      setCurrentUsageMinutes(screentime.current_usage_minutes);
      setDeviceLocked(screentime.is_locked_remotely);
      setApps(appsList);
      setBlockedCategories(filters.blocked_categories);
      setBlockedUrls(filters.blacklisted_urls);
      setLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        current_address: locationData.current_address,
        battery_percentage: locationData.battery_percentage
      });
      setGeofences(geofenceList);
      setReportSummary(summary);
      setSosActive(activeSos.is_panic_active);
      setActiveAlerts(activeSos.active_alerts);
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local storage:', err);
      syncLocalToState(childId);
    } finally {
      setIsLoading(false);
    }
  }, [syncLocalToState]);

  /**
   * Refresh children list and auto-seed if empty
   */
  const refreshChildrenList = useCallback(async () => {
    setIsLoading(true);
    const isOnline = await checkBackend();

    if (isOnline) {
      try {
        let childList = await ParentalRepository.listChildren();

        // Database seeding if empty
        if (childList.length === 0) {
          console.log('Seeding Alex and Emma profiles to Neon Cloud...');
          const alex = await ParentalRepository.createChild('Alex', 12);
          const emma = await ParentalRepository.createChild('Emma', 8);
          childList = [alex, emma];
        }

        const mappedChildren = childList.map((c: any, index: number) => ({
          id: c.child_id,
          name: c.name,
          age: c.age,
          avatarColor: index === 0 ? '#A855F7' : '#EC4899',
          battery: c.battery || '0%',
          batteryLevel: parseInt(c.battery || '0', 10) || 0,
          device: c.device || 'Unlinked Device Slot',
          deviceName: c.device || 'Unlinked Device Slot',
          lastActive: c.is_active_online ? 'Active Now' : 'Offline',
          is_active_online: c.is_active_online,
          linking_code: c.linking_code,
          appUsage: index === 0 ? [
            { name: 'Roblox', time: '1h 15m', color: '#EC4899' },
            { name: 'YouTube', time: '45m', color: '#A855F7' },
            { name: 'Chrome', time: '15m', color: '#06B6D4' }
          ] : [
            { name: 'YouTube Kids', time: '45m', color: '#F97316' },
            { name: 'Minecraft', time: '30m', color: '#10B981' }
          ]
        }));

        setChildren(mappedChildren);

        // Select first child profile
        const activeId = selectedProfileId || mappedChildren[0].id;
        setSelectedProfileId(activeId);
        await refreshChildData(activeId);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('Error fetching/seeding children:', err);
      }
    }

    // Offline / local fallback mode
    setChildren([...localChildrenRef.current]);
    const activeId = selectedProfileId || localChildrenRef.current[0].id;
    setSelectedProfileId(activeId);
    syncLocalToState(activeId);
    setIsLoading(false);
  }, [selectedProfileId, checkBackend, refreshChildData, syncLocalToState]);

  // Initial load
  useEffect(() => {
    refreshChildrenList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle selected child profile changes
  const selectProfile = useCallback(async (id: string) => {
    setSelectedProfileId(id);
    if (backendAvailable) {
      await refreshChildData(id);
    } else {
      syncLocalToState(id);
    }
  }, [backendAvailable, refreshChildData, syncLocalToState]);

  /**
   * Action methods
   */
  const changeDeviceLock = useCallback(async (isLocked: boolean) => {
    setDeviceLocked(isLocked);
    if (backendAvailable) {
      try {
        await ParentalRepository.remoteLock(selectedProfileId, isLocked);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Local updates
      const target = localScreentimeRef.current[selectedProfileId];
      if (target) target.is_locked_remotely = isLocked;
    }
  }, [backendAvailable, selectedProfileId]);

  const changeChildDailyLimit = useCallback(async (minutes: number) => {
    setLimitMinutes(minutes);
    if (backendAvailable) {
      try {
        const res = await fetch(`http://localhost:8002/api/screentime/${selectedProfileId}/daily-limit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daily_limit_minutes: minutes }),
        });
        if (!res.ok) console.warn('Failed to save daily limit to server.');
      } catch (e) {
        console.error(e);
      }
    } else {
      const target = localScreentimeRef.current[selectedProfileId];
      if (target) target.daily_limit_minutes = minutes;
    }
  }, [backendAvailable, selectedProfileId]);

  const toggleBlockApp = useCallback(async (appId: string, appName: string) => {
    // Optimistic UI state flip
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, is_blocked: !a.is_blocked } : a));

    if (backendAvailable) {
      try {
        await ParentalRepository.toggleAppLockout(selectedProfileId, appId);
      } catch (e) {
        console.error(e);
      }
    } else {
      const list = localAppsRef.current[selectedProfileId] || [];
      const app = list.find(a => a.app_id === appId);
      if (app) app.is_blocked = !app.is_blocked;
    }
  }, [backendAvailable, selectedProfileId]);

  const toggleFilterCategory = useCallback(async (categoryName: string, isBlocked: boolean) => {
    setBlockedCategories(prev => ({ ...prev, [categoryName]: isBlocked }));
    if (backendAvailable) {
      try {
        await ParentalRepository.toggleFilterCategory(selectedProfileId, categoryName, isBlocked);
      } catch (e) {
        console.error(e);
      }
    } else {
      const target = localFiltersRef.current[selectedProfileId];
      if (target) target.blocked_categories[categoryName] = isBlocked;
    }
  }, [backendAvailable, selectedProfileId]);

  const addBlacklistUrl = useCallback(async (url: string) => {
    if (!url) return;
    const cleanUrl = url.trim().toLowerCase();
    setBlockedUrls(prev => [...prev, cleanUrl]);

    if (backendAvailable) {
      try {
        await ParentalRepository.blacklistUrl(selectedProfileId, cleanUrl);
      } catch (e) {
        console.error(e);
      }
    } else {
      const target = localFiltersRef.current[selectedProfileId];
      if (target) target.blacklisted_urls.push(cleanUrl);
    }
  }, [backendAvailable, selectedProfileId]);

  const removeBlacklistUrl = useCallback((url: string) => {
    setBlockedUrls(prev => prev.filter(u => u !== url));
    // Since backend does not support removing domains directly, we fallback to local representation or just UI state update
    if (!backendAvailable) {
      const target = localFiltersRef.current[selectedProfileId];
      if (target) target.blacklisted_urls = target.blacklisted_urls.filter(u => u !== url);
    }
  }, [backendAvailable, selectedProfileId]);

  const generateLinkingCode = useCallback(async () => {
    if (backendAvailable) {
      try {
        const res = await ParentalRepository.generateLinkingCode(selectedProfileId);
        // Reload children to display the generated linking code
        await refreshChildrenList();
        return res.linking_code;
      } catch (e) {
        console.error(e);
      }
    } else {
      // Mock code generation
      const partLeft = Math.floor(100 + Math.random() * 900);
      const partRight = Math.floor(100 + Math.random() * 900);
      const mockCode = `${partLeft}-${partRight}`;

      const activeChild = localChildrenRef.current.find(c => c.id === selectedProfileId);
      if (activeChild) {
        activeChild.linking_code = mockCode;
      }
      setChildren([...localChildrenRef.current]);
      return mockCode;
    }
  }, [backendAvailable, selectedProfileId, refreshChildrenList]);

  const addNewGeofence = useCallback(async (name: string, lat: number, lng: number, radius: number) => {
    const newFence: GeofenceZone = {
      id: String(Math.random()),
      child_id: selectedProfileId,
      name,
      latitude: lat,
      longitude: lng,
      radius_meters: radius,
      status: 'ACTIVE',
    };
    setGeofences(prev => [...prev, newFence]);

    if (backendAvailable) {
      try {
        await ParentalRepository.createGeofence(selectedProfileId, name, lat, lng, radius);
      } catch (e) {
        console.error(e);
      }
    } else {
      const list = localGeofencesRef.current[selectedProfileId] || [];
      list.push(newFence);
    }
  }, [backendAvailable, selectedProfileId]);

  const triggerSOS = useCallback(async (lat: number, lng: number, message: string) => {
    setSosActive(true);
    if (backendAvailable) {
      try {
        await ParentalRepository.triggerSOS(selectedProfileId, lat, lng, message);
      } catch (e) {
        console.error(e);
      }
    }
  }, [backendAvailable, selectedProfileId]);

  const resolveSOS = useCallback(() => {
    setSosActive(false);
  }, []);

  const updateSosPreferences = useCallback(async (emailEnabled: boolean, email: string, phoneEnabled: boolean, phone: string) => {
    if (backendAvailable) {
      try {
        await ParentalRepository.updateSOSPreferences(selectedProfileId, emailEnabled, email, phoneEnabled, phone);
      } catch (e) {
        console.error(e);
      }
    } else {
      localSosPreferencesRef.current[selectedProfileId] = {
        email_enabled: emailEnabled,
        parent_email: email,
        phone_enabled: phoneEnabled,
        parent_phone: phone,
      };
    }
  }, [backendAvailable, selectedProfileId]);

  const getSosPreferences = useCallback(() => {
    if (backendAvailable) {
      // Fetch or use mock
      return localSosPreferencesRef.current[selectedProfileId] || { email_enabled: false, parent_email: '', phone_enabled: false, parent_phone: '' };
    }
    return localSosPreferencesRef.current[selectedProfileId] || { email_enabled: false, parent_email: '', phone_enabled: false, parent_phone: '' };
  }, [backendAvailable, selectedProfileId]);

  return {
    isLoading,
    backendAvailable,
    children,
    selectedProfileId,
    selectProfile,
    deviceLocked,
    changeDeviceLock,
    limitMinutes,
    currentUsageMinutes,
    changeChildDailyLimit,
    apps,
    toggleBlockApp,
    blockedUrls,
    addBlacklistUrl,
    removeBlacklistUrl,
    blockedCategories,
    toggleFilterCategory,
    location,
    geofences,
    addNewGeofence,
    reportSummary,
    sosActive,
    triggerSOS,
    resolveSOS,
    activeAlerts,
    updateSosPreferences,
    getSosPreferences,
    generateLinkingCode,
    refreshData: () => refreshChildrenList(),
  };
}
