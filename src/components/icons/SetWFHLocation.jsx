import React, { useState } from 'react';
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
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StraightenIcon from '@mui/icons-material/Straighten';
import PersonIcon from '@mui/icons-material/Person';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const SetWFHLocation = () => {
    const [empIdInput, setEmpIdInput] = useState('');
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

    const validateInputs = () => {
        if (!empIdInput || !latitude || !longitude) {
            return 'Employee ID, latitude, and longitude are required.';
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

        // Validate inputs
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            setSnackbar({ open: true, message: validationError, severity: 'error' });
            setIsLoading(false);
            return;
        }

        // Validate token and empId
        if (!empId || !token) {
            setError('No authentication token found. Redirecting to login...');
            setSnackbar({ open: true, message: 'No authentication token found. Redirecting to login...', severity: 'error' });
            setTimeout(() => navigate('/login'), 2000);
            setIsLoading(false);
            return;
        }

        try {
            console.log('Sending request with empId:', empId, 'token:', token);
            const response = await axios.post(
                `${API_URL}/set_location`,
                {
                    emp_id: empIdInput,
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
            setEmpIdInput('');
            setLatitude('');
            setLongitude('');
            setRadius('1000');
            setOpenDialog(false);
        } catch (err) {
            console.error('Request error:', err);
            if (err.response) {
                const status = err.response.status;
                const errorMessage = err.response.data.message || 'Server error occurred';
                if (status === 401) {
                    setError(`${errorMessage} Redirecting to login...`);
                    setSnackbar({ open: true, message: `${errorMessage} Redirecting to login...`, severity: 'error' });
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError(errorMessage);
                    setSnackbar({ open: true, message: errorMessage, severity: 'error' });
                }
            } else if (err.request) {
                setError('Network error occurred. Please check your connection.');
                setSnackbar({ open: true, message: 'Network error occurred. Please check your connection.', severity: 'error' });
            } else {
                setError('An error occurred while sending the request.');
                setSnackbar({ open: true, message: 'An error occurred while sending the request.', severity: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setMessage('');
        setError('');
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEmpIdInput('');
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
            <Tooltip title="Set WFH Location" placement="top">
                <IconButton
                    onClick={handleOpenDialog}
                    color="primary"
                    size="large"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: '10px', sm: '90px' },
                        right: { xs: '10px', sm: '20px' },
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#e0e0e0' },
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        zIndex: 1300,
                    }}
                    aria-label="Open set WFH location form"
                >
                    <HomeIcon fontSize="large" />
                </IconButton>
            </Tooltip>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
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
                        Set Permanent WFH Location
                    </Typography>
                    <IconButton onClick={handleCloseDialog} aria-label="Close dialog">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography
                        variant="subtitle2"
                        className="mb-4 text-muted"
                        sx={{ textAlign: 'center' }}
                    >
                        Enter location details for the employee’s WFH setup
                    </Typography>
                    <form onSubmit={handleSubmit} noValidate>
                        <Box mb={3}>
                            <TextField
                                label="Employee ID"
                                placeholder="Enter employee ID"
                                type="text"
                                value={empIdInput}
                                onChange={(e) => setEmpIdInput(e.target.value)}
                                fullWidth
                                variant="outlined"
                                error={error && error.includes('Employee ID')}
                                helperText={error && error.includes('Employee ID') ? error : ''}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                required
                            />
                        </Box>
                        <Box mb={3}>
                            <TextField
                                label="Latitude"
                                placeholder="Enter latitude (-90 to 90)"
                                type="number"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                fullWidth
                                variant="outlined"
                                error={error && error.includes('Latitude')}
                                helperText={error && error.includes('Latitude') ? error : ''}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOnIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ step: 'any' }}
                                required
                            />
                        </Box>
                        <Box mb={3}>
                            <TextField
                                label="Longitude"
                                placeholder="Enter longitude (-180 to 180)"
                                type="number"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                fullWidth
                                variant="outlined"
                                error={error && error.includes('Longitude')}
                                helperText={error && error.includes('Longitude') ? error : ''}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOnIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ step: 'any' }}
                                required
                            />
                        </Box>
                        <Box mb={3}>
                            <TextField
                                label="Radius (meters)"
                                placeholder="Enter radius (default 1000)"
                                type="number"
                                value={radius}
                                onChange={(e) => setRadius(e.target.value)}
                                fullWidth
                                variant="outlined"
                                error={error && error.includes('Radius')}
                                helperText={error && error.includes('Radius') ? error : ''}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <StraightenIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ step: 'any' }}
                                required
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
                                'Set WFH Location'
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
                        {error && !error.includes('Employee ID') && !error.includes('Latitude') && !error.includes('Longitude') && !error.includes('Radius') && (
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

export default SetWFHLocation;
