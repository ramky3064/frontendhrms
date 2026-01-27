import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        bgcolor: '#f5f5f5',
        py: 2,
        px: 3,
        // mt: 4,
        textAlign: 'center',
        borderTop: '1px solid #ccc',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} HRMS Portal. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
