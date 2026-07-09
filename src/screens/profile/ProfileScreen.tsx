import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';

const C = {
  bg: theme.colors.background,
  surface: theme.colors.surface,
  card: theme.colors.surface,
  accent: theme.colors.primary,
  danger: theme.colors.danger,
  dangerBg: theme.colors.dangerBg,
  text: theme.colors.textPrimary,
  muted: theme.colors.textSecondary,
  border: theme.colors.border,
};

const PROVIDER_LABELS: Record<string, string> = {
  google: '🔵 Google', facebook: '📘 Facebook',
  microsoft: '🔷 Microsoft', mock: '🛠 Demo',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: '🔔', label: 'Notification Preferences', action: () => {} },
    { icon: '🔒', label: 'Privacy & Data', action: () => {} },
    { icon: '📄', label: 'Terms of Service', action: () => {} },
    { icon: '🆘', label: 'Support', action: () => {} },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <LinearGradient colors={[C.bg, C.surface]} style={styles.header}>
        <View style={styles.avatarRing}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'Unknown User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.providerBadge}>
          <Text style={styles.providerText}>{PROVIDER_LABELS[user?.provider ?? 'mock']}</Text>
        </View>
      </LinearGradient>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.action}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.separator} />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>CareTag Consumer v0.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 3, borderColor: C.border },
  avatarText: { fontSize: 38, color: '#fff', fontWeight: '800' },
  userName: { fontSize: 24, fontWeight: theme.typography.weights.bold, color: C.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: C.muted, marginBottom: 12, fontWeight: theme.typography.weights.medium },
  providerBadge: { backgroundColor: theme.colors.highlight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1.5, borderColor: C.border },
  providerText: { color: C.accent, fontSize: 13, fontWeight: theme.typography.weights.bold },
  menuList: { padding: 24, paddingBottom: 60 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: C.border },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, color: C.text, fontSize: 15, fontWeight: theme.typography.weights.bold },
  menuChevron: { color: C.muted, fontSize: 20 },
  separator: { height: 1.5, backgroundColor: C.border, marginVertical: 24 },
  logoutBtn: { height: 54, backgroundColor: C.dangerBg, borderRadius: theme.borderRadius.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.danger, marginBottom: 20 },
  logoutText: { color: C.danger, fontSize: 16, fontWeight: theme.typography.weights.bold },
  version: { color: C.muted, fontSize: 12, textAlign: 'center', fontWeight: theme.typography.weights.medium },
});
