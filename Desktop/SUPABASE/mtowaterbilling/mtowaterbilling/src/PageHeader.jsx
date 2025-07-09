import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

const PageHeader = ({ title, subtitle, actions }) => (
  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <Stack spacing={0.5}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.5px' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
          {subtitle}
        </Typography>
      )}
    </Stack>
    {actions && <Box sx={{ mt: { xs: 2, sm: 0 } }}>{actions}</Box>}
  </Box>
);

export default PageHeader; 