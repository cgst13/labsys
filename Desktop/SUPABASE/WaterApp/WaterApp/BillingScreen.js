import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { Picker } from '@react-native-picker/picker';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BillingScreen = ({ navigation }) => {
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customerid: '',
    billedmonth: '',
    previousreading: '',
    currentreading: '',
    consumption: '',
    basicamount: '',
    surchargeamount: '',
    discountamount: '',
    totalbillamount: '',
    advancepaymentamount: '',
    paymentstatus: 'Unpaid',
    encodedby: '',
    customername: '',
  });
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: billsData } = await supabase.from('bills').select('*').order('billedmonth', { ascending: false });
    const { data: customersData } = await supabase.from('customers').select('*');
    setBills(billsData || []);
    setCustomers(customersData || []);
    setLoading(false);
  };

  // Get unique barangays for filter
  const barangayOptions = ['All', ...Array.from(new Set(customers.map(c => c.barangay).filter(b => b && b.trim() !== ''))).sort()];
  // Get unique customer types for filter
  const typeOptions = ['All', ...Array.from(new Set(customers.map(c => c.type).filter(t => t && t.trim() !== ''))).sort()];

  // Filter customers by search and barangay
  const filteredCustomers = customers.filter(c => {
    const matchesName = c.name.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesBarangay = barangayFilter === 'All' || c.barangay === barangayFilter;
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesName && matchesBarangay && matchesType;
  });

  const handleSelectCustomer = (customer) => {
    navigation.navigate('AddBilling', { customer });
  };

  const handleDeleteBill = async (billid) => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('bills').delete().eq('billid', billid);
        fetchData();
      }},
    ]);
  };

  const renderBill = ({ item }) => (
    <View style={styles.billCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="receipt-long" size={28} color="#1976d2" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.billCustomer}>{item.customername || 'Unknown'}</Text>
          <Text style={styles.billMonth}>Month: {item.billedmonth?.slice(0,7)}</Text>
          <Text style={styles.billAmount}>₱ {item.totalbillamount?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.billStatus, { color: item.paymentstatus === 'Paid' ? '#4CAF50' : '#F44336' }]}>{item.paymentstatus || 'Unpaid'}</Text>
          <TouchableOpacity onPress={() => handleDeleteBill(item.billid)}>
            <Feather name="trash-2" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0d47a1", "#1976d2"]} style={styles.header}>
        <View style={[styles.headerContent, { justifyContent: 'center', position: 'relative' }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { position: 'absolute', left: 0, zIndex: 2 }]}> 
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: 'center', flex: 1 }]}>Billing</Text>
        </View>
      </LinearGradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : (
          <View style={{ padding: 16, paddingBottom: 32 }}>
            <Text style={styles.inputLabel}>Search Customer</Text>
            <View style={styles.searchBoxContainer}>
              <Feather name="search" size={20} color="#90a4ae" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBoxInput}
                placeholder="Search by name..."
                placeholderTextColor="#90a4ae"
                value={customerSearch}
                onChangeText={setCustomerSearch}
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 2 }}>
              <View style={[styles.barangayPickerWrapper, { flex: 1, marginRight: 4 }]}> 
                <Picker
                  selectedValue={barangayFilter}
                  onValueChange={setBarangayFilter}
                  style={styles.barangayPicker}
                  itemStyle={styles.barangayPickerItem}
                >
                  {barangayOptions.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.barangayPickerWrapper, { flex: 1, marginLeft: 4 }]}> 
                <Picker
                  selectedValue={typeFilter}
                  onValueChange={setTypeFilter}
                  style={styles.barangayPicker}
                  itemStyle={styles.barangayPickerItem}
                >
                  {typeOptions.map(t => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
                </Picker>
              </View>
            </View>
            <Text style={styles.inputLabel}>Customer</Text>
            <View style={{ marginBottom: 12 }}>
              {filteredCustomers.length === 0 ? (
                <Text style={{ color: '#90a4ae', textAlign: 'center', marginVertical: 12 }}>No customers found.</Text>
              ) : (
                filteredCustomers.map(item => (
                  <TouchableOpacity
                    key={item.customerid}
                    style={styles.modernCustomerCard}
                    onPress={() => handleSelectCustomer(item)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="person" size={28} color="#1976d2" style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modernCustomerName}>[{item.customerid}] {item.name}</Text>
                      <Text style={styles.modernCustomerSub}>Type: {item.type || 'N/A'}  |  Barangay: {item.barangay || 'N/A'}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={22} color="#1976d2" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  addButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  billCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  billCustomer: { fontSize: 18, fontWeight: '700', color: '#1976d2' },
  billMonth: { fontSize: 14, color: '#546e7a', marginTop: 2 },
  billAmount: { fontSize: 16, color: '#263238', fontWeight: '600', marginTop: 2 },
  billStatus: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1976d2', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 14, color: '#1976d2', marginTop: 10, marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 4 },
  pickerWrapper: { flexDirection: 'row', marginBottom: 8 },
  customerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#e3f2fd', marginRight: 8 },
  customerChipSelected: { backgroundColor: '#1976d2' },
  saveButton: { marginTop: 18, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: { marginTop: 10, alignItems: 'center' },
  cancelButtonText: { color: '#1976d2', fontSize: 16, fontWeight: '600' },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBoxInput: {
    flex: 1,
    fontSize: 17,
    color: '#263238',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    opacity: 0.85,
  },
  barangayPickerWrapper: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 2, borderWidth: 1, borderColor: '#e3f2fd', overflow: 'hidden', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, minHeight: 48, justifyContent: 'center', marginBottom: 8 },
  barangayPicker: { width: '100%', minHeight: 48, color: '#1976d2', backgroundColor: 'transparent', fontSize: 17, paddingHorizontal: 10 },
  barangayPickerItem: { fontSize: 17, color: '#1976d2' },
  modernCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modernCustomerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 2,
  },
  modernCustomerSub: {
    fontSize: 14,
    color: '#546e7a',
  },
});

export default BillingScreen; 