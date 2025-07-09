import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress,
  TablePagination, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert, Card, CardContent, Stack, Avatar, Tooltip, Grid, Skeleton, Container
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon, Search as SearchIcon, FilterList as FilterListIcon, SentimentDissatisfied as EmptyIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from './PageHeader';

// Remove static barangayList
// const barangayList = [
//   'San Jose', 'San Juan', 'San Pedro', 'San Pablo', 'San Isidro', 'San Antonio', 'San Nicolas', 'San Rafael', 'San Roque', 'San Vicente', 'Other'
// ];

const initialForm = { name: '', type: '', barangay: '', discount: '', remarks: '' };

function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const replacer = (key, value) => value === null ? '' : value;
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','),
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterType, setFilterType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [sortOption, setSortOption] = useState('name_asc'); // Added sort option
  const [totalCount, setTotalCount] = useState(0);

  // Add this useEffect for fetching customers with correct dependencies
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('date_added', { ascending: false })
        .range(from, to);
      if (search) query = query.ilike('name', `%${search}%`);
      if (filterBarangay) query = query.eq('barangay', filterBarangay);
      if (filterType) query = query.eq('type', filterType);
      const { data, error, count } = await query;
      if (!error) {
        setCustomers(data || []);
        setTotalCount(count || 0);
      } else setError('Failed to fetch customers');
      setLoading(false);
    };
    fetchCustomers();
  }, [page, rowsPerPage, search, filterBarangay, filterType]);

  const fetchDiscountOptions = async () => {
    const { data, error } = await supabase
      .from('discount')
      .select('*');
    if (!error) setDiscountOptions(data || []);
  };

  const fetchTypeOptions = async () => {
    const { data, error } = await supabase
      .from('customer_type')
      .select('*');
    if (!error) setTypeOptions(data || []);
  };

  const fetchBarangayOptions = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('*');
    if (!error) setBarangayOptions(data || []);
  };

  useEffect(() => {
    fetchDiscountOptions();
    fetchTypeOptions();
    fetchBarangayOptions();
  }, []);

  const handleSearch = (c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterBarangay || c.barangay === filterBarangay) &&
    (!filterType || c.type === filterType);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDialogOpen = (customer = null) => {
    if (customer) {
      setForm({ ...customer });
      setEditId(customer.customerid);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpenDialog(true);
  };
  const handleDialogClose = () => setOpenDialog(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEdit = async () => {
    if (!form.name) return setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
    if (editId) {
      // Edit
      const { error } = await supabase
        .from('customers')
        .update({ ...form })
        .eq('customerid', editId);
      if (!error) setSnackbar({ open: true, message: 'Customer updated', severity: 'success' });
      else {
        console.error('Update failed:', error);
        setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
      }
    } else {
      // Add
      const { error } = await supabase
        .from('customers')
        .insert([{ ...form }]);
      if (!error) setSnackbar({ open: true, message: 'Customer added', severity: 'success' });
      else setSnackbar({ open: true, message: 'Add failed', severity: 'error' });
    }
    setOpenDialog(false);
    // fetchCustomers(); // This is now handled by the useEffect
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customerid', id);
    if (!error) setSnackbar({ open: true, message: 'Customer deleted', severity: 'success' });
    else setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    // fetchCustomers(); // This is now handled by the useEffect
  };

  const handleDeleteClick = (customerid) => {
    setCustomerToDelete(customerid);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      await handleDelete(customerToDelete);
      setCustomerToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  const handleDeleteCancel = () => {
    setCustomerToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: '#f4f6fa', minHeight: '100vh' }}>
      <PageHeader
        title="Customers"
        actions={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportToCSV(customers, 'customers.csv')}
              size="large"
            >
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleDialogOpen()} size="large">Add Customer</Button>
          </Stack>
        }
      />
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Card elevation={3} sx={{ p: 0, overflow: 'visible', boxShadow: 'none', background: 'transparent' }}>
          <CardContent sx={{ p: 0 }}>
          <Paper elevation={1} sx={{ mb: 3, p: 2, borderRadius: 2, background: '#f9fafb' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                label="Search by name"
                variant="outlined"
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
                sx={{ width: 220 }}
              />
              <FormControl sx={{ minWidth: 160 }} size="small">
                <InputLabel>Barangay</InputLabel>
                <Select
                  value={filterBarangay}
                  label="Barangay"
                  onChange={e => setFilterBarangay(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {barangayOptions.map(b => <MenuItem key={b.barangay} value={b.barangay}>{b.barangay}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }} size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={e => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {typeOptions.map(t => <MenuItem key={t.type} value={t.type}>{t.type}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 140 }} size="small">
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sortOption}
                  label="Sort"
                  onChange={e => setSortOption(e.target.value)}
                >
                  <MenuItem value="name_asc">Name A-Z</MenuItem>
                  <MenuItem value="name_desc">Name Z-A</MenuItem>
                </Select>
              </FormControl>
              <FilterListIcon sx={{ color: 'text.secondary', ml: 1 }} />
            </Stack>
          </Paper>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)', mb: 2 }}>
              <Table sx={{ minWidth: 650 }} stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }}>Barangay</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }}>Discount</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 700, background: '#f1f5f9', color: 'primary.main' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                      </TableRow>
                    ))
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                          <EmptyIcon sx={{ fontSize: 48, mb: 1 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            No customers found
                          </Typography>
                          <Typography variant="body2">Try adjusting your search or filters.</Typography>
                        </Box>
                    </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c, i) => (
                      <TableRow
                        key={c.customerid}
                        hover
                        sx={{
                          backgroundColor: i % 2 === 0 ? '#f8fafc' : '#e0f2fe',
                          transition: 'background 0.2s',
                          '&:hover': {
                            backgroundColor: '#bae6fd',
                          },
                        }}
                      >
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.type}</TableCell>
                        <TableCell>{c.barangay}</TableCell>
                        <TableCell>{c.discount}</TableCell>
                        <TableCell>{c.remarks}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                            <IconButton onClick={() => handleDialogOpen(c)} size="small" color="primary">
                              <EditIcon />
                            </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                            <IconButton onClick={() => handleDeleteClick(c.customerid)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>
      </Container>
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required />
          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select name="type" value={form.type} label="Type" onChange={handleFormChange} required>
              {typeOptions.map(t => <MenuItem key={t.type} value={t.type}>{t.type}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Barangay</InputLabel>
            <Select name="barangay" value={form.barangay} label="Barangay" onChange={handleFormChange} required>
              {barangayOptions.map(b => <MenuItem key={b.barangay} value={b.barangay}>{b.barangay}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Discount</InputLabel>
            <Select
              name="discount"
              value={form.discount}
              label="Discount"
              onChange={handleFormChange}
              required
            >
              {discountOptions.map(opt => (
                <MenuItem key={opt.type} value={opt.discountpercentage}>
                  {opt.type} ({opt.discountpercentage}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Remarks" name="remarks" value={form.remarks} onChange={handleFormChange} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddOrEdit} variant="contained">{editId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this customer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers; 