import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Stack, Avatar, CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, AccountBalanceWallet as WalletIcon, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from './supabaseClient';
import PageHeader from './PageHeader';

const CreditManagement = () => {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (search.trim() === '') {
      setLoading(true);
      const fetchWithCredit = async () => {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .gt('credit_balance', 0);
        setCustomers(error ? [] : data || []);
        setLoading(false);
      };
      fetchWithCredit();
      return;
    }
    setLoading(true);
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${search}%`);
      setCustomers(error ? [] : data || []);
      setLoading(false);
    };
    const delayDebounce = setTimeout(fetchCustomers, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleAddCreditClick = (customer) => {
    setSelectedCustomer(customer);
    setCreditAmount('');
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEditCreditClick = (customer) => {
    setSelectedCustomer(customer);
    setCreditAmount(customer.credit_balance ? String(customer.credit_balance) : '');
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setCreditAmount('');
    setEditMode(false);
  };

  const handleAddCredit = async () => {
    if (!creditAmount || isNaN(Number(creditAmount))) {
      setSnackbar({ open: true, message: 'Enter a valid amount', severity: 'error' });
      return;
    }
    let newCredit;
    if (editMode) {
      newCredit = Number(creditAmount);
    } else {
      newCredit = Number(selectedCustomer.credit_balance || 0) + Number(creditAmount);
    }
    const { error } = await supabase
      .from('customers')
      .update({ credit_balance: newCredit })
      .eq('customerid', selectedCustomer.customerid);
    if (!error) {
      setSnackbar({ open: true, message: editMode ? 'Credit updated successfully' : 'Credit added successfully', severity: 'success' });
      setCustomers(customers.map(c => c.customerid === selectedCustomer.customerid ? { ...c, credit_balance: newCredit } : c));
      handleDialogClose();
    } else {
      setSnackbar({ open: true, message: editMode ? 'Failed to update credit' : 'Failed to add credit', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: '#f4f6fa', minHeight: '100vh' }}>
      <PageHeader title="Credit Management" subtitle="Manually add credits to customer accounts" />
      <Box sx={{ maxWidth: 400, mb: 3 }}>
        <TextField
          label="Search customer name"
          variant="outlined"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          sx={{ width: '100%' }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)', maxWidth: '100%' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ background: '#f1f5f9' }}>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Barangay</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Current Credit</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center"><CircularProgress size={32} sx={{ my: 3 }} /></TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                    <WalletIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      No customers found
                    </Typography>
                    <Typography variant="body2">Try searching for a customer name.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c, i) => (
                <TableRow key={c.customerid} hover sx={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#e0f2fe', transition: 'background 0.2s', '&:hover': { backgroundColor: '#bae6fd' } }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 14 }}>
                        {c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                      </Avatar>
                      {c.name}
                    </Stack>
                  </TableCell>
                  <TableCell>{c.barangay}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.credit_balance ? `₱${Number(c.credit_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleAddCreditClick(c)} sx={{ mr: 1 }}>
                      Add Credit
                    </Button>
                    {Number(c.credit_balance) > 0 && (
                      <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditCreditClick(c)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editMode ? 'Edit Credit' : `Add Credit to ${selectedCustomer?.name}`}</DialogTitle>
        <DialogContent>
          <TextField
            label="Credit Amount"
            type="number"
            value={creditAmount}
            onChange={e => setCreditAmount(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddCredit} variant="contained">{editMode ? 'Update Credit' : 'Add Credit'}</Button>
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

export default CreditManagement; 