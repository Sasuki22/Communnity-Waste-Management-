import { useCallback, useState } from 'react';
import { Link, Redirect, useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { announcements, schedules, type Announcement, type Schedule } from '@/api/resident';
import { useAuth } from '@/auth/context';
import { SiteMenu } from '@/components/site-menu';
import { scheduleIcon } from '@/components/schedule-icon';
import { useResidentTheme } from '@/theme/resident-theme';

export default function ResidentScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { mode, colors } = useResidentTheme();
  const [items, setItems] = useState<Schedule[]>([]);
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    if (!session) return;
    let active = true;
    setLoading(true); setError('');
    Promise.allSettled([schedules(session.token), announcements(session.token)]).then(([scheduleResult, noticeResult]) => {
      if (!active) return;
      if (scheduleResult.status === 'fulfilled') setItems(scheduleResult.value);
      if (noticeResult.status === 'fulfilled') setNotices(noticeResult.value);
      if (scheduleResult.status === 'rejected' || noticeResult.status === 'rejected') setError('Some live information could not be loaded. Check your connection and reopen the dashboard.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [session]));
  if (!session) return <Redirect href="/login" />;
  const name = session.user.name || session.user.email;
  const actions = [
    { title: 'Request Pickup', icon: '🚚', detail: 'Schedule a waste disposal pickup.', href: '/request-pickup' as const, tint: '#d8eaf6' },
    { title: 'View Schedule', icon: '🗓', detail: 'Check the waste collection schedule.', href: '/schedule' as const, tint: '#e6eef9' },
    { title: 'Recycling Guide', icon: '♻', detail: 'Learn how to properly segregate waste.', href: '/explore' as const, tint: '#f6f8e4' },
    { title: 'Report an Issue', icon: '⚠', detail: 'Report missed collection or other concerns.', href: '/report-issue' as const, tint: '#fcedee' },
  ];
  return <SafeAreaView style={[styles.page, { backgroundColor: colors.page }]}><SiteMenu resident /><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.welcome}>Welcome back,{ '\n' }{name}!</Text><Text style={styles.heroCopy}>Let’s keep our community clean and green together.</Text><Image source={require('@/assets/images/recycling-bins.webp')} resizeMode="contain" style={styles.heroImage} /></View>
    <View style={styles.grid}>{actions.map((item, index) => <Pressable key={item.title} accessibilityRole="link" onPress={() => router.push(item.href)} style={[styles.tile, { backgroundColor: mode === 'dark' ? colors.action[index] : item.tint }]}><Text style={styles.icon}>{item.icon}</Text><Text style={[styles.title, { color: colors.heading }]}>{item.title}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.detail}</Text></Pressable>)}</View>
    {loading && <ActivityIndicator color="#267e3b" />}{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={[styles.card, { backgroundColor: colors.surface }]}><View style={styles.cardHeader}><Text style={[styles.title, { color: colors.heading }]}>Upcoming Schedule</Text><Link href="/schedule" style={styles.link}>View Full →</Link></View>
      {!loading && items.length === 0 && <Text style={[styles.detail, { color: colors.text }]}>No schedules are available from the website yet.</Text>}
      {items.slice(0, 4).map(item => <View key={item.id} style={[styles.row, { borderBottomColor: colors.line }]}><Text style={[styles.detail, { color: colors.text }]}>{scheduleIcon(item.icon, item.waste_type)}  {item.waste_type}</Text><Text style={[styles.badge, { backgroundColor: colors.badge, color: colors.badgeText }]}>{item.day_of_week}</Text></View>)}
    </View>
    <View style={[styles.card, { backgroundColor: colors.surface }]}><Text style={[styles.title, { color: colors.heading }]}>Announcements</Text>
      {!loading && notices.length === 0 && <Text style={[styles.detail, { color: colors.text }]}>No announcements published yet.</Text>}
      {notices.map(item => <View key={item.id} style={[styles.notice, { backgroundColor: colors.notice }]}><Text style={[styles.title, { color: colors.heading }]}>{item.title}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.message}</Text><Text style={[styles.detail, { color: colors.text }]}>{item.created_at}</Text></View>)}
    </View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ebf6ed' }, content: { paddingBottom: 45, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: '#124831', minHeight: 235, padding: 22, overflow: 'hidden' }, welcome: { color: '#fff', fontSize: 24, fontWeight: '800', maxWidth: 250 }, heroCopy: { color: '#e4f6ea', fontSize: 14, maxWidth: 220, marginTop: 8 }, heroImage: { width: '64%', height: 155, alignSelf: 'flex-end', marginTop: -25 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 12, marginTop: -17 }, tile: { width: '48%', flexGrow: 1, minHeight: 140, borderRadius: 16, padding: 15, gap: 5 },
  icon: { fontSize: 25 }, title: { color: '#18281c', fontSize: 16, fontWeight: '800' }, detail: { color: '#425249', fontSize: 13, lineHeight: 19 }, error: { color: '#a52323', paddingHorizontal: 15 },
  card: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 12, padding: 17, gap: 12 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, link: { color: '#19823a', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: '#e3eee6', borderBottomWidth: 1, paddingVertical: 8 }, badge: { color: '#126a2a', backgroundColor: '#dcfbe3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  notice: { backgroundColor: '#eef8f0', borderRadius: 11, padding: 13, gap: 7 },
});