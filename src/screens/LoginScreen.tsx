/**
 * LoginScreen.tsx
 *
 * High-contrast light-themed login / sign-up screen matching the UI Master Contract.
 * Supports mobile number, email, name, password, confirm password, and user agreement checkbox.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../constants/translations';

export default function LoginScreen() {
  const { loginWithPhone, signUpWithPhone, loginAsMock, isLoading, error, clearError } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  const isRTL = language === 'ar';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [agreementModalVisible, setAgreementModalVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const validateAndNormalizePhone = (phone: string): string | null => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+970|\+972)?(59|56)\d{7}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      return null;
    }

    if (cleanPhone.startsWith('0')) {
      return `+970${cleanPhone.slice(1)}`;
    }
    if (!cleanPhone.startsWith('+')) {
      return `+${cleanPhone}`;
    }
    return cleanPhone;
  };

  const handleSubmit = async () => {
    setValidationError(null);
    clearError();

    // Sign Up validation rules
    if (mode === 'signup') {
      if (!mobileNumber || !password || !confirmPassword || !email || !name) {
        setValidationError(isRTL ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError(t.passwordsDoNotMatchError);
        return;
      }
      if (!agreement) {
        setValidationError(t.acceptAgreementError);
        return;
      }
      // Simple email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setValidationError(isRTL ? 'البريد الإلكتروني غير صحيح.' : 'Invalid email address.');
        return;
      }
    } else {
      if (!mobileNumber || !password) {
        setValidationError(isRTL ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
        return;
      }
    }

    const normalizedPhone = validateAndNormalizePhone(mobileNumber);
    if (!normalizedPhone) {
      setValidationError(
        isRTL 
          ? 'رقم هاتف غير صالح. يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام' 
          : 'Invalid Palestinian number. Must start with 059 or 056 and be 10 digits.'
      );
      return;
    }

    try {
      if (mode === 'login') {
        await loginWithPhone(normalizedPhone, password);
      } else {
        await signUpWithPhone(normalizedPhone, password, email.trim(), name.trim());
      }
    } catch (e: any) {
      if (e.message === 'MOBILE_EXISTS') {
        setValidationError(t.mobileExistsError);
      }
    }
  };

  const handleDemoBypass = () => {
    loginAsMock('+970599000000');
  };

  const getCleanErrorMessage = () => {
    if (validationError) return validationError;
    if (error === 'MOBILE_EXISTS') return t.mobileExistsError;
    if (error) return error;
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Icon name="car-connected" size={68} color={theme.colors.primary} />
            <Text style={styles.logoText}>
              Care<Text style={styles.logoAccent}>Tag</Text>
            </Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            
            {/* Segmented Auth Mode Switch */}
            <View style={[styles.modeTabs, { flexDirection: rowDirection }]}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'login' && styles.activeTabBtn]}
                onPress={() => {
                  setMode('login');
                  setValidationError(null);
                  clearError();
                }}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                  {isRTL ? 'تسجيل الدخول' : 'Login'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signup' && styles.activeTabBtn]}
                onPress={() => {
                  setMode('signup');
                  setValidationError(null);
                  clearError();
                }}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                  {isRTL ? 'حساب جديد' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message display */}
            {getCleanErrorMessage() && (
              <View style={[styles.errorContainer, { flexDirection: rowDirection }]}>
                <Icon name="alert-circle" size={20} color={theme.colors.danger} />
                <Text style={[styles.errorText, { 
                  marginLeft: isRTL ? 0 : 8, 
                  marginRight: isRTL ? 8 : 0, 
                  textAlign: isRTL ? 'right' : 'left' 
                }]}>
                  {getCleanErrorMessage()}
                </Text>
              </View>
            )}

            {/* Name Input (Sign Up Mode Only) */}
            {mode === 'signup' && (
              <>
                <Text style={[styles.label, { textAlign }]}>
                  {t.nameLabel}
                </Text>
                <View style={[styles.inputContainer, { flexDirection: rowDirection }]}>
                  <Icon name="account" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={isRTL ? 'الاسم الأول والأخير' : 'John Doe'}
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </>
            )}

            {/* Email Input (Sign Up Mode Only) */}
            {mode === 'signup' && (
              <>
                <Text style={[styles.label, { textAlign }]}>
                  {t.emailLabel}
                </Text>
                <View style={[styles.inputContainer, { flexDirection: rowDirection }]}>
                  <Icon name="email" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={isRTL ? 'example@domain.com' : 'example@domain.com'}
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </>
            )}

            {/* Phone Input */}
            <Text style={[styles.label, { textAlign }]}>
              {isRTL ? 'رقم الجوال' : 'Mobile Number'}
            </Text>
            <View style={[styles.inputContainer, { flexDirection: rowDirection }]}>
              <Icon name="phone" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { textAlign }]}
                placeholder={isRTL ? 'مثال: 0599000000' : 'e.g. 0599000000'}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Password Input */}
            <Text style={[styles.label, { textAlign }]}>
              {isRTL ? 'كلمة المرور' : 'Password'}
            </Text>
            <View style={[styles.inputContainer, { flexDirection: rowDirection }]}>
              <Icon name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { textAlign }]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password Input (Sign Up Mode Only) */}
            {mode === 'signup' && (
              <>
                <Text style={[styles.label, { textAlign }]}>
                  {t.confirmPasswordLabel}
                </Text>
                <View style={[styles.inputContainer, { flexDirection: rowDirection }]}>
                  <Icon name="lock-check" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </>
            )}

            {/* User Agreement Checkbox & Modal Trigger (Sign Up Mode Only) */}
            {mode === 'signup' && (
              <View style={[styles.checkboxContainer, { flexDirection: rowDirection }]}>
                <TouchableOpacity 
                  onPress={() => setAgreement(prev => !prev)}
                  activeOpacity={0.8}
                  style={styles.checkboxClick}
                >
                  <Icon 
                    name={agreement ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                    size={24} 
                    color={agreement ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
                <View style={[styles.agreementTextCol, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
                  <Text style={[styles.checkboxLabel, { textAlign }]}>
                    {t.userAgreementText}{' '}
                    <Text 
                      style={styles.agreementLink}
                      onPress={() => setAgreementModalVisible(true)}
                    >
                      {t.pressToViewAgreement}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Action Button */}
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' 
                    ? (isRTL ? 'دخول' : 'Sign In') 
                    : (isRTL ? 'إنشاء حساب' : 'Create Account')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.or}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Dev Mode Bypass */}
            <TouchableOpacity style={[styles.btnMock, { flexDirection: rowDirection }]} onPress={handleDemoBypass}>
              <Icon name="flask-outline" size={20} color={theme.colors.primary} style={[styles.btnIcon, { marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }]} />
              <Text style={styles.btnMockText}>{t.enterDemo}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* USER AGREEMENT MODAL */}
      <Modal visible={agreementModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { flexDirection: rowDirection }]}>
              <Text style={styles.modalTitle}>{t.agreementTitle}</Text>
              <TouchableOpacity onPress={() => setAgreementModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.agreementScroll}>
              <Text style={[styles.agreementContentText, { textAlign }]}>
                {t.agreementContent}
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setAgreementModalVisible(false)}>
                <Text style={styles.closeBtnText}>{t.done}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: theme.colors.primary,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: theme.typography.weights.medium,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.button,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.button,
  },
  activeTabBtn: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.card,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: theme.typography.weights.bold,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.input,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkboxClick: {
    paddingTop: 2,
  },
  agreementTextCol: {
    flex: 1,
  },
  checkboxLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.typography.weights.medium,
  },
  agreementLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  loader: {
    marginVertical: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textSecondary,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
  },
  btnMock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.highlight,
  },
  btnIcon: {
    marginRight: 8,
  },
  btnMockText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: theme.typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  agreementScroll: {
    padding: 20,
  },
  agreementContentText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
});
