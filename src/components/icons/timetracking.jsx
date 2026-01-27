import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Typography,
  Button,
  InputAdornment,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import StraightenIcon from '@mui/icons-material/Straighten';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// Define keyframes for animation
const tooltipAnimation = `
  @keyframes tooltipFadeSlide {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .react-tooltip.show {
    animation: tooltipFadeSlide 0.3s ease-in-out forwards;
  }
`;

const SetOfficeLocation = () => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('1000');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const empId = sessionStorage.getItem('empId') || '';
  const token = localStorage.getItem(`token_${empId}`) || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!empId || !token) {
      setError('Please log in to set office location.');
      setSnackbar({ open: true, message: 'Please log in to set office location.', severity: 'error' });
      setTimeout(() => navigate('/login'), 2000);
    } else {
      console.log('Token retrieved:', token);
    }
  }, [empId, token, navigate]);

  const validateInputs = () => {
    if (!latitude || !longitude) {
      return 'Latitude and longitude are required.';
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be between -90 and 90.';
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return 'Longitude must be between -180 and 180.';
    }
    if (isNaN(rad) || rad <= 0) {
      return 'Radius must be a positive number.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      setSnackbar({ open: true, message: validationError, severity: 'error' });
      setIsLoading(false);
      return;
    }

    if (!empId || !token) {
      setError('No authentication token found. Redirecting to login...');
      setSnackbar({ open: true, message: 'No authentication token found. Redirecting to login...', severity: 'error' });
      setTimeout(() => navigate('/login'), 2000);
      setIsLoading(false);
      return;
    }

    const url = `${API_URL}/set_default_office`;
    console.log('Sending request to:', url, 'with empId:', empId, 'token:', token);
    try {
      const response = await axios.post(
        url,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseFloat(radius),
        },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );

      setMessage(response.data.message);
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      setLatitude('');
      setLongitude('');
      setRadius('1000');
      setOpenDialog(false);
    } catch (err) {
      console.error('Request error:', err);
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data.message || 'Server error occurred';
        if (status === 401 || status === 422) {
          setError(`Invalid or expired token: ${errorMessage}. Redirecting to login...`);
          setSnackbar({ open: true, message: `Invalid or expired token: ${errorMessage}. Redirecting to login...`, severity: 'error' });
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(errorMessage);
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
      } else if (err.request) {
        setError('Network error occurred.');
        setSnackbar({ open: true, message: 'Network error occurred. Please check your connection.', severity: 'error' });
      } else {
        setError('An error occurred while sending the request.');
        setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    if (!empId || !token) {
      setError('Please log in to set office location.');
      setSnackbar({ open: true, message: 'Please log in to set office location.', severity: 'info' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setOpenDialog(true);
    setMessage('');
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setLatitude('');
    setLongitude('');
    setRadius('1000');
    setMessage('');
    setError('');
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div style={{ width: 'fit-content' }}>
      <style>{tooltipAnimation}</style>
      <IconButton
        data-tooltip-id="set-office-tooltip"
        data-tooltip-content="Set Office Location"
        onClick={handleOpenDialog}
        color="primary"
        size="large"
        sx={{
          // position: 'fixed',
          // bottom: { xs: '10px', sm: '20px' },
          // right: { xs: '10px', sm: '20px' },
          bgcolor: '#fff',
          '&:hover': { bgcolor: '#e0e0e0' },
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1300,
        }}
        aria-label="Open set office location form"
      >
        <LocationOnIcon fontSize="large" />
      </IconButton>
      <Tooltip
        id="set-office-tooltip"
        place="top-end"
        style={{
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          zIndex: 1400,
        }}
        delayShow={100}
        delayHide={100}
      />
      <Dialog
        open={openDialog}
        fullWidth
        onClose={handleCloseDialog}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Set Default Office Location
          </Typography>
          <Box>
            <IconButton onClick={handleCloseDialog} aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="subtitle2"
            className="mb-4"
            sx={{ textAlign: 'center' }}
          >
            Enter your office location details for the default office
          </Typography>
          <Box>
            <form method="POST" onSubmit={handleSubmit} noValidate>
              <Box mb={3}>
                <TextField
                  label="Latitude"
                  placeholder="Enter latitude (-90 to 90)"
                  type="number"
                  value={latitude}
                  fullWidth
                  onChange={(e) => setLatitude(e.target.value)}
                  variant="outlined"
                  error={error && error.includes('Latitude')}
                  helperText={error && error.includes('Latitude') ? error : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon color="action" />
                      </InputAdornment>
                    ),
                    inputProps: { step: 'any' }
                  }}
                />
              </Box>
              <Box mb={3}>
                <TextField
                  label="Longitude"
                  placeholder="Enter longitude (-180 to 180)"
                  type="number"
                  value={longitude}
                  fullWidth
                  onChange={(e) => setLongitude(e.target.value)}
                  variant="outlined"
                  error={error && error.includes('Longitude')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon color="primary" />
                      </InputAdornment>
                    ),
                    inputProps: { step: 'any' }
                  }}
                />
              </Box>
              <Box mb={3}>
                <TextField
                  label="Radius (meters)"
                  placeholder="Enter radius (default 1000)"
                  type="number"
                  value={radius}
                  fullWidth
                  onChange={(e) => setRadius(e.target.value)}
                  variant="outlined"
                  error={error && error.includes('Radius')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <StraightenIcon color="primary" />
                      </InputAdornment>
                    ),
                    inputProps: { step: 'any' }
                  }}
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '16px',
                  backgroundColor: '#4c63f5',
                  '&:hover': { backgroundColor: '#3b50c4' },
                }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Set Location'
                )}
              </Button>
              {message && !error && (
                <Typography
                  variant="body2"
                  className="mt-3 text-center"
                  style={{ color: '#2e7d32' }}
                  role="alert"
                  aria-live="polite"
                >
                  {message}
                </Typography>
              )}
              {error && !error.includes('Latitude') && !error.includes('Longitude') && !error.includes('Radius') && (
                <Typography
                  variant="body2"
                  className="mt-3 text-center"
                  style={{ color: '#d32f2f' }}
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </Typography>
              )}
            </form>
          </Box>
        </DialogContent>
      </Dialog>
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
    </div>
  );
};

export default SetOfficeLocation;