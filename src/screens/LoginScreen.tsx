/**
 * LoginScreen.tsx
 *
 * Premium dark-themed login screen featuring Google, Facebook, Microsoft OAuth.
 * Includes a Dev Mode bypass button.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../constants/translations';

export default function LoginScreen() {
  const {
    loginWithGoogle,
    loginWithFacebook,
    loginWithMicrosoft,
    loginAsMock,
    isLoading,
    error,
  } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  const isRTL = language === 'ar';

  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        {/* Header Logo */}
        <View style={styles.logoContainer}>
          <Icon name="car-connected" size={64} color={theme.colors.primary} />
          <Text style={styles.logoText}>Care<Text style={styles.logoAccent}>Tag</Text></Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        {/* Action Form */}
        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>{t.getStarted}</Text>
          
          {error && (
            <View style={[styles.errorContainer, { flexDirection: rowDirection }]}>
              <Icon name="alert-circle" size={20} color={theme.colors.danger} />
              <Text style={[styles.errorText, { 
                marginLeft: isRTL ? 0 : 8, 
                marginRight: isRTL ? 8 : 0, 
                textAlign: isRTL ? 'right' : 'left' 
              }]}>{error}</Text>
            </View>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          ) : (
            <>
              {/* Google Button */}
              <TouchableOpacity style={[styles.btn, styles.btnGoogle, { flexDirection: rowDirection }]} onPress={loginWithGoogle}>
                <Icon name="google" size={24} color="#FFFFFF" style={[styles.btnIcon, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]} />
                <Text style={styles.btnText}>{t.loginGoogle}</Text>
              </TouchableOpacity>

              {/* Facebook Button */}
              <TouchableOpacity style={[styles.btn, styles.btnFacebook, { flexDirection: rowDirection }]} onPress={loginWithFacebook}>
                <Icon name="facebook" size={24} color="#FFFFFF" style={[styles.btnIcon, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]} />
                <Text style={styles.btnText}>{t.loginFacebook}</Text>
              </TouchableOpacity>

              {/* Microsoft Button */}
              <TouchableOpacity style={[styles.btn, styles.btnMicrosoft, { flexDirection: rowDirection }]} onPress={loginWithMicrosoft}>
                <Icon name="microsoft" size={24} color="#FFFFFF" style={[styles.btnIcon, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]} />
                <Text style={styles.btnText}>{t.loginMicrosoft}</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t.or}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Dev Mode Bypass */}
              <TouchableOpacity style={[styles.btnMock, { flexDirection: rowDirection }]} onPress={loginAsMock}>
                <Icon name="flask-outline" size={20} color={theme.colors.primary} style={[styles.btnIcon, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]} />
                <Text style={styles.btnMockText}>{t.enterDemo}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 10,
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
  buttonContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.card,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.danger,
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
    fontWeight: theme.typography.weights.medium,
  },
  loader: {
    marginVertical: 40,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: theme.borderRadius.button,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  btnIcon: {
    marginRight: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  btnGoogle: {
    backgroundColor: '#DB4437',
  },
  btnFacebook: {
    backgroundColor: '#1877F2',
  },
  btnMicrosoft: {
    backgroundColor: '#0F172A',
    borderColor: theme.colors.border,
    borderWidth: 1.5,
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
  btnMockText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: theme.typography.weights.bold,
  },
});
