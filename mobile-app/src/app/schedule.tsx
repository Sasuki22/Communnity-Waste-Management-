import { useCallback, useState } from 'react';
import { Link, Redirect, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { schedules, type Schedule } from '@/api/resident';
import { useAuth } from '@/auth/context';
import { SiteMenu } from '@/components/site-menu';
import { scheduleIcon } from '@/components/schedule-icon';
import { useResidentTheme } from '@/theme/resident-theme';

export default function ScheduleScreen() {
  const { session } = useAuth();
  const { mode, colors } = useResidentTheme();
  const [items, setItems] = useState<Schedule[]>([]);
  const [zone, setZone] = useState('All Zones');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    if (!session) return;
    let active = true;
    setBusy(true); setError('');
    schedules(session.token).then(data => { if (active) setItems(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load schedules.'); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [session]));
  if (!session) return <Redirect href="/login" />;
  const filtered = items.filter(item => zone === 'All Zones' || item.zone === 'All Zones' || item.zone === zone);
  return <SafeAreaView style={[styles.page, mode === 'light' && styles.lightPage]}><SiteMenu resident /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.heading}>🗓  Pickup Schedules</Text>
    <View style={styles.filters}>{['All Zones', 'Zone 1', 'Zone 2', 'Zone 3'].map(value => <Pressable accessibilityRole="button" key={value} onPress={() => setZone(value)} style={[styles.filter, zone === value && styles.selected]}><Text style={styles.filterText}>{value}</Text></Pressable>)}</View>
    {busy && <ActivityIndicator color="#fff" />}{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!busy && !error && !filtered.length && <Text style={styles.body}>No collection schedules published for this zone.</Text>}
    {filtered.map(item => <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}><Text style={[styles.title, { color: colors.heading }]}>{scheduleIcon(item.icon, item.waste_type)}  {item.waste_type}</Text><Text style={[styles.day, { backgroundColor: colors.badge, color: colors.badgeText }]}>{item.day_of_week}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.time_slot}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.zone} · {item.frequency}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.description}</Text></View>)}
    <Link href="/resident" asChild><Pressable style={styles.close}><Text style={styles.body}>Close</Text></Pressable></Link>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#102e23' }, lightPage: { backgroundColor: '#234b38' }, content: { padding: 16, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' }, heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginVertical: 12 }, filters: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, filter: { padding: 10, borderRadius: 20, backgroundColor: '#275441' }, selected: { backgroundColor: '#21853c' }, filterText: { color: '#fff', fontWeight: '700', fontSize: 12 }, card: { backgroundColor: '#fff', borderRadius: 13, padding: 16, gap: 3 }, title: { fontSize: 16, fontWeight: '800', color: '#17291d' }, day: { alignSelf: 'flex-end', backgroundColor: '#c8f4d4', color: '#15662d', borderRadius: 12, padding: 5, overflow: 'hidden' }, detail: { fontSize: 13, color: '#47574c' }, body: { color: '#fff', fontSize: 15 }, error: { color: '#ffb5b5' }, close: { alignSelf: 'center', borderWidth: 1, borderColor: '#48705a', borderRadius: 9, padding: 12, marginTop: 20 } });