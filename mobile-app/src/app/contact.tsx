import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendContact, validateContact } from '@/api/contact';
import { apiBase } from '@/api/client';
import { SiteMenu } from '@/components/site-menu';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  let configured = true;
  try { apiBase(); } catch { configured = false; }

  const submit = async () => {
    if (inFlight.current || !configured) return;
    const invalid = validateContact({ name, email, message });
    if (invalid) { setFeedback(invalid); return; }
    inFlight.current = true;
    setSending(true);
    setFeedback('');
    try {
      const confirmation = await sendContact({ name, email, message });
      setFeedback(confirmation);
      setMessage('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <SiteMenu />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>CWMS CONTACT</Text>
          <Text style={styles.heading}>Get in touch</Text>
          <Text style={styles.body}>Send one message per Gmail address per UTC day. This limit is enforced by the website.</Text>
          {!configured && (
            <View style={styles.notice}>
              <Text style={styles.body}>Contact is unavailable in this preview until the website API URL is configured.</Text>
            </View>
          )}
          <Text style={styles.label}>Name</Text>
          <TextInput accessibilityLabel="Name" style={styles.input} value={name} onChangeText={setName} autoComplete="name" maxLength={101} editable={!sending} />
          <Text style={styles.label}>Gmail address</Text>
          <TextInput accessibilityLabel="Gmail address" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={151} editable={!sending} />
          <Text style={styles.label}>Message</Text>
          <TextInput accessibilityLabel="Message" style={[styles.input, styles.message]} value={message} onChangeText={setMessage} multiline textAlignVertical="top" maxLength={5001} editable={!sending} />
          {!!feedback && <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: sending || !configured }} disabled={sending || !configured} onPress={submit} style={[styles.button, (sending || !configured) && styles.disabled]}>
            {sending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Send message</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f8f5' },
  fill: { flex: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24, paddingBottom: 120, gap: 12 },
  eyebrow: { color: '#226544', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  heading: { fontSize: 34, fontWeight: '800', color: '#143b29' },
  body: { fontSize: 16, lineHeight: 24, color: '#324d3d' },
  notice: { padding: 18, backgroundColor: '#e7f2ea', borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '700', color: '#143b29', marginTop: 10 },
  input: { minHeight: 50, borderRadius: 12, backgroundColor: '#ffffff', padding: 14, color: '#143b29', fontSize: 16, borderWidth: 1, borderColor: '#c3d8ca' },
  message: { minHeight: 140 },
  feedback: { fontSize: 16, lineHeight: 24, color: '#143b29', marginTop: 8 },
  button: { minHeight: 50, borderRadius: 12, backgroundColor: '#226544', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});