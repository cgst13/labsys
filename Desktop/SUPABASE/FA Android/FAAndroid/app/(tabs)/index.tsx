import { supabase } from '@/constants/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline' as const, route: '/dashboard' },
  { key: 'customers', label: 'Customers', icon: 'people-outline' as const, route: '/customers' },
  { key: 'billing', label: 'Billing', icon: 'file-tray-full-outline' as const, route: '/billing' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' as const, route: '/payments' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-outline' as const, route: '/reports' },
  { key: 'users', label: 'Users', icon: 'person-circle-outline' as const, route: '/users' },
  { key: 'tools', label: 'Tools', icon: 'construct-outline' as const, route: '/tools' },
];

const screenWidth = Dimensions.get('window').width;
const CARD_MAX_WIDTH = 180;
const CARD_MIN_WIDTH = 140;
const CARD_MARGIN = 8;
const CARD_WIDTH = Math.min(
  CARD_MAX_WIDTH,
  (screenWidth - CARD_MARGIN * 4) / 2
);

export default function HomeMenu() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    };
    fetchUser();
  }, []);

  const renderItem = ({ item }: { item: typeof MENU_ITEMS[number] }) => (
    <TouchableOpacity style={styles.menuCard} onPress={() => router.push(item.route)}>
      <Ionicons name={item.icon} size={36} color="#1976D2" style={{ marginBottom: 8 }} />
      <Text style={styles.menuLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={MENU_ITEMS}
        renderItem={renderItem}
        numColumns={2}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
        columnWrapperStyle={{ gap: 0 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {userEmail && <Text style={styles.welcome}>Welcome, {userEmail}!</Text>}
            <Text style={styles.title}>Main Menu</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  welcome: {
    fontSize: 18,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  menuGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8,
  },
  appDesc: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
});
