import { Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/context';
import { SiteMenu } from '@/components/site-menu';

export default function HomeScreen() {
  const { session } = useAuth();
  return <SafeAreaView style={styles.page}>
    <SiteMenu />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Community <Text style={styles.green}>Waste Management</Text> System</Text>
      <Text style={styles.tagline}>Together for a Cleaner,{ '\n' }Greener Community</Text>
      <View style={styles.art}><Image source={require('@/assets/images/recycling-bins.webp')} accessibilityLabel="Green, blue and yellow recycling bins" resizeMode="contain" style={styles.bins} /></View>
      <Link href={session ? '/resident' : '/services'} asChild><Pressable accessibilityRole="link" style={styles.button}><Text style={styles.buttonText}>{session ? 'Go to Dashboard' : 'Get Started'}  →</Text></Pressable></Link>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4fff3' },
  content: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 25, paddingTop: 24, paddingBottom: 18 },
  heading: { color: '#141414', fontSize: 32, lineHeight: 39, fontWeight: '800', maxWidth: 340 },
  green: { color: '#09812e' }, tagline: { color: '#515a53', fontSize: 16, lineHeight: 23, marginTop: 7 },
  art: { flex: 1, minHeight: 290, justifyContent: 'center', alignItems: 'center' },
  bins: { width: '110%', height: '100%', maxHeight: 430 },
  button: { minHeight: 55, borderRadius: 11, backgroundColor: '#27833d', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});