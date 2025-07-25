import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Dashboard = ({ navigation }) => {
  const menuItems = [
    {
      id: 1,
      title: 'Customers',
      subtitle: 'Manage customer accounts',
      icon: 'people',
      iconType: 'MaterialIcons',
      color: '#2196F3',
      gradient: ['#2196F3', '#21CBF3'],
    },
    {
      id: 2,
      title: 'Billing',
      subtitle: 'Generate and manage bills',
      icon: 'receipt-long',
      iconType: 'MaterialIcons',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#8BC34A'],
    },
    {
      id: 3,
      title: 'Payments',
      subtitle: 'Process payments',
      icon: 'payment',
      iconType: 'MaterialIcons',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFC107'],
    },
    {
      id: 4,
      title: 'Credit Management',
      subtitle: 'Manage credit accounts',
      icon: 'account-balance-wallet',
      iconType: 'MaterialIcons',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#E91E63'],
    },
    {
      id: 5,
      title: 'Users',
      subtitle: 'System user management',
      icon: 'manage-accounts',
      iconType: 'MaterialIcons',
      color: '#F44336',
      gradient: ['#F44336', '#FF5722'],
    },
    // Removed Schedule and Tools
    {
      id: 8,
      title: 'Account Settings',
      subtitle: 'Manage your profile',
      icon: 'settings',
      iconType: 'MaterialIcons',
      color: '#607D8B',
      gradient: ['#607D8B', '#90a4ae'],
    },
  ];

  const handleMenuPress = (item) => {
    // Handle navigation to specific screens
    if (item.title === 'Customers') {
      navigation.navigate('Customers');
    } else if (item.title === 'Billing') {
      navigation.navigate('Billing');
    } else if (item.title === 'Payments') {
      navigation.navigate('Payments');
    } else if (item.title === 'Account Settings') {
      navigation.navigate('AccountSettings');
    } else if (item.title === 'Credit Management') {
      navigation.navigate('CreditManagement');
    } else if (item.title === 'Users') {
      navigation.navigate('Users');
    } else {
      console.log(`Navigating to ${item.title}`);
      // navigation.navigate(item.title);
    }
  };

  const handleLogout = () => {
    // Handle logout functionality
    navigation.goBack();
  };

  const renderIcon = (item) => {
    const IconComponent = MaterialIcons;
    return <IconComponent name={item.icon} size={32} color="#ffffff" />;
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={item.gradient}
        style={styles.menuItemGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.menuItemContent}>
          <View style={styles.iconContainer}>
            {renderIcon(item)}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Helper to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // State for user info
  const [userFullName, setUserFullName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      setLoadingUser(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && user.email) {
        // Query users table for full name
        const { data, error } = await supabase
          .from('users')
          .select('firstname, lastname, email')
          .eq('email', user.email)
          .single();
        if (data) {
          setUserFullName(`${data.firstname} ${data.lastname}`);
        } else {
          setUserFullName(user.email); // fallback to email
        }
      } else {
        setUserFullName('User');
      }
      setLoadingUser(false);
    };
    fetchUserName();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565c0" />
      {/* Header */}
      <View style={styles.elegantHeaderBlue}>
        <View style={styles.elegantLogoContainerBlue}>
          <MaterialIcons name="water-drop" size={36} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.elegantHeaderTitleBlue}>Water Billing System</Text>
          <Text style={styles.elegantHeaderSubtitleBlue}>LGU Concepcion, Romblon</Text>
        </View>
        <TouchableOpacity style={styles.elegantLogoutBtnBlue} onPress={handleLogout}>
          <Feather name="log-out" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Dashboard Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.elegantContentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.elegantMenuGrid}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.elegantMenuItem}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={item.gradient}
                style={styles.elegantMenuItemGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.elegantMenuItemContent}>
                  <View style={styles.elegantIconContainer}>
                    <MaterialIcons name={item.icon} size={32} color="#fff" />
                  </View>
                  <View style={styles.elegantTextContainer}>
                    <Text style={styles.elegantMenuTitle}>{item.title}</Text>
                    <Text style={styles.elegantMenuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={22} color="#fff" style={styles.elegantArrow} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        {/* Footer */}
        <View style={styles.elegantFooter}>
          <Text style={styles.elegantFooterText}>Water Billing System v1.0.0</Text>
          <Text style={styles.elegantFooterSubtext}>© 2024 LGU Concepcion, Romblon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
  },
  elegantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 20 : 56,
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elegantLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  elegantHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1976d2',
    letterSpacing: 0.3,
  },
  elegantHeaderSubtitle: {
    fontSize: 14,
    color: '#90a4ae',
    marginTop: 2,
    fontWeight: '500',
  },
  elegantLogoutBtn: {
    marginLeft: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 18,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elegantContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  elegantMenuGrid: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  elegantMenuItem: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 18,
    borderRadius: 20,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  elegantMenuItemGradient: {
    borderRadius: 20,
    padding: 22,
    width: '100%',
  },
  elegantMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elegantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  elegantTextContainer: {
    flex: 1,
  },
  elegantMenuTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  elegantMenuSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },
  elegantArrow: {
    marginLeft: 12,
  },
  elegantFooter: {
    alignItems: 'center',
    paddingVertical: 28,
    width: '100%',
  },
  elegantFooterText: {
    fontSize: 14,
    color: '#90a4ae',
    fontWeight: '600',
    marginBottom: 2,
  },
  elegantFooterSubtext: {
    fontSize: 12,
    color: '#b0bec5',
  },
  elegantHeaderBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 20 : 56,
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: '#1565c0',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elegantLogoContainerBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  elegantHeaderTitleBlue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  elegantHeaderSubtitleBlue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  elegantLogoutBtnBlue: {
    marginLeft: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Dashboard;