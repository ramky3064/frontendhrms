import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Container,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Grid,
  Snackbar,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parse } from 'date-fns';
import AppNavbar from './Hrmnav';
import DynamicSidebar from './Sidebar';

const ManagePayslip = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    salary_month: new Date().toISOString().slice(0, 7), // Default to current YYYY-MM
    pay_period: new Date().toISOString().slice(0, 7), // Default to current YYYY-MM
    monthly_pay: '',
    bank_name: '',
    bank_account_no: '',
    payment_status: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

  // Handle Snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Modified toast function to use Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Fetch token and emp_id
  const getTokenAndEmpId = () => {
    let empId = sessionStorage.getItem('empId');
    let token = localStorage.getItem(`token_${empId}`) || localStorage.getItem('token');

    if (!token || !empId) {
      try {
        const fallbackToken = localStorage.getItem('token');
        if (fallbackToken) {
          const decoded = jwtDecode(fallbackToken);
          empId = decoded.emp_id || decoded.sub;
          if (empId) {
            token = fallbackToken;
            localStorage.setItem(`token_${empId}`, token);
            sessionStorage.setItem('empId', empId);
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        return { token: null, empId: null };
      }
    }
    return { token, empId };
  };

  // Fetch employees on mount
  useEffect(() => {
    const { token, empId } = getTokenAndEmpId();
    if (!token || !empId) {
      const errorMessage = 'Authentication required. Please log in.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    axios
      .get(`${API_URL}/employees`, {
        headers: { Authorization: token },
      })
      .then((response) => {
        if (response.data.employees && Array.isArray(response.data.employees)) {
          setEmployees(response.data.employees);
        } else {
          throw new Error('No employees found.');
        }
      })
      .catch((err) => {
        let errorMessage = 'Failed to fetch employee list.';
        if (err.response?.status === 401) {
          errorMessage = 'Unauthorized access. Please log in again.';
          navigate('/login');
        } else if (err.response?.data?.database) {
          errorMessage = 'Database error occurred. Please contact support.';
        } else {
          errorMessage = err.response?.data?.error || errorMessage;
        }
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date changes for salary_month and pay_period
  const handleDateChange = (name, date) => {
    if (date && !isNaN(date)) {
      const formattedDate = format(date, 'yyyy-MM');
      setFormData((prev) => ({
        ...prev,
        [name]: formattedDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { token, empId } = getTokenAndEmpId();
    if (!token || !empId) {
      const errorMessage = 'Authentication required. Please log in again.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      navigate('/login');
      setLoading(false);
      return;
    }

    // Validate required fields
    const requiredFields = [
      'employee_id',
      'salary_month',
      'pay_period',
      'monthly_pay',
      'bank_name',
      'bank_account_no',
      'payment_status',
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    if (parseFloat(formData.monthly_pay) < 0) {
      const errorMessage = 'Monthly pay cannot be negative.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      setLoading(false);
      return;
    }

    // Validate salary_month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(formData.salary_month)) {
      const errorMessage = 'Salary month must be in YYYY-MM format.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      setLoading(false);
      return;
    }

    // Prepare payload
    const payload = {
      employee_id: formData.employee_id,
      salary_month: formData.salary_month,
      pay_period: formData.pay_period,
      monthly_pay: parseFloat(formData.monthly_pay) || 0,
      bank_name: formData.bank_name,
      bank_account_no: formData.bank_account_no,
      payment_status: formData.payment_status,
    };

    try {
      const response = await axios.post(`${API_URL}/manage_payslip`, payload, {
        headers: { Authorization: token },
      });
      const successMessage = `${response.data.message} Payment Status: ${response.data.payment_status}`;
      setSuccess(successMessage);
      showSnackbar(successMessage, 'success');
      // Reset form
      setFormData({
        employee_id: '',
        salary_month: new Date().toISOString().slice(0, 7),
        pay_period: new Date().toISOString().slice(0, 7),
        monthly_pay: '',
        bank_name: '',
        bank_account_no: '',
        payment_status: 'Pending',
      });
    } catch (err) {
      let errorMessage = err.response?.data?.error || 'Failed to manage payslip.';
      if (err.response?.status === 401) {
        errorMessage = 'Unauthorized access. Please log in again.';
        navigate('/login');
      } else if (err.response?.status === 404) {
        errorMessage = 'Employee not found or no payroll data.';
      } else if (err.response?.data?.database) {
        errorMessage = 'Database error occurred. Please contact support.';
      }
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.join(', ');
      }
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppNavbar />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <DynamicSidebar />
          <Container maxWidth="md" sx={{ my: 6, flexGrow: 1 }}>
            <Box
              sx={{
                padding: { xs: 3, sm: 4 },
                backgroundColor: '#fff',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  textAlign: 'center',
                  mb: 4,
                }}
              >
                Manage Payslip
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
                  {success}
                </Alert>
              )}
              {loading && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <CircularProgress size={32} color="primary" />
                </Box>
              )}
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2, minWidth: '300px' }}>
                      <InputLabel id="employee_id_label">Employee</InputLabel>
                      <Select
                        labelId="employee_id_label"
                        id="employee_id"
                        name="employee_id"
                        value={formData.employee_id}
                        onChange={handleChange}
                        label="Employee"
                        required
                        disabled={loading}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          minHeight: '56px',
                          '& .MuiSelect-select': {
                            py: 1.5,
                            px: 1.5,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3f51b5',
                          },
                        }}
                      >
                        <MenuItem value="">Select Employee</MenuItem>
                        {employees.map((emp) => (
                          <MenuItem key={emp.employee_id} value={emp.employee_id}>
                            {emp.employee_name} ({emp.employee_id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      views={['year', 'month']}
                      label="Salary Month (YYYY-MM)"
                      value={
                        formData.salary_month
                          ? parse(formData.salary_month, 'yyyy-MM', new Date())
                          : null
                      }
                      onChange={(date) => handleDateChange('salary_month', date)}
                      disabled={loading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                          sx={{
                            mb: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1,
                            minHeight: '55px',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#3f51b5',
                              },
                            },
                          }}
                          error={formData.salary_month && !/^\d{4}-\d{2}$/.test(formData.salary_month)}
                          helperText={
                            formData.salary_month && !/^\d{4}-\d{2}$/.test(formData.salary_month)
                              ? 'Format: YYYY-MM'
                              : ''
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      views={['year', 'month']}
                      label="Pay Period (YYYY-MM)"
                      value={
                        formData.pay_period
                          ? parse(formData.pay_period, 'yyyy-MM', new Date())
                          : null
                      }
                      onChange={(date) => handleDateChange('pay_period', date)}
                      disabled={loading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                          sx={{
                            mb: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1,
                            minHeight: '56px',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#3f51b5',
                              },
                            },
                          }}
                          error={formData.pay_period && !/^\d{4}-\d{2}$/.test(formData.pay_period)}
                          helperText={
                            formData.pay_period && !/^\d{4}-\d{2}$/.test(formData.pay_period)
                              ? 'Format: YYYY-MM'
                              : ''
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monthly Pay"
                      id="monthly_pay"
                      name="monthly_pay"
                      value={formData.monthly_pay}
                      onChange={handleChange}
                      type="number"
                      placeholder="Enter monthly pay"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      required
                      disabled={loading}
                      error={formData.monthly_pay && parseFloat(formData.monthly_pay) < 0}
                      helperText={
                        formData.monthly_pay && parseFloat(formData.monthly_pay) < 0
                          ? 'Monthly pay cannot be negative'
                          : ''
                      }
                      sx={{
                        mb: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        minHeight: '56px',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#3f51b5',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      id="bank_name"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="Enter bank name"
                      required
                      disabled={loading}
                      sx={{
                        mb: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        minHeight: '56px',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#3f51b5',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bank Account Number"
                      id="bank_account_no"
                      name="bank_account_no"
                      value={formData.bank_account_no}
                      onChange={handleChange}
                      placeholder="Enter bank account number"
                      required
                      disabled={loading}
                      sx={{
                        mb: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        minHeight: '56px',
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#3f51b5',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2, minHeight: '56px' }}>
                      <InputLabel id="payment_status_label">Payment Status</InputLabel>
                      <Select
                        labelId="payment_status_label"
                        id="payment_status"
                        name="payment_status"
                        value={formData.payment_status}
                        onChange={handleChange}
                        label="Payment Status"
                        required
                        disabled={loading}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          minHeight: '56px',
                          '& .MuiSelect-select': {
                            py: 1.5,
                            px: 16,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3f51b5',
                          },
                        }}
                      >
                        <MenuItem value="Paid">Paid</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      backgroundColor: '#3f51b5',
                      '&:hover': {
                        backgroundColor: '#303f9f',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease',
                      },
                      '&:disabled': {
                        backgroundColor: '#b0bec5',
                      },
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Payslip'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={() =>
                      setFormData({
                        employee_id: '',
                        salary_month: new Date().toISOString().slice(0, 7),
                        pay_period: new Date().toISOString().slice(0, 7),
                        monthly_pay: '',
                        bank_name: '',
                        bank_account_no: '',
                        payment_status: 'Pending',
                      })
                    }
                    disabled={loading}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      borderColor: '#f50057',
                      color: '#f50057',
                      '&:hover': {
                        borderColor: '#c51162',
                        color: '#c51162',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease',
                      },
                      '&:disabled': {
                        borderColor: '#b0bec5',
                        color: '#b0bec5',
                      },
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </form>
              <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Alert
                  onClose={handleCloseSnackbar}
                  severity={snackbarSeverity}
                  sx={{ width: '100%' }}
                >
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </Box>
          </Container>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ManagePayslip;