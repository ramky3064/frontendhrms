import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button as BSButton,
  Spinner,
} from 'react-bootstrap';
import {
  TextField,
  InputAdornment,
  Typography,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const FirstUserMail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setSnackbar({ open: true, message: 'Email is required', severity: 'error' });
      return;
    }

    if (!validateEmail(email)) {
      setSnackbar({ open: true, message: 'Invalid email format', severity: 'error' });
      return;
    }

    setLoading(true);
    console.log('Submitting Reset Password:', { email });

    try {
      const response = await axios.post(
        `${API_URL}/forgot_password`,
        { email },
        { timeout: 5000 }
      );

      console.log('Reset Password Response:', response.data);
      if (response.status === 200) {
        setSnackbar({ open: true, message: 'OTP sent to your email', severity: 'success' });
        navigate('/mailotp', { state: { email } });
      }
    } catch (error) {
      console.error('Reset Password Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 404) {
        setSnackbar({ open: true, message: 'Email not found', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
      }
    } finally {
      setLoading(false);
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
                Enter your email to receive an OTP.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <TextField
                  label="Email"
                  placeholder="Enter your email"
                  fullWidth
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
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
              >
                {loading ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : null}
                {loading ? 'Sending...' : 'Send OTP to Email'}
              </BSButton>

              <Box mt={2} textAlign="center">
                <Typography variant="body2">
                  Remembered your password?{' '}
                  <RouterLink to="login" className="text-primary">
                    Login
                  </RouterLink>
                </Typography>
              </Box>
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

export default FirstUserMail;
