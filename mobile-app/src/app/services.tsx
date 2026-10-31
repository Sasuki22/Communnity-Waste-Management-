import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SiteMenu } from '@/components/site-menu';

const services = [
  { icon: '▣', title: 'Waste Categories', detail: 'Proper segregation for a cleaner community.', tint: '#eaf9ec', href: '/explore' as const },
  { icon: '▦', title: 'Pickup Scheduling', detail: 'See collection days and plan a pickup.', tint: '#eaf4ff', href: '/schedule' as const },
  { icon: '✦', title: 'Community Programs', detail: 'Join initiatives and make an impact.', tint: '#fff8e5', href: '/about' as const },
];
const steps = [
  { icon: '▦', title: 'Schedule Collection', detail: 'View the live waste collection schedule.', tint: '#eaf9ec', href: '/schedule' as const },
  { icon: '▣', title: 'Request Pickup', detail: 'Book a pickup for bulky or special items.', tint: '#eaf4ff', href: '/request-pickup' as const },
  { icon: '♻', title: 'Recycling Guide', detail: 'Learn how to properly separate and dispose of waste.', tint: '#fff8e5', href: '/explore' as const },
  { icon: '✦', title: 'Community Participation', detail: 'Join local clean-up programs.', tint: '#fff0f0', href: '/about' as const },
];
export default function ServicesScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.page}><SiteMenu /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.heading}>Our Services</Text><Text style={styles.caption}>Simple actions. A cleaner, greener community.</Text>
    {services.map(item => <Pressable key={item.title} accessibilityRole="link" onPress={() => router.push(item.href)} style={[styles.row, { backgroundColor: item.tint }]}><Text style={styles.icon}>{item.icon}</Text><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.caption}>{item.detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
    <Text style={[styles.heading, styles.section]}>How It Works</Text><Text style={styles.caption}>Take part in a cleaner and greener barangay.</Text>
    <View style={styles.grid}>{steps.map(item => <Pressable key={item.title} accessibilityRole="link" onPress={() => router.push(item.href)} style={[styles.tile, { backgroundColor: item.tint }]}><Text style={styles.icon}>{item.icon}</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.caption}>{item.detail}</Text></Pressable>)}</View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' }, content: { padding: 20, paddingBottom: 55, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 25, fontWeight: '800', color: '#0b6630' }, caption: { color: '#56605a', fontSize: 14, lineHeight: 19 },
  row: { borderRadius: 17, padding: 16, flexDirection: 'row', gap: 15, alignItems: 'center', minHeight: 100 }, icon: { fontSize: 28, color: '#086c32' },
  copy: { flex: 1, gap: 5 }, title: { fontSize: 17, color: '#141d16', fontWeight: '700' }, chevron: { fontSize: 29, color: '#19261d' },
  section: { color: '#151515', marginTop: 36 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '48%', flexGrow: 1, minHeight: 185, borderRadius: 17, padding: 16, gap: 12 },
});