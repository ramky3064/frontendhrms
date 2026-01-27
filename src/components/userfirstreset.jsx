import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const FirstUserReset = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const { state } = useLocation();
  const empId = state?.empId || sessionStorage.getItem('empId');
  const email = state?.email;

  useEffect(() => {
    console.log('Firstreset Mounted:', { empId, email, state });
    if (!empId || !email) {
      console.error('Missing empId or email, redirecting to login');
      setSnackbar({ open: true, message: 'Session expired or invalid. Please log in again.', severity: 'error' });
      navigate('/loginpage');
    }
    setSnackbar({ open: true, message: 'Firstreset loaded', severity: 'info' });
    return () => console.log('Firstreset Unmounted');
  }, [empId, email, navigate, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit Triggered', { newPassword, confirmPassword, empId, email });

    // Input validation
    if (!newPassword) {
      console.log('Validation Failed: New password is empty');
      setSnackbar({ open: true, message: 'New password is required', severity: 'error' });
      return;
    }

    if (!confirmPassword) {
      console.log('Validation Failed: Confirm password is empty');
      setSnackbar({ open: true, message: 'Confirm password is required', severity: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('Validation Failed: Passwords do not match');
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      console.log('Validation Failed: Password too short');
      setSnackbar({ open: true, message: 'Password must be at least 8 characters long', severity: 'error' });
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log('Validation Failed: Password does not meet requirements');
      setSnackbar({ open: true, message: 'Password must contain at least one uppercase letter, one number, and one special character', severity: 'error' });
      return;
    }

    const token = localStorage.getItem(`token_${empId}`);
    console.log('Token Check for empId:', empId, { token: token ? 'Present' : 'Missing' });

    if (!token) {
      console.error('Validation Failed: Authentication token missing');
      setSnackbar({ open: true, message: 'Authentication token missing. Please try again.', severity: 'error' });
      navigate('/loginpage');
      return;
    }

    setLoading(true);
    console.log('Submitting Request:', {
      url: `${API_URL}/reset_password`,
      body: { email, new_password: newPassword },
      headers: { Authorization: token },
      empId,
    });

    try {
      const response = await axios.post(
        `${API_URL}/reset_password`,
        { email, new_password: newPassword },
        {
          headers: { Authorization: token },
          timeout: 5000,
        }
      );

      console.log('Reset Password Response:', {
        status: response.status,
        data: response.data,
      });

      setSnackbar({ open: true, message: 'Password reset successfully', severity: 'success' });
      // Clear token after successful reset
      localStorage.removeItem(`token_${empId}`);
      navigate('/loginpage', { state: { empId } });
    } catch (error) {
      console.error('Reset Password Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to reset password. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
      console.log('Request Completed', { loading: false });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      className="d-flex align-items-center justify-content-center"
      sx={{
        height: '100vh',
        background: 'linear-gradient(to right, #667eea, #f7971e)',
      }}
    >
      <Card sx={{ width: 400, borderRadius: 3, boxShadow: 6, padding: 3 }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" align="center" fontWeight="bold">
            Reset Password
          </Typography>
          <Typography variant="body2" align="center" gutterBottom>
            Enter your new password for <strong>{email}</strong> to complete the reset.
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            onClick={() => console.log('Button Clicked')}
            sx={{
              mt: 2,
              backgroundColor: '#4f46e5',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1,
              '&:hover': {
                backgroundColor: '#4338ca',
              },
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FirstUserReset;
