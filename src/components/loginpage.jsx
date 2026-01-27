import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Spinner,
  Button as BSButton
} from 'react-bootstrap';
import {
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const AutoSubmitLogin = ({ handleLogin, loading, showOTP }) => {
  const { values, errors, setSubmitting, setFieldError } = useFormikContext();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (showOTP || loading) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout for 3 seconds
    if (
      values.username &&
      values.password &&
      values.password.length >= 6 &&
      !errors.username &&
      !errors.password
    ) {
      timeoutRef.current = setTimeout(() => {
        handleLogin(values, { setSubmitting, setFieldError });
      }, 1250);
    }

    // Cleanup timeout on component unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [values.username, values.password, errors.username, errors.password, loading, showOTP, handleLogin]);

  return null;
};

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [empId, setEmpId] = useState(null);
  const [email, setEmail] = useState(null);
  const [otpStatus, setOtpStatus] = useState(null);
  const [shake, setShake] = useState(false); // State for shake animation
  const navigate = useNavigate();
  const inputRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));

  // Debug otpStatus changes
  useEffect(() => {
    console.log('otpStatus updated:', otpStatus);
  }, [otpStatus]);

  const loginSchema = Yup.object({
    username: Yup.string().required('User Name is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const otpSchema = Yup.object({
    otp: Yup.string()
      .length(6, 'OTP must be 6 digits')
      .matches(/^\d{6}$/, 'OTP must contain only numbers')
      .required('OTP is required'),
  });

  const handleLogin = async (values, { setSubmitting, setFieldError }) => {
    if (loading) return;
    setLoading(true);
    setSubmitting(true);

    try {
      localStorage.removeItem('isCheckedIn');
      localStorage.removeItem('timer');

      const response = await axios.post(`${API_URL}/login`, values);
      console.log('Login Response:', response.data);
      if (response.status === 200) {
        const { token, role } = response.data;
        console.log('Token on Login:', token);
        let empId;
        try {
          const decoded = jwtDecode(token);
          empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(token);
        } catch (error) {
          console.error('Error decoding JWT:', error);
          empId = md5(token);
          setSnackbar({ open: true, message: 'Invalid token format. Using temporary ID.', severity: 'warning' });
        }
        localStorage.setItem(`token_${empId}`, token);
        localStorage.setItem('userRole', role);
        sessionStorage.setItem('empId', empId);
        sessionStorage.setItem('userRole', role);
        console.log('Token stored for empId:', empId, 'Role:', role);

        setEmail(values.username);
        setEmpId(empId);
        setShowOTP(true);
        setError(null);
        setOtpStatus(null);
        setSnackbar({ open: true, message: 'OTP sent to your email', severity: 'success' });
        setTimeout(() => {
          inputRefs.current[0]?.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setFieldError('password', 'Invalid User Name or password');
        setSnackbar({ open: true, message: 'Invalid User Name or password', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Login error. Please try again.', severity: 'error' });
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleResendOTP = async (setFieldValue) => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setResendCooldown(30);

    const token = localStorage.getItem(`token_${empId}`);

    if (!token || !empId) {
      setError('Token or employee ID missing. Please try again.');
      setSnackbar({ open: true, message: 'Token or employee ID missing. Please try again.', severity: 'error' });
      setIsResending(false);
      setResendCooldown(0);
      setShowOTP(false);
      setOtpStatus(null);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/login_resend_otp`,
        {},
        { headers: { Authorization: token } }
      );
      setFieldValue('otp', '');
      setSnackbar({ open: true, message: 'OTP resent successfully to your email', severity: 'success' });
      setError(null);
      setOtpStatus(null);
      inputRefs.current[0]?.current?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Invalid or expired token. Please log in again.');
        setSnackbar({ open: true, message: 'Invalid or expired token. Please log in again.', severity: 'error' });
        setShowOTP(false);
        setOtpStatus(null);
      } else if (err.response?.status === 404) {
        setError('User not found. Please check your credentials.');
        setSnackbar({ open: true, message: 'User not found. Please check your credentials.', severity: 'error' });
      } else {
        setError('Failed to resend OTP. Please try again.');
        setSnackbar({ open: true, message: 'Failed to resend OTP. Please try again.', severity: 'error' });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async (values, { setFieldValue }) => {
    if (loading) return;
    setLoading(true);
    setOtpStatus(null); // Reset otpStatus before verification attempt

    const { otp } = values;
    const token = localStorage.getItem(`token_${empId}`);

    if (!token || !empId) {
      setError('Token or employee ID missing. Please try again.');
      setSnackbar({ open: true, message: 'Token or employee ID missing. Please try again.', severity: 'error' });
      setShowOTP(false);
      setOtpStatus(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/verify_otp`,
        { otp },
        { headers: { Authorization: token } }
      );

      const { role, require_password_reset } = response.data;
      localStorage.setItem('userRole', role);
      sessionStorage.setItem('empId', empId);
      localStorage.setItem('empId', empId);
      sessionStorage.setItem('otpVerified', 'true');
      sessionStorage.setItem('otpVerifiedTimestamp', Date.now().toString());

      setOtpStatus('correct');
      setTimeout(() => {
        setSnackbar({ open: true, message: 'OTP verified successfully', severity: 'success' });

        if (require_password_reset) {
          navigate('/first-mail', { state: { empId, email } });
        } else {
          switch (role) {
            case 'HR':
              navigate('/hr-dashboard');
              break;
            case 'Manager':
              navigate('/manager-dashboard');
              break;
            case 'Employee':
              navigate('/employee-dashboard');
              break;
            case 'Admin':
              navigate('/ceo-dashboard');
              break;
            default:
              navigate('/');
          }
        }
      }, 500);
    } catch (err) {
      console.error('OTP verification error:', err.response?.data || err.message);
      setError('Invalid or expired OTP. Please try again.');
      setFieldValue('otp', '');
      setOtpStatus('incorrect');
      setShake(true); // Trigger shake animation
      setTimeout(() => setShake(false), 500); // Reset shake after animation duration
      inputRefs.current.forEach((ref) => {
        if (ref.current) ref.current.value = '';
      });
      inputRefs.current[0]?.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    sessionStorage.removeItem('otpVerified');
    sessionStorage.removeItem('otpVerifiedTimestamp');
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('userRole');
  }, []);

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

  const otpFieldStyles = (status, hasValue) => {
    console.log('Applying otpFieldStyles with status:', status, 'hasValue:', hasValue);
    return {
      width: '40px',
      '& .MuiInputBase-root': {
        color: '#fff',
        backgroundColor: 'transparent',
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        borderBottom: `2px solid ${status === 'correct' ? 'green' : status === 'incorrect' ? 'red' : hasValue ? '#4fb9ed' : 'transparent'
          } !important`,
        '&:hover': {
          borderBottom: `2px solid ${status === 'correct' ? 'green' : status === 'incorrect' ? 'red' : hasValue ? '#3ba8d7' : '#3ba8d7'
            } !important`,
        },
        '&.Mui-focused': {
          borderBottom: `2px solid ${status === 'correct' ? 'green' : status === 'incorrect' ? 'red' : '#4fb9ed'
            } !important`,
        },
      },
      '& input': {
        textAlign: 'center',
        fontSize: '22px',
        fontWeight: 'bold',
        padding: '0 0 8px 0',
        color: '#fff',
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
        '&[type=number]': {
          MozAppearance: 'textfield',
        },
      },
    };
  };

  // Define the shake animation keyframes
  const shakeAnimation = {
    '@keyframes shake': {
      '0%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-10px)' },
      '50%': { transform: 'translateX(10px)' },
      '75%': { transform: 'translateX(-10px)' },
      '100%': { transform: 'translateX(0)' },
    },
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
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
          animation: shake ? 'shake 0.2s ease-in-out' : 'none', // Apply shake animation
          ...shakeAnimation, // Include keyframes
        }}
      >
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cofomo Tech
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
            {showOTP ? 'Enter the OTP sent to your email' : 'Please enter your details to log in'}
          </Typography>
        </Box>

        <Formik
          initialValues={{ username: '', password: '', otp: '' }}
          validationSchema={showOTP ? otpSchema : loginSchema}
          onSubmit={showOTP ? handleVerifyOTP : handleLogin}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue, errors, touched }) => (
            <Form>
              <AutoSubmitLogin handleLogin={handleLogin} loading={loading} showOTP={showOTP} />

              <Box mb={2}>
                <Field name="username">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      label="User Name"
                      placeholder="Enter your User Name"
                      fullWidth
                      variant="outlined"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      sx={textFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </InputAdornment>
                        ),
                        readOnly: showOTP,
                      }}
                    />
                  )}
                </Field>
              </Box>

              <Box mb={2}>
                <Field name="password">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      label="Password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      variant="outlined"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      sx={textFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword((prev) => !prev)}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              disabled={showOTP}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        readOnly: showOTP,
                      }}
                    />
                  )}
                </Field>
              </Box>

              {showOTP && (
                <Box key={otpStatus} sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: '10px' }}>
                  {inputRefs.current.map((ref, index) => {
                    console.log(`Rendering OTP input ${index} with otpStatus: ${otpStatus}`);
                    return (
                      <TextField
                        key={`otp-${index}-${otpStatus}`}
                        inputRef={ref}
                        value={values.otp[index] || ''}
                        onChange={(e) => {
                          const { value } = e.target;
                          if (/^\d?$/.test(value)) {
                            const otpArray = values.otp.split('');
                            otpArray[index] = value;
                            const newOtp = otpArray.join('').padEnd(6, '');
                            setFieldValue('otp', newOtp);

                            if (value && index < 5 && inputRefs.current[index + 1]?.current) {
                              inputRefs.current[index + 1].current.focus();
                            }

                            if (newOtp.length === 6 && !loading) {
                              handleVerifyOTP({ otp: newOtp }, { setFieldValue });
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !values.otp[index] && index > 0) {
                            inputRefs.current[index - 1]?.current?.focus();
                          }
                        }}
                        placeholder="-"
                        type="number"
                        inputProps={{
                          maxLength: 1,
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                          style: {
                            textAlign: 'center',
                            fontSize: '22px',
                            fontWeight: 'bold',
                            width: '40px',
                            padding: '0 0 8px 0',
                          },
                        }}
                        sx={otpFieldStyles(otpStatus, !!values.otp[index])}
                        autoFocus={index === 0}
                      />
                    );
                  })}
                </Box>
              )}

              {showOTP && (
                <Box sx={{ color: '#ffc107', mb: 3, textAlign: 'center' }}>
                  <ErrorMessage name="otp" component="div" />
                  {error && <div>{error}</div>}
                </Box>
              )}

              {!showOTP && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#ffc107', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </Box>
              )}

              {!showOTP && (
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
                  {loading ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : null}
                  Login
                </BSButton>
              )}

              {showOTP && (
                <Box mt={2} textAlign="center">
                  <BSButton
                    variant="link"
                    onClick={() => handleResendOTP(setFieldValue)}
                    disabled={isResending || resendCooldown > 0 || loading}
                    style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : 'Resend OTP'}
                  </BSButton>
                  <BSButton
                    variant="link"
                    onClick={() => {
                      setShowOTP(false);
                      setError(null);
                      setFieldValue('otp', '');
                      setFieldValue('password', '');
                      setFieldValue('username', '');
                      setOtpStatus(null);
                      navigate('/login');
                    }}
                    style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem', marginLeft: '10px' }}
                    disabled={loading}
                  >
                    Back to Login
                  </BSButton>
                </Box>
              )}
            </Form>
          )}
        </Formik>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;