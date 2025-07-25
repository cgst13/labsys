import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Modal, ScrollView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { Picker } from '@react-native-picker/picker';
import { useToast } from './GlobalToast';
import { BlurView } from 'expo-blur';
import { useUser } from './UserContext';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const SUPABASE_URL = 'https://rzyrhnupwzppwiudfuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODA5NjksImV4cCI6MjA2NzQ1Njk2OX0.aq0cp84sxMjLPvr_8E4btcQLjhT9zZSUEPgr0bqHMUs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const UsersScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [roleOptions, setRoleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  // Animation for FAB tooltip
  const [fabTooltipVisible, setFabTooltipVisible] = useState(false);
  const fabTooltipOpacity = useRef(new Animated.Value(0)).current;
  const { user } = useUser();
  const [confirmStatusModal, setConfirmStatusModal] = useState({ visible: false, user: null, newStatus: null });
  const [statusLoading, setStatusLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    department: '',
    position: '',
    role: '',
    // status removed from form
  });
  const [adding, setAdding] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editing, setEditing] = useState(false);

  // Fetch departments for picker
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('department');
      if (data) setDepartmentOptions(data.map(d => d.department));
    };
    fetchDepartments();
  }, []);

  const showFabTooltip = () => {
    setFabTooltipVisible(true);
    Animated.timing(fabTooltipOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  const hideFabTooltip = () => {
    Animated.timing(fabTooltipOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setFabTooltipVisible(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, departmentFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('users').select('*', { count: 'exact' }).order('lastname', { ascending: true });
    if (search && search.trim() !== '') {
      query = query.or(`firstname.ilike.%${search.trim()}%,lastname.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }
    if (roleFilter !== 'All') {
      query = query.eq('role', roleFilter);
    }
    if (departmentFilter !== 'All') {
      query = query.eq('department', departmentFilter);
    }
    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    const { data, count } = await query.limit(1000);
    setUsers(data || []);
    setTotalCount(count || 0);
    // Get unique roles/departments for filters
    setRoleOptions(['All', ...Array.from(new Set((data || []).map(u => u.role).filter(Boolean)))].sort());
    setDepartmentOptions(['All', ...Array.from(new Set((data || []).map(u => u.department).filter(Boolean)))].sort());
    setLoading(false);
  };

  const filteredUsers = users; // All filtering is server-side

  const handleStatusToggle = (userObj) => {
    setConfirmStatusModal({
      visible: true,
      user: userObj,
      newStatus: userObj.status === 'Active' ? 'Inactive' : 'Active',
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmStatusModal.user) return;
    setStatusLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ status: confirmStatusModal.newStatus })
      .eq('userid', confirmStatusModal.user.userid);
    setStatusLoading(false);
    setConfirmStatusModal({ visible: false, user: null, newStatus: null });
    if (error) {
      showToast(error.message || 'Failed to update status.', 'error');
    } else {
      showToast(`User status updated to ${confirmStatusModal.newStatus}.`, 'success');
      setModalVisible(false);
      fetchUsers();
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header with subtle shadow */}
      <LinearGradient colors={["#0d47a1", "#1565c0"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <MaterialIcons name="manage-accounts" size={28} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.headerTitle}>Users</Text>
          </View>
        </View>
      </LinearGradient>
      {/* Card for search and filters */}
      <View style={styles.searchFilterCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBoxContainer}>
            <Feather name="search" size={20} color="#90a4ae" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBoxInput}
              placeholder="Search by name or email..."
              placeholderTextColor="#90a4ae"
              value={search}
              onChangeText={setSearch}
              underlineColorAndroid="transparent"
              returnKeyType="search"
            />
          </View>
        </View>
        <View style={styles.filterRow}>
          <View style={styles.filterPillFlex}>
            <MaterialIcons name="category" size={18} color="#1976d2" style={styles.filterIcon} />
            <Picker
              selectedValue={roleFilter}
              onValueChange={setRoleFilter}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {roleOptions.map(r => (
                <Picker.Item key={r} label={r} value={r} />
              ))}
            </Picker>
          </View>
          <View style={styles.filterPillFlex}>
            <MaterialIcons name="apartment" size={18} color="#1976d2" style={styles.filterIcon} />
            <Picker
              selectedValue={departmentFilter}
              onValueChange={setDepartmentFilter}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {departmentOptions.map(d => (
                <Picker.Item key={d} label={d} value={d} />
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
              <Picker.Item label="Inactive" value="Inactive" />
            </Picker>
          </View>
        </View>
      </View>
      {/* User List Section */}
      <View style={styles.listSectionHeaderRow}>
        <Text style={styles.sectionHeader}>User List</Text>
        <Text style={styles.countText}>Showing {filteredUsers.length} of {totalCount} user{totalCount === 1 ? '' : 's'}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
      ) : filteredUsers.length === 0 ? (
        <Text style={{ color: '#90a4ae', textAlign: 'center', marginVertical: 12 }}>No users found.</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => String(item.userid)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modernUserCard}
              activeOpacity={0.85}
              onPress={() => { setSelectedUser(item); setModalVisible(true); }}
            >
              <View style={styles.avatarCircle}>
                <MaterialIcons name="person" size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modernUserName}>{item.firstname} {item.lastname}</Text>
                <Text style={styles.modernUserSub}>{item.email}</Text>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, styles.roleChip]}><Text style={styles.chipText}>{item.role || 'N/A'}</Text></View>
                  <View style={[styles.chip, styles.deptChip]}><Text style={styles.chipText}>{item.department || 'N/A'}</Text></View>
                  <View style={[styles.chip, item.status === 'Active' ? styles.activeChip : styles.inactiveChip]}><Text style={styles.chipText}>{item.status || 'N/A'}</Text></View>
                </View>
                <Text style={styles.lastLoginText}>Last Login: {item.lastlogin ? new Date(item.lastlogin).toLocaleString() : 'Never'}</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={20} color="#1976d2" />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 8 }}
        />
      )}
      {/* Floating Action Button for Add User */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
          onLongPress={showFabTooltip}
          onPressOut={hideFabTooltip}
        >
          <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.fabGradient}>
            <MaterialIcons name="person-add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        {fabTooltipVisible && (
          <Animated.View style={[styles.fabTooltip, { opacity: fabTooltipOpacity }]}> 
            <Text style={styles.fabTooltipText}>Add User</Text>
          </Animated.View>
        )}
      </View>
      {/* User Details Modal */}
      <Modal
        visible={modalVisible && !!selectedUser}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Blur background when modal is visible */}
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          <Animated.View style={styles.userModalCard}>
            {/* Enhanced Gradient Header with large avatar and floating close button */}
            <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.userModalHeader}>
              <View style={styles.userModalAvatarWrapper}>
                <View style={styles.userModalAvatarCircle}>
                  <MaterialIcons name="person" size={54} color="#fff" />
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.userModalCloseBtn}>
                <Feather name="x" size={28} color="#1976d2" />
              </TouchableOpacity>
            </LinearGradient>
            {/* User Info Card Section */}
            <View style={styles.userModalInfoCard}>
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="badge" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Name</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.firstname} {selectedUser?.lastname}</Text>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="email" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Email</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.email}</Text>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="apartment" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Department</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.department || 'N/A'}</Text>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="work" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Position</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.position || 'N/A'}</Text>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="verified-user" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Role</Text>
                <View style={[styles.chip, styles.roleChip, { marginLeft: 8 }]}><Text style={styles.chipText}>{selectedUser?.role || 'N/A'}</Text></View>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="toggle-on" size={22} color={selectedUser?.status === 'Active' ? '#4CAF50' : '#F44336'} style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Status</Text>
                <View style={[styles.chip, selectedUser?.status === 'Active' ? styles.activeChip : styles.inactiveChip, { marginLeft: 8 }]}><Text style={styles.chipText}>{selectedUser?.status || 'N/A'}</Text></View>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="event" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Date Created</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.datecreated ? new Date(selectedUser.datecreated).toLocaleString() : 'N/A'}</Text>
              </View>
              <View style={styles.userModalDivider} />
              <View style={styles.userModalInfoRow}>
                <MaterialIcons name="history" size={22} color="#1976d2" style={styles.userModalInfoIcon} />
                <Text style={styles.userModalInfoLabel}>Last Login</Text>
                <Text style={styles.userModalInfoValue}>{selectedUser?.lastlogin ? new Date(selectedUser.lastlogin).toLocaleString() : 'Never'}</Text>
              </View>
            </View>
            {/* Action Buttons */}
            <View style={styles.userModalActionsRowEnhanced}>
              <TouchableOpacity style={styles.userModalActionBtnEnhanced} activeOpacity={0.85} onPress={() => {
                setEditForm({
                  userid: selectedUser?.userid,
                  firstname: selectedUser?.firstname || '',
                  lastname: selectedUser?.lastname || '',
                  email: selectedUser?.email || '',
                  department: selectedUser?.department || '',
                  position: selectedUser?.position || '',
                  role: selectedUser?.role || '',
                });
                setEditModalVisible(true);
              }}>
                <Feather name="edit" size={20} color="#fff" />
                <Text style={styles.userModalActionTextEnhanced}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.userModalActionBtnEnhanced, (selectedUser && (selectedUser.status || '').trim().toLowerCase() === 'active') ? styles.deactivateBtn : styles.activateBtn]} activeOpacity={0.85} onPress={() => handleStatusToggle(selectedUser)}>
                <MaterialIcons name={(selectedUser && (selectedUser.status || '').trim().toLowerCase() === 'active') ? 'toggle-off' : 'toggle-on'} size={22} color="#fff" />
                <Text style={styles.userModalActionTextEnhanced}>{(selectedUser && (selectedUser.status || '').trim().toLowerCase() === 'active') ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      {/* Status Change Confirmation Modal */}
      <Modal
        visible={confirmStatusModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmStatusModal({ visible: false, user: null, newStatus: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.userModalCard, { alignItems: 'center', paddingVertical: 32 }]}> 
            <Feather name="alert-triangle" size={38} color={confirmStatusModal.newStatus === 'Inactive' ? '#e53935' : '#43a047'} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: confirmStatusModal.newStatus === 'Inactive' ? '#e53935' : '#43a047', marginBottom: 8 }}>
              {confirmStatusModal.newStatus === 'Inactive' ? 'Deactivate User?' : 'Activate User?'}
            </Text>
            <Text style={{ color: '#263238', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
              Are you sure you want to {confirmStatusModal.newStatus === 'Inactive' ? 'deactivate' : 'activate'} {confirmStatusModal.user?.firstname} {confirmStatusModal.user?.lastname}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                onPress={confirmStatusChange}
                style={[styles.userModalActionBtnEnhanced, confirmStatusModal.newStatus === 'Inactive' ? styles.deactivateBtn : styles.activateBtn]}
                activeOpacity={0.85}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name={confirmStatusModal.newStatus === 'Inactive' ? 'toggle-off' : 'toggle-on'} size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.userModalActionTextEnhanced}>{confirmStatusModal.newStatus === 'Inactive' ? 'Deactivate' : 'Activate'}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmStatusModal({ visible: false, user: null, newStatus: null })}
                style={[styles.userModalActionBtnEnhanced, { backgroundColor: '#b0bec5' }]}
                activeOpacity={0.85}
              >
                <MaterialIcons name="close" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.userModalActionTextEnhanced}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Add User Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.userModalCard, { paddingVertical: 0, paddingBottom: 24, overflow: 'visible' }]}> 
            {/* Professional, elegant header */}
            <View style={styles.elegantModalHeader}>
              <Text style={styles.elegantModalTitle}>Add User</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.elegantModalCloseBtn}>
                <Feather name="x" size={26} color="#1976d2" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, paddingHorizontal: 2 }} contentContainerStyle={{ padding: 18 }}>
              {/* Name & Email Section */}
              <Text style={styles.addUserSectionHeader}>Personal Info</Text>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="badge" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={addForm.firstname} onChangeText={v => setAddForm(f => ({ ...f, firstname: v }))} placeholder="First Name*" placeholderTextColor="#90a4ae" />
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="badge" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={addForm.lastname} onChangeText={v => setAddForm(f => ({ ...f, lastname: v }))} placeholder="Last Name*" placeholderTextColor="#90a4ae" />
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="email" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={addForm.email} onChangeText={v => setAddForm(f => ({ ...f, email: v }))} placeholder="Email*" placeholderTextColor="#90a4ae" autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View style={styles.addUserDivider} />
              {/* Work Section */}
              <Text style={styles.addUserSectionHeader}>Work Info</Text>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="apartment" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <Picker
                  selectedValue={addForm.department}
                  onValueChange={v => setAddForm(f => ({ ...f, department: v }))}
                  style={styles.addUserPicker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#1976d2"
                >
                  <Picker.Item label="Select department..." value="" />
                  {departmentOptions.map(dep => (
                    <Picker.Item key={dep} label={dep} value={dep} />
                  ))}
                </Picker>
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="verified-user" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <Picker
                  selectedValue={addForm.role}
                  onValueChange={v => setAddForm(f => ({ ...f, role: v }))}
                  style={styles.addUserPicker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#1976d2"
                >
                  <Picker.Item label="Select role..." value="" />
                  <Picker.Item label="Admin" value="Admin" />
                  <Picker.Item label="Reader" value="Reader" />
                  <Picker.Item label="Collector" value="Collector" />
                  <Picker.Item label="Monitor" value="Monitor" />
                </Picker>
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="work" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={addForm.position} onChangeText={v => setAddForm(f => ({ ...f, position: v }))} placeholder="Position" placeholderTextColor="#90a4ae" />
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.addUserSaveBtn}
              onPress={async () => {
                if (!addForm.firstname.trim() || !addForm.lastname.trim() || !addForm.email.trim()) {
                  showToast('First name, last name, and email are required.', 'error');
                  return;
                }
                setAdding(true);
                // Generate a UUID for userid
                let userid;
                try {
                  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userid = crypto.randomUUID();
                  } else {
                    userid = uuidv4();
                  }
                } catch (e) {
                  showToast('Failed to generate user ID.', 'error');
                  setAdding(false);
                  return;
                }
                try {
                  // Insert into users table
                  const { error } = await supabase.from('users').insert([
                    {
                      userid,
                      firstname: addForm.firstname.trim(),
                      lastname: addForm.lastname.trim(),
                      email: addForm.email.trim(),
                      password: 'admin',
                      department: addForm.department,
                      position: addForm.position,
                      role: addForm.role,
                      status: 'Active',
                      datecreated: new Date().toISOString(),
                      lastlogin: null,
                    },
                  ]);
                  setAdding(false);
                  if (!error) {
                    setAddModalVisible(false);
                    setAddForm({ firstname: '', lastname: '', email: '', department: '', position: '', role: '' });
                    fetchUsers();
                    showToast('User added successfully!', 'success');
                  } else {
                    showToast(error.message || 'Failed to add user.', 'error');
                  }
                } catch (e) {
                  setAdding(false);
                  showToast('Unexpected error occurred while saving user.', 'error');
                }
              }}
              disabled={adding}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.addUserSaveBtnGradient}>
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addUserSaveBtnText}>Save</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit User Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.userModalCard, { paddingVertical: 0, paddingBottom: 24, overflow: 'visible' }]}> 
            {/* Professional, elegant header */}
            <View style={styles.elegantModalHeader}>
              <Text style={styles.elegantModalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.elegantModalCloseBtn}>
                <Feather name="x" size={26} color="#1976d2" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, paddingHorizontal: 2 }} contentContainerStyle={{ padding: 18 }}>
              {/* Name & Email Section */}
              <Text style={styles.addUserSectionHeader}>Personal Info</Text>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="badge" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={editForm.firstname} onChangeText={v => setEditForm(f => ({ ...f, firstname: v }))} placeholder="First Name*" placeholderTextColor="#90a4ae" />
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="badge" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={editForm.lastname} onChangeText={v => setEditForm(f => ({ ...f, lastname: v }))} placeholder="Last Name*" placeholderTextColor="#90a4ae" />
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="email" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={editForm.email} onChangeText={v => setEditForm(f => ({ ...f, email: v }))} placeholder="Email*" placeholderTextColor="#90a4ae" autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View style={styles.addUserDivider} />
              {/* Work Section */}
              <Text style={styles.addUserSectionHeader}>Work Info</Text>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="apartment" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <Picker
                  selectedValue={editForm.department}
                  onValueChange={v => setEditForm(f => ({ ...f, department: v }))}
                  style={styles.addUserPicker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#1976d2"
                >
                  <Picker.Item label="Select department..." value="" />
                  {departmentOptions.map(dep => (
                    <Picker.Item key={dep} label={dep} value={dep} />
                  ))}
                </Picker>
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="verified-user" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <Picker
                  selectedValue={editForm.role}
                  onValueChange={v => setEditForm(f => ({ ...f, role: v }))}
                  style={styles.addUserPicker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#1976d2"
                >
                  <Picker.Item label="Select role..." value="" />
                  <Picker.Item label="Admin" value="Admin" />
                  <Picker.Item label="Reader" value="Reader" />
                  <Picker.Item label="Collector" value="Collector" />
                  <Picker.Item label="Monitor" value="Monitor" />
                </Picker>
              </View>
              <View style={styles.addUserInputPill}>
                <MaterialIcons name="work" size={20} color="#1976d2" style={styles.addUserInputIcon} />
                <TextInput style={styles.addUserInput} value={editForm.position} onChangeText={v => setEditForm(f => ({ ...f, position: v }))} placeholder="Position" placeholderTextColor="#90a4ae" />
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.addUserSaveBtn}
              onPress={async () => {
                if (!editForm.firstname.trim() || !editForm.lastname.trim() || !editForm.email.trim()) {
                  showToast('First name, last name, and email are required.', 'error');
                  return;
                }
                setEditing(true);
                const updateObj = {
                  firstname: editForm.firstname.trim(),
                  lastname: editForm.lastname.trim(),
                  email: editForm.email.trim(),
                  department: editForm.department,
                  position: editForm.position,
                  role: editForm.role,
                };
                const { error } = await supabase.from('users').update(updateObj).eq('userid', editForm.userid);
                setEditing(false);
                if (!error) {
                  setEditModalVisible(false);
                  setModalVisible(false);
                  fetchUsers();
                  showToast('User updated successfully!', 'success');
                } else {
                  showToast(error.message || 'Failed to update user.', 'error');
                }
              }}
              disabled={editing}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#1976d2", "#42a5f5"]} style={styles.addUserSaveBtnGradient}>
                {editing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addUserSaveBtnText}>Save</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingTop: Platform.OS === 'android' ? 36 : 56, paddingBottom: 18, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 8, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  headerContent: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', position: 'absolute', left: 0, zIndex: 2 },
  searchFilterCard: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 14, marginTop: -32, marginBottom: 10, padding: 18, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, flex: 1, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, borderWidth: 0 },
  searchIcon: { marginRight: 8 },
  searchBoxInput: { flex: 1, fontSize: 17, color: '#263238', backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 8, paddingHorizontal: 0 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 2, marginTop: 2, alignItems: 'center' },
  filterPillFlex: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, borderWidth: 1, borderColor: '#e3f2fd', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1, minWidth: 0 },
  filterIcon: { marginRight: 6 },
  picker: { width: '100%', minHeight: 44, color: '#1976d2', backgroundColor: 'transparent', fontSize: 16, paddingHorizontal: 10 },
  pickerItem: { fontSize: 16, color: '#1976d2' },
  listSectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, marginHorizontal: 18, marginTop: 2 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1976d2', marginBottom: 10, marginTop: 8, letterSpacing: 0.2 },
  countText: { fontSize: 15, color: '#607d8b', fontWeight: '600', marginLeft: 8 },
  modernUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, position: 'relative' },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modernUserName: { fontSize: 18, fontWeight: '800', color: '#1976d2', marginBottom: 2 },
  modernUserSub: { fontSize: 14, color: '#546e7a', marginBottom: 2 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 2 },
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6, backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, color: '#1976d2', fontWeight: '700' },
  roleChip: { backgroundColor: '#e3f2fd' },
  deptChip: { backgroundColor: '#ede7f6' },
  activeChip: { backgroundColor: '#c8e6c9' },
  inactiveChip: { backgroundColor: '#ffcdd2' },
  lastLoginText: { fontSize: 12, color: '#90a4ae', marginTop: 2 },
  fabContainer: { position: 'absolute', bottom: 32, right: 24, zIndex: 20, alignItems: 'center' },
  fab: { borderRadius: 32, overflow: 'hidden', elevation: 8 },
  fabGradient: { padding: 20, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  fabTooltip: { position: 'absolute', bottom: 70, right: 0, backgroundColor: '#263238', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  fabTooltipText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  userModalCard: { backgroundColor: '#fff', borderRadius: 32, paddingBottom: 24, width: '94%', maxWidth: 440, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16, position: 'relative', alignSelf: 'center', overflow: 'hidden' },
  userModalHeader: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 36, paddingBottom: 24, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'column' },
  userModalAvatarWrapper: { position: 'absolute', top: -36, alignSelf: 'center', zIndex: 10 },
  userModalAvatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
  userModalCloseBtn: { position: 'absolute', top: 18, right: 18, zIndex: 20, backgroundColor: '#fff', borderRadius: 20, padding: 6, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 },
  userModalInfoCard: { backgroundColor: '#fff', borderRadius: 24, marginTop: 60, marginHorizontal: 18, padding: 18, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  userModalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userModalInfoIcon: { marginRight: 10 },
  userModalInfoLabel: { fontSize: 15, color: '#1976d2', fontWeight: '700', width: 90 },
  userModalInfoValue: { fontSize: 15, color: '#263238', fontWeight: '600', flex: 1, textAlign: 'right' },
  userModalDivider: { height: 1, backgroundColor: '#e3f2fd', marginVertical: 4, borderRadius: 1 },
  userModalActionsRowEnhanced: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginHorizontal: 18 },
  userModalActionBtnEnhanced: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1976d2', borderRadius: 32, paddingVertical: 14, marginHorizontal: 8, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2 },
  userModalActionTextEnhanced: { fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 10 },
  deactivateBtn: { backgroundColor: '#F44336' },
  activateBtn: { backgroundColor: '#4CAF50' },
  inputLabel: { fontSize: 16, color: '#263238', marginBottom: 8, marginTop: 16 },
  userModalTitle: { fontSize: 24, fontWeight: '800', color: '#1976d2', marginTop: 10 },
  // Add User Modal Styles
  addUserModalHeader: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 36, paddingBottom: 18, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'row' },
  addUserModalIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 3, borderColor: '#fff', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  addUserModalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center', marginLeft: -16 },
  addUserSectionHeader: { fontSize: 15, color: '#1976d2', fontWeight: '700', marginTop: 10, marginBottom: 6, letterSpacing: 0.2 },
  addUserDivider: { height: 1, backgroundColor: '#e3f2fd', marginVertical: 10, borderRadius: 1 },
  addUserInputRow: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  addUserInputPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e3f2fd', shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, minWidth: 0 },
  addUserInputIcon: { marginRight: 8 },
  addUserInput: { flex: 1, fontSize: 16, color: '#263238', backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 6, paddingHorizontal: 0 },
  addUserPicker: { flex: 1, minHeight: 44, color: '#1976d2', backgroundColor: 'transparent', fontSize: 16, paddingHorizontal: 10 },
  addUserSaveBtn: { marginTop: 10, borderRadius: 32, overflow: 'hidden', elevation: 4 },
  addUserSaveBtnGradient: { padding: 16, borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  addUserSaveBtnText: { fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 8 },
  elegantModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 28, paddingBottom: 18, paddingHorizontal: 18, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#f7fafd', borderBottomWidth: 1, borderBottomColor: '#e3f2fd', position: 'relative' },
  elegantModalTitle: { flex: 1, textAlign: 'center', fontSize: 21, fontWeight: '800', color: '#1976d2', letterSpacing: 0.2 },
  elegantModalCloseBtn: { position: 'absolute', right: 18, top: 24, zIndex: 10, padding: 4, borderRadius: 20, backgroundColor: 'rgba(25,118,210,0.06)' },
});

export default UsersScreen; 