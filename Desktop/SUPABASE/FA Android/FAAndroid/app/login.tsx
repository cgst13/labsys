import { supabase } from '@/constants/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MAX_WIDTH = 400;
const CARD_MIN_WIDTH = 0.85 * screenWidth;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgDecor} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          <View style={styles.logoContainer}>
            <Ionicons name="water" size={72} color="#1976D2" style={styles.logoIcon} />
            <Text style={styles.appTitle}>Water Billing System</Text>
            <Text style={styles.appDesc}>LGU Concepcion, Romblon</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.loginTitle}>Sign in to your account</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={22} color="#1976D2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={22} color="#1976D2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E3F2FD',
    zIndex: -1,
    borderBottomRightRadius: 120,
    borderBottomLeftRadius: 120,
    height: 320,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    paddingHorizontal: 8,
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoIcon: {
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  appDesc: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    minWidth: CARD_MIN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#1976D2',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 24,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 18,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E7ED',
    marginBottom: 16,
    paddingHorizontal: 8,
    width: '100%',
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    width: '100%',
    height: 48,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  error: {
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 15,
  },
}); 