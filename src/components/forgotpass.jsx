import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button as BSButton } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ForgotPassword = () => {
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
    console.log('Submitting Forgot Password:', { email });

    try {
      const response = await axios.post(
        `${API_URL}/forgot_password`,
        { email },
        { timeout: 5000 }
      );

      console.log('Forgot Password Response:', response.data);
      if (response.status === 200) {
        setSnackbar({ open: true, message: 'OTP sent to your email', severity: 'success' });
        navigate('/mailotp', { state: { email } });
      }
    } catch (error) {
      console.error('Forgot Password Error:', {
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

  const textFieldStyles = {
    '& .MuiInputBase-root': {
      color: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#fff',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#fff',
    },
    '& .MuiFormHelperText-root': {
      color: '#ffc107'
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: { xs: '20px', md: '0 5vw' },
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      >
        <source src="./video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: -1,
        }}
      />

      {/* Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1,
        }}
      >
        <img
          src="./mainLogo.png"
          alt="Dolphin Logo"
          style={{
            width: '90px',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </Box>

      {/* Watermark */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1,
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            fontSize: '0.8rem',
            marginRight: '4px',
          }}
        >
          powered by
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#4fb9ed',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Cofomo Tech
        </Typography>
      </Box>

      <Box
        sx={{
          background: 'rgba(10, 25, 41, 0.7)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: '#fff',
          maxWidth: '380px',
          width: '100%',
          padding: { xs: '1.5rem', md: '2rem' },
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.2)'
        }}
      >
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cofomo Tech 
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
            Enter your email to receive an OTP
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <TextField
              label="Email"
              placeholder="Enter your email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={textFieldStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <BSButton
            type="submit"
            className="w-100 py-2"
            style={{
              backgroundColor: '#4fb9ed',
              borderColor: '#4fb9ed',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '15px',
              borderRadius: '6px',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3ba8d7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4fb9ed'}
            disabled={loading}
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              'Send OTP to Email'
            )}
          </BSButton>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
              Remembered your password?{' '}
              <RouterLink to="/login" style={{ color: '#4fb9ed', fontWeight: 'bold', textDecoration: 'none' }}>
                Login
              </RouterLink>
            </Typography>
          </Box>
        </form>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;