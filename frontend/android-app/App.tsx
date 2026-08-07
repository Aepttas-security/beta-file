import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { colors } from './src/styles/theme';

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

type ScreenName =
  | 'Login'
  | 'SignUp'
  | 'Dashboard'
  | 'GeoTracking'
  | 'ParentalControl'
  | 'MalwareAnalysis'
  | 'CallerIntelligence'
  | 'ChildLink'
  | 'ChildMode'
  | 'VulnerabilityDetection'
  | 'ChildDashboard';

import { useAppTheme } from './src/contexts/ThemeContext';

import { useApkScanner } from './src/hooks/useApkScanner';

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
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Login');
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');
  const scanner = useApkScanner();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return (
          <LoginScreen
            onSignInSuccess={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('Dashboard');
            }}
            onSetUpChildDevice={() => setCurrentScreen('ChildLink')}
            onGoToSignUp={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('SignUp');
            }}
            signUpSuccessMessage={signUpSuccessMessage}
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
            onSignOut={() => setCurrentScreen('Login')}
            onOpenGeoTracking={() => setCurrentScreen('GeoTracking')}
            onOpenParentalControl={() => setCurrentScreen('ParentalControl')}
            onOpenMalwareAnalysis={() => setCurrentScreen('MalwareAnalysis')}
            onOpenCallerIntelligence={() => setCurrentScreen('CallerIntelligence')}
            onOpenVulnerabilityDetection={() => setCurrentScreen('VulnerabilityDetection')}
            onOpenChildDashboard={() => setCurrentScreen('ChildDashboard')}
            scanner={scanner}
          />
        );
      case 'GeoTracking':
        return <GeoTrackingScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ParentalControl':
        return <ParentalControlScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'MalwareAnalysis':
        return <MalwareAnalysisScreen onBack={() => setCurrentScreen('Dashboard')} scanner={scanner} />;
      case 'CallerIntelligence':
        return <CallerIntelligenceScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'VulnerabilityDetection':
        return <VulnerabilityDetectionScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ChildDashboard':
        return <ChildDashboardScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ChildLink':
        return (
          <ChildLinkScreen
            onBack={() => setCurrentScreen('Login')}
            onLinkSuccess={() => setCurrentScreen('ChildMode')}
          />
        );
      case 'ChildMode':
        return <ChildModeScreen onUnlink={() => setCurrentScreen('Login')} />;
      default:
        return (
          <LoginScreen
            onSignInSuccess={() => setCurrentScreen('Dashboard')}
            onSetUpChildDevice={() => setCurrentScreen('ChildLink')}
            onGoToSignUp={() => setCurrentScreen('SignUp')}
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
