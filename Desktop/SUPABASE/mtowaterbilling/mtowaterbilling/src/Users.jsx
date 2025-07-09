import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, TextField, Select, MenuItem, Stack, IconButton, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { supabase } from './supabaseClient';
import PageHeader from './PageHeader';

const roleOptions = ['Admin', 'Collector', 'Reader'];
const statusOptions = ['active', 'inactive', 'pending'];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    userid: '',
    email: '',
    firstname: '',
    lastname: '',
    password: '', // not used in form, but kept for insert
    department: '',
    position: '',
    role: 'Collector',
    status: 'active',
    datecreated: '',
    lastlogin: ''
  });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('datecreated', { ascending: false });
      setUsers(error ? [] : data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('*');
      console.log('Departments fetched:', data, error); // DEBUG LOG
      if (!error && data) {
        setDepartmentOptions(data.map(d => d.name || d.department || d.dept_name || d.title));
      } else {
        setDepartmentOptions([]);
      }
    };
    fetchDepartments();
  }, []);

  const handleDialogOpen = (user = null) => {
    if (user) {
      setEditMode(true);
      setSelectedUser(user);
      setForm({
        userid: user.userid,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        password: '',
        department: user.department || '',
        position: user.position || '',
        role: user.role || 'Collector',
        status: user.status || 'active',
        datecreated: user.datecreated || '',
        lastlogin: user.lastlogin || ''
      });
    } else {
      setEditMode(false);
      setSelectedUser(null);
      setForm({
        userid: '',
        email: '',
        firstname: '',
        lastname: '',
        password: '',
        department: '',
        position: '',
        role: 'Collector',
        status: 'active',
        datecreated: '',
        lastlogin: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setForm({
      userid: '',
      email: '',
      firstname: '',
      lastname: '',
      password: '',
      department: '',
      position: '',
      role: 'Collector',
      status: 'active',
      datecreated: '',
      lastlogin: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async () => {
    if (!form.email || !form.firstname || !form.lastname || !form.role || !form.status) {
      setSnackbar({ open: true, message: 'Fill in all required fields', severity: 'error' });
      return;
    }
    if (editMode) {
      const { error } = await supabase
        .from('users')
        .update({
          firstname: form.firstname,
          lastname: form.lastname,
          department: form.department,
          position: form.position,
          role: form.role,
          status: form.status
        })
        .eq('userid', form.userid);
      if (!error) {
        setSnackbar({ open: true, message: 'User updated', severity: 'success' });
        setUsers(users.map(u => u.userid === form.userid ? { ...u, ...form } : u));
        handleDialogClose();
      } else {
        setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
      }
    } else {
      // Generate uuid for new user
      const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18);
      const { error } = await supabase
        .from('users')
        .insert([{ ...form, password: 'admin', userid: uuid, datecreated: new Date().toISOString() }]);
      if (!error) {
        setSnackbar({ open: true, message: 'User added', severity: 'success' });
        setUsers([{ ...form, userid: uuid, datecreated: new Date().toISOString() }, ...users]);
        handleDialogClose();
      } else {
        setSnackbar({ open: true, message: 'Failed to add user', severity: 'error' });
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('userid', selectedUser.userid);
    if (!error) {
      setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
      setUsers(users.filter(u => u.userid !== selectedUser.userid));
      setDeleteDialogOpen(false);
    } else {
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: '#f4f6fa', minHeight: '100vh' }}>
      <PageHeader
        title="Users"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleDialogOpen()}>
            Add User
          </Button>
        }
      />
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)', maxWidth: '100%' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ background: '#f1f5f9' }}>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Position</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Date Created</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Last Login</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center"><CircularProgress size={32} sx={{ my: 3 }} /></TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                    <PersonIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      No users found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u, i) => (
                <TableRow key={u.userid} hover sx={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#e0f2fe', transition: 'background 0.2s', '&:hover': { backgroundColor: '#bae6fd' } }}>
                  <TableCell>{u.firstname} {u.lastname}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.position}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.datecreated ? new Date(u.datecreated).toLocaleString() : ''}</TableCell>
                  <TableCell>{u.lastlogin ? new Date(u.lastlogin).toLocaleString() : ''}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleDialogOpen(u)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => { setSelectedUser(u); setDeleteDialogOpen(true); }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
              fullWidth
              disabled={editMode}
            />
            <TextField
              label="First Name"
              name="firstname"
              value={form.firstname}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastname"
              value={form.lastname}
              onChange={handleFormChange}
              fullWidth
            />
            {/* Department Dropdown */}
            <Select
              label="Department"
              name="department"
              value={form.department}
              onChange={handleFormChange}
              fullWidth
              size="small"
              displayEmpty
            >
              <MenuItem value=""><em>Select Department</em></MenuItem>
              {departmentOptions.map((dept, idx) => (
                <MenuItem key={idx} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
            <TextField
              label="Position"
              name="position"
              value={form.position}
              onChange={handleFormChange}
              fullWidth
            />
            <Select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleFormChange}
              fullWidth
              size="small"
            >
              {roleOptions.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </Select>
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleFormChange}
              fullWidth
              size="small"
            >
              {statusOptions.map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </Select>
            {editMode && (
              <>
                <TextField
                  label="Date Created"
                  value={form.datecreated ? new Date(form.datecreated).toLocaleString() : ''}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Last Login"
                  value={form.lastlogin ? new Date(form.lastlogin).toLocaleString() : ''}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">{editMode ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete {selectedUser?.firstname} {selectedUser?.lastname}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users; 