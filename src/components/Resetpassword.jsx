import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { Button as BSButton, Spinner } from 'react-bootstrap';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (!email) {
      setSnackbar({ open: true, message: 'Email is missing. Please start the process again.', severity: 'error' });
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const passwordSchema = Yup.object({
    password: Yup.string()
      .matches(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
      )
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/reset_password`,
        {
          email,
          new_password: values.password,
        },
        {
          timeout: 5000,
        }
      );

      if (response.status === 200) {
        setSnackbar({ open: true, message: 'Password reset successful', severity: 'success' });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to show success message
        navigate('/loginpage');
      }
    } catch (error) {
      console.error('Reset Password Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Email not found. Please check your email.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
      setSubmitting(false);
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
        {/* <img
          src="./mainLogo.png"
          alt="Dolphin Logo"
          style={{
            width: '90px',
            height: 'auto',
            objectFit: 'contain',
          }}
        /> */}
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
        <Box mb={3} textAlign="center">
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cofomo Tech
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
            Set a new password for <strong>{email}</strong>
          </Typography>
        </Box>

        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={passwordSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, isSubmitting, errors, touched }) => (
            <Form>
              <Box mb={2}>
                <Typography variant="caption" color="rgba(255, 255, 255, 0.8)" display="block" sx={{ textAlign: 'center' }}>
                  Password must be at least 8 characters long with one uppercase, one lowercase, one number, and one special character
                </Typography>
              </Box>

              <Box mb={3}>
                <TextField
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  variant="outlined"
                  value={values.password}
                  onChange={handleChange}
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={textFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mb={3}>
                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  variant="outlined"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  error={touched.confirmPassword && !!errors.confirmPassword}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  sx={textFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                disabled={isSubmitting || loading}
              >
                {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Reset Password
              </BSButton>
            </Form>
          )}
        </Formik>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResetPassword;