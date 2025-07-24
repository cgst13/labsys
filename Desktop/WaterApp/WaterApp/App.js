import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Animated, Dimensions, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createClient } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import Dashboard from './Dashboard';
import BillingScreen from './BillingScreen';
import AddBillingScreen from './AddBillingScreen';
import PaymentsScreen from './PaymentsScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import CreditManagementScreen from './CreditManagementScreen';
import CustomersScreen from './CustomersScreen';
import UsersScreen from './UsersScreen';
import { ToastProvider } from './GlobalToast';
import { UserProvider, useUser } from './UserContext';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

function LoginScreen({ navigation, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const waterDropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Water drop animation loop
    const waterDropAnimation = () => {
      Animated.sequence([
        Animated.timing(waterDropAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(waterDropAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => waterDropAnimation());
    };
    waterDropAnimation();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    
    // Add button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Query users table for matching email and password
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    setLoading(false);
    if (error || !data) {
      console.log('User Table Auth Error:', error);
      Alert.alert('Login Failed', 'Invalid email or password.');
    } else {
      // Navigate to Dashboard immediately after successful login
      setUser(data); // Set the user in the context
      navigation.navigate('Dashboard');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d47a1" />
      <LinearGradient
        colors={["#0d47a1", "#1565c0", "#1976d2", "#42a5f5"]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating water drops background */}
        <View style={styles.backgroundElements}>
          <Animated.View style={[styles.floatingDrop, { 
            opacity: waterDropAnim,
            transform: [{ translateY: waterDropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20]
            })}]
          }]}>
            <MaterialIcons name="water-drop" size={24} color="rgba(255,255,255,0.1)" />
          </Animated.View>
          <Animated.View style={[styles.floatingDrop2, { 
            opacity: waterDropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            }),
            transform: [{ translateY: waterDropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 10]
            })}]
          }]}>
            <MaterialIcons name="water-drop" size={18} color="rgba(255,255,255,0.08)" />
          </Animated.View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, width: '100%' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
              
              {/* Header Section */}
              <Animated.View style={[styles.headerContainer, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }]}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#ffffff', '#e3f2fd']}
                    style={styles.logoBackground}
                  >
                    <MaterialIcons name="water-drop" size={56} color="#0d47a1" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>Water Billing System</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#bbdefb" />
                  <Text style={styles.description}>LGU Concepcion, Romblon</Text>
                </View>
              </Animated.View>

              {/* Login Card */}
              <Animated.View style={[styles.card, {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
              }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={styles.cardSubtitle}>Sign in to your account</Text>
                </View>

                {/* Email Input */}
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <View style={styles.inputIconContainer}>
                    <MaterialIcons name="email" size={22} color={emailFocused ? "#0d47a1" : "#90a4ae"} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#90a4ae"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                {/* Password Input */}
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <View style={styles.inputIconContainer}>
                    <Feather name="lock" size={22} color={passwordFocused ? "#0d47a1" : "#90a4ae"} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#90a4ae"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.showHideButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#90a4ae" />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#90a4ae', '#78909c'] : ['#0d47a1', '#1565c0']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.buttonText}>Signing In...</Text>
                      </View>
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>Secure • Reliable • Efficient</Text>
                </View>
              </Animated.View>

              {/* Version Info */}
              <Animated.View style={[styles.versionContainer, { opacity: fadeAnim }]}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstname || !lastname) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    // 1. Generate a UUID for the new user
    const { data: uuidData, error: uuidError } = await supabase.rpc('gen_random_uuid');
    if (uuidError || !uuidData) {
      setLoading(false);
      Alert.alert('Registration Failed', 'Could not generate user ID.');
      return;
    }
    const userId = uuidData;
    // 2. Insert into users table with actual password
    const { error: userError } = await supabase.from('users').insert([
      {
        userid: userId,
        firstname,
        lastname,
        password, // Store actual password (for demo only)
        department,
        position,
        role,
        email,
        status: 'active',
        datecreated: new Date().toISOString(),
        lastlogin: null,
      },
    ]);
    setLoading(false);
    if (userError) {
      Alert.alert('Registration Failed', userError.message || 'An error occurred.');
      return;
    }
    Alert.alert('Registration Successful', 'You can now log in.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <LinearGradient
      colors={["#0d47a1", "#1565c0", "#1976d2", "#42a5f5"]}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Register</Text>
              <TextInput
                style={styles.input}
                placeholder="First Name*"
                placeholderTextColor="#90a4ae"
                value={firstname}
                onChangeText={setFirstname}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name*"
                placeholderTextColor="#90a4ae"
                value={lastname}
                onChangeText={setLastname}
              />
              <TextInput
                style={styles.input}
                placeholder="Department"
                placeholderTextColor="#90a4ae"
                value={department}
                onChangeText={setDepartment}
              />
              <TextInput
                style={styles.input}
                placeholder="Position"
                placeholderTextColor="#90a4ae"
                value={position}
                onChangeText={setPosition}
              />
              <TextInput
                style={styles.input}
                placeholder="Role"
                placeholderTextColor="#90a4ae"
                value={role}
                onChangeText={setRole}
              />
              <TextInput
                style={styles.input}
                placeholder="Email*"
                placeholderTextColor="#90a4ae"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password*"
                placeholderTextColor="#90a4ae"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#90a4ae', '#78909c'] : ['#0d47a1', '#1565c0']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
                <Text style={{ color: '#0d47a1', fontWeight: 'bold' }}>Already have an account? Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login">
              {props => {
                const { setUser } = useUser();
                return <LoginScreen {...props} setUser={setUser} />;
              }}
            </Stack.Screen>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Customers" component={CustomersScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="AddBilling" component={AddBillingScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="CreditManagement" component={CreditManagementScreen} />
            <Stack.Screen name="Users" component={UsersScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingDrop: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.1,
  },
  floatingDrop2: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.15,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#e3f2fd',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  description: {
    fontSize: 14,
    color: '#bbdefb',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    zIndex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0d47a1',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#546e7a',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    marginBottom: 20,
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#0d47a1',
    backgroundColor: '#ffffff',
    shadowColor: '#0d47a1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#263238',
    backgroundColor: 'transparent',
    paddingVertical: 16,
  },
  showHideButton: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0d47a1',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#0d47a1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f8',
  },
  footerText: {
    fontSize: 12,
    color: '#90a4ae',
    letterSpacing: 1,
    fontWeight: '500',
  },
  versionContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
});
