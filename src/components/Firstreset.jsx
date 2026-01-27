import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button as BSButton,
  Spinner
} from 'react-bootstrap';
import {
  TextField,
  InputAdornment,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const FirstUserReset = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigate('/login');
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
      navigate('/login');
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
      navigate('/login', { state: { empId } });
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
    <Container fluid style={{ height: '100vh', display: 'flex', padding: 0 }}>
      <Row className="w-100 m-0">
        <Col
          md={6}
          className="d-none d-md-flex align-items-center justify-content-center"
          style={{
            background: 'linear-gradient(45deg, rgb(166, 205, 235), rgb(67, 204, 254))',
            color: '#fff',
            padding: '50px',
            borderRadius: '16px 0 0 16px',
          }}
        >
          <Box textAlign="center">
            <img
              src="./logo.png"
              alt="Cofomo Tech Logo"
              style={{ maxWidth: '200px', height: 'auto' }}
            />
            <Typography variant="h4" style={{ fontWeight: 'bold', marginBottom: '20px' }}>
              Empowering people through seamless HR management.
            </Typography>
            <Box my={4}></Box>
            <Typography variant="body1">
              Efficiently manage your workforce, streamline operations effortlessly.
            </Typography>
          </Box>
        </Col>

        <Col
          md={6}
          className="d-flex align-items-center justify-content-center"
          style={{ background: '#fff', padding: '20px' }}
        >
          <Card
            style={{
              border: 'none',
              maxWidth: '400px',
              width: '100%',
              padding: '20px',
            }}
          >
            <Box textAlign="center" mb={3}>
              <Typography variant="h6" style={{ fontWeight: 'bold', color: '#f7971e' }}>
                DRAGON
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Enter your new password for <strong>{email}</strong> to complete the reset.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <TextField
                  label="New Password"
                  placeholder="Enter new password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className="mb-3">
                <TextField
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <BSButton
                type="submit"
                className="w-100 py-2"
                style={{
                  backgroundColor: '#4fb9ed',
                  borderColor: '#4fb9ed',
                  fontWeight: 'bold',
                  color: '#fff',
                  fontSize: '16px',
                  borderRadius: '8px',
                }}
                disabled={loading}
                onClick={() => console.log('Button Clicked')}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : null}
                {loading ? 'Resetting...' : 'Reset Password'}
              </BSButton>
            </form>
          </Card>
        </Col>
      </Row>
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
    </Container>
  );
};

export default FirstUserReset;
