import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { CallDetectionModule } = NativeModules;

// ============================================
// INTERFACES - Real call data structures
// ============================================

export interface CallState {
  state: number;
  stateName: 'IDLE' | 'RINGING' | 'OFFHOOK' | 'UNKNOWN';
  isActive: boolean;
}

export interface CallEvent {
  state: string;           // "INCOMING", "OUTGOING", "OFFHOOK", "IDLE"
  stateName?: string;
  phoneNumber: string;
  type?: 'INCOMING' | 'OUTGOING' | 'OFFHOOK' | 'IDLE';  // ✅ Fixed: Added all types
  isInContacts?: boolean;
  contactName?: string;
  isSpam?: boolean;
  riskScore?: number;
  timestamp?: number;
  carrier?: string;        // ✅ Added
  location?: string;       // ✅ Added
}

export interface CallSummary {
  phoneNumber: string;
  callType: 'answered' | 'missed' | 'blocked';
  duration: number;
  isInContacts: boolean;
  isSpam: boolean;
  riskScore: number;
  contactName?: string;
  timestamp: number;
}

export interface CallerInfo {
  phoneNumber: string;
  callerName: string;
  isInContacts: boolean;
  isSpam: boolean;
  riskScore?: number;
  address?: string;
  carrier?: string;
  location?: string;
}

// ============================================
// MAIN CLASS - Real-Time Call Detection Manager
// ============================================

class CallDetectionManager {
  private eventEmitter: NativeEventEmitter | null = null;
  private isListening: boolean = false;
  private callStartTime: number = 0;
  private currentCallNumber: string = '';
  private isCallAnswered: boolean = false;
  
  // Event listeners
  private stateListeners: Array<(event: CallEvent) => void> = [];
  private callerInfoListeners: Array<(info: CallerInfo) => void> = [];
  private summaryListeners: Array<(summary: CallSummary) => void> = [];
  private errorListeners: Array<(error: Error) => void> = [];
  
  // Permission state
  private overlayPermissionGranted: boolean = false;
  private permissionsGranted: boolean = false;

  constructor() {
    if (Platform.OS === 'android' && CallDetectionModule) {
      this.eventEmitter = new NativeEventEmitter(CallDetectionModule);
      this.setupEventListeners();
      console.log('✅ CallDetectionManager initialized for real-time detection');
    } else {
      console.warn('⚠️ CallDetectionModule not available on this platform');
    }
  }

  // ============================================
  // EVENT LISTENERS - Real call events from native
  // ============================================

  private setupEventListeners() {
    if (!this.eventEmitter) return;

    // 📞 REAL CALL STATE CHANGES
    this.eventEmitter.addListener('onCallStateChanged', (event: CallEvent) => {
      console.log('📞 Real call event:', event);
      
      // Track call timing - using 'state' field instead of 'type'
      const state = event.state || event.type || '';
      
      if (state === 'INCOMING') {
        this.currentCallNumber = event.phoneNumber || '';
        this.callStartTime = Date.now();
        this.isCallAnswered = false;
        console.log(`📞 Incoming call from: ${this.currentCallNumber}`);
      } else if (state === 'OFFHOOK') {
        this.isCallAnswered = true;
        console.log(`📞 Call answered: ${this.currentCallNumber}`);
      } else if (state === 'IDLE') {
        this.handleCallEnded();
        console.log(`📞 Call ended: ${this.currentCallNumber}`);
      }
      
      // Notify all state listeners
      this.stateListeners.forEach(callback => callback(event));
    });

    // 🔍 REAL CALLER INFO (from native contact & spam detection)
    this.eventEmitter.addListener('onCallDetected', (event: CallEvent) => {
      console.log('🔍 Real caller info received:', event);
      
      const callerInfo: CallerInfo = {
        phoneNumber: event.phoneNumber || '',
        callerName: event.contactName || (event.isInContacts ? event.phoneNumber || '' : 'Unknown Caller'),
        isInContacts: event.isInContacts || false,
        isSpam: event.isSpam || false,
        riskScore: event.riskScore || 0,
        carrier: event.carrier || 'Unknown',
        location: event.location || 'Unknown',
      };
      
      this.callerInfoListeners.forEach(callback => callback(callerInfo));
    });

    // 📊 REAL CALL ENDED (summary)
    this.eventEmitter.addListener('onCallEnded', (summary: CallSummary) => {
      console.log('📊 Real call ended:', summary);
      this.summaryListeners.forEach(callback => callback(summary));
    });

    // ❌ REAL ERRORS
    this.eventEmitter.addListener('onError', (error: any) => {
      console.error('❌ Native error:', error);
      this.errorListeners.forEach(callback => callback(new Error(error.message || 'Unknown native error')));
    });
  }

  // ============================================
  // CALL TRACKING - Real-time call state
  // ============================================

  private handleCallEnded() {
    if (!this.currentCallNumber) return;
    
    const duration = Math.round((Date.now() - this.callStartTime) / 1000);
    const callType = this.isCallAnswered ? 'answered' : 'missed';
    
    // Create real call summary
    const summary: CallSummary = {
      phoneNumber: this.currentCallNumber,
      callType: callType as 'answered' | 'missed',
      duration: duration,
      isInContacts: false,
      isSpam: false,
      riskScore: 0,
      timestamp: Date.now(),
    };
    
    console.log(`📊 Call ended: ${callType}, duration: ${duration}s`);
    
    // Reset tracking
    this.currentCallNumber = '';
    this.callStartTime = 0;
    this.isCallAnswered = false;
  }

  // ============================================
  // PERMISSIONS - Real permission management
  // ============================================

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('⚠️ Permissions only supported on Android');
      return false;
    }
    
    try {
      console.log('🔐 Requesting permissions...');
      const result = await CallDetectionModule.requestPermissions();
      this.permissionsGranted = result === true;
      console.log(`✅ Permissions ${this.permissionsGranted ? 'granted' : 'denied'}`);
      return this.permissionsGranted;
    } catch (error) {
      console.error('❌ Permission error:', error);
      this.errorListeners.forEach(cb => cb(new Error('Failed to request permissions')));
      return false;
    }
  }

  async checkOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    
    try {
      const result = await CallDetectionModule.checkOverlayPermission();
      this.overlayPermissionGranted = result === true;
      console.log(`🔍 Overlay permission: ${this.overlayPermissionGranted ? 'granted' : 'not granted'}`);
      return this.overlayPermissionGranted;
    } catch (error) {
      console.error('❌ Overlay check error:', error);
      return false;
    }
  }

  async requestOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    
    try {
      console.log('🖼️ Requesting overlay permission...');
      await CallDetectionModule.requestOverlayPermission();
      // Wait for user to grant/deny
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await this.checkOverlayPermission();
    } catch (error) {
      console.error('❌ Overlay request error:', error);
      return false;
    }
  }

  // ============================================
  // REAL-TIME CALL DETECTION CONTROL
  // ============================================

  async startDetection(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('⚠️ Call detection only supported on Android');
      return false;
    }
    
    if (this.isListening) {
      console.log('📱 Already listening for calls');
      return true;
    }

    try {
      console.log('▶️ Starting real-time call detection...');
      
      // Ensure permissions are granted
      if (!this.permissionsGranted) {
        await this.requestPermissions();
      }
      
      // Ensure overlay permission
      const hasOverlay = await this.checkOverlayPermission();
      if (!hasOverlay) {
        console.warn('⚠️ Overlay permission not granted. Popups may not appear.');
        await this.requestOverlayPermission();
      }

      // Start real detection
      await CallDetectionModule.startCallDetection();
      this.isListening = true;
      console.log('✅ Real-time call detection started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start detection:', error);
      this.errorListeners.forEach(cb => cb(new Error('Failed to start call detection')));
      return false;
    }
  }

  async stopDetection(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    if (!this.isListening) {
      console.log('📱 Already stopped');
      return true;
    }

    try {
      console.log('⏹️ Stopping real-time call detection...');
      await CallDetectionModule.stopCallDetection();
      this.isListening = false;
      console.log('✅ Real-time call detection stopped');
      return true;
    } catch (error) {
      console.error('❌ Stop detection error:', error);
      return false;
    }
  }

  // ============================================
  // REAL-TIME STATE QUERIES
  // ============================================

  async getCallState(): Promise<CallState | null> {
    if (Platform.OS !== 'android') return null;
    
    try {
      const state = await CallDetectionModule.getCallState();
      console.log('📱 Current call state:', state);
      return state;
    } catch (error) {
      console.error('❌ Get call state error:', error);
      return null;
    }
  }

  async isCallActive(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const active = await CallDetectionModule.isCallActive();
      console.log(`📱 Call active: ${active}`);
      return active;
    } catch (error) {
      console.error('❌ Check active error:', error);
      return false;
    }
  }

  async getCurrentCallNumber(): Promise<string> {
    return this.currentCallNumber;
  }

  async getCallDuration(): Promise<number> {
    if (this.callStartTime === 0) return 0;
    return Math.round((Date.now() - this.callStartTime) / 1000);
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      console.log('📱 Initializing CallDetectionModule...');
      await CallDetectionModule.initialize();
      await CallDetectionModule.initializeModule();
      
      // Check initial permissions
      await this.requestPermissions();
      await this.checkOverlayPermission();
      
      console.log('✅ Call detection module initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.errorListeners.forEach(cb => cb(new Error('Failed to initialize call detection')));
      return false;
    }
  }

  // ============================================
  // EVENT SUBSCRIPTION METHODS
  // ============================================

  // Listen for ALL call events
  addListener(callback: (event: CallEvent) => void): () => void {
    this.stateListeners.push(callback);
    return () => {
      this.stateListeners = this.stateListeners.filter(cb => cb !== callback);
    };
  }

  // Listen for enriched caller info (with contact names, spam status)
  onCallDetected(callback: (info: CallerInfo) => void): () => void {
    this.callerInfoListeners.push(callback);
    return () => {
      this.callerInfoListeners = this.callerInfoListeners.filter(cb => cb !== callback);
    };
  }

  // Listen for call end summaries
  onCallEnded(callback: (summary: CallSummary) => void): () => void {
    this.summaryListeners.push(callback);
    return () => {
      this.summaryListeners = this.summaryListeners.filter(cb => cb !== callback);
    };
  }

  // Listen for errors
  onError(callback: (error: Error) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
    };
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.stateListeners = [];
    this.callerInfoListeners = [];
    this.summaryListeners = [];
    this.errorListeners = [];
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onCallStateChanged');
      this.eventEmitter.removeAllListeners('onCallDetected');
      this.eventEmitter.removeAllListeners('onCallEnded');
      this.eventEmitter.removeAllListeners('onError');
    }
  }

  // ============================================
  // STATUS GETTERS
  // ============================================

  get isActive(): boolean {
    return this.isListening;
  }

  get hasOverlayPermission(): boolean {
    return this.overlayPermissionGranted;
  }

  get hasPermissions(): boolean {
    return this.permissionsGranted;
  }

  // ============================================
  // DEBUG - List available native methods
  // ============================================

  getAvailableMethods(): string[] {
    if (!CallDetectionModule) return [];
    return Object.keys(CallDetectionModule);
  }

  // ============================================
  // TESTING ONLY - Simulate calls for testing
  // NEVER USE IN PRODUCTION - Remove for release
  // ============================================

  // ⚠️ TEST ONLY - Remove this method for production
  async simulateCall(phoneNumber: string): Promise<void> {
    if (Platform.OS !== 'android') return;
    console.warn('⚠️ TEST MODE: Simulating call - Remove for production');
    try {
      await CallDetectionModule.simulateCall(phoneNumber);
    } catch (error) {
      console.error('❌ Simulate call error:', error);
    }
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export default new CallDetectionManager();