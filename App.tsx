import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { colors } from './src/styles/theme';
import { Storage } from './src/utils/storage';
import { ChildDaemon } from './src/services/childDaemon';
import { ParentalRepository } from './src/data/parentalRepository';

// Import Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { GeoTrackingScreen } from './src/screens/GeoTrackingScreen';
import { ParentalControlScreen } from './src/screens/ParentalControlScreen';
import { MalwareAnalysisScreen } from './src/screens/MalwareAnalysisScreen';
import { CallerIntelligenceScreen } from './src/screens/CallerIntelligenceScreen';
import { ChildLinkScreen } from './src/screens/ChildLinkScreen';
import { ChildModeScreen } from './src/screens/ChildModeScreen';
import { VulnerabilityDetectionScreen } from './src/screens/VulnerabilityDetectionScreen';
import { ChildDashboardScreen } from './src/screens/ChildDashboardScreen';
import { AdminLogsScreen } from './src/screens/AdminLogsScreen';
import { DeviceRoleSelectionScreen } from './src/screens/DeviceRoleSelectionScreen';
import { TwoStepBindingScreen } from './src/screens/TwoStepBindingScreen';
import { ChildPermissionsScreen } from './src/screens/ChildPermissionsScreen';

type ScreenName =
  | 'Login'
  | 'SignUp'
  | 'Dashboard'
  | 'GeoTracking'
  | 'ParentalControl'
  | 'MalwareAnalysis'
  | 'CallerIntelligence'
  | 'ChildLink'
  | 'ChildPermissions'
  | 'ChildMode'
  | 'VulnerabilityDetection'
  | 'ChildDashboard'
  | 'AdminLogs'
  | 'DeviceRoleSelection'
  | 'TwoStepBinding';

import { useAppTheme } from './src/contexts/ThemeContext';

function AppContent({ renderScreen }: { renderScreen: () => React.ReactNode }) {
  const { colors, mode } = useAppTheme();
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.safeArea}>
          {renderScreen()}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('DeviceRoleSelection');
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');

  useEffect(() => {
    LogBox.ignoreAllLogs();
    async function checkLaunchGuard() {
      try {
        console.log('[App] Checking session on mount...');
        const token = await Storage.getAuthToken();
        console.log('[App] Session check retrieved token:', token);
        if (token) {
          console.log('[Auth] Active session token found. Auto-routing to Dashboard.');
          // Sync keys to TokenStorage using updated Storage wrappers
          try {
            await Storage.setAuthToken(token);
            const profile = await Storage.getUserProfile();
            if (profile) {
              await Storage.setUserProfile(profile);
            }
          } catch (e) {
            console.warn('[App] Failed to sync session keys on mount:', e);
          }
          const userProfile = await Storage.getUserProfile();
          if (userProfile && userProfile.user_id) {
            const backendCheck = await ParentalRepository.checkParentLinked(userProfile.user_id);
            if (backendCheck?.is_linked && backendCheck?.linked_child) {
              await Storage.setLinkedChild(backendCheck.linked_child);
            }
          }
          setCurrentScreen('Dashboard');
        } else {
          setCurrentScreen('DeviceRoleSelection');
        }
      } catch (error) {
        console.error('[Auth] Session restoration check failed:', error);
        setCurrentScreen('DeviceRoleSelection');
      }
    }
    checkLaunchGuard();
  }, []);

  const handleSignOut = async () => {
    await Storage.clear();
    ChildDaemon.stopDaemon();
    setCurrentScreen('DeviceRoleSelection');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DeviceRoleSelection':
        return (
          <DeviceRoleSelectionScreen
            onSelectParent={() => setCurrentScreen('Login')}
            onSelectChild={() => setCurrentScreen('ChildLink')}
            onViewBindingCode={() => setCurrentScreen('TwoStepBinding')}
          />
        );
      case 'Login':
        return (
          <LoginScreen
            onSignInSuccess={(isLinked, userEmail) => {
              setSignUpSuccessMessage('');
              if (userEmail === 'admin@gmail.com') {
                setCurrentScreen('AdminLogs');
              } else {
                setCurrentScreen('Dashboard');
              }
            }}
            onSetUpChildDevice={() => setCurrentScreen('DeviceRoleSelection')}
            onGoToSignUp={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('SignUp');
            }}
            signUpSuccessMessage={signUpSuccessMessage}
          />
        );
      case 'TwoStepBinding':
        return (
          <TwoStepBindingScreen
            onBack={() => setCurrentScreen('Dashboard')}
            onCheckStatus={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'SignUp':
        return (
          <SignUpScreen
            onSignUpSuccess={() => {
              setSignUpSuccessMessage('Account created successfully! Please sign in.');
              setCurrentScreen('Login');
            }}
            onGoToLogin={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('Login');
            }}
          />
        );
      case 'Dashboard':
        return (
          <DashboardScreen
            onSignOut={handleSignOut}
            onOpenGeoTracking={() => setCurrentScreen('GeoTracking')}
            onOpenParentalControl={() => setCurrentScreen('ParentalControl')}
            onOpenMalwareAnalysis={() => setCurrentScreen('MalwareAnalysis')}
            onOpenCallerIntelligence={() => setCurrentScreen('CallerIntelligence')}
            onOpenVulnerabilityDetection={() => setCurrentScreen('VulnerabilityDetection')}
            onOpenChildDashboard={() => setCurrentScreen('ChildDashboard')}
          />
        );
      case 'GeoTracking':
        return <GeoTrackingScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ParentalControl':
        return (
          <ParentalControlScreen
            onBack={() => setCurrentScreen('Dashboard')}
            onSignOut={handleSignOut}
          />
        );
      case 'MalwareAnalysis':
        return <MalwareAnalysisScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'CallerIntelligence':
        return <CallerIntelligenceScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'VulnerabilityDetection':
        return <VulnerabilityDetectionScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ChildDashboard':
        return <ChildDashboardScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ChildLink':
        return (
          <ChildLinkScreen
            onBack={() => setCurrentScreen('DeviceRoleSelection')}
            onLinkSuccess={() => setCurrentScreen('ChildPermissions')}
          />
        );
      case 'ChildPermissions':
        return (
          <ChildPermissionsScreen
            onBack={() => setCurrentScreen('ChildLink')}
            onConfirmPermissions={() => setCurrentScreen('ChildMode')}
          />
        );
      case 'ChildMode':
        return <ChildModeScreen onUnlink={handleSignOut} />;
      case 'AdminLogs':
        return <AdminLogsScreen onBack={() => setCurrentScreen('Login')} />;
      default:
        return (
          <DeviceRoleSelectionScreen
            onSelectParent={() => setCurrentScreen('Login')}
            onSelectChild={() => setCurrentScreen('ChildLink')}
            onViewBindingCode={() => setCurrentScreen('TwoStepBinding')}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <AppContent renderScreen={renderScreen} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default App;
