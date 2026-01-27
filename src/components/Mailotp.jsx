import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TextField,
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { Button as BSButton } from 'react-bootstrap';
// import VpnKey from '@mui/icons-material/VpnKey';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const MailOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || sessionStorage.getItem('resetEmail') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const inputRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));

  useEffect(() => {
    if (!email) {
      console.error('Email missing, redirecting to forgot-password');
      setSnackbar({
        open: true,
        message: 'Email is missing. Please start the process again.',
        severity: 'error'
      });
      navigate('/forgot-password');
    } else {
      sessionStorage.setItem('resetEmail', email);
    }
    console.log('MailOtp Mounted:', { email });
    return () => console.log('MailOtp Unmounted');
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleResendOtp = async () => {
    if (!email) {
      setSnackbar({
        open: true,
        message: 'Email is missing. Please start the process again.',
        severity: 'error'
      });
      navigate('/forgot-password');
      return;
    }

    setResendLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/mail_resend_otp`,
        { email },
        { timeout: 5000 }
      );
      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'New OTP sent to your email',
          severity: 'success'
        });
        setResendCooldown(30);
        setOtp(''); // Clear the OTP input
        inputRefs.current.forEach((ref) => {
          if (ref.current) ref.current.value = '';
        });
      }
    } catch (error) {
      console.error('Resend OTP Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      let message = 'Error resending OTP. Please try again.';
      if (error.response?.status === 404) {
        message = 'Email not found. Please check the email address.';
      } else if (error.response?.status === 429) {
        message = 'Too many OTP requests. Please wait before trying again.';
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please check your connection.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      setSnackbar({ open: true, message: 'OTP is required', severity: 'error' });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setSnackbar({ open: true, message: 'OTP must be exactly 6 digits', severity: 'error' });
      return;
    }

    setLoading(true);
    console.log('Submitting OTP Verification:', { email, otp });

    try {
      const response = await axios.post(
        `${API_URL}/verify_otp_forgot_password`,
        { email, otp },
        { timeout: 10000 }
      );

      console.log('Verify OTP Response:', response.data);
      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'OTP verified successfully! You can now reset your password.',
          severity: 'success'
        });
        sessionStorage.setItem('otpVerified', 'true');
        setTimeout(() => {
          navigate('/resetpassword', { state: { email } });
        }, 1500);
      }
    } catch (error) {
      console.error('Verify OTP Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      let message = 'Error verifying OTP. Please try again.';
      if (error.response?.status === 401) {
        message = 'Invalid or expired OTP';
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please check your connection.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const { value } = e.target;
    if (/^\d?$/.test(value)) {
      const otpArray = otp.split('');
      otpArray[index] = value;
      const newOtp = otpArray.join('').padEnd(6, '');
      setOtp(newOtp);

      if (value && index < 5 && inputRefs.current[index + 1]?.current) {
        inputRefs.current[index + 1].current.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    }
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
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cofomo Tech
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
            Enter the 6-digit OTP sent to <strong>{email}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          {inputRefs.current.map((ref, index) => (
            <TextField
              key={index}
              inputRef={ref}
              value={otp[index] || ''}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              variant="outlined"
              inputProps={{
                maxLength: 1,
                style: {
                  textAlign: 'center',
                  fontSize: '20px',
                  width: '48px',
                  height: '48px',
                  padding: '0',
                },
              }}
              sx={{
                width: '48px',
                ...textFieldStyles,
                '& .MuiInputBase-root': {
                  ...textFieldStyles['& .MuiInputBase-root'],
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                },
              }}
            />
          ))}
        </Box>

        <Box sx={{ color: '#ffc107', mb: 3, textAlign: 'center' }}>
          {otp && !/^\d{0,6}$/.test(otp) && <div>OTP must contain only digits</div>}
          {otp && otp.length !== 6 && <div>OTP must be exactly 6 digits</div>}
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
          disabled={loading || otp.length !== 6}
          onClick={handleSubmit}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </BSButton>

        <Box mt={2} textAlign="center">
          <BSButton
            variant="link"
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            {resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : resendLoading
              ? 'Resending...'
              : 'Resend OTP'}
          </BSButton>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

export default MailOtp;