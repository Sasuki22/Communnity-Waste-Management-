import { Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SiteMenu } from '@/components/site-menu';
export default function AboutScreen() {
  return <SafeAreaView style={styles.page}><SiteMenu /><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.heading}>About</Text><Text style={styles.body}>The Community Waste Management System helps neighbors sort waste correctly, schedule collections, and take part in local clean-up programs, so your barangay stays clean and green.</Text>
    <Image source={require('@/assets/images/recycling-bins.webp')} resizeMode="contain" style={styles.image} accessibilityLabel="Community recycling bins" />
    <View style={styles.card}><Text style={styles.heading}>Contact</Text><Text style={styles.body}>Questions or concerns about collection in your area? Send us a message.</Text><Link href="/contact" asChild><Pressable style={styles.button}><Text style={styles.buttonText}>Send a message</Text></Pressable></Link></View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f2fff1' }, content: { padding: 26, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' }, heading: { fontSize: 26, color: '#0e7332', fontWeight: '800' }, body: { fontSize: 16, color: '#394c40', lineHeight: 23 }, image: { height: 215, width: '100%' }, card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, gap: 14 }, button: { backgroundColor: '#218239', borderRadius: 10, padding: 16, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });