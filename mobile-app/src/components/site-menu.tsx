import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/context';
import { markNotificationsRead, notifications, type Notification } from '@/api/resident';
import { useResidentTheme } from '@/theme/resident-theme';

export function SiteMenu({ resident = false }: { resident?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<Notification[]>([]);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { mode, toggle } = useResidentTheme();
  useFocusEffect(useCallback(() => {
    if (!resident || !session) return;
    let active = true;
    notifications(session.token).then(items => { if (active) { setNotificationItems(items); setNotificationError(''); } })
      .catch(() => { if (active) setNotificationError('Unable to load notifications. Please try again.'); });
    return () => { active = false; };
  }, [resident, session]));
  async function openNotifications() {
    if (notificationOpen) { setNotificationOpen(false); return; }
    setOpen(false); setNotificationOpen(true); setNotificationBusy(true); setNotificationError('');
    if (!session) return;
    try {
      const items = await notifications(session.token);
      setNotificationItems(items);
      if (items.some(item => Number(item.is_read) === 0)) {
        try {
          await markNotificationsRead(session.token);
          setNotificationItems(items.map(item => ({ ...item, is_read: 1 })));
        } catch { setNotificationError('Notifications loaded, but could not be marked as read.'); }
      }
    } catch { setNotificationError('Unable to load notifications. Please try again.'); }
    finally { setNotificationBusy(false); }
  }
  function go(href: Href) { setOpen(false); router.push(href); }
  async function logout() {
    if (busy) return;
    setBusy(true);
    try { await signOut(); setOpen(false); router.replace('/'); }
    catch { setError('Could not log out on the website. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <>
    <View style={[styles.bar, resident && styles.darkBar]}>
      <Text accessibilityLabel="CWMS recycling logo" style={styles.logo}>♻</Text>
      {resident && <Text numberOfLines={1} style={styles.residentName}>{session?.user.name || 'Resident'}</Text>}
      {resident && <>
        <Pressable accessibilityRole="button" accessibilityLabel="View notifications" onPress={openNotifications} style={styles.headerButton}>
          <Image source={require('@/assets/images/bell-notification.svg')} tintColor="#fff" contentFit="contain" style={styles.bell} />
          {notificationItems.some(item => Number(item.is_read) === 0) && <View style={styles.dot} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`} onPress={toggle} style={styles.headerButton}>
          <Text style={styles.headerIcon}>{mode === 'light' ? '☾' : '☀'}</Text>
        </Pressable>
      </>}
      <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Close menu' : 'Open menu'} onPress={() => { setNotificationOpen(false); setOpen(!open); }} style={styles.menuButton}><Text style={[styles.menuIcon, resident && styles.light]}>{open ? '×' : '☰'}</Text></Pressable>
    </View>
    {resident && notificationOpen && <View style={styles.notificationPanel}>
      <View style={styles.notificationHeader}><Text style={styles.notificationTitle}>Notifications</Text><Pressable accessibilityRole="button" accessibilityLabel="Close notifications" onPress={() => setNotificationOpen(false)}><Text style={styles.light}>✕</Text></Pressable></View>
      <ScrollView style={styles.notificationList}>
        {notificationBusy && <ActivityIndicator color="#fff" />}
        {!!notificationError && <Text accessibilityRole="alert" style={styles.notificationText}>{notificationError}</Text>}
        {!notificationBusy && !notificationError && !notificationItems.length && <Text style={styles.notificationText}>No notifications yet.</Text>}
        {notificationItems.map(item => <View key={item.id} style={styles.notificationItem}><Text style={styles.notificationTitle}>{item.status}</Text><Text style={styles.notificationText}>{item.message}</Text><Text style={styles.notificationText}>{item.created_at}</Text></View>)}
      </ScrollView>
    </View>}
    {open && <View style={[styles.overlay, resident && styles.darkOverlay]}>
      {(resident ? [
        ['⌂', 'Dashboard', '/resident'], ['●', 'Profile', '/profile'], ['▣', 'Request Pickup', '/request-pickup'], ['▦', 'View Schedule', '/schedule'], ['♻', 'Recycling Guide', '/explore'], ['⚠', 'Report an Issue', '/report-issue'],
      ] : [
        ['⌂', 'Home', '/'], ['✦', 'About', '/about'], ['▦', 'Services', '/services'], ['✉', 'Contact', '/contact'],
      ]).map(([icon, label, route]) => <Pressable key={label} accessibilityRole="button" onPress={() => go(route as Href)} style={styles.item}><Text style={[styles.itemText, resident && styles.light]}>{icon}    {label}</Text></Pressable>)}
      <View style={styles.spacer} />
      {resident ? <Pressable accessibilityRole="button" disabled={busy} onPress={logout} style={styles.action}><Text style={styles.logout}>{busy ? 'Signing out…' : '↪  Logout'}</Text></Pressable> : <>
        <Pressable accessibilityRole="button" onPress={() => go('/login')} style={styles.action}><Text style={styles.actionText}>Log in</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => go('/register')} style={styles.outline}><Text style={styles.outlineText}>Register</Text></Pressable>
      </>}
    </View>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </>;
}

const styles = StyleSheet.create({
  bar: { height: 62, flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 22, zIndex: 3 },
  darkBar: { backgroundColor: '#102f24' }, logo: { color: '#139b41', fontSize: 36, fontWeight: '800' },
  residentName: { flex: 1, color: '#fff', fontWeight: '700', marginLeft: 12 }, menuButton: { minWidth: 48, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center', marginLeft: 'auto' },
  menuIcon: { fontSize: 26, color: '#113824' }, light: { color: '#fff' },
  headerButton: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { color: '#fff', fontSize: 23 }, bell: { width: 22, height: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffbd50', position: 'absolute', right: 7, top: 9 },
  notificationPanel: { position: 'absolute', top: 62, left: 12, right: 12, maxHeight: 320, padding: 16, backgroundColor: '#19372a', borderWidth: 1, borderColor: '#395e49', borderRadius: 12, zIndex: 11, elevation: 11 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#395e49' },
  notificationList: { maxHeight: 260 }, notificationItem: { paddingVertical: 10, gap: 4, borderBottomWidth: 1, borderBottomColor: '#395e49' },
  notificationTitle: { color: '#fff', fontWeight: '800', fontSize: 15 }, notificationText: { color: '#c7ddcf', fontSize: 13, lineHeight: 19, paddingVertical: 3 },
  overlay: { position: 'absolute', top: 62, bottom: 0, left: 0, right: 0, backgroundColor: '#fcfff9', padding: 22, zIndex: 10, elevation: 10, gap: 5 },
  darkOverlay: { backgroundColor: '#0e2d22' }, item: { minHeight: 53, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10 },
  itemText: { fontSize: 17, fontWeight: '600', color: '#182b20' }, spacer: { flex: 1 },
  action: { minHeight: 50, backgroundColor: '#26833b', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#fff', fontSize: 17, fontWeight: '700' }, outline: { minHeight: 50, borderWidth: 1, borderColor: '#26833b', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: '#15802f', fontSize: 17, fontWeight: '700' }, logout: { color: '#ff7474', fontSize: 17, fontWeight: '700' }, error: { color: '#ffaaaa' },
});