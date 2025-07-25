import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './GlobalToast';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from './UserContext';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AccountSettingsScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const { user, setUser } = useUser();
  const [form, setForm] = useState({ firstname: '', lastname: '', department: '', position: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        department: user.department || '',
        position: user.position || '',
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleEditOrSave = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    // Save logic
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('users').update({
      firstname: form.firstname,
      lastname: form.lastname,
      department: form.department,
      position: form.position,
    }).eq('userid', user.userid);
    setSaving(false);
    if (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
    } else {
      setUser({ ...user, ...form });
      showToast('Profile updated successfully!', 'success');
      setEditing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.elegantHeaderBlue}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.elegantBackBtnBlue}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.elegantHeaderTitleWrapperBlue}>
          <Text style={styles.elegantHeaderTitleBlue}>Account Settings</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.elegantContentContainer} keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
          ) : !user ? (
            <Text style={{ color: '#90a4ae', marginTop: 40, textAlign: 'center' }}>User info not found.</Text>
          ) : (
            <View style={styles.elegantCard}>
              <Text style={styles.elegantInputLabel}>Email</Text>
              <View style={styles.elegantInputPillReadOnly}>
                <Feather name="mail" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput style={styles.elegantInput} value={user.email} editable={false} placeholderTextColor="#90a4ae" />
              </View>
              <Text style={styles.elegantInputLabel}>First Name</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="user" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput style={styles.elegantInput} value={form.firstname} onChangeText={text => setForm(f => ({ ...f, firstname: text }))} placeholder="First Name" placeholderTextColor="#90a4ae" editable={editing} />
              </View>
              <Text style={styles.elegantInputLabel}>Last Name</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="user" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput style={styles.elegantInput} value={form.lastname} onChangeText={text => setForm(f => ({ ...f, lastname: text }))} placeholder="Last Name" placeholderTextColor="#90a4ae" editable={editing} />
              </View>
              <Text style={styles.elegantInputLabel}>Department</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="briefcase" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput style={styles.elegantInput} value={form.department} onChangeText={text => setForm(f => ({ ...f, department: text }))} placeholder="Department" placeholderTextColor="#90a4ae" editable={editing} />
              </View>
              <Text style={styles.elegantInputLabel}>Position</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="award" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput style={styles.elegantInput} value={form.position} onChangeText={text => setForm(f => ({ ...f, position: text }))} placeholder="Position" placeholderTextColor="#90a4ae" editable={editing} />
              </View>
              <TouchableOpacity style={styles.elegantSaveButton} onPress={handleEditOrSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.elegantSaveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.elegantSaveButtonText}>{editing ? 'Save' : 'Edit'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.elegantChangePasswordBtn} onPress={() => setPasswordModalVisible(true)} activeOpacity={0.85}>
                <Feather name="lock" size={18} color="#1976d2" style={{ marginRight: 8 }} />
                <Text style={styles.elegantChangePasswordText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalCard}>
            <View style={styles.elegantModalHeader}>
              <Text style={styles.elegantModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.elegantModalCloseBtn}>
                <Feather name="x" size={26} color="#1976d2" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 22 }}>
              <Text style={styles.elegantInputLabel}>New Password</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="lock" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput
                  style={styles.elegantInput}
                  value={passwordForm.newPassword}
                  onChangeText={v => setPasswordForm(f => ({ ...f, newPassword: v }))}
                  placeholder="New Password"
                  placeholderTextColor="#90a4ae"
                  secureTextEntry
                />
              </View>
              <Text style={styles.elegantInputLabel}>Confirm Password</Text>
              <View style={styles.elegantInputPill}>
                <Feather name="lock" size={18} color="#1976d2" style={styles.elegantInputIcon} />
                <TextInput
                  style={styles.elegantInput}
                  value={passwordForm.confirmPassword}
                  onChangeText={v => setPasswordForm(f => ({ ...f, confirmPassword: v }))}
                  placeholder="Confirm Password"
                  placeholderTextColor="#90a4ae"
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={styles.elegantSaveButton}
                onPress={async () => {
                  if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
                    showToast('Please enter and confirm your new password.', 'error');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    showToast('Passwords do not match.', 'error');
                    return;
                  }
                  setPasswordSaving(true);
                  const { error } = await supabase.from('users').update({ password: passwordForm.newPassword }).eq('userid', user.userid);
                  setPasswordSaving(false);
                  if (!error) {
                    setPasswordModalVisible(false);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                    showToast('Password updated successfully!', 'success');
                  } else {
                    showToast(error.message || 'Failed to update password.', 'error');
                  }
                }}
                disabled={passwordSaving}
                activeOpacity={0.85}
              >
                <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.elegantSaveButtonGradient}>
                  {passwordSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.elegantSaveButtonText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafd' },
  elegantHeaderBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 56,
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
    position: 'relative',
  },
  elegantBackBtnBlue: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elegantHeaderTitleWrapperBlue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'android' ? 44 : 56,
    bottom: 0,
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  elegantHeaderTitleBlue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  elegantContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  elegantCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginTop: 32,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
    maxWidth: 420,
  },
  elegantInputLabel: { fontSize: 15, color: '#1976d2', fontWeight: '700', marginTop: 10, marginBottom: 4, letterSpacing: 0.2 },
  elegantInputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e3f2fd', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, minWidth: 0 },
  elegantInputPillReadOnly: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4f8', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e3f2fd', minWidth: 0 },
  elegantInputIcon: { marginRight: 8 },
  elegantInput: { flex: 1, fontSize: 16, color: '#263238', backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 6, paddingHorizontal: 0 },
  elegantSaveButton: { marginTop: 18, borderRadius: 32, overflow: 'hidden', elevation: 3 },
  elegantSaveButtonGradient: { padding: 16, borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  elegantSaveButtonText: { fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 8 },
  elegantChangePasswordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 24, borderWidth: 1, borderColor: '#1976d2', paddingVertical: 12, backgroundColor: '#f7fafd' },
  elegantChangePasswordText: { color: '#1976d2', fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '92%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  elegantModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  elegantModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976d2',
  },
  elegantModalCloseBtn: {
    padding: 10,
  },
});

export default AccountSettingsScreen; 