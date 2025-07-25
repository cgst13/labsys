import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './GlobalToast';
import { useUser } from './UserContext';
import { useState as useTabState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AddBillingScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { customer } = route.params;
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'history'
  const [form, setForm] = useState({
    billedmonth: '',
    previousreading: '',
    currentreading: '',
    consumption: '',
    basicamount: '',
  });
  const [saving, setSaving] = useState(false);
  const [rateLoading, setRateLoading] = useState(true);
  const [typeRates, setTypeRates] = useState({ rate1: 0, rate2: 0 });
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [monthOptions, setMonthOptions] = useState([]);
  const [previousBills, setPreviousBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [editForm, setEditForm] = useState({ previousreading: '', currentreading: '', basicamount: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [pendingDeleteBill, setPendingDeleteBill] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [viewBillLoading, setViewBillLoading] = useState(false);

  // Fetch rates for customer type on mount
  useEffect(() => {
    const fetchRates = async () => {
      setRateLoading(true);
      const { data, error } = await supabase
        .from('customer_type')
        .select('rate1,rate2')
        .eq('type', customer.type)
        .single();
      if (data) {
        setTypeRates({ rate1: Number(data.rate1) || 0, rate2: Number(data.rate2) || 0 });
      } else {
        setTypeRates({ rate1: 0, rate2: 0 });
      }
      setRateLoading(false);
    };
    fetchRates();
  }, [customer.type]);

  useEffect(() => {
    const setDefaultBilledMonth = async () => {
      // Fetch latest bill for this customer
      setBillsLoading(true);
      const { data: bills, error } = await supabase
        .from('bills')
        .select('billid,billedmonth,currentreading,previousreading,basicamount,consumption,encodedby,dateencoded')
        .eq('customerid', customer.customerid)
        .order('billedmonth', { ascending: false });
      setPreviousBills(bills || []);
      setBillsLoading(false);
      // Use the latest bill for default month/reading
      const latest = bills && bills.length > 0 ? bills[0] : null;
      let nextMonth;
      let prevReading = 0;
      let startYear, startMonth;
      if (latest && latest.billedmonth) {
        // Get next month after last bill
        const last = latest.billedmonth.slice(0, 7); // YYYY-MM
        const [year, month] = last.split('-').map(Number);
        let nextYear = year;
        let nextMonthNum = month + 1;
        if (nextMonthNum > 12) {
          nextMonthNum = 1;
          nextYear++;
        }
        nextMonth = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;
        prevReading = latest.currentreading || 0;
        startYear = nextYear;
        startMonth = nextMonthNum;
      } else {
        // No previous bill, default to next month from today and prevReading to 0
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 2; // getMonth is 0-based, +1 for next month
        if (month > 12) {
          month = 1;
          year++;
        }
        nextMonth = `${year}-${String(month).padStart(2, '0')}`;
        prevReading = 0;
        startYear = year;
        startMonth = month;
      }
      // Generate month options (up to 12 months ahead)
      const months = [];
      let y = startYear, m = startMonth;
      for (let i = 0; i < 12; i++) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      setMonthOptions(months);
      setForm(f => ({ ...f, billedmonth: nextMonth, previousreading: String(prevReading) }));
    };
    setDefaultBilledMonth();
  }, [customer.customerid]);

  // Auto-calculate consumption and basic amount
  useEffect(() => {
    // Only calculate if rates are loaded
    if (rateLoading) return;
    const prev = Number(form.previousreading) || 0;
    const curr = Number(form.currentreading) || 0;
    let consumption = curr - prev;
    if (consumption < 0) consumption = 0;
    let calcFor = consumption === 0 ? 1 : consumption;
    let basic = 0;
    if (calcFor <= 3) {
      basic = calcFor * typeRates.rate1;
    } else {
      basic = (3 * typeRates.rate1) + ((calcFor - 3) * typeRates.rate2);
    }
    setForm(f => ({ ...f, consumption: String(consumption), basicamount: basic > 0 ? String(basic.toFixed(2)) : '' }));
    // eslint-disable-next-line
  }, [form.currentreading, form.previousreading, typeRates, rateLoading]);

  // Auto-calculate basic amount in edit modal
  useEffect(() => {
    if (!editBill) return;
    const prev = Number(editForm.previousreading) || 0;
    const curr = Number(editForm.currentreading) || 0;
    let consumption = curr - prev;
    if (consumption < 0) consumption = 0;
    let calcFor = consumption === 0 ? 1 : consumption;
    let basic = 0;
    if (calcFor <= 3) {
      basic = calcFor * typeRates.rate1;
    } else {
      basic = (3 * typeRates.rate1) + ((calcFor - 3) * typeRates.rate2);
    }
    setEditForm(f => ({ ...f, basicamount: basic > 0 ? String(basic.toFixed(2)) : '' }));
    // eslint-disable-next-line
  }, [editForm.previousreading, editForm.currentreading, typeRates, editBill]);

  const { showToast } = useToast();
  const handleSave = async () => {
    if (!form.billedmonth || !form.previousreading || !form.currentreading || form.consumption === '') {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (Number(form.currentreading) < Number(form.previousreading)) {
      showToast('Current reading cannot be less than previous reading.', 'error');
      return;
    }
    setSaving(true);
    // Generate random 8-digit billid
    let billid;
    let isUnique = false;
    while (!isUnique) {
      billid = Math.floor(10000000 + Math.random() * 90000000);
      // Check uniqueness in bills table
      const { data: existing } = await supabase.from('bills').select('billid').eq('billid', billid);
      if (!existing || existing.length === 0) isUnique = true;
    }
    // Convert billedmonth to YYYY-MM-01
    const billedMonthDate = form.billedmonth.length === 7 ? `${form.billedmonth}-01` : form.billedmonth;
    const newBill = {
      billid,
      customerid: customer.customerid,
      billedmonth: billedMonthDate,
      previousreading: Number(form.previousreading) || 0,
      currentreading: Number(form.currentreading) || 0,
      consumption: Number(form.consumption) || 0,
      basicamount: Number(form.basicamount) || 0,
      surchargeamount: 0,
      discountamount: 0,
      totalbillamount: 0,
      advancepaymentamount: 0,
      paymentstatus: 'Unpaid',
      encodedby: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '',
      dateencoded: new Date().toISOString(),
      paidby: null,
      datepaid: null,
      customername: customer.name,
    };
    const { error } = await supabase.from('bills').insert([newBill]);
    setSaving(false);
    if (error) {
      showToast(error.message || 'Failed to add bill.', 'error');
    } else {
      showToast('Bill added successfully!', 'success');
      navigation.goBack();
    }
  };

  // Delete bill handler
  const handleDeleteBill = async () => {
    if (!pendingDeleteBill) return;
    const { error } = await supabase.from('bills').delete().eq('billid', pendingDeleteBill.billid);
    if (error) {
      showToast(error.message || 'Failed to delete bill.', 'error');
    } else {
      setPreviousBills(bills => bills.filter(b => b.billid !== pendingDeleteBill.billid));
      showToast('Bill deleted successfully!', 'success');
    }
    setPendingDeleteBill(null);
  };

  // Edit bill handler
  const openEditBill = (bill) => {
    setEditBill(bill);
    setEditForm({
      previousreading: String(bill.previousreading),
      currentreading: String(bill.currentreading),
      basicamount: String(bill.basicamount),
    });
  };
  const handleEditSave = async () => {
    if (!editBill || !editBill.billid) {
      showToast('Bill ID is missing. Cannot update this bill.', 'error');
      setEditBill(null);
      return;
    }
    if (Number(editForm.currentreading) < Number(editForm.previousreading)) {
      showToast('Current reading cannot be less than previous reading.', 'error');
      return;
    }
    setEditSaving(true);
    const prev = Number(editForm.previousreading);
    const curr = Number(editForm.currentreading);
    const basic = Number(editForm.basicamount);
    const updateObj = {
      previousreading: (editForm.previousreading === '' || editForm.previousreading === undefined) ? 0 : (isNaN(prev) ? 0 : prev),
      currentreading: (editForm.currentreading === '' || editForm.currentreading === undefined) ? 0 : (isNaN(curr) ? 0 : curr),
      basicamount: (editForm.basicamount === '' || editForm.basicamount === undefined) ? 0 : (isNaN(basic) ? 0 : basic),
    };
    const { error } = await supabase.from('bills').update(updateObj).eq('billid', editBill.billid);
    setEditSaving(false);
    if (error) {
      showToast(error.message || 'Failed to update bill.', 'error');
    } else {
      showToast('Bill updated successfully!', 'success');
      setEditBill(null);
      // Refresh both Add Bill and History tabs
      const refreshBills = async () => {
        setBillsLoading(true);
        const { data: bills, error } = await supabase
          .from('bills')
          .select('billid,billedmonth,currentreading,previousreading,basicamount,consumption,encodedby,dateencoded')
          .eq('customerid', customer.customerid)
          .order('billedmonth', { ascending: false });
        setPreviousBills(bills || []);
        setBillsLoading(false);
        // Also update Add Bill form's default values
        if (bills && bills.length > 0) {
          const latest = bills[0];
          let nextMonth;
          let prevReading = latest.currentreading || 0;
          if (latest && latest.billedmonth) {
            const last = latest.billedmonth.slice(0, 7); // YYYY-MM
            const [year, month] = last.split('-').map(Number);
            let nextYear = year;
            let nextMonthNum = month + 1;
            if (nextMonthNum > 12) {
              nextMonthNum = 1;
              nextYear++;
            }
            nextMonth = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;
          } else {
            const today = new Date();
            let year = today.getFullYear();
            let month = today.getMonth() + 2;
            if (month > 12) {
              month = 1;
              year++;
            }
            nextMonth = `${year}-${String(month).padStart(2, '0')}`;
          }
          setForm(f => ({ ...f, billedmonth: nextMonth, previousreading: String(prevReading), currentreading: '', consumption: '', basicamount: '' }));
        }
      };
      refreshBills();
    }
  };

  // Fetch full bill details by billid when opening the modal
  const openViewBill = async (bill) => {
    setViewBillLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('billid', bill.billid)
      .single();
    setViewBill(data || bill);
    setViewBillLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0d47a1", "#1976d2"]} style={styles.header}>
        <View style={[styles.headerContent, { justifyContent: 'center', position: 'relative' }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { position: 'absolute', left: 0, zIndex: 2 }]}> 
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: 'center', flex: 1 }]}>Add Bill</Text>
        </View>
      </LinearGradient>
      {/* Tab Navigation */}
      <View style={styles.modernTabBar}>
        <TouchableOpacity
          style={[styles.modernTabBtn, activeTab === 'add' && styles.modernTabBtnActive]}
          onPress={() => setActiveTab('add')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={activeTab === 'add' ? ["#1976d2", "#42a5f5"] : ["#e3f2fd", "#e3f2fd"]}
            style={styles.modernTabBtnGradient}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={activeTab === 'add' ? '#fff' : '#1976d2'} style={{ marginRight: 8 }} />
            <Text style={[styles.modernTabBtnText, activeTab === 'add' && styles.modernTabBtnTextActive]}>Add Bill</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modernTabBtn, activeTab === 'history' && styles.modernTabBtnActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={activeTab === 'history' ? ["#1976d2", "#42a5f5"] : ["#e3f2fd", "#e3f2fd"]}
            style={styles.modernTabBtnGradient}
          >
            <MaterialIcons name="history" size={20} color={activeTab === 'history' ? '#fff' : '#1976d2'} style={{ marginRight: 8 }} />
            <Text style={[styles.modernTabBtnText, activeTab === 'history' && styles.modernTabBtnTextActive]}>History</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {activeTab === 'add' && (
            <>
              <View style={styles.modernCustomerInfoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="person" size={32} color="#1976d2" style={{ marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modernCustomerId}>ID: {customer.customerid}</Text>
                    <Text style={styles.modernCustomerName}>{customer.name}</Text>
                    <Text style={styles.modernCustomerType}>Type: {customer.type || 'N/A'}</Text>
                    <Text style={styles.modernCustomerBarangay}>Barangay: {customer.barangay || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.inputLabel}>Billed Month (YYYY-MM) <Text style={{color: 'red'}}>*</Text></Text>
              <TouchableOpacity
                style={[styles.modernInput, styles.modernMonthInput]}
                onPress={() => setMonthModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, color: form.billedmonth ? '#263238' : '#90a4ae' }}>
                  {form.billedmonth || 'Select month...'}
                </Text>
                <Feather name="calendar" size={18} color="#1976d2" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              <Modal
                visible={monthModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setMonthModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.monthModalContent}>
                    <Text style={styles.modalTitle}>Select Billed Month</Text>
                    <FlatList
                      data={monthOptions}
                      keyExtractor={item => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.monthOption,
                            form.billedmonth === item && styles.monthOptionSelected,
                          ]}
                          onPress={() => {
                            setForm(f => ({ ...f, billedmonth: item }));
                            setMonthModalVisible(false);
                          }}
                        >
                          <Text style={{ fontSize: 16, color: form.billedmonth === item ? '#fff' : '#1976d2' }}>{item}</Text>
                        </TouchableOpacity>
                      )}
                      style={{ maxHeight: 350, marginBottom: 12 }}
                    />
                    <TouchableOpacity onPress={() => setMonthModalVisible(false)} style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Previous Reading <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.previousreading}
                    onChangeText={text => setForm({ ...form, previousreading: text })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Current Reading <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.currentreading}
                    onChangeText={text => setForm({ ...form, currentreading: text })}
                  />
                </View>
              </View>
              <Text style={styles.inputLabel}>Consumption <Text style={{color: 'red'}}>*</Text></Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.modernInput, { backgroundColor: '#f0f4f8', color: '#888', marginBottom: 0 }]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.consumption}
                    editable={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.modernInput, { backgroundColor: '#f0f4f8', color: '#888', marginBottom: 0 }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={form.basicamount}
                    editable={false}
                  />
                </View>
              </View>
              {rateLoading && (
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <ActivityIndicator size="small" color="#1976d2" />
                  <Text style={{ color: '#1976d2', fontSize: 13, marginTop: 2 }}>Loading rates...</Text>
                </View>
              )}
              <TouchableOpacity style={styles.modernSaveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.modernSaveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.modernSaveButtonText}>Save Bill</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'history' && (
            <>
              <Text style={styles.inputLabel}>Bill History</Text>
              {billsLoading ? (
                <ActivityIndicator size="small" color="#1976d2" style={{ marginBottom: 10 }} />
              ) : previousBills.length === 0 ? (
                <Text style={{ color: '#90a4ae', marginBottom: 10 }}>No previous bills found.</Text>
              ) : (
                <ScrollView style={{ width: '100%' }}>
                  {previousBills.map((bill, idx) => (
                    <TouchableOpacity
                      key={bill.billedmonth + '-' + idx}
                      style={styles.modernHistoryCard}
                      onPress={() => openViewBill(bill)}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="receipt-long" size={24} color="#1976d2" style={{ marginRight: 14 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modernHistoryMonth}>Month: {bill.billedmonth?.slice(0,7)}</Text>
                          <Text style={styles.modernHistoryText}>Prev: {bill.previousreading} | Curr: {bill.currentreading} | Basic: ₱{Number(bill.basicamount).toFixed(2)}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}
          {/* Edit Bill Modal */}
          <Modal
            visible={!!editBill}
            animationType="slide"
            transparent
            onRequestClose={() => setEditBill(null)}
          >
            <View style={styles.editModalOverlay}>
              <View style={styles.modernBillModalCard}>
                {/* Top right close icon */}
                <TouchableOpacity onPress={() => setEditBill(null)} style={styles.modernModalCloseBtn}>
                  <Feather name="x" size={28} color="#1976d2" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                  <MaterialIcons name="edit" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
                  <Text style={styles.modernBillModalTitle}>Edit Bill</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Previous Reading</Text>
                    <TextInput
                      style={styles.modernInput}
                      keyboardType="numeric"
                      value={editForm.previousreading}
                      onChangeText={text => setEditForm(f => ({ ...f, previousreading: text }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Current Reading</Text>
                    <TextInput
                      style={styles.modernInput}
                      keyboardType="numeric"
                      value={editForm.currentreading}
                      onChangeText={text => setEditForm(f => ({ ...f, currentreading: text }))}
                    />
                  </View>
                </View>
                <Text style={styles.inputLabel}>Basic Amount</Text>
                <TextInput
                  style={[styles.modernInput, { backgroundColor: '#f0f4f8', color: '#888', marginBottom: 0 }]}
                  keyboardType="numeric"
                  value={editForm.basicamount}
                  editable={false}
                />
                <TouchableOpacity style={styles.modernSaveButton} onPress={handleEditSave} disabled={editSaving} activeOpacity={0.85}>
                  <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.modernSaveButtonGradient}>
                    {editSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.modernSaveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* View Bill Details Modal */}
          <Modal
            visible={!!viewBill}
            animationType="slide"
            transparent
            onRequestClose={() => setViewBill(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modernBillModalCard}>
                {/* Top right close icon */}
                <TouchableOpacity onPress={() => setViewBill(null)} style={styles.modernModalCloseBtn}>
                  <Feather name="x" size={28} color="#1976d2" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                  <MaterialIcons name="receipt-long" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
                  <Text style={styles.modernBillModalTitle}>Bill Details</Text>
                </View>
                {viewBillLoading ? (
                  <ActivityIndicator size="large" color="#1976d2" style={{ marginVertical: 20 }} />
                ) : viewBill && (
                  <>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Month:</Text><Text style={styles.modernBillModalValue}>{viewBill.billedmonth?.slice(0,7)}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Previous Reading:</Text><Text style={styles.modernBillModalValue}>{viewBill.previousreading}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Current Reading:</Text><Text style={styles.modernBillModalValue}>{viewBill.currentreading}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Consumption:</Text><Text style={styles.modernBillModalValue}>{Number(viewBill.consumption).toFixed(2)}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Basic Amount:</Text><Text style={[styles.modernBillModalValue, { color: '#1976d2', fontWeight: '700' }]}>₱{Number(viewBill.basicamount).toFixed(2)}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Encoded By:</Text><Text style={styles.modernBillModalValue}>{viewBill.encodedby || 'N/A'}</Text></View>
                    <View style={styles.modernBillModalRow}><Text style={styles.inputLabel}>Date Encoded:</Text><Text style={styles.modernBillModalValue}>{viewBill.dateencoded ? new Date(viewBill.dateencoded).toLocaleString() : 'N/A'}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => { setViewBill(null); openEditBill(viewBill); }}
                        style={styles.modernBillModalEditBtn}
                        activeOpacity={0.85}
                      >
                        <MaterialIcons name="edit" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.modernBillModalBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setViewBill(null); setPendingDeleteBill(viewBill); }}
                        style={styles.modernBillModalDeleteBtn}
                        activeOpacity={0.85}
                      >
                        <MaterialIcons name="delete" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.modernBillModalBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Delete Bill Confirmation Modal */}
      <Modal
        visible={!!pendingDeleteBill}
        animationType="fade"
        transparent
        onRequestClose={() => setPendingDeleteBill(null)}
      >
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Feather name="alert-triangle" size={38} color="#e53935" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#e53935', marginBottom: 8 }}>Delete Bill?</Text>
            <Text style={{ color: '#263238', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
              Are you sure you want to delete the bill for {pendingDeleteBill?.billedmonth?.slice(0,7) || ''}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                onPress={handleDeleteBill}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e53935',
                  borderRadius: 10,
                  paddingVertical: 14,
                  shadowColor: '#e53935',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 2,
                  marginRight: 8,
                }}
              >
                <MaterialIcons name="delete" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPendingDeleteBill(null)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e0e0e0',
                  borderRadius: 10,
                  paddingVertical: 14,
                  shadowColor: '#888',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.10,
                  shadowRadius: 4,
                  elevation: 1,
                  marginLeft: 8,
                }}
              >
                <MaterialIcons name="close" size={20} color="#1976d2" style={{ marginRight: 8 }} />
                <Text style={{ color: '#1976d2', fontWeight: '700', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  customerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  customerId: { fontSize: 14, color: '#1976d2', fontWeight: '700', marginBottom: 2 },
  customerName: { fontSize: 18, fontWeight: '700', color: '#263238', marginBottom: 2 },
  customerBarangay: { fontSize: 15, color: '#546e7a' },
  customerType: { fontSize: 15, color: '#1976d2', fontWeight: '500', marginBottom: 2 },
  inputLabel: { fontSize: 14, color: '#1976d2', marginTop: 10, marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 4 },
  saveButton: { marginTop: 18, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  monthInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingRight: 12,
    paddingLeft: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  monthOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
  },
  monthOptionSelected: {
    backgroundColor: '#1976d2',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 15,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  prevBillCard: {
    backgroundColor: '#f8fafb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  prevBillMonth: {
    fontWeight: '700',
    color: '#1976d2',
    fontSize: 15,
    marginBottom: 2,
  },
  prevBillText: {
    color: '#263238',
    fontSize: 14,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 2,
  },
  historyButtonText: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 15,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976d2',
  },
  editModalClose: {
    padding: 4,
    borderRadius: 16,
  },
  editModalSection: {
    marginBottom: 18,
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#263238',
  },
  editModalSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  editModalSaveGradient: {
    padding: 14,
    alignItems: 'center',
  },
  editModalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modernHistoryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, position: 'relative' },
  modernHistoryMonth: { fontWeight: '700', color: '#1976d2', fontSize: 17, marginBottom: 4 },
  modernHistoryText: { fontSize: 15, color: '#263238', marginBottom: 2 },
  modernCustomerInfoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 22, marginBottom: 18, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, position: 'relative' },
  modernCustomerId: { fontSize: 14, color: '#1976d2', fontWeight: '700', marginBottom: 2 },
  modernCustomerName: { fontSize: 18, fontWeight: '700', color: '#263238', marginBottom: 2 },
  modernCustomerBarangay: { fontSize: 15, color: '#546e7a' },
  modernCustomerType: { fontSize: 15, color: '#1976d2', fontWeight: '500', marginBottom: 2 },
  modernInput: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 12, padding: 14, fontSize: 17, marginBottom: 8, backgroundColor: '#fff', color: '#263238', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  modernMonthInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12, paddingLeft: 12, paddingVertical: 12, marginBottom: 8 },
  modernSaveButton: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  modernSaveButtonGradient: { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  modernSaveButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  modernBillModalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '92%', maxWidth: 420, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 12, position: 'relative', alignSelf: 'center' },
  modernBillModalTitle: { fontSize: 22, fontWeight: '800', color: '#1976d2', marginBottom: 2, textAlign: 'center' },
  modernBillModalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modernBillModalValue: { fontSize: 16, color: '#263238', fontWeight: '600' },
  modernModalCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, borderRadius: 20 },
  modernBillModalEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1976d2', borderRadius: 10, paddingVertical: 14, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2, marginRight: 8 },
  modernBillModalDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e53935', borderRadius: 10, paddingVertical: 14, shadowColor: '#e53935', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2, marginLeft: 8 },
  modernBillModalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modernTabBar: { flexDirection: 'row', backgroundColor: '#e3f2fd', borderRadius: 18, margin: 16, marginBottom: 0, padding: 4, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  modernTabBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', marginHorizontal: 2 },
  modernTabBtnActive: { },
  modernTabBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14 },
  modernTabBtnText: { color: '#1976d2', fontWeight: '700', fontSize: 16 },
  modernTabBtnTextActive: { color: '#fff' },
});

export default AddBillingScreen; 