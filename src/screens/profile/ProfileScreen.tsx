import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../../store/authStore';

const C = {
  bg: '#0A0E1A', surface: '#12182B', card: '#161D33',
  accent: '#3D7BF5', danger: '#FF4D6A',
  text: '#E8EEFF', muted: '#8896BB', border: 'rgba(61,123,245,0.2)',
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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
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
  avatarRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 3, borderColor: 'rgba(61,123,245,0.4)' },
  avatarText: { fontSize: 38, color: '#fff', fontWeight: '800' },
  userName: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: C.muted, marginBottom: 12 },
  providerBadge: { backgroundColor: 'rgba(61,123,245,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  providerText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  menuList: { padding: 24, paddingBottom: 60 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, color: C.text, fontSize: 15, fontWeight: '600' },
  menuChevron: { color: C.muted, fontSize: 20 },
  separator: { height: 1, backgroundColor: C.border, marginVertical: 24 },
  logoutBtn: { height: 54, backgroundColor: 'rgba(255,77,106,0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,77,106,0.3)', marginBottom: 20 },
  logoutText: { color: C.danger, fontSize: 16, fontWeight: '800' },
  version: { color: C.muted, fontSize: 12, textAlign: 'center' },
});
