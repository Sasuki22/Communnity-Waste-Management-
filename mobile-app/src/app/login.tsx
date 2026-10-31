import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/context';
import { SiteMenu } from '@/components/site-menu';

export default function LoginScreen() {
  const { session, signIn, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    setBusy(true); setError('');
    try { await signIn(email, password); setPassword(''); router.replace('/resident'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); router.replace('/'); } catch { setError('Could not log out on the website. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.page}><SiteMenu /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.heading}>{session ? 'Resident account' : 'Resident log in'}</Text>
    {session ? <View style={styles.card}>
      <Text style={styles.description}>Signed in as {session.user.name || session.user.email}</Text>
      <Text style={styles.description}>{session.user.email}</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={logout} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
    </View> : <View style={styles.card}>
      <Text style={styles.description}>Use the same resident account as the CWMS website.</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={styles.button}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}</Pressable>
      <Link href="/register" style={styles.link}>New here? Register</Link>
    </View>}
    {session && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </ScrollView></SafeAreaView>;
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f8f3' },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 24, paddingBottom: 100, gap: 16 },
  heading: { fontSize: 32, fontWeight: '800', color: '#143b29' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 22, gap: 14 },
  description: { color: '#324d3d', fontSize: 16, lineHeight: 23 },
  label: { color: '#143b29', fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#879c8c', borderRadius: 9, minHeight: 48, paddingHorizontal: 12, color: '#143b29', fontSize: 16 },
  button: { backgroundColor: '#35783c', borderRadius: 9, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#a52323', fontSize: 15 },
  link: { color: '#226544', fontSize: 16, fontWeight: '700', marginTop: 4 },
});