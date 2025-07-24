import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Platform, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { Picker } from '@react-native-picker/picker';
import { useUser } from './UserContext';
import { useToast } from './GlobalToast';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    type: '',
    barangay: '',
    discount: '',
    remarks: '',
    status: '',
    disconnection_date: '',
    added_by: '',
    disconnected_by: '',
  });
  const [adding, setAdding] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editing, setEditing] = useState(false);
  const { user } = useUser();
  const { showToast } = useToast();
  // Only use picker options for add modal; for filters, derive from customers array
  const [typePickerOptions, setTypePickerOptions] = useState([]);
  const [barangayPickerOptions, setBarangayPickerOptions] = useState([]);
  const [discountPickerOptions, setDiscountPickerOptions] = useState([]);
  const [confirmDisconnectVisible, setConfirmDisconnectVisible] = useState(false);
  const [pendingDisconnectCustomer, setPendingDisconnectCustomer] = useState(null);
  const [remarksModalVisible, setRemarksModalVisible] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
    // Fetch type options for picker
    supabase.from('customer_type').select('type').then(({ data }) => setTypePickerOptions(data ? data.map(d => d.type) : []));
    // Fetch barangay options for picker
    supabase.from('barangays').select('barangay').then(({ data }) => setBarangayPickerOptions(data ? data.map(d => d.barangay) : []));
    // Fetch discount options for picker
    supabase.from('discount').select('type,discountpercentage').then(({ data }) => setDiscountPickerOptions(data || []));
  }, [search, barangayFilter, typeFilter, statusFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    let query = supabase.from('customers').select('*', { count: 'exact' }).order('name', { ascending: true });
    if (search && search.trim() !== '') {
      query = query.ilike('name', `%${search.trim()}%`);
    }
    if (barangayFilter !== 'All') {
      query = query.eq('barangay', barangayFilter);
    }
    if (typeFilter !== 'All') {
      query = query.eq('type', typeFilter);
    }
    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    const { data, count } = await query.limit(1000);
    setCustomers(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  // Get unique barangays/types from all customers (not just filtered)
  const barangayFilterOptions = ['All', ...Array.from(new Set(customers.map(c => c.barangay).filter(b => b && b.trim() !== ''))).sort()];
  const typeFilterOptions = ['All', ...Array.from(new Set(customers.map(c => c.type).filter(t => t && t.trim() !== ''))).sort()];

  // No client-side filtering; customers is always the correct list
  const filteredCustomers = customers;

  const handleEdit = (customer) => {
    // Placeholder for edit logic
  };
  const handleDelete = (customer) => {
    // Placeholder for delete logic (show confirmation)
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0d47a1", "#1976d2"]} style={styles.header}>
        <View style={[styles.headerContent, { justifyContent: 'center', position: 'relative' }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { position: 'absolute', left: 0, zIndex: 2 }]}> 
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { textAlign: 'center', flex: 1 }]}>Customers</Text>
        </View>
      </LinearGradient>
      <View style={styles.contentContainer}>
        <Text style={styles.inputLabel}>Search Customer</Text>
        <View style={styles.searchBoxContainer}>
          <Feather name="search" size={20} color="#90a4ae" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBoxInput}
            placeholder="Search by name..."
            placeholderTextColor="#90a4ae"
            value={search}
            onChangeText={setSearch}
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={styles.filterRow}>
          <View style={styles.filterPillFlex}>
            <Feather name="map-pin" size={18} color="#1976d2" style={styles.filterIcon} />
            <Picker
              selectedValue={barangayFilter}
              onValueChange={setBarangayFilter}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {barangayFilterOptions.map(b => (
                <Picker.Item key={b} label={b} value={b} />
              ))}
            </Picker>
          </View>
          <View style={styles.filterPillFlex}>
            <MaterialIcons name="category" size={18} color="#1976d2" style={styles.filterIcon} />
            <Picker
              selectedValue={typeFilter}
              onValueChange={setTypeFilter}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {typeFilterOptions.map(t => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
          <View style={styles.filterPillFlex}>
            <MaterialIcons name="toggle-on" size={18} color="#1976d2" style={styles.filterIcon} />
            <Picker
              selectedValue={statusFilter}
              onValueChange={setStatusFilter}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Disconnected" value="Disconnected" />
            </Picker>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={styles.sectionHeader}>Customer List</Text>
          <Text style={styles.countText}>Showing {filteredCustomers.length} of {totalCount} customer{totalCount === 1 ? '' : 's'}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : filteredCustomers.length === 0 ? (
          <Text style={{ color: '#90a4ae', textAlign: 'center', marginVertical: 12 }}>No customers found.</Text>
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={item => String(item.customerid)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modernCustomerCard}
                activeOpacity={0.85}
                onPress={() => { setSelectedCustomer(item); setModalVisible(true); }}
              >
                <MaterialIcons name="person" size={32} color="#1976d2" style={{ marginRight: 18 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modernCustomerName}>[{item.customerid}] {item.name}</Text>
                  <Text style={styles.modernCustomerSub}>Type: {item.type || 'N/A'}  |  Barangay: {item.barangay || 'N/A'}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
        {/* Floating Action Button for Add Customer */}
        <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
          <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.fabGradient}>
            <MaterialIcons name="person-add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Customer Details Modal */}
      <Modal
        visible={modalVisible && !!selectedCustomer}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModalCard}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={28} color="#1976d2" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <MaterialIcons name="person" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
              <Text style={styles.customerModalTitle}>Customer Details</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>ID:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.customerid}</Text></View>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Name:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.name}</Text></View>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Type:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.type || 'N/A'}</Text></View>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Barangay:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.barangay || 'N/A'}</Text></View>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Discount:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.discount ?? 0}</Text></View>
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Credit Balance:</Text><Text style={styles.customerModalValue}>₱{Number(selectedCustomer?.credit_balance ?? 0).toFixed(2)}</Text></View>
              {selectedCustomer?.remarks ? (
                <View style={[styles.customerModalRow, { alignItems: 'flex-start' }]}> 
                  <Text style={styles.inputLabel}>Remarks:</Text>
                  <TouchableOpacity
                    style={styles.viewRemarksBtn}
                    onPress={() => setRemarksModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewRemarksBtnText}>View Remarks</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Status:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.status || 'N/A'}</Text></View>
              {selectedCustomer?.disconnection_date ? (
                <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Disconnection Date:</Text><Text style={[styles.customerModalValue, { color: '#e53935' }]}>{selectedCustomer?.disconnection_date}</Text></View>
              ) : null}
              {selectedCustomer?.added_by ? (
                <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Added by:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.added_by}</Text></View>
              ) : null}
              {selectedCustomer?.disconnected_by ? (
                <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Disconnected by:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.disconnected_by}</Text></View>
              ) : null}
              <View style={styles.customerModalRow}><Text style={styles.inputLabel}>Date Added:</Text><Text style={styles.customerModalValue}>{selectedCustomer?.date_added || 'N/A'}</Text></View>
            </ScrollView>
            {/* Action Buttons */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditForm(selectedCustomer);
                  setEditModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.actionBtnGradient}>
                  <MaterialIcons name="edit" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
              {selectedCustomer?.status === 'Active' ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setPendingDisconnectCustomer(selectedCustomer);
                    setConfirmDisconnectVisible(true);
                  }}
                  activeOpacity={0.85}
                  disabled={editing}
                >
                  <LinearGradient colors={["#e53935", "#e57373"]} style={styles.actionBtnGradient}>
                    <MaterialIcons name="block" size={22} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.actionBtnText}>Disconnect</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : selectedCustomer?.status === 'Disconnected' ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={async () => {
                    setEditing(true);
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const userName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '';
                    const reconnectionLog = `Reconnected on ${todayStr} by ${userName}`;
                    const prevRemarks = selectedCustomer.remarks ? selectedCustomer.remarks + ' | ' : '';
                    const newRemarks = prevRemarks + reconnectionLog;
                    const { error } = await supabase.from('customers').update({ status: 'Active', disconnection_date: null, remarks: newRemarks }).eq('customerid', selectedCustomer.customerid);
                    setEditing(false);
                    if (!error) {
                      showToast('Customer reconnected.', 'success');
                      setModalVisible(false);
                      fetchCustomers();
                    } else {
                      showToast(error.message || 'Failed to reconnect.', 'error');
                    }
                  }}
                  activeOpacity={0.85}
                  disabled={editing}
                >
                  <LinearGradient colors={["#43a047", "#66bb6a"]} style={styles.actionBtnGradient}>
                    <MaterialIcons name="refresh" size={22} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.actionBtnText}>Reconnect</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
      {/* Add Customer Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModalCard}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={28} color="#1976d2" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <MaterialIcons name="person-add" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
              <Text style={styles.customerModalTitle}>Add Customer</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.modernInput} value={addForm.name} onChangeText={v => setAddForm(f => ({ ...f, name: v }))} placeholder="Full Name" />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={addForm.type}
                  onValueChange={v => setAddForm(f => ({ ...f, type: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select type..." value="" />
                  {typePickerOptions.map(t => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Barangay</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={addForm.barangay}
                  onValueChange={v => setAddForm(f => ({ ...f, barangay: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select barangay..." value="" />
                  {barangayPickerOptions.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Discount</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={addForm.discount}
                  onValueChange={v => setAddForm(f => ({ ...f, discount: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select discount..." value="" />
                  {discountPickerOptions.map(d => (
                    <Picker.Item key={d.type} label={`${d.type} (${d.discountpercentage ?? 0}%)`} value={d.discountpercentage} />
                  ))}
                </Picker>
              </View>
              {/* Remarks field removed from add customer modal */}
            </ScrollView>
            <TouchableOpacity
              style={styles.modernSaveButton}
              onPress={async () => {
                if (!addForm.name.trim() || !addForm.type || !addForm.barangay) {
                  showToast('Name, Type, and Barangay are required.', 'error');
                  return;
                }
                setAdding(true);
                // Generate random 6-digit customerid
                let customerid;
                let isUnique = false;
                while (!isUnique) {
                  customerid = Math.floor(100000 + Math.random() * 900000); // 6 digits
                  const { data: existing } = await supabase.from('customers').select('customerid').eq('customerid', customerid);
                  if (!existing || existing.length === 0) isUnique = true;
                }
                const newCustomer = {
                  customerid,
                  name: addForm.name,
                  type: addForm.type,
                  barangay: addForm.barangay,
                  discount: addForm.discount ? Number(addForm.discount) : null,
                  status: 'Active',
                  added_by: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '',
                };
                const { error } = await supabase.from('customers').insert([newCustomer]);
                setAdding(false);
                if (!error) {
                  setAddModalVisible(false);
                  setAddForm({ name: '', type: '', barangay: '', discount: '', remarks: '', status: '', added_by: '' });
                  fetchCustomers();
                  showToast('Customer added successfully!', 'success');
                } else {
                  showToast(error.message || 'Failed to add customer.', 'error');
                }
              }}
              disabled={adding || !addForm.name.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.modernSaveButtonGradient}>
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.modernSaveButtonText}>Save</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit Customer Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerModalCard}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={28} color="#1976d2" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <MaterialIcons name="edit" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
              <Text style={styles.customerModalTitle}>Edit Customer</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.modernInput} value={editForm.name} onChangeText={v => setEditForm(f => ({ ...f, name: v }))} placeholder="Full Name" />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editForm.type}
                  onValueChange={v => setEditForm(f => ({ ...f, type: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select type..." value="" />
                  {typePickerOptions.map(t => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Barangay</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editForm.barangay}
                  onValueChange={v => setEditForm(f => ({ ...f, barangay: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select barangay..." value="" />
                  {barangayPickerOptions.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Discount</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editForm.discount}
                  onValueChange={v => setEditForm(f => ({ ...f, discount: v }))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select discount..." value="" />
                  {discountPickerOptions.map(d => (
                    <Picker.Item key={d.type} label={`${d.type} (${d.discountpercentage ?? 0}%)`} value={d.discountpercentage} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>Remarks</Text>
              <TextInput style={styles.modernInput} value={editForm.remarks} onChangeText={v => setEditForm(f => ({ ...f, remarks: v }))} placeholder="Remarks" />
            </ScrollView>
            <TouchableOpacity
              style={styles.modernSaveButton}
              onPress={async () => {
                if (!editForm.name.trim() || !editForm.type || !editForm.barangay) {
                  showToast('Name, Type, and Barangay are required.', 'error');
                  return;
                }
                setEditing(true);
                const updateObj = {
                  name: editForm.name,
                  type: editForm.type,
                  barangay: editForm.barangay,
                  discount: editForm.discount ? Number(editForm.discount) : null,
                  remarks: editForm.remarks,
                };
                const { error } = await supabase.from('customers').update(updateObj).eq('customerid', editForm.customerid);
                setEditing(false);
                if (!error) {
                  showToast('Customer updated successfully!', 'success');
                  setEditModalVisible(false);
                  setModalVisible(false);
                  fetchCustomers();
                } else {
                  showToast(error.message || 'Failed to update customer.', 'error');
                }
              }}
              disabled={editing}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.modernSaveButtonGradient}>
                {editing ? (
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
      {/* Disconnect Confirmation Modal */}
      <Modal
        visible={confirmDisconnectVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmDisconnectVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.customerModalCard, { alignItems: 'center', paddingVertical: 32 }]}> 
            <Feather name="alert-triangle" size={38} color="#e53935" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#e53935', marginBottom: 8 }}>Disconnect Customer?</Text>
            <Text style={{ color: '#263238', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
              Are you sure you want to disconnect {pendingDisconnectCustomer?.name}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                onPress={async () => {
                  setEditing(true);
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const userName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '';
                  const disconnectionLog = `Disconnected on ${todayStr} by ${userName}`;
                  const prevRemarks = pendingDisconnectCustomer.remarks ? pendingDisconnectCustomer.remarks + ' | ' : '';
                  const newRemarks = prevRemarks + disconnectionLog;
                  const { error } = await supabase.from('customers').update({ status: 'Disconnected', disconnection_date: todayStr, remarks: newRemarks }).eq('customerid', pendingDisconnectCustomer.customerid);
                  setEditing(false);
                  setConfirmDisconnectVisible(false);
                  setPendingDisconnectCustomer(null);
                  if (!error) {
                    showToast('Customer disconnected.', 'success');
                    setModalVisible(false);
                    fetchCustomers();
                  } else {
                    showToast(error.message || 'Failed to disconnect.', 'error');
                  }
                }}
                style={styles.actionBtn}
                activeOpacity={0.85}
                disabled={editing}
              >
                <LinearGradient colors={["#e53935", "#e57373"]} style={styles.actionBtnGradient}>
                  <MaterialIcons name="block" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.actionBtnText}>Disconnect</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setConfirmDisconnectVisible(false); setPendingDisconnectCustomer(null); }}
                style={styles.actionBtn}
                activeOpacity={0.85}
              >
                <LinearGradient colors={["#b0bec5", "#90a4ae"]} style={styles.actionBtnGradient}>
                  <MaterialIcons name="close" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Remarks Modal */}
      <Modal
        visible={remarksModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRemarksModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.customerModalCard, { alignItems: 'center', paddingVertical: 32, maxWidth: 500 }]}> 
            <TouchableOpacity onPress={() => setRemarksModalVisible(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={28} color="#1976d2" />
            </TouchableOpacity>
            <MaterialIcons name="notes" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
            <Text style={styles.customerModalTitle}>Remarks</Text>
            <ScrollView style={{ maxHeight: 300, marginTop: 12, width: '100%' }}>
              {selectedCustomer?.remarks
                ? selectedCustomer.remarks.split('|').map((remark, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ color: '#1976d2', fontSize: 18, marginRight: 8, marginTop: 1 }}>•</Text>
                      <Text style={{ color: '#263238', fontSize: 16, textAlign: 'left', lineHeight: 22, flex: 1 }}>{remark.trim()}</Text>
                    </View>
                  ))
                : <Text style={{ color: '#90a4ae', fontSize: 16 }}>No remarks.</Text>
              }
            </ScrollView>
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
  barangayPickerWrapper: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e3f2fd', overflow: 'hidden' },
  modernCustomerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 22, marginBottom: 16, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, position: 'relative' },
  modernCustomerName: { fontSize: 19, fontWeight: '800', color: '#1976d2', marginBottom: 2 },
  modernCustomerSub: { fontSize: 15, color: '#546e7a', marginBottom: 2 },
  modernCustomerRemarks: { fontSize: 14, color: '#e53935', fontStyle: 'italic', marginTop: 2 },
  editBtn: { backgroundColor: '#e3f2fd', borderRadius: 12, padding: 10, marginLeft: 10, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 },
  deleteBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginLeft: 8, shadowColor: '#e53935', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 },
  fab: { position: 'absolute', bottom: 32, right: 24, zIndex: 20, borderRadius: 32, overflow: 'hidden', elevation: 8 },
  fabGradient: { padding: 18, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  contentContainer: { flex: 1, padding: 18, paddingBottom: 32, backgroundColor: '#f5f7fa' },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: 2, paddingHorizontal: 2, alignItems: 'center' },
  filterPillFlex: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, borderWidth: 1, borderColor: '#e3f2fd', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, minWidth: 0 },
  filterIcon: { marginRight: 6 },
  pickerWrapper: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 2, borderWidth: 1, borderColor: '#e3f2fd', overflow: 'hidden', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, minHeight: 48, justifyContent: 'center', marginBottom: 8 },
  picker: { width: '100%', minHeight: 48, color: '#1976d2', backgroundColor: 'transparent', fontSize: 17, paddingHorizontal: 10 },
  pickerItem: { fontSize: 17, color: '#1976d2' },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1976d2', marginBottom: 10, marginTop: 8, letterSpacing: 0.2 },
  statusPill: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  statusActive: { backgroundColor: '#43a047' },
  statusDisconnected: { backgroundColor: '#e53935' },
  statusOther: { backgroundColor: '#b0bec5' },
  statusPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modernCustomerMeta: { fontSize: 13, color: '#607d8b', marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  customerModalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '92%', maxWidth: 420, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 12, position: 'relative', alignSelf: 'center' },
  customerModalTitle: { fontSize: 22, fontWeight: '800', color: '#1976d2', marginBottom: 2, textAlign: 'center' },
  customerModalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerModalValue: { fontSize: 16, color: '#263238', fontWeight: '600' },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, borderRadius: 20 },
  modernInput: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 12, padding: 14, fontSize: 17, marginBottom: 8, backgroundColor: '#fff', color: '#263238', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  modernSaveButton: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  modernSaveButtonGradient: { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  modernSaveButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  actionBtnRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 16 },
  actionBtn: { flex: 1, borderRadius: 24, overflow: 'hidden', marginHorizontal: 4, elevation: 3, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6 },
  actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 24 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.2 },
  viewRemarksBtn: { backgroundColor: '#e3f2fd', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 8, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  viewRemarksBtnText: { color: '#1976d2', fontWeight: '700', fontSize: 15 },
  countText: { fontSize: 15, color: '#607d8b', fontWeight: '600', marginLeft: 8 },
});

export default CustomersScreen; 