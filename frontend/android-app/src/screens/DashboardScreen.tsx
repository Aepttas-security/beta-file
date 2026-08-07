import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Line, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';
import { useApkScanner } from '../hooks/useApkScanner';

interface DashboardScreenProps {
  onSignOut: () => void;
  onOpenGeoTracking: () => void;
  onOpenParentalControl: () => void;
  onOpenMalwareAnalysis: () => void;
  onOpenCallerIntelligence: () => void;
  onOpenVulnerabilityDetection: () => void;
  onOpenChildDashboard: () => void;
  scanner: ReturnType<typeof useApkScanner>;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSignOut,
  onOpenGeoTracking,
  onOpenParentalControl,
  onOpenMalwareAnalysis,
  onOpenCallerIntelligence,
  onOpenVulnerabilityDetection,
  onOpenChildDashboard,
  scanner,
}) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const score = scanner.dashboardMetrics?.device_security_score ?? 100;
  const totalScanned = scanner.dashboardMetrics?.total_scanned ?? 0;
  const threatsDetected = scanner.dashboardMetrics?.threats_detected ?? 0;
  const quarantinedFiles = scanner.dashboardMetrics?.quarantined_files ?? 0;
  const lastScanTimestamp = scanner.autoScanState?.lastScanTimestamp;

  const isProtected = threatsDetected === 0 && quarantinedFiles === 0;

  const formatRelativeTime = (timestampStr: string | null) => {
    if (!timestampStr) return 'Never scanned';
    const date = new Date(timestampStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const [activeTab, setActiveTab] = useState('Home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileView, setProfileView] = useState<'menu' | 'info' | 'settings' | 'subscription' | 'orders'>('menu');
  const [profileData, setProfileData] = useState({
    name: 'Leo Anderson',
    phone: '+1 (555) 019-2831',
    email: 'leo.anderson@example.com'
  });

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Redirecting', message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <View style={styles.purpleGlow} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Small Logo Container */}
            <View style={styles.miniLogo}>
              <Svg width={28} height={28} viewBox="0 0 100 100">
                <Defs>
                  <SvgLinearGradient id="miniShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#8b5cf6" />
                    <Stop offset="100%" stopColor="#2563eb" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M50,10 L85,22 V48 C85,69.5 70,89 50,94 C30,89 15,69.5 15,48 V22 L50,10 Z"
                  fill="url(#miniShieldGrad)"
                />
                <Path
                  d="M45,60 L35,50 L39,46 L45,52 L61,36 L65,40 Z"
                  fill={colors.text}
                />
              </Svg>
            </View>
            <View style={styles.headerTitleContainer}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.headerTitle}>Aepttas Shield</Text>
              </View>
              <Text style={styles.headerSubtitle}>AI-Powered Mobile Security Suite</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity style={styles.bellButton} onPress={onSignOut}>
              <Icon name="notifications" color={colors.text} size={20} />
              <View style={styles.redDot} />
            </TouchableOpacity>

            {/* Profile Icon */}
            <TouchableOpacity style={styles.profileButton} onPress={() => { setProfileView('menu'); setShowProfileModal(true); }}>
              <Icon name="person" color={colors.text} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. MAIN STATUS CARD */}
        <LinearGradient
          colors={['#5b21b6', '#1e3a8a', '#0f172a']}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusCardContent}>
            {/* Glowing Shield SVG */}
            <View style={styles.shieldWrapper}>
              <Svg width={90} height={90} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" fill={colors.purpleAccent} opacity={0.15} />
                <Circle cx="50" cy="50" r="35" fill={colors.cyanAccent} opacity={0.1} />
                <Path
                  d="M50,20 L80,30 V50 C80,68 67,82 50,87 C33,82 20,68 20,50 V30 L50,20 Z"
                  fill="#1e293b"
                  stroke={colors.cyanAccent}
                  strokeWidth="3"
                />
                <Path
                  d="M45,63 L32,50 L37,45 L45,53 L63,35 L68,40 Z"
                  fill={colors.cyanAccent}
                />
              </Svg>
            </View>

            {/* Device Status Details */}
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabelText}>YOUR DEVICE IS</Text>
              <View style={styles.protectedRow}>
                <Text style={[styles.protectedText, !isProtected && { color: colors.redDanger }]}>
                  {isProtected ? 'PROTECTED' : 'AT RISK'}
                </Text>
                <View style={[styles.checkBadge, !isProtected && { backgroundColor: colors.redDanger }]}>
                  <Icon name={isProtected ? 'check' : 'warning'} color="#fff" size={10} />
                </View>
              </View>
              <Text style={styles.scoreLabel}>Security Score</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{score}</Text>
                <Text style={styles.scoreSmall}>/100</Text>
              </View>
              <View style={styles.scanTimeRow}>
                <Text style={styles.scanTimeText}>Last scanned: {formatRelativeTime(lastScanTimestamp)}</Text>
                <TouchableOpacity onPress={() => scanner.refreshData()} style={{ marginLeft: 4 }}>
                  <Icon name="refresh" color="#d1d5db" size={12} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 3. STATS ROW */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="report" color={colors.redDanger} size={20} />
            <Text style={styles.statValue}>{threatsDetected}</Text>
            <Text style={styles.statLabel}>Threats{'\n'}Detected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="inventory" color={colors.purpleAccent} size={20} />
            <Text style={styles.statValue}>
              {totalScanned >= 1000 ? `${(totalScanned / 1000).toFixed(2)}K` : totalScanned}
            </Text>
            <Text style={styles.statLabel}>APKs{'\n'}Scanned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="warning-amber" color={colors.orangeWarning} size={20} />
            <Text style={styles.statValue}>{quarantinedFiles}</Text>
            <Text style={styles.statLabel}>Quarantined{'\n'}Files</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="shield" color={colors.cyanAccent} size={20} />
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Vulnerabilities{'\n'}Found</Text>
          </View>
        </View>

        {/* 4. QUICK ACTIONS SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS GRID */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.purpleAccent + '1E' }]}>
              <Icon name="shield" color={colors.purpleAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Antivirus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenMalwareAnalysis}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.greenSuccess + '1E' }]}>
              <Icon name="inventory" color={colors.greenSuccess} size={20} />
            </View>
            <Text style={styles.gridLabel}>APK Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenCallerIntelligence}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.blueAccent + '1E' }]}>
              <Icon name="phone" color={colors.blueAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Caller Intelligence</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenVulnerabilityDetection}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.orangeWarning + '1E' }]}>
              <Icon name="error-outline" color={colors.orangeWarning} size={20} />
            </View>
            <Text style={styles.gridLabel}>Vulnerability{'\n'}Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.gridRow, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.gridItem} onPress={onOpenChildDashboard}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.purpleAccent + '1E' }]}>
              <Icon name="child-care" color={colors.purpleAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Child Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenGeoTracking}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.blueAccent + '1E' }]}>
              <Icon name="globe" color={colors.blueAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Geo Tracking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={onOpenParentalControl}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.pinkAccent + '1E' }]}>
              <Icon name="people" color={colors.pinkAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Parental Control</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBg, { backgroundColor: colors.cyanAccent + '1E' }]}>
              <Icon name="vpn-key" color={colors.cyanAccent} size={20} />
            </View>
            <Text style={styles.gridLabel}>Secure VPN</Text>
          </TouchableOpacity>
        </View>

        {/* 5. AI THREAT INTELLIGENCE CARD */}
        <View style={styles.aiCard}>
          <View style={styles.aiContent}>
            <View style={{ flex: 1.3 }}>
              <Text style={styles.aiTitle}>AI Threat Intelligence</Text>
              <Text style={styles.aiDate}>Updated: Today 08:45 AM</Text>
            </View>

            {/* Neural Network SVG Graphic */}
            <View style={styles.brainWrapper}>
              <Svg width={60} height={50} viewBox="0 0 60 50">
                <Circle cx="30" cy="25" r="16" fill={colors.cyanAccent} opacity={0.2} />
                <Circle cx="30" cy="25" r="6" fill={colors.purpleAccent} opacity={0.8} />
                {/* Connector Lines */}
                <Line x1="30" y1="25" x2="10" y2="10" stroke={colors.cyanAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="50" y2="35" stroke={colors.cyanAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="15" y2="40" stroke={colors.purpleAccent} strokeWidth="1" opacity={0.6} />
                <Line x1="30" y1="25" x2="48" y2="10" stroke={colors.purpleAccent} strokeWidth="1" opacity={0.6} />
                {/* Node Circles */}
                <Circle cx="10" cy="10" r="3" fill={colors.cyanAccent} />
                <Circle cx="50" cy="35" r="3" fill={colors.cyanAccent} />
                <Circle cx="15" cy="40" r="3" fill={colors.purpleAccent} />
                <Circle cx="48" cy="10" r="3" fill={colors.purpleAccent} />
              </Svg>
            </View>

            <TouchableOpacity style={styles.aiArrowBtn}>
              <Icon name="arrow-forward" color={colors.text} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. RECENT ACTIVITY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.editLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivityCard}>
          <View style={styles.activityIconBg}>
            <Icon name="error" color={colors.redDanger} size={24} />
          </View>
          <View style={styles.activityTexts}>
            <Text style={styles.activityTitle}>Malicious APK Detected</Text>
            <Text style={styles.activitySub}>com.bad.app.malware</Text>
          </View>
          <View style={styles.activityTimeCol}>
            <Text style={styles.activityTime}>10:30 AM</Text>
            <Text style={styles.activityStatus}>Quarantined</Text>
          </View>
        </View>

        {/* Spacer before footer bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 7. FLOATING BOTTOM NAVIGATION BAR */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.floatingNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
            <Icon name="home" color={activeTab === 'Home' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Scan')}>
            <Icon name="search" color={activeTab === 'Scan' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Scan' && styles.navTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Console')}>
            <Icon name="terminal" color={activeTab === 'Console' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Console' && styles.navTextActive]}>Console</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Reports')}>
            <Icon name="reports" color={activeTab === 'Reports' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'Reports' && styles.navTextActive]}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('More')}>
            <Icon name="grid" color={activeTab === 'More' ? colors.purpleAccent : colors.textMuted} size={22} />
            <Text style={[styles.navText, activeTab === 'More' && styles.navTextActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* PROFILE POPUP */}
      <Modal transparent={true} visible={showProfileModal} animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close X Button */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowProfileModal(false)}>
              <Icon name="close" color={colors.text} size={16} />
            </TouchableOpacity>

            {profileView === 'menu' ? (
              <>
                <Text style={styles.menuTitle}>Profile Menu</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('info')}>
                    <Icon name="person" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Profile Info</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('subscription')}>
                    <Icon name="verified" color={colors.purpleAccent} size={20} />
                    <Text style={styles.menuOptionText}>Subscription</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('orders')}>
                    <Icon name="receipt" color={colors.orangeWarning} size={20} />
                    <Text style={styles.menuOptionText}>Orders & Payments</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Feedback feature coming soon.')}>
                    <Icon name="feedback" color={colors.greenSuccess} size={20} />
                    <Text style={styles.menuOptionText}>Feedback</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Help feature coming soon.')}>
                    <Icon name="help" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Help</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => setProfileView('settings')}>
                    <Icon name="settings" color={colors.greenSuccess} size={20} />
                    <Text style={styles.menuOptionText}>Settings</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : profileView === 'info' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatarContainer}>
                    <View style={styles.profileAvatarBg}>
                      <Icon name="person" color={colors.text} size={40} />
                    </View>
                    <TouchableOpacity style={styles.editAvatarBtn} onPress={() => showToast('Edit photo feature coming soon.')}>
                      <Icon name="edit" color="#000" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Name</Text>
                  <Text style={styles.profileValue}>{profileData.name}</Text>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Phone Number</Text>
                  <Text style={styles.profileValue}>{profileData.phone}</Text>
                </View>

                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{profileData.email}</Text>
                </View>
              </>
            ) : profileView === 'settings' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <Text style={styles.menuTitle}>Settings</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  {/* Theme Toggle */}
                  <TouchableOpacity style={styles.menuOptionBtn} onPress={toggleTheme}>
                    <Text style={styles.menuOptionText}>Dark/Light Mode</Text>
                    <Icon name={mode === 'dark' ? 'light-mode' : 'dark-mode'} color={colors.cyanAccent} size={16} />
                  </TouchableOpacity>

                  {['Account', 'Password', 'Change Password', 'Email', 'Change Email', 'Language'].map((settingItem, idx) => (
                    <TouchableOpacity key={idx} style={styles.menuOptionBtn} onPress={() => showToast(`${settingItem} settings coming soon.`)}>
                      <Text style={styles.menuOptionText}>{settingItem}</Text>
                      <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                    </TouchableOpacity>
                  ))}

                  {/* Log Out Option */}
                  <TouchableOpacity style={[styles.menuOptionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]} onPress={() => { setShowProfileModal(false); onSignOut(); }}>
                    <Text style={[styles.menuOptionText, { color: colors.redDanger }]}>Log Out</Text>
                    <Icon name="exit-to-app" color={colors.redDanger} size={20} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : profileView === 'subscription' ? (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <View style={styles.subHeader}>
                  <Icon name="verified" color={colors.purpleAccent} size={20} />
                  <Text style={styles.subHeaderTag}>AEPTTAS SHIELD SUBSCRIPTION</Text>
                </View>

                <Text style={styles.subMainTitle}>Upgrade to Premium Security</Text>
                <Text style={styles.subDescription}>
                  Unlock full AI telemetry defense and safeguard your mobile workspace.
                </Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <View style={styles.plansContainer}>
                    {/* Standard Shield Plan */}
                    <TouchableOpacity
                      style={styles.planCard}
                      onPress={() => showToast('Thank you for subscribing to Standard Shield!')}
                    >
                      <View style={styles.planHeaderRow}>
                        <Text style={styles.planName}>Standard Shield</Text>
                        <Text style={styles.planPrice}>₹299/mo</Text>
                      </View>
                      <Text style={styles.planFeatures}>
                        • Core APK Sandboxing{`\n`}• 2 Linked Child Devices{`\n`}• Basic Geo-tracking History
                      </Text>
                    </TouchableOpacity>

                    {/* Premium Plan */}
                    <TouchableOpacity
                      style={[styles.planCard, styles.planCardElite]}
                      onPress={() => showToast('Welcome to Premium Protection!')}
                    >
                      <View style={styles.eliteBadgeRow}>
                        <View style={styles.eliteBadge}>
                          <Text style={styles.eliteBadgeText}>MOST POPULAR</Text>
                        </View>
                      </View>
                      <View style={styles.planHeaderRow}>
                        <Text style={[styles.planName, { color: colors.cyanAccent }]}>Premium</Text>
                        <Text style={[styles.planPrice, { color: colors.cyanAccent }]}>₹599/mo</Text>
                      </View>
                      <Text style={[styles.planFeatures, { color: '#e2e8f0' }]}>
                        • Infinite Sandbox Telemetry{`\n`}• Unlimited Child Device Links{`\n`}• Secure VIP VPN Access{`\n`}• Live 24/7 Threat Intelligence
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.modalBackBtn} onPress={() => setProfileView('menu')}>
                  <Icon name="arrow-back" color={colors.text} size={16} />
                </TouchableOpacity>

                <Text style={styles.menuTitle}>Orders & Payments</Text>

                <ScrollView style={styles.menuOptionsContainer} showsVerticalScrollIndicator={false}>
                  <View style={[styles.planCard, { marginBottom: 12 }]}>
                    <View style={styles.planHeaderRow}>
                      <Text style={styles.planName}>No Orders Yet</Text>
                    </View>
                    <Text style={styles.planFeatures}>
                      Your past purchases and payment history will appear here once you subscribe to a plan.
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Payment methods coming soon.')}>
                    <Icon name="credit-card" color={colors.cyanAccent} size={20} />
                    <Text style={styles.menuOptionText}>Manage Payment Methods</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOptionBtn} onPress={() => showToast('Billing history coming soon.')}>
                    <Icon name="receipt" color={colors.purpleAccent} size={20} />
                    <Text style={styles.menuOptionText}>Billing History</Text>
                    <Icon name="arrow-forward" color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    alignItems: 'center',
    overflow: 'hidden',
  },
  purpleGlow: {
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: '#201a54',
    opacity: 0.35,
    marginTop: -200,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 12,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.purpleAccent + '88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.redDanger,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purpleAccent + '40',
    borderWidth: 2,
    borderColor: colors.purpleAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cyanAccent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#07051f',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
  },
  profileLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  profileValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  menuOptionsContainer: {
    width: '100%',
    paddingTop: 8,
  },
  menuOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  modalBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statusCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#38bdf844', // translucent cyan/purple gradient border simulation
    marginTop: 10,
    marginBottom: 24,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDetails: {
    flex: 1,
    paddingLeft: 16,
  },
  statusLabelText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  protectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  protectedText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.greenSuccess,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreBig: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreSmall: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 4,
    marginLeft: 2,
  },
  scanTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scanTimeText: {
    color: '#D1D5DB',
    fontSize: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  editLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridItem: {
    flex: 0.23,
    height: 96,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  gridIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  aiCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginTop: 28,
    marginBottom: 28,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  brainWrapper: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.redDanger + '26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTexts: {
    flex: 1,
    marginLeft: 14,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activitySub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  activityTimeCol: {
    alignItems: 'flex-end',
  },
  activityTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  activityStatus: {
    color: colors.redDanger,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  floatingNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  floatingNav: {
    flexDirection: 'row',
    height: 68,
    borderRadius: 24,
    backgroundColor: colors.cardBackground + 'F2', // 0.95 opacity
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  navTextActive: {
    color: colors.purpleAccent,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: '#ffd900',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  subHeaderTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.purpleAccent,
    letterSpacing: 1,
    marginLeft: 6,
  },
  subMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subDescription: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  plansContainer: {
    width: '100%',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#0a0d1b',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  planCardElite: {
    borderColor: colors.cyanAccent + '88',
    backgroundColor: '#0a1626',
    borderWidth: 1.5,
  },
  eliteBadgeRow: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eliteBadge: {
    backgroundColor: colors.cyanAccent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  eliteBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.purpleAccent,
  },
  planFeatures: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  subSkipBtn: {
    paddingVertical: 6,
  },
  subSkipBtnText: {
    fontSize: 11,
    color: '#6b6e85',
    fontWeight: '600',
  },
});
