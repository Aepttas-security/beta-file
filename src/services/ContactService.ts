import { PermissionsAndroid, Platform } from 'react-native';

export interface LocalContact {
  recordID: string;
  displayName: string;
  phoneNumbers: Array<{ label: string; number: string }>;
  hasThumbnail: boolean;
  thumbnailPath?: string;
}

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

const getContactsModule = async () => {
  if (!isNative) {
    return null;
  }
  try {
    const Contacts = require('react-native-contacts');
    return Contacts;
  } catch (error) {
    console.warn('Contacts module not available:', error);
    return null;
  }
};

export const getLocalContacts = async (): Promise<LocalContact[]> => {
  if (!isNative) {
    console.log('📱 Contacts not supported on web');
    return [];
  }

  try {
    const Contacts = await getContactsModule();
    if (!Contacts) {
      return [];
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts to identify callers.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return [];
      }
    }

    const contacts = await Contacts.getAll();
    
    return contacts.map((contact: any) => ({
      recordID: contact.recordID || '',
      displayName: contact.displayName || 'Unknown',
      phoneNumbers: contact.phoneNumbers || [],
      hasThumbnail: contact.hasThumbnail || false,
      thumbnailPath: contact.thumbnailPath,
    }));
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return [];
  }
};

export const findContactByNumber = (
  contacts: LocalContact[],
  phoneNumber: string
): LocalContact | null => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  for (const contact of contacts) {
    for (const phone of contact.phoneNumbers) {
      const cleanContactNumber = phone.number.replace(/\D/g, '');
      if (cleanContactNumber === cleanNumber || 
          cleanContactNumber.includes(cleanNumber) || 
          cleanNumber.includes(cleanContactNumber)) {
        return contact;
      }
    }
  }
  return null;
};

export const getContactName = (
  contacts: LocalContact[],
  phoneNumber: string
): string | null => {
  const contact = findContactByNumber(contacts, phoneNumber);
  return contact ? contact.displayName : null;
};