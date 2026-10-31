import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerResident } from '@/api/auth';
import { styles } from './login';
import { SiteMenu } from '@/components/site-menu';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await registerResident(name, email, password, confirm);
      setPassword(''); setConfirm(''); setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to register.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.page}><SiteMenu /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.heading}>Create a resident account</Text>
    <View style={styles.card}>{success ? <>
      <Text accessibilityRole="alert" style={styles.description}>Account created. You can now sign in. Your account is shared with the CWMS website.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.button}><Text style={styles.buttonText}>Go to log in</Text></Pressable>
    </> : <>
      <Text style={styles.description}>Register using the same website database used by the admin dashboard.</Text>
      <Text style={styles.label}>Full name</Text><TextInput accessibilityLabel="Full name" style={styles.input} value={name} onChangeText={setName} autoComplete="name" />
      <Text style={styles.label}>Email</Text><TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
      <Text style={styles.label}>Password (at least 6 characters)</Text><TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Text style={styles.label}>Confirm password</Text><TextInput accessibilityLabel="Confirm password" style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={styles.button}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}</Pressable>
      <Link href="/login" style={styles.link}>Already registered? Log in</Link>
    </>}</View>
  </ScrollView></SafeAreaView>;
}