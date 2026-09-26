// src/services/RealCallDetectionService.ts
import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import api from './api';
import { store } from '../store';
import { showCallPopup, setPopupAnalysis, hidePopup } from '../modules/callDetection/store/callDetectionSlice';

let CallDetectorManager: any = null;

if (Platform.OS === 'android') {
  try {
    CallDetectorManager = require('@huddle01/react-native-call-detection').default;
  } catch (e) {
    console.log('Call detection not available:', e);
  }
}

class RealCallDetectionService {
  private callDetector: any = null;
  private isListening: boolean = false;
  private currentNumber: string | null = null;

  startDetection(): void {
    if (this.isListening) {
      console.log('Call detection already running');
      return;
    }

    if (!CallDetectorManager) {
      console.error('Call detection library not available');
      return;
    }

    try {
      this.callDetector = new CallDetectorManager(
        (event: string, phoneNumber: string) => {
          this.handleCallEvent(event, phoneNumber);
        },
        true,
        () => {
          console.log('Permission denied for call detection');
        },
        {
          title: 'Phone State Permission',
          message: 'This app needs access to detect incoming calls and protect you from spam.'
        }
      );

      this.isListening = true;
      console.log('✅ Real call detection started');

    } catch (error) {
      console.error('Failed to start call detection:', error);
    }
  }

  stopDetection(): void {
    if (this.callDetector) {
      try {
        this.callDetector.dispose();
        this.callDetector = null;
        this.isListening = false;
        console.log('🛑 Call detection stopped');
      } catch (error) {
        console.error('Error stopping call detection:', error);
      }
    }
  }

  private handleCallEvent(event: string, phoneNumber: string): void {
    console.log(`📞 Call event: ${event}, Number: ${phoneNumber}`);

    const cleanNumber = phoneNumber?.replace(/[^\d+]/g, '') || '';

    switch (event) {
      case 'Incoming':
        this.currentNumber = cleanNumber;
        this.handleIncomingCall(cleanNumber);
        break;

      case 'Connected':
        console.log('Call connected:', cleanNumber);
        break;

      case 'Disconnected':
        this.handleCallEnded(cleanNumber);
        break;

      case 'Missed':
        this.handleMissedCall(cleanNumber);
        break;

      default:
        console.log('Unknown call event:', event);
    }
  }

  private async handleIncomingCall(phoneNumber: string): Promise<void> {
    try {
      store.dispatch(showCallPopup({
        phoneNumber,
        isLoading: true
      }));

      const response = await api.getCallerInfo(phoneNumber);
      
      store.dispatch(setPopupAnalysis({
        callerInfo: response.callerInfo,
        riskScore: response.riskScore,
        threatLevel: response.threatLevel,
        isBlocked: response.isBlocked,
        categories: response.categories || [],
        scamProbability: response.scamProbability || 0
      }));

    } catch (error) {
      console.error('Failed to get caller info:', error);
      store.dispatch(setPopupAnalysis({
        callerInfo: {
          name: 'Unknown Caller',
          phoneNumber: phoneNumber,
          carrier: 'Unknown',
          location: 'Unknown',
          riskScore: 30,
          threatLevel: 'Suspicious',
          spamReports: 0,
          reputation: 0,
          isBlocked: false
        },
        riskScore: 30,
        threatLevel: 'Suspicious',
        isBlocked: false,
        categories: ['Unknown'],
        scamProbability: 0
      }));
    }
  }

  private handleCallEnded(phoneNumber: string): void {
    store.dispatch(hidePopup());
    this.currentNumber = null;
  }

  private handleMissedCall(phoneNumber: string): void {
    store.dispatch(hidePopup());
    this.currentNumber = null;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ]);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          console.log('✅ All call permissions granted');
          return true;
        } else {
          console.warn('⚠️ Some permissions denied');
          return false;
        }
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
    return true;
  }

  isRunning(): boolean {
    return this.isListening;
  }

  cleanup(): void {
    this.stopDetection();
  }
}

export const realCallDetection = new RealCallDetectionService();