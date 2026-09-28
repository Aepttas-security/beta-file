import { useState, useEffect, useCallback } from 'react';
import { getCallerBaseUrl } from '../config/apiConfig';
import { Storage } from '../utils/storage';
import CallDetection from '../native/CallDetection';

export interface BlockedNumber {
  number: string;
  name: string;
  reason: string;
  date: string;
}

export interface SpamCall {
  name: string;
  number: string;
  riskScore: number;
  date: string;
}

export interface CallReport {
  id: string;
  number: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface MockCall {
  name: string;
  number: string;
  riskScore: number;
  type: 'Normal' | 'Spam' | 'Scam' | 'High-Risk' | 'Suspicious';
  carrier: string;
  location: string;
  frequency: string;
}

export function useCallerIntelligence(childId: string = '1') {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);
  const [spamCalls, setSpamCalls] = useState<SpamCall[]>([]);
  const [reportHistory, setReportHistory] = useState<CallReport[]>([]);
  const [callHistory, setCallHistory] = useState<MockCall[]>([]);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFromBackendDB = useCallback(async () => {
    setIsLoading(true);
    let realDeviceLogs: MockCall[] = [];

    // 1. Fetch real device call logs from phone hardware via native bridge
    try {
      const deviceLogs = await CallDetection.getDeviceCallLogs(100);
      if (Array.isArray(deviceLogs) && deviceLogs.length > 0) {
        realDeviceLogs = deviceLogs.map(log => {
          let callType: 'Normal' | 'Spam' | 'Scam' | 'High-Risk' | 'Suspicious' = 'Normal';
          if (log.isBlocked) {
            callType = 'Scam';
          } else if (log.isSpam || log.riskScore >= 70) {
            callType = 'Spam';
          } else if (log.riskScore >= 40) {
            callType = 'Suspicious';
          }

          return {
            name: log.callerName || 'Unknown Caller',
            number: log.phoneNumber || '',
            riskScore: log.riskScore || (log.isBlocked ? 100 : log.isSpam ? 85 : 5),
            type: callType,
            carrier: 'Cellular Network',
            location: 'Mobile Device',
            frequency: `${log.callType} • ${log.duration || '00:00'}`,
          };
        });
      }
    } catch (e) {
      console.warn('Native device call logs error:', e);
    }

    // 2. Fetch backend records from Cloud DB
    try {
      const baseUrl = getCallerBaseUrl();
      const [intelRes, callsRes, spamRes, blockedRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/caller-intel/${childId}`),
        fetch(`${baseUrl}/api/calls`),
        fetch(`${baseUrl}/api/spam-log`),
        fetch(`${baseUrl}/api/blocked`),
      ]);

      if (intelRes.status === 'fulfilled' && intelRes.value.ok) {
        const data = await intelRes.value.json();
        if (Array.isArray(data.blockedNumbers)) {
          setBlockedNumbers(data.blockedNumbers);
        }
        if (Array.isArray(data.reportHistory)) {
          setReportHistory(data.reportHistory);
        }
        if (typeof data.autoBlockEnabled === 'boolean') {
          setAutoBlockEnabled(data.autoBlockEnabled);
        }
        if (typeof data.notificationsEnabled === 'boolean') {
          setNotificationsEnabled(data.notificationsEnabled);
        }
      }

      if (blockedRes.status === 'fulfilled' && blockedRes.value.ok) {
        const bData = await blockedRes.value.json();
        if (Array.isArray(bData) && bData.length > 0) {
          const mappedBlocked: BlockedNumber[] = bData.map((b: any) => ({
            number: b.phone_number || '',
            name: b.caller_name || 'Blocked Caller',
            reason: b.block_reason || 'Shield Auto-Blocked',
            date: b.block_date ? String(b.block_date).split(' ')[0] : 'Recent',
          }));
          setBlockedNumbers(prev => {
            const map = new Map<string, BlockedNumber>();
            prev.forEach(item => map.set(item.number, item));
            mappedBlocked.forEach(item => map.set(item.number, item));
            return Array.from(map.values());
          });
        }
      }

      if (spamRes.status === 'fulfilled' && spamRes.value.ok) {
        const spamData = await spamRes.value.json();
        if (Array.isArray(spamData)) {
          const mappedSpam: SpamCall[] = spamData.map((s: any) => ({
            name: s.caller_name || 'Reported Spam',
            number: s.phone_number || '',
            riskScore: s.risk_score || 85,
            date: s.reported_at ? new Date(s.reported_at).toLocaleString() : 'Recent',
          }));
          setSpamCalls(mappedSpam);
        }
      }

      let backendCalls: MockCall[] = [];
      if (callsRes.status === 'fulfilled' && callsRes.value.ok) {
        const callsData = await callsRes.value.json();
        if (Array.isArray(callsData) && callsData.length > 0) {
          backendCalls = callsData.map((c: any) => ({
            name: c.caller_name || 'Unknown Caller',
            number: c.caller_number || '',
            riskScore: c.risk_score || 0,
            type: c.risk_score >= 80 ? 'Spam' : (c.risk_score > 40 ? 'Suspicious' : 'Normal'),
            carrier: 'Cellular Network',
            location: 'India',
            frequency: 'Recent Call',
          }));
        }
      }

      // Combine device logs with backend calls, avoiding duplicate numbers
      const mergedCalls = [...realDeviceLogs];
      const existingNumbers = new Set(realDeviceLogs.map(l => l.number));
      backendCalls.forEach(bc => {
        if (!existingNumbers.has(bc.number)) {
          mergedCalls.push(bc);
          existingNumbers.add(bc.number);
        }
      });

      setCallHistory(mergedCalls);
      setIsLoading(false);
      return;
    } catch (e) {
      console.warn('Caller Intel backend fetch failed, using local fallback:', e);
    }

    if (realDeviceLogs.length > 0) {
      setCallHistory(realDeviceLogs);
    } else {
      try {
        const data = await Storage.getCallerIntel();
        if (data) {
          if (Array.isArray(data.blockedNumbers)) setBlockedNumbers(data.blockedNumbers);
          if (Array.isArray(data.spamCalls)) setSpamCalls(data.spamCalls);
          if (Array.isArray(data.reportHistory)) setReportHistory(data.reportHistory);
          if (Array.isArray(data.callHistory)) setCallHistory(data.callHistory);
        }
      } catch {}
    }
    setIsLoading(false);
  }, [childId]);

  const saveToStorage = useCallback(async (updated: any) => {
    try {
      await Storage.setCallerIntel(updated);
    } catch (err) {
      console.error('Error saving caller intelligence to storage:', err);
    }
  }, []);

  useEffect(() => {
    fetchFromBackendDB();
  }, [fetchFromBackendDB]);

  const addBlockedNumber = useCallback(async (number: string, name: string, reason: string) => {
    const newEntry: BlockedNumber = {
      number,
      name: name || 'Spam Number',
      reason: reason || 'User Blocked',
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newEntry, ...blockedNumbers.filter(b => b.number !== number)];
    setBlockedNumbers(updated);
    saveToStorage({ blockedNumbers: updated, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/blocked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: number, caller_name: name, block_reason: reason }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend add blocked number error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, fetchFromBackendDB]);

  const removeBlockedNumber = useCallback(async (number: string) => {
    const updated = blockedNumbers.filter(b => b.number !== number);
    setBlockedNumbers(updated);
    saveToStorage({ blockedNumbers: updated, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/blocked/${encodeURIComponent(number)}`, {
        method: 'DELETE',
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend delete blocked number error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, fetchFromBackendDB]);

  const reportCall = useCallback(async (number: string, type: string, description: string) => {
    const newReport: CallReport = {
      id: String(Date.now()),
      number,
      type,
      description,
      timestamp: new Date().toLocaleString(),
    };
    const updatedReports = [newReport, ...reportHistory];
    setReportHistory(updatedReports);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory: updatedReports, callHistory, autoBlockEnabled, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_number: number, report_reason: `${type}: ${description}` }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend report call error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled, saveToStorage, fetchFromBackendDB]);

  const toggleAutoBlock = useCallback(async (val: boolean) => {
    setAutoBlockEnabled(val);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled: val, notificationsEnabled });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_block_enabled: val }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend toggle auto block error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, notificationsEnabled, saveToStorage, childId, fetchFromBackendDB]);

  const toggleNotifications = useCallback(async (val: boolean) => {
    setNotificationsEnabled(val);
    saveToStorage({ blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, notificationsEnabled: val });

    try {
      await fetch(`${getCallerBaseUrl()}/api/caller-intel/${childId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: val }),
      });
      await fetchFromBackendDB();
    } catch (e) {
      console.error('Backend toggle notifications error:', e);
    }
  }, [blockedNumbers, spamCalls, reportHistory, callHistory, autoBlockEnabled, saveToStorage, childId, fetchFromBackendDB]);

  return {
    blockedNumbers,
    spamCalls,
    reportHistory,
    callHistory,
    autoBlockEnabled,
    notificationsEnabled,
    isLoading,
    addBlockedNumber,
    removeBlockedNumber,
    reportCall,
    toggleAutoBlock,
    toggleNotifications,
    refreshData: fetchFromBackendDB,
  };
}
