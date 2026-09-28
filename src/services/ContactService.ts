import { PermissionsAndroid, Platform } from 'react-native';
import CallDetection from '../native/CallDetection';
import { getCallerBaseUrl } from '../config/apiConfig';

export interface LocalContact {
  recordID: string;
  displayName: string;
  phoneNumber: string;
  phoneNumbers?: Array<{ label: string; number: string }>;
  hasThumbnail?: boolean;
  thumbnailPath?: string;
}

export const getLocalContacts = async (): Promise<LocalContact[]> => {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission',
        message: 'Shield needs access to your contacts to identify callers and search numbers.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return [];
    }

    const nativeContacts = await CallDetection.getDeviceContacts();
    return nativeContacts.map(c => ({
      recordID: c.recordID,
      displayName: c.displayName,
      phoneNumber: c.phoneNumber,
      phoneNumbers: [{ label: 'mobile', number: c.phoneNumber }],
      thumbnailPath: c.thumbnailPath,
    }));
  } catch (error) {
    console.error('Failed to get local contacts:', error);
    return [];
  }
};

export const findContactByNumber = (
  contacts: LocalContact[],
  phoneNumber: string
): LocalContact | null => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (!cleanNumber || cleanNumber.length < 4) return null;
  const last10 = cleanNumber.slice(-10);

  for (const contact of contacts) {
    const cleanPhone = (contact.phoneNumber || '').replace(/\D/g, '');
    if (cleanPhone && (cleanPhone === cleanNumber || cleanPhone.endsWith(last10) || (cleanPhone.length >= 10 && last10.endsWith(cleanPhone.slice(-10))))) {
      return contact;
    }
    if (contact.phoneNumbers) {
      for (const p of contact.phoneNumbers) {
        const cp = (p.number || '').replace(/\D/g, '');
        if (cp && (cp === cleanNumber || cp.endsWith(last10) || (cp.length >= 10 && last10.endsWith(cp.slice(-10))))) {
          return contact;
        }
      }
    }
  }
  return null;
};

export const findContactByName = (
  contacts: LocalContact[],
  nameQuery: string
): LocalContact[] => {
  const query = nameQuery.trim().toLowerCase();
  if (!query) return [];
  return contacts.filter(c => (c.displayName || '').toLowerCase().includes(query));
};

export const getContactName = (
  contacts: LocalContact[],
  phoneNumber: string
): string | null => {
  const contact = findContactByNumber(contacts, phoneNumber);
  return contact ? contact.displayName : null;
};

export const syncContactsWithBackend = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    if (Platform.OS === 'android') {
      try {
        await CallDetection.syncContacts();
      } catch (nativeErr) {
        console.warn('Native syncContacts warning:', nativeErr);
      }
    }

    const contacts = await getLocalContacts();
    if (contacts.length === 0) {
      return { success: false, count: 0, message: 'No contacts found or permission denied' };
    }

    const payload = contacts
      .filter(c => c.phoneNumber && c.phoneNumber.trim().length > 3)
      .map(c => ({
        caller_name: c.displayName || 'Unknown',
        phone_number: c.phoneNumber.trim(),
      }));

    if (payload.length === 0) {
      return { success: false, count: 0, message: 'No valid phone numbers found to upload' };
    }

    const baseUrl = getCallerBaseUrl();
    const resp = await fetch(`${baseUrl}/api/callers/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'shield-prod-key-2024',
      },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      const count = data.inserted || payload.length;
      return {
        success: true,
        count: payload.length,
        message: `Successfully synchronized ${payload.length} contacts with cloud database`,
      };
    } else {
      return {
        success: false,
        count: 0,
        message: `Server returned HTTP ${resp.status}`,
      };
    }
  } catch (error: any) {
    console.error('syncContactsWithBackend error:', error);
    return { success: false, count: 0, message: error?.message || 'Contact sync failed' };
  }
};