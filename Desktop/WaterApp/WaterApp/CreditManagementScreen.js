import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './GlobalToast';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CreditManagementScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCredit, setEditCredit] = useState('');
  const [saving, setSaving] = useState(false);

  const searchTimeout = useRef();

  useEffect(() => {
    fetchCustomers(search);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (!search) fetchCustomers('');
    // eslint-disable-next-line
  }, []);

  const fetchCustomers = async (searchTerm) => {
    setLoading(true);
    let query = supabase.from('customers').select('*').order('name', { ascending: true });
    if (searchTerm && searchTerm.trim() !== '') {
      // Server-side search for all customers
      query = query.ilike('name', `%${searchTerm.trim()}%`);
    } else {
      // Only customers with credit_balance > 0
      query = query.gt('credit_balance', 0);
    }
    const { data } = await query;
    setCustomers(data || []);
    setLoading(false);
  };

  // No more client-side filtering; customers is always the correct list
  const filteredCustomers = customers;

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setEditCredit(Number(customer.credit_balance ?? 0).toFixed(2));
  };

  const handleSave = async () => {
    if (!editingCustomer) return;
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({ credit_balance: Number(editCredit) })
      .eq('customerid', editingCustomer.customerid);
    setSaving(false);
    if (error) {
      showToast(error.message || 'Failed to update credit.', 'error');
    } else {
      showToast('Credit updated!', 'success');
      setEditingCustomer(null);
      fetchCustomers();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0d47a1", "#1976d2"]} style={styles.header}>
        <View style={[styles.headerContent, { justifyContent: 'center', position: 'relative' }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { position: 'absolute', left: 0, zIndex: 2 }]}> 
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: 'center', flex: 1 }]}>Credit Management</Text>
        </View>
      </LinearGradient>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Feather name="search" size={22} color="#1976d2" style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 18, backgroundColor: '#f5f7fa', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e3f2fd', color: '#263238' }}
            placeholder="Search customer by name..."
            placeholderTextColor="#90a4ae"
            value={search}
            onChangeText={setSearch}
            underlineColorAndroid="transparent"
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text style={styles.countText}>Showing {filteredCustomers.length} customer{filteredCustomers.length === 1 ? '' : 's'}</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : filteredCustomers.length === 0 ? (
          <Text style={{ color: '#90a4ae', textAlign: 'center', marginVertical: 12 }}>No customers with credit balance found.</Text>
        ) : (
          filteredCustomers.map(customer => (
            <TouchableOpacity
              key={customer.customerid}
              style={styles.fullWidthCard}
              activeOpacity={0.85}
              onPress={() => handleEdit(customer)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="account-balance-wallet" size={28} color="#1976d2" style={{ marginRight: 14 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modernName}>{customer.name}</Text>
                  <Text style={styles.modernSub}>ID: {customer.customerid}  |  Type: {customer.type || 'N/A'}  |  Barangay: {customer.barangay || 'N/A'}</Text>
                </View>
                <Text style={styles.modernCredit}>₱{Number(customer.credit_balance ?? 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {/* Edit Credit Modal */}
      {editingCustomer && (
        <View style={[styles.modalOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}> 
          <View style={[styles.modalContent, { paddingTop: 32, paddingBottom: 32, alignItems: 'center', position: 'relative', justifyContent: 'center' }]}> 
            <TouchableOpacity onPress={() => setEditingCustomer(null)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, borderRadius: 20 }}>
              <MaterialIcons name="close" size={28} color="#1976d2" />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1976d2', marginBottom: 18 }}>Update Credit</Text>
            <Text style={{ fontSize: 16, color: '#263238', marginBottom: 6 }}>Customer: <Text style={{ color: '#1976d2', fontWeight: '700' }}>{editingCustomer.name}</Text></Text>
            <Text style={{ fontSize: 16, color: '#263238', marginBottom: 6 }}>Current Credit: <Text style={{ color: '#1976d2' }}>₱{Number(editingCustomer.credit_balance ?? 0).toFixed(2)}</Text></Text>
            <Text style={{ fontSize: 16, color: '#263238', marginBottom: 10 }}>New Credit Balance</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 12, padding: 12, fontSize: 18, marginBottom: 18, width: 220, backgroundColor: '#f5f7fa', color: '#263238', textAlign: 'center' }}
              placeholder="0.00"
              keyboardType="numeric"
              value={editCredit}
              onChangeText={setEditCredit}
            />
            <TouchableOpacity
              onPress={handleSave}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1976d2',
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 32,
                shadowColor: '#1976d2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  inputLabel: { fontSize: 14, color: '#1976d2', marginTop: 10, marginBottom: 2 },
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 0 },
  searchIcon: { marginRight: 8 },
  searchBoxInput: { flex: 1, fontSize: 17, color: '#263238', backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 8, paddingHorizontal: 0 },
  barangayPickerWrapper: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e3f2fd', overflow: 'hidden' },
  barangayPicker: { width: '100%', height: 44, color: '#1976d2', backgroundColor: 'transparent', fontSize: 16, paddingHorizontal: 10 },
  customerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  customerName: { fontSize: 18, fontWeight: '700', color: '#1976d2' },
  customerSub: { fontSize: 14, color: '#546e7a', marginTop: 2 },
  editBtn: { backgroundColor: '#e3f2fd', borderRadius: 8, padding: 8, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1976d2', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 4 },
  modernCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    marginRight: 12,
    marginLeft: 0,
    width: '47%',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  modernName: { fontSize: 20, fontWeight: '700', color: '#1976d2', marginBottom: 2 },
  modernSub: { fontSize: 14, color: '#546e7a', marginBottom: 2 },
  modernCredit: { fontSize: 16, color: '#388e3c', fontWeight: '700', marginTop: 6, marginBottom: 8 },
  // No more modernEditBtn
  fullWidthCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    alignSelf: 'center',
  },
  countText: { fontSize: 15, color: '#607d8b', fontWeight: '600', marginLeft: 8 },
});

export default CreditManagementScreen; 