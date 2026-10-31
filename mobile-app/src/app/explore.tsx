import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SiteMenu } from '@/components/site-menu';
import { useAuth } from '@/auth/context';
import { useResidentTheme } from '@/theme/resident-theme';

const categories = [
  { icon: '🌿', title: 'Green Bin: Biodegradable & Organic', detail: 'Food scraps, fruit peels, vegetable waste, yard clippings, leaves and paper napkins.', background: '#e7f7e8' },
  { icon: '♻', title: 'Blue Bin: Clean Recyclables', detail: 'Clean paper, cardboard boxes, plastic bottles, metal cans and glass jars. Rinse before disposal.', background: '#e7f2ff' },
  { icon: '⚠', title: 'Yellow Bin: Special & Hazardous Waste', detail: 'Batteries, light bulbs, e-waste, paint cans and expired chemicals. Please separate for special pickup.', background: '#fff7d8' },
  { icon: '▣', title: 'Black Bin: Residual / General Waste', detail: 'Sanitary items, non-recyclable plastic packaging, worn fabrics, broken ceramics and other residual waste.', background: '#eff1f0' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { mode, colors } = useResidentTheme();
  return (
    <SafeAreaView style={styles.page}>
      <SiteMenu resident={!!session} />
      <ScrollView style={session && mode === 'light' ? styles.lightPage : undefined} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>♻  Waste Segregation Guide</Text>
        <Text style={styles.note}>These recycling tips are informational. Check local collection instructions; this page does not display schedules or rewards.</Text>
        {categories.map(category => (
          <View key={category.title} style={[styles.card, { backgroundColor: session && mode === 'dark' ? colors.surface : category.background }]}>
            <Text style={styles.icon}>{category.icon}</Text>
            <View style={styles.cardCopy}>
              <Text style={[styles.title, session && mode === 'dark' && { color: colors.heading }]}>{category.title}</Text>
              <Text style={[styles.description, session && mode === 'dark' && { color: colors.text }]}>{category.detail}</Text>
            </View>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>Close</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#102e23' },
  lightPage: { backgroundColor: '#234b38' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 48, gap: 10 },
  heading: { color: '#fff', fontSize: 21, fontWeight: '800', marginVertical: 10 },
  note: { color: '#e0eee5', fontSize: 13, lineHeight: 19, marginBottom: 6 },
  card: { borderRadius: 13, padding: 15, flexDirection: 'row', gap: 12, minHeight: 94 },
  icon: { fontSize: 26 }, cardCopy: { flex: 1, gap: 5 },
  title: { fontSize: 15, fontWeight: '800', color: '#17251b' },
  description: { fontSize: 13, lineHeight: 19, color: '#48554b' },
  close: { borderWidth: 1, borderColor: '#53725d', borderRadius: 9, alignSelf: 'center', minWidth: 115, padding: 12, alignItems: 'center', marginTop: 18 },
  closeText: { color: '#fff', fontWeight: '700' },
});