import { useCallback, useState } from 'react';
import { Link, Redirect, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/context';
import { getProfile, saveProfile, formatPhoneInput, type ResidentProfile } from '@/api/profile';
import { apiBase } from '@/api/client';
import { SiteMenu } from '@/components/site-menu';
import { useResidentTheme } from '@/theme/resident-theme';

export default function ProfileScreen() {
  const { session, updateUser } = useAuth();
  const { mode } = useResidentTheme();
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [draft, setDraft] = useState({ full_name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const token = session?.token;

  useFocusEffect(useCallback(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError('');
    getProfile(token).then(user => {
      if (!active) return;
      setProfile(user);
      setDraft({ full_name: user.full_name ?? '', email: user.email ?? '', phone: user.phone ?? '', address: user.address ?? '' });
      setLoading(false);
    }).catch(e => {
      if (active) { setError(e instanceof Error ? e.message : 'Unable to load profile.'); setLoading(false); }
    });
    return () => { active = false; };
  }, [token]));

  if (!session) return <Redirect href="/login" />;

  async function submit() {
    if (saving || !session) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const saved = await saveProfile(session.token, draft);
      setProfile(saved);
      setDraft({ full_name: saved.full_name, email: saved.email, phone: saved.phone ?? '', address: saved.address ?? '' });
      updateUser(saved.full_name, saved.email);
      setNotice('Profile saved successfully.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save profile. Please try again.'); }
    finally { setSaving(false); }
  }

  const photo = profile?.profile_picture;
  const photoUrl = photo && /^uploads\/profiles\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(photo) ? `${apiBase()}/${photo}` : null;
  const field = (label: string, key: keyof typeof draft, settings: { keyboardType?: 'email-address' | 'phone-pad'; maxLength: number; placeholder?: string }) => <View style={styles.field} key={key}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} style={styles.input} value={draft[key]} onChangeText={value => setDraft(current => ({ ...current, [key]: key === 'phone' ? formatPhoneInput(value) : value }))}
      keyboardType={settings.keyboardType} maxLength={settings.maxLength} placeholder={settings.placeholder} placeholderTextColor="#98b2a0" autoCapitalize={key === 'email' ? 'none' : 'sentences'} autoComplete={key === 'email' ? 'email' : key === 'phone' ? 'tel' : undefined} />
  </View>;

  return <SafeAreaView style={[styles.page, mode === 'light' && styles.lightPage]}><SiteMenu resident /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.heading}>My Profile</Text>
    {loading && !profile ? <View style={styles.center}><ActivityIndicator color="#62c67a" /><Text style={styles.muted}>Loading your profile…</Text></View> : null}
    {!loading && !profile ? <View style={styles.center}><Text accessibilityRole="alert" style={styles.error}>{error || 'Profile unavailable.'}</Text><Pressable accessibilityRole="button" onPress={() => { setLoading(true); getProfile(session.token).then(user => { setProfile(user); setDraft({ full_name: user.full_name, email: user.email, phone: user.phone ?? '', address: user.address ?? '' }); setError(''); }).catch(e => setError(e instanceof Error ? e.message : 'Unable to load profile.')).finally(() => setLoading(false)); }} style={styles.button}><Text style={styles.buttonText}>Retry</Text></Pressable></View> : null}
    {profile && <View style={styles.panel}>
      <View style={styles.avatar}>{photoUrl ? <Image source={{ uri: photoUrl }} contentFit="cover" style={styles.avatarImage} /> : <Text style={styles.avatarSymbol}>👤</Text>}</View>
      <Text style={styles.displayName}>{profile.full_name}</Text>
      <Text style={styles.status}>● Active Account</Text>
      <Text style={styles.hint}>Profile photos can be updated on the website.</Text>
      <Text style={styles.section}>Personal Information</Text>
      {field('Full Name', 'full_name', { maxLength: 100 })}
      {field('Email Address', 'email', { maxLength: 150, keyboardType: 'email-address' })}
      {field('Phone Number', 'phone', { maxLength: 14, keyboardType: 'phone-pad', placeholder: '09XXXXXXXXX or +639XXXXXXXXX' })}
      <Text style={styles.hint}>11 digits starting with 09; +639 or +6309 accepted. Optional.</Text>
      {field('Address', 'address', { maxLength: 255, placeholder: 'Enter your complete address' })}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!notice && <Text accessibilityRole="alert" style={styles.status}>{notice}</Text>}
      <View style={styles.actions}><Link href="/resident" style={styles.cancel}>Cancel</Link><Pressable accessibilityRole="button" disabled={saving || loading} onPress={submit} style={[styles.button, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}</Pressable></View>
    </View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#102e23' }, lightPage: { backgroundColor: '#edf7ed' },
  content: { padding: 20, paddingBottom: 95, maxWidth: 650, width: '100%', alignSelf: 'center', gap: 16 },
  heading: { color: '#207e3b', fontSize: 26, fontWeight: '800', marginTop: 10 },
  panel: { backgroundColor: '#19372a', borderRadius: 18, padding: 22, gap: 11, borderWidth: 1, borderColor: '#355943' },
  avatar: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#e0f1dd', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', overflow: 'hidden' },
  avatarImage: { width: 108, height: 108 }, avatarSymbol: { fontSize: 60 },
  displayName: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center' }, status: { color: '#60d073', fontWeight: '700', textAlign: 'center' },
  section: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 7 },
  field: { gap: 5 }, label: { color: '#fff', fontSize: 14, fontWeight: '700' },
  input: { color: '#fff', backgroundColor: '#244434', borderColor: '#4a7056', borderWidth: 1, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 15 },
  hint: { color: '#bbd4c2', fontSize: 12, textAlign: 'center' }, muted: { color: '#cce0d0' }, error: { color: '#ffaaaa', fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#385e45', marginTop: 8 },
  cancel: { borderColor: '#476f55', borderWidth: 1, borderRadius: 8, color: '#fff', padding: 13, overflow: 'hidden' },
  button: { backgroundColor: '#1c8a3a', borderRadius: 8, minHeight: 48, minWidth: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { color: '#fff', fontWeight: '800' }, disabled: { opacity: 0.6 }, center: { padding: 28, gap: 14, alignItems: 'center' },
});