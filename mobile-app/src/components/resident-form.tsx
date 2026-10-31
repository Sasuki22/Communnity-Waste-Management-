import { useState } from 'react';
import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestPickup, reportIssue } from '@/api/resident';
import { useAuth } from '@/auth/context';
import { SiteMenu } from './site-menu';
import { useResidentTheme } from '@/theme/resident-theme';

export function ResidentForm({ kind }: { kind: 'pickup' | 'issue' }) {
  const { session } = useAuth();
  const { mode } = useResidentTheme();
  const [address, setAddress] = useState('');
  const [type, setType] = useState(kind === 'pickup' ? 'Bulky Items (Furniture, Appliances)' : 'Missed Scheduled Collection');
  const [date, setDate] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  if (!session) return <Redirect href="/login" />;
  const token = session.token;
  async function submit() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (kind === 'pickup') await requestPickup(token, { address, waste_type: type, preferred_date: date, notes: detail });
      else await reportIssue(token, { issue_type: type, location: address, description: detail });
      setSuccess(true); setDetail('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Submission failed. Please try again.'); }
    finally { setBusy(false); }
  }
  const title = kind === 'pickup' ? 'Request Special Pickup' : 'Report an Issue / Concern';
  return <SafeAreaView style={[styles.page, mode === 'light' && styles.lightPage]}><SiteMenu resident /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.heading}>{kind === 'pickup' ? '🚚' : '⚠'}  {title}</Text>
    {success ? <View style={styles.panel}><Text accessibilityRole="alert" style={styles.label}>Submitted to the CWMS website successfully.</Text><Link href="/resident" style={styles.link}>Back to Dashboard</Link></View> : <View style={styles.panel}>
      {kind === 'pickup' && <><Text style={styles.label}>Full Name</Text><Text style={styles.readonly}>{session.user.name}</Text></>}
      <Text style={styles.label}>{kind === 'pickup' ? 'Address / Zone' : 'Location / Street / Zone'}</Text>
      <TextInput accessibilityLabel="Location or address" placeholder="Street and zone" placeholderTextColor="#82998b" style={styles.input} value={address} onChangeText={setAddress} maxLength={255} />
      <Text style={styles.label}>{kind === 'pickup' ? 'Waste Type' : 'Issue Type'}</Text>
      <TextInput accessibilityLabel={kind === 'pickup' ? 'Waste type' : 'Issue type'} style={styles.input} value={type} onChangeText={setType} maxLength={100} />
      {kind === 'pickup' && <><Text style={styles.label}>Preferred Date (YYYY-MM-DD)</Text><TextInput accessibilityLabel="Preferred date" placeholder="YYYY-MM-DD" placeholderTextColor="#82998b" keyboardType="numbers-and-punctuation" style={styles.input} value={date} onChangeText={setDate} maxLength={10} /></>}
      <Text style={styles.label}>{kind === 'pickup' ? 'Notes (Optional)' : 'Description & Details'}</Text>
      <TextInput accessibilityLabel="Details" multiline textAlignVertical="top" style={[styles.input, styles.multi]} value={detail} onChangeText={setDetail} maxLength={10000} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <View style={styles.actions}><Link href="/resident" style={styles.link}>Cancel</Link><Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={styles.button}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{kind === 'pickup' ? 'Submit Request' : 'Submit Report'}</Text>}</Pressable></View>
    </View>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#102e23' }, lightPage: { backgroundColor: '#234b38' }, content: { padding: 18, paddingBottom: 90, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' }, heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginVertical: 10 }, panel: { gap: 11 }, label: { color: '#fff', fontSize: 15, fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#496953', borderRadius: 8, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15, backgroundColor: '#1e4030' }, readonly: { color: '#d8eadc', backgroundColor: '#244a34', padding: 13, borderRadius: 8 }, multi: { minHeight: 110 }, error: { color: '#ffb0b0', fontSize: 15 }, actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 15 }, link: { color: '#d6f4df', borderWidth: 1, borderColor: '#547663', borderRadius: 9, padding: 14, overflow: 'hidden' }, button: { backgroundColor: '#16813b', padding: 15, borderRadius: 9, minWidth: 140, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });