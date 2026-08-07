import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface ChildLinkScreenProps {
  onBack: () => void;
  onLinkSuccess: () => void;
}

export const ChildLinkScreen: React.FC<ChildLinkScreenProps> = ({
  onBack,
  onLinkSuccess,
}) => {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [childName, setChildName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLinkDevice = () => {
    Keyboard.dismiss();

    const cleanCode = pairingCode.replace(/\D/g, '');

    if (!childName.trim()) {
      setErrorMessage("Please enter the child's name");
    } else if (!parentEmail.trim() || !parentEmail.includes('@')) {
      setErrorMessage('Please enter a valid parent email');
    } else if (cleanCode.length !== 6) {
      setErrorMessage('Pairing code must be 6 digits');
    } else {
      setErrorMessage('');
      onLinkSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Back button and header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Link Child Device</Text>
      </View>

      <View style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Enter Authorization Details</Text>
          <Text style={styles.infoSub}>
            Input the child's identity and the generated 6-digit code from the parent's control panel link screen.
          </Text>
        </View>

        {/* Inputs Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Icon name="person" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Child's Name (e.g. Alex)"
              placeholderTextColor={colors.textMuted}
              value={childName}
              onChangeText={setChildName}
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 16 }]}>
            <Icon name="email" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Parent's Email Address"
              placeholderTextColor={colors.textMuted}
              value={parentEmail}
              onChangeText={setParentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 16 }]}>
            <Icon name="vpn-key" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Linking Code (e.g. 942-817)"
              placeholderTextColor={colors.textMuted}
              value={pairingCode}
              onChangeText={setPairingCode}
              keyboardType="number-pad"
              maxLength={7}
            />
          </View>
        </View>

        {/* Error message */}
        {errorMessage.length > 0 && <Text style={styles.errorText}>{errorMessage}</Text>}

        {/* Link Device Button */}
        <TouchableOpacity style={styles.linkBtn} onPress={handleLinkDevice}>
          <LinearGradient
            colors={[colors.purpleAccent, colors.cyanAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.btnText}>Link Device & Connect</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 28,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingLeft: 12,
  },
  errorText: {
    color: colors.redDanger,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginLeft: 4,
  },
  linkBtn: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 32,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
