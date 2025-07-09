import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box, Avatar, Stack } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const ProfileDialog = ({ open, onClose, user }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Profile & Settings</DialogTitle>
    <DialogContent>
      <Stack direction="column" alignItems="center" spacing={2} sx={{ mt: 2, mb: 2 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 32 }}>
          <AccountCircle fontSize="inherit" />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
        <Typography variant="body2" color="text.secondary">Role: {user.role}</Typography>
        {user.department && <Typography variant="body2" color="text.secondary">Department: {user.department}</Typography>}
        {user.position && <Typography variant="body2" color="text.secondary">Position: {user.position}</Typography>}
        {user.status && <Typography variant="body2" color="text.secondary">Status: {user.status}</Typography>}
        {user.datecreated && <Typography variant="body2" color="text.secondary">Date Created: {new Date(user.datecreated).toLocaleString()}</Typography>}
        {user.lastlogin && <Typography variant="body2" color="text.secondary">Last Login: {new Date(user.lastlogin).toLocaleString()}</Typography>}
      </Stack>
      {/* Future: Add password change, preferences, etc. */}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained" color="primary">Close</Button>
    </DialogActions>
  </Dialog>
);

export default ProfileDialog; 