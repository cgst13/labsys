import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const RPTCalculator = () => (
  <Box sx={{ p: { xs: 1, md: 3 }, background: '#f4f6fa', minHeight: '100vh' }}>
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(30,58,138,0.04)' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        RPT Calculator
      </Typography>
      <Box sx={{ width: '100%', height: { xs: 400, md: 700 }, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
        <iframe
          title="RPT Calculator"
          src="https://script.google.com/macros/s/AKfycbzdhU6lDW5kd9w28hE3inteCV1zdz_VLUOOD_RAWwUlyIyNCTsoMfklGIbOKsf5TX96qg/exec"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
        />
      </Box>
    </Paper>
  </Box>
);

export default RPTCalculator; 