// src/services/CustomCallDetectionService.ts
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { hidePopup, setPopupAnalysis, showCallPopup } from '../modules/callDetection/store/callDetectionSlice';
import { store } from '../store';
import api from './api';

// ✅ Unified module name
const CallDetectionModule = Platform.OS !== 'web' ? NativeModules.CallDetectionModule : null;

class CustomCallDetectionService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isListening: boolean = false;
  private currentNumber: string | null = null;

  constructor() {
    console.log('🔍 CustomCallDetectionService constructor');
    console.log('🔍 Platform:', Platform.OS);
    console.log('🔍 CallDetectionModule:', CallDetectionModule);
    console.log('🔍 All NativeModules:', Object.keys(NativeModules));
    
    // ✅ Only setup listeners on non-web platforms
    if (CallDetectionModule && Platform.OS !== 'web') {
      this.eventEmitter = new NativeEventEmitter(CallDetectionModule);
      this.setupListeners();
      console.log('📱 Call detection module initialized successfully');
    } else {
      console.log('📱 Call detection not available on this platform');
      if (Platform.OS !== 'web') {
        console.log('🔍 Available modules:', Object.keys(NativeModules).join(', '));
      }
    }
  }

  private setupListeners(): void {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onCallDetected', (event: any) => {
      console.log('📞 Call detected:', event);
      
      if (event.event === 'Incoming') {
        this.currentNumber = event.phoneNumber;
        this.handleIncomingCall(event.phoneNumber);
      } else if (event.event === 'Disconnected') {
        this.handleCallEnded();
      } else if (event.event === 'Connected') {
        console.log('Call connected:', event.phoneNumber);
      }
    });

    this.eventEmitter.addListener('onDetectionStatus', (status: any) => {
      console.log('Detection status:', status);
    });
  }

  // ✅ Fixed: Properly handle missing module with debug logs
  async startDetection(): Promise<boolean> {
    console.log('🔍 startDetection called');
    console.log('🔍 Platform:', Platform.OS);
    
    // ✅ Check if running on web
    if (Platform.OS === 'web') {
      console.log('📱 Call detection not available on web platform');
      return false;
    }

    // ✅ Check if the module exists
    console.log('🔍 CallDetectionModule:', CallDetectionModule);
    console.log('🔍 All NativeModules:', Object.keys(NativeModules));
    
    if (!CallDetectionModule) {
      console.log('❌ CallDetectionModule is null or undefined');
      console.log('🔍 Available modules:', Object.keys(NativeModules).join(', '));
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        console.log('🔍 Requesting permissions...');
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ]);
        
        console.log('🔍 Permission results:', permissions);
        
        const allGranted = Object.values(permissions).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.log('❌ Permissions not granted');
          console.log('🔍 Please enable permissions in Settings → Apps → Aepttas Shield → Permissions');
          return false;
        }
        console.log('✅ All permissions granted');
      }

      console.log('🔍 Calling native startDetection...');
      CallDetectionModule.startDetection();
      this.isListening = true;
      console.log('✅ Call detection started successfully');

      return true;

    } catch (error) {
      console.error('❌ Failed to start detection:', error);
      return false;
    }
  }

  stopDetection(): void {
    console.log('🔍 stopDetection called');
    
    // ✅ Web platform check
    if (Platform.OS === 'web') {
      console.log('📱 Call detection not available on web platform');
      return;
    }

    if (!CallDetectionModule) {
      console.log('ℹ️ CallDetectionModule not available');
      return;
    }

    try {
      CallDetectionModule.stopDetection();
      this.isListening = false;
      console.log('🛑 Call detection stopped');
    } catch (error) {
      console.log('ℹ️ Failed to stop detection:', error);
    }
  }

  private async handleIncomingCall(phoneNumber: string): Promise<void> {
    console.log('🔍 handleIncomingCall:', phoneNumber);
    
    try {
      store.dispatch(showCallPopup({
        phoneNumber
      }));

      const response = await api.getCallerInfo(phoneNumber);
      console.log('🔍 Caller info response:', response);
      
      store.dispatch(setPopupAnalysis({
        callerInfo: response.callerInfo || {
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
        riskScore: response.riskScore || 30,
        threatLevel: response.threatLevel || 'Suspicious',
        isBlocked: response.isBlocked || false,
        categories: response.categories || ['Unknown'],
        scamProbability: response.scamProbability || 0
      }));

    } catch (error) {
      console.log('ℹ️ Failed to get caller info:', error);
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

  private handleCallEnded(): void {
    console.log('🔍 handleCallEnded');
    store.dispatch(hidePopup());
    this.currentNumber = null;
  }

  isRunning(): boolean {
    return this.isListening;
  }

  cleanup(): void {
    console.log('🔍 cleanup called');
    this.stopDetection();
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onCallDetected');
      this.eventEmitter.removeAllListeners('onDetectionStatus');
    }
  }
}

export const customCallDetection = new CustomCallDetectionService();