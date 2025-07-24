import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { Picker } from '@react-native-picker/picker';
import { useToast } from './GlobalToast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from './UserContext';
import { MaterialIcons } from '@expo/vector-icons';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PaymentsScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ visible: false, bills: [] });
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', paidby: '' });
  const [processing, setProcessing] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const [surchargeSettings, setSurchargeSettings] = useState({ due_day: 15, first_surcharge_percent: 10, second_surcharge_percent: 5 });
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' or 'history'
  const [historyBills, setHistoryBills] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingUnpayBill, setPendingUnpayBill] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyDetailModal, setHistoryDetailModal] = useState({ visible: false, bill: null });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch surcharge settings on mount
  useEffect(() => {
    const fetchSurcharge = async () => {
      const { data } = await supabase.from('surcharge_settings').select('*').limit(1).single();
      if (data) setSurchargeSettings(data);
    };
    fetchSurcharge();
  }, []);

  // Remove supabase.auth.getUser effect, and instead use user context
  useEffect(() => {
    if (user) {
      setCurrentUserName(`${user.firstname || ''} ${user.lastname || ''}`.trim());
    } else {
      setCurrentUserName('');
    }
  }, [user]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, count } = await supabase.from('customers').select('*', { count: 'exact' }).limit(1000);
    setCustomers(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  // Get unique barangays/types
  const barangayOptions = ['All', ...Array.from(new Set(customers.map(c => c.barangay).filter(b => b && b.trim() !== ''))).sort()];
  const typeOptions = ['All', ...Array.from(new Set(customers.map(c => c.type).filter(t => t && t.trim() !== ''))).sort()];

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesName = c.name.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesBarangay = barangayFilter === 'All' || c.barangay === barangayFilter;
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesName && matchesBarangay && matchesType;
  });

  // Fetch unpaid bills for selected customer
  const fetchBills = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('customerid', selectedCustomer.customerid)
      .eq('paymentstatus', 'Unpaid')
      .order('billedmonth', { ascending: false });
    setBills(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchBills();
  }, [selectedCustomer]);

  // Helper: parse YYYY-MM-DD as local date
  function parseDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Helper: calculate due date for a bill
  function getDueDate(bill) {
    const billed = parseDate(bill.billedmonth);
    if (!billed) return null;
    const due = new Date(billed);
    due.setMonth(due.getMonth() + 1); // add 1 month, handles year overflow
    // Clamp day to last day of month
    const lastDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate();
    due.setDate(Math.min(surchargeSettings.due_day, lastDay));
    return due;
  }
  function getEndOfDueMonth(bill) {
    const billed = parseDate(bill.billedmonth);
    if (!billed) return null;
    const due = new Date(billed);
    due.setMonth(due.getMonth() + 1); // next month
    // Last day of due month
    return new Date(due.getFullYear(), due.getMonth() + 1, 0);
  }
  // Helper: calculate surcharge for a bill
  function calcSurcharge(bill, dateObj) {
    if (!dateObj) return 0;
    const dueDate = getDueDate(bill);
    const endOfDueMonth = getEndOfDueMonth(bill);
    if (!dueDate || !endOfDueMonth) return 0;
    const base = Number(bill.basicamount || 0);
    const firstPct = Number(surchargeSettings.first_surcharge_percent) / 100;
    const secondPct = Number(surchargeSettings.second_surcharge_percent) / 100;
    if (dateObj <= dueDate) return 0;
    if (dateObj > dueDate && dateObj <= endOfDueMonth) {
      return base * firstPct;
    }
    if (dateObj > endOfDueMonth) {
      const first = base * firstPct;
      const second = (base + first) * secondPct;
      return first + second;
    }
    return 0;
  }

  const openPaymentModal = () => {
    // Calculate net total with credit
    const totalAmount = selectedBills.reduce((sum, b) => sum + Number(b.basicamount || 0), 0);
    const totalDiscount = selectedBills.reduce((sum, b) => {
      if (selectedCustomer && selectedCustomer.discount) {
        const base = Number(b.basicamount || 0);
        return sum + (base * Number(selectedCustomer.discount) / 100);
      } else {
        return sum;
      }
    }, 0);
    const today = new Date();
    const totalSurcharge = selectedBills.reduce((sum, b) => sum + calcSurcharge(b, today), 0);
    const netTotal = totalAmount - totalDiscount + totalSurcharge;
    const creditBalance = Number(selectedCustomer?.credit_balance ?? 0);
    const creditApplied = Math.min(creditBalance, netTotal);
    const netTotalAfterCredit = Math.max(0, netTotal - creditApplied);
    const todayStr = today.toISOString().slice(0, 10);
    setPaymentForm({ amount: String(netTotalAfterCredit.toFixed(2)), date: todayStr, paidby: currentUserName });
    setPaymentModal({ visible: true, bills: selectedBills });
  };

  const handleBillSelect = (bill) => {
    setSelectedBills((prev) => {
      if (prev.some(b => b.billid === bill.billid)) {
        return prev.filter(b => b.billid !== bill.billid);
      } else {
        return [...prev, bill];
      }
    });
  };

  const handleProcessPayment = async () => {
    if (!paymentForm.amount || !paymentForm.date) {
      showToast('Please fill in all payment details.', 'error');
      return;
    }
    if (!currentUserName) {
      showToast('User info not loaded. Please try again.', 'error');
      return;
    }
    setProcessing(true);
    const billIds = paymentModal.bills.map(b => b.billid);
    // Calculate per-bill values
    const today = new Date();
    const amountPaid = Number(paymentForm.amount);
    // Calculate net total for all selected bills
    const totalAmount = paymentModal.bills.reduce((sum, b) => sum + Number(b.totalbillamount || b.basicamount || 0), 0);
    const totalDiscount = paymentModal.bills.reduce((sum, b) => {
      if (selectedCustomer && selectedCustomer.discount) {
        const base = Number(b.basicamount || 0);
        return sum + (base * Number(selectedCustomer.discount) / 100);
      } else {
        return sum;
      }
    }, 0);
    const totalSurcharge = paymentModal.bills.reduce((sum, b) => sum + calcSurcharge(b, today), 0);
    const netTotal = totalAmount - totalDiscount + totalSurcharge;
    const advancePayment = amountPaid - netTotal;
    // Prepare updates for each bill
    const perBillAmount = amountPaid / paymentModal.bills.length;
    const perBillAdvance = (advancePayment > 0 ? advancePayment : 0) / paymentModal.bills.length;
    const updates = paymentModal.bills.map(bill => {
      // Calculate per-bill discount and surcharge
      let discount = 0;
      if (selectedCustomer && selectedCustomer.discount) {
        const base = Number(bill.basicamount || 0);
        discount = (base * Number(selectedCustomer.discount) / 100);
      }
      const surcharge = calcSurcharge(bill, today);
      return {
        billid: bill.billid,
        paymentstatus: 'Paid',
        paidby: currentUserName,
        datepaid: paymentForm.date,
        discountamount: discount,
        surchargeamount: surcharge,
        totalbillamount: perBillAmount,
        advancepaymentamount: perBillAdvance,
      };
    });
    // Update all bills
    let error = null;
    for (const update of updates) {
      const { error: billError } = await supabase.from('bills').update({
        paymentstatus: update.paymentstatus,
        paidby: update.paidby,
        datepaid: update.datepaid,
        discountamount: update.discountamount,
        surchargeamount: update.surchargeamount,
        totalbillamount: update.totalbillamount,
        advancepaymentamount: update.advancepaymentamount,
      }).eq('billid', update.billid);
      if (billError) error = billError;
    }
    // Update customer's credit_balance with total advance payment and deduct credit applied
    if (!error && selectedCustomer) {
      // Get current credit_balance
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customerid', selectedCustomer.customerid)
        .single();
      if (!customerError && customerData) {
        const prevCredit = Number(customerData.credit_balance || 0);
        // Calculate credit applied and advance payment
        const creditApplied = Math.min(prevCredit, netTotal);
        const amountPaid = Number(paymentForm.amount);
        const netTotalAfterCredit = Math.max(0, netTotal - creditApplied);
        const advancePayment = amountPaid - netTotalAfterCredit;
        // New credit balance: previous - credit applied + advance payment (if any)
        const newCredit = prevCredit - creditApplied + (advancePayment > 0 ? advancePayment : 0);
        await supabase
          .from('customers')
          .update({ credit_balance: newCredit })
          .eq('customerid', selectedCustomer.customerid);
        // Refresh selectedCustomer info in UI
        setSelectedCustomer({ ...customerData, credit_balance: newCredit });
      }
    }
    setProcessing(false);
    if (error) {
      showToast(error.message || 'Failed to process payment.', 'error');
    } else {
      showToast('Payment processed successfully!', 'success');
      setPaymentModal({ visible: false, bills: [] });
      setBills(bills => bills.filter(b => !billIds.includes(b.billid)));
      setSelectedBills([]);
      // Refresh unpaid bills
      fetchBills();
      // Refresh payment history if on history tab
      if (activeTab === 'history' && selectedCustomer) {
        setHistoryLoading(true);
        supabase
          .from('bills')
          .select('*')
          .eq('customerid', selectedCustomer.customerid)
          .eq('paymentstatus', 'Paid')
          .order('datepaid', { ascending: false })
          .then(({ data }) => {
            setHistoryBills(data || []);
            setHistoryLoading(false);
          });
      }
    }
  };

  // Calculate total, discount, surcharge, and net total for selected bills
  const totalAmount = selectedBills.reduce((sum, b) => sum + Number(b.basicamount || 0), 0);
  const totalDiscount = selectedBills.reduce((sum, b) => {
    if (selectedCustomer && selectedCustomer.discount) {
      const base = Number(b.basicamount || 0);
      return sum + (base * Number(selectedCustomer.discount) / 100);
    } else {
      return sum;
    }
  }, 0);
  const today = new Date();
  const totalSurcharge = selectedBills.reduce((sum, b) => sum + calcSurcharge(b, today), 0);
  const netTotal = totalAmount - totalDiscount + totalSurcharge;
  // Apply credit balance
  const creditBalance = Number(selectedCustomer?.credit_balance ?? 0);
  const creditApplied = Math.min(creditBalance, netTotal);
  const netTotalAfterCredit = Math.max(0, netTotal - creditApplied);

  // Fetch payment history for selected customer when tab is 'history'
  useEffect(() => {
    if (activeTab !== 'history' || !selectedCustomer) return;
    setHistoryLoading(true);
    supabase
      .from('bills')
      .select('*')
      .eq('customerid', selectedCustomer.customerid)
      .eq('paymentstatus', 'Paid')
      .order('datepaid', { ascending: false })
      .then(({ data }) => {
        setHistoryBills(data || []);
        setHistoryLoading(false);
      });
  }, [activeTab, selectedCustomer]);

  // Unpay handler
  const handleUnpay = async () => {
    if (!pendingUnpayBill) return;
    const { error } = await supabase.from('bills').update({
      paymentstatus: 'Unpaid',
      paidby: null,
      datepaid: null,
      surchargeamount: 0,
      discountamount: 0,
      totalbillamount: 0,
      advancepaymentamount: 0
    }).eq('billid', pendingUnpayBill.billid);
    if (error) {
      showToast(error.message || 'Failed to mark as unpaid.', 'error');
    } else {
      setHistoryBills(bills => bills.filter(b => b.billid !== pendingUnpayBill.billid));
      showToast('Bill marked as unpaid.', 'success');
      fetchBills();
    }
    setPendingUnpayBill(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0d47a1", "#1976d2"]} style={styles.header}>
        <View style={[styles.headerContent, { justifyContent: 'center', position: 'relative' }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { position: 'absolute', left: 0, zIndex: 2 }]}> 
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: 'center', flex: 1 }]}>Payments</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {!selectedCustomer && (
          <>
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
          </>
        )}
        {!selectedCustomer ? (
          <>
            <Text style={styles.inputLabel}>Select Customer</Text>
            <Text style={styles.countText}>Showing {filteredCustomers.length} of {totalCount} customer{totalCount === 1 ? '' : 's'}</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
            ) : filteredCustomers.length === 0 ? (
              <Text style={{ color: '#90a4ae', textAlign: 'center', marginVertical: 12 }}>No customers found.</Text>
            ) : (
              filteredCustomers.map(item => (
                <TouchableOpacity
                  key={item.customerid}
                  style={styles.modernCustomerCard}
                  onPress={() => setSelectedCustomer(item)}
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
          </>
        ) : (
          <>
            <View style={styles.modernSelectedCustomerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="person" size={32} color="#1976d2" style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modernCustomerName}>[{selectedCustomer.customerid}] {selectedCustomer.name}</Text>
                  <Text style={styles.modernCustomerSub}>Type: {selectedCustomer.type || 'N/A'}  |  Barangay: {selectedCustomer.barangay || 'N/A'}</Text>
                  <Text style={styles.modernCustomerSub}>Discount: {selectedCustomer.discount ?? 0}  |  Credit: ₱{Number(selectedCustomer.credit_balance ?? 0).toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={styles.modernChangeBtn}> 
                  <MaterialIcons name="close" size={22} color="#1976d2" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={() => setActiveTab('unpaid')} style={[styles.modernTabBtn, activeTab === 'unpaid' && styles.modernTabBtnActive]}>
                  <MaterialIcons name="receipt" size={18} color={activeTab === 'unpaid' ? '#fff' : '#1976d2'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modernTabBtnText, activeTab === 'unpaid' && styles.modernTabBtnTextActive]}>Unpaid</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.modernTabBtn, activeTab === 'history' && styles.modernTabBtnActive]}>
                  <MaterialIcons name="history" size={18} color={activeTab === 'history' ? '#fff' : '#1976d2'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modernTabBtnText, activeTab === 'history' && styles.modernTabBtnTextActive]}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
            {activeTab === 'unpaid' && (
              <>
                <Text style={styles.inputLabel}>Unpaid</Text>
                {loading ? (
                  <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />
                ) : bills.length === 0 ? (
                  <Text style={{ color: '#90a4ae', marginVertical: 16 }}>No unpaid bills found for this customer.</Text>
                ) : (
                  <>
                    <Text style={styles.countText}>Showing {bills.length} bill{bills.length === 1 ? '' : 's'}</Text>
                    {bills.map(bill => {
                      const selected = selectedBills.some(b => b.billid === bill.billid);
                      return (
                        <TouchableOpacity
                          key={bill.billid}
                          style={[styles.billCard, selected && styles.billCardSelected]}
                          onPress={() => handleBillSelect(bill)}
                          activeOpacity={0.85}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name={selected ? 'check-square' : 'square'} size={22} color={selected ? '#1976d2' : '#b0bec5'} style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.billMonth}>Month: {bill.billedmonth?.slice(0,7)}</Text>
                              <Text style={styles.billAmount}>Amount: ₱{Number(bill.basicamount || 0).toFixed(2)}</Text>
                              <Text style={styles.billSub}>Prev: {bill.previousreading} | Curr: {bill.currentreading}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Selected Bills</Text>
                      {selectedBills.length === 0 ? (
                        <Text style={{ color: '#90a4ae', marginBottom: 8 }}>No bills selected.</Text>
                      ) : (
                        <>
                          {selectedBills.map(bill => {
                            let discount = 0;
                            if (selectedCustomer && selectedCustomer.discount) {
                              const base = Number(bill.basicamount || 0);
                              discount = (base * Number(selectedCustomer.discount) / 100);
                            }
                            const surcharge = calcSurcharge(bill, today);
                            return (
                              <Text key={bill.billid} style={styles.summaryBill}>
                                {bill.billedmonth?.slice(0,7)} — ₱{Number(bill.basicamount || 0).toFixed(2)}
                                {discount ? ` | Discount: ₱${discount.toFixed(2)}` : ''}
                                {surcharge ? ` | Surcharge: ₱${surcharge.toFixed(2)}` : ''}
                              </Text>
                            );
                          })}
                          <Text style={styles.summaryTotal}>Total: ₱{totalAmount.toFixed(2)}</Text>
                          <Text style={styles.summaryDiscount}>Discount: ₱{totalDiscount.toFixed(2)}</Text>
                          <Text style={styles.summarySurcharge}>Surcharge: ₱{totalSurcharge.toFixed(2)}</Text>
                          <Text style={styles.summaryCredit}>Credit Applied: ₱{creditApplied.toFixed(2)}</Text>
                          <Text style={styles.summaryNetTotal}>Net Total: ₱{netTotalAfterCredit.toFixed(2)}</Text>
                        </>
                      )}
                      <TouchableOpacity
                        style={[styles.payBtn, { marginTop: 10, opacity: selectedBills.length === 0 ? 0.5 : 1 }]}
                        onPress={openPaymentModal}
                        disabled={selectedBills.length === 0}
                      >
                        <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.payBtnGradient}>
                          <Text style={styles.payBtnText}>Process Payment</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
            {activeTab === 'history' && (
              <>
                <Text style={styles.inputLabel}>History</Text>
                {historyLoading ? (
                  <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />
                ) : historyBills.length === 0 ? (
                  <Text style={{ color: '#90a4ae', marginVertical: 16 }}>No payment history found for this customer.</Text>
                ) : (
                  <ScrollView style={{ width: '100%' }}>
                    <Text style={styles.countText}>Showing {historyBills.length} payment{historyBills.length === 1 ? '' : 's'}</Text>
                    {historyBills.map((bill, idx) => {
                      // Calculate values for modal
                      let discount = 0;
                      if (selectedCustomer && selectedCustomer.discount) {
                        const base = Number(bill.basicamount || 0);
                        discount = (base * Number(selectedCustomer.discount) / 100);
                      }
                      const surcharge = calcSurcharge(bill, bill.datepaid ? parseDate(bill.datepaid.slice(0, 10)) : null);
                      const basicAmount = Number(bill.basicamount || 0);
                      const totalPaid = Number(bill.advancepaymentamount || bill.totalbillamount || bill.basicamount || 0);
                      const advancePayment = Number(bill.advancepaymentamount || 0);
                      const consumption = (bill.currentreading ?? 0) - (bill.previousreading ?? 0);
                      return (
                        <TouchableOpacity
                          key={bill.billid + '-' + idx}
                          style={styles.prevBillCard}
                          activeOpacity={0.85}
                          onPress={() => setHistoryDetailModal({ visible: true, bill: { ...bill, discount, surcharge, basicAmount, totalPaid, advancePayment, consumption } })}
                        >
                          <MaterialIcons name="receipt" size={24} color="#1976d2" style={{ marginRight: 14 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.prevBillMonth}>Month: {bill.billedmonth?.slice(0,7)}</Text>
                            <Text style={styles.prevBillText}>Prev: {bill.previousreading} | Curr: {bill.currentreading} | Cons: {consumption}</Text>
                            <Text style={styles.prevBillText}>Basic Amount: ₱{basicAmount.toFixed(2)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}
            {/* History Detail Modal */}
            <Modal
              visible={historyDetailModal.visible}
              animationType="slide"
              transparent
              onRequestClose={() => setHistoryDetailModal({ visible: false, bill: null })}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxWidth: 400 }]}> 
                  <Text style={styles.modalTitle}>Payment Breakdown</Text>
                  {historyDetailModal.bill && (
                    <>
                      {/* Top right close icon */}
                      <TouchableOpacity
                        onPress={() => setHistoryDetailModal({ visible: false, bill: null })}
                        style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, borderRadius: 20 }}
                      >
                        <MaterialIcons name="close" size={28} color="#1976d2" />
                      </TouchableOpacity>
                      <Text style={styles.inputLabel}>Month: <Text style={{ color: '#1976d2', fontWeight: '700' }}>{historyDetailModal.bill.billedmonth?.slice(0,7)}</Text></Text>
                      <Text style={styles.inputLabel}>Basic Amount: <Text style={{ color: '#263238' }}>₱{historyDetailModal.bill.basicAmount.toFixed(2)}</Text></Text>
                      <Text style={styles.inputLabel}>Discount: <Text style={{ color: '#388e3c' }}>₱{historyDetailModal.bill.discount.toFixed(2)}</Text></Text>
                      <Text style={styles.inputLabel}>Surcharge: <Text style={{ color: '#e53935' }}>₱{historyDetailModal.bill.surcharge.toFixed(2)}</Text></Text>
                      <Text style={styles.inputLabel}>Total Amount Paid: <Text style={{ color: '#1976d2', fontWeight: '700' }}>₱{historyDetailModal.bill.totalPaid.toFixed(2)}</Text></Text>
                      <Text style={styles.inputLabel}>Advance Payment: <Text style={{ color: '#1976d2' }}>₱{historyDetailModal.bill.advancePayment.toFixed(2)}</Text></Text>
                      <Text style={styles.inputLabel}>Payment Date: <Text style={{ color: '#1976d2' }}>{historyDetailModal.bill.datepaid ? historyDetailModal.bill.datepaid.slice(0,10) : 'N/A'}</Text></Text>
                      <Text style={styles.inputLabel}>Paid By: <Text style={{ color: '#1976d2' }}>{historyDetailModal.bill.paidby || 'N/A'}</Text></Text>
                      {historyDetailModal.bill.paidby === currentUserName && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 16 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setHistoryDetailModal({ visible: false, bill: null });
                              setPendingUnpayBill(historyDetailModal.bill);
                            }}
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
                              marginLeft: 8,
                            }}
                          >
                            <MaterialIcons name="delete" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Unpay</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}
      </ScrollView>
      {/* Payment Modal */}
      <Modal
        visible={paymentModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentModal({ visible: false, bills: [] })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Process Payment</Text>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={paymentForm.amount}
              onChangeText={text => setPaymentForm(f => ({ ...f, amount: text }))}
            />
            <Text style={styles.inputLabel}>Date Paid</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={paymentForm.date}
                onChangeText={text => setPaymentForm(f => ({ ...f, date: text }))}
              />
            ) : (
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, color: paymentForm.date ? '#263238' : '#90a4ae' }}>
                  {paymentForm.date || 'Select date...'}
                </Text>
                <Feather name="calendar" size={18} color="#1976d2" style={{ marginLeft: 8 }} />
                {showDatePicker && (
                  <DateTimePicker
                    value={paymentForm.date ? new Date(paymentForm.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const d = selectedDate;
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setPaymentForm(f => ({ ...f, date: dateStr }));
                      }
                    }}
                  />
                )}
              </TouchableOpacity>
            )}
            {currentUserName && (
              <Text style={[styles.inputLabel, { marginBottom: 2 }]}>Paid By: <Text style={{ color: '#1976d2', fontWeight: '700' }}>{currentUserName}</Text></Text>
            )}
            {/* Top right Cancel icon */}
            <TouchableOpacity
              onPress={() => setPaymentModal({ visible: false, bills: [] })}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, borderRadius: 20 }}
            >
              <MaterialIcons name="close" size={28} color="#1976d2" />
            </TouchableOpacity>
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleProcessPayment}
                disabled={!currentUserName || processing}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: (!currentUserName || processing) ? '#90caf9' : '#1976d2',
                  borderRadius: 10,
                  paddingVertical: 14,
                  shadowColor: '#1976d2',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 2,
                  opacity: (!currentUserName || processing) ? 0.5 : 1,
                }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="payment" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                      {currentUserName ? 'Save Payment' : 'Loading user info...'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Unpay Confirmation Modal */}
      <Modal
        visible={!!pendingUnpayBill}
        animationType="fade"
        transparent
        onRequestClose={() => setPendingUnpayBill(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 32 }]}> 
            <Feather name="alert-triangle" size={38} color="#e53935" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#e53935', marginBottom: 8 }}>Mark as Unpaid?</Text>
            <Text style={{ color: '#263238', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
              Are you sure you want to mark the bill for {pendingUnpayBill?.billedmonth?.slice(0,7) || ''} as unpaid?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                onPress={handleUnpay}
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
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Unpay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPendingUnpayBill(null)}
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
  headerContent: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', flex: 1, textAlign: 'center' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  inputLabel: { fontSize: 14, color: '#1976d2', marginTop: 10, marginBottom: 2 },
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 0 },
  searchIcon: { marginRight: 8 },
  searchBoxInput: { flex: 1, fontSize: 17, color: '#263238', backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 8, paddingHorizontal: 0 },
  barangayPickerWrapper: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 2, borderWidth: 1, borderColor: '#e3f2fd', overflow: 'hidden', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, minHeight: 48, justifyContent: 'center', marginBottom: 8 },
  barangayPicker: { width: '100%', minHeight: 48, color: '#1976d2', backgroundColor: 'transparent', fontSize: 17, paddingHorizontal: 10 },
  barangayPickerItem: { fontSize: 17, color: '#1976d2' },
  customerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  customerName: { fontSize: 18, fontWeight: '700', color: '#1976d2' },
  customerSub: { fontSize: 14, color: '#546e7a', marginTop: 2 },
  selectedCustomerCard: { backgroundColor: '#e3f2fd', borderRadius: 16, padding: 16, marginBottom: 16 },
  clearCustomerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#1976d2' },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  billCardSelected: {
    borderColor: '#1976d2',
    borderWidth: 2,
    backgroundColor: '#e3f2fd',
  },
  billMonth: { fontWeight: '700', color: '#1976d2', fontSize: 17, marginBottom: 2 },
  billAmount: { fontSize: 18, color: '#263238', fontWeight: '700', marginBottom: 2 },
  billSub: { color: '#546e7a', fontSize: 15, marginBottom: 8 },
  payBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  payBtnGradient: { padding: 0, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '92%', maxWidth: 420, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 12, position: 'relative' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1976d2', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 4 },
  saveButton: { marginTop: 18, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1976d2', paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  saveButtonGradient: { padding: 0, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  cancelButton: { marginTop: 10, alignItems: 'center', borderRadius: 14, backgroundColor: '#e0e0e0', paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center' },
  cancelButtonText: { color: '#1976d2', fontSize: 17, fontWeight: '700', marginLeft: 8 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  summaryTitle: {
    fontWeight: '700',
    color: '#1976d2',
    fontSize: 16,
    marginBottom: 6,
  },
  summaryBill: {
    color: '#263238',
    fontSize: 15,
    marginBottom: 2,
  },
  summaryTotal: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'right',
  },
  summaryDiscount: {
    color: '#388e3c',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'right',
  },
  summarySurcharge: {
    color: '#e53935',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'right',
  },
  summaryNetTotal: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 17,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'right',
  },
  summaryCredit: {
    color: '#388e3c',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'right',
  },
  prevBillCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  prevBillMonth: {
    fontWeight: '700',
    color: '#1976d2',
    fontSize: 17,
    marginBottom: 4,
  },
  prevBillText: {
    fontSize: 15,
    color: '#263238',
    marginBottom: 2,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  tabBtnActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  tabBtnText: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  modernCustomerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  modernCustomerName: { fontSize: 18, fontWeight: '700', color: '#1976d2', marginBottom: 2 },
  modernCustomerSub: { fontSize: 14, color: '#546e7a', marginBottom: 2 },
  modernSelectedCustomerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  modernChangeBtn: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  modernTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  modernTabBtnActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  modernTabBtnText: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 15,
  },
  modernTabBtnTextActive: {
    color: '#fff',
  },
  countText: { fontSize: 15, color: '#607d8b', fontWeight: '600', marginLeft: 8 },
});

export default PaymentsScreen; 