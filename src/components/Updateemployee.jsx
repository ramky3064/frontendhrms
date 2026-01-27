import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppNavbar from './Hrmnav';
import DynamicSidebar from './Sidebar';
import Footer from './Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const EmployeeUForm = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [open, setOpen] = useState(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const fetchEmployee = useCallback(async () => {
    const sessionEmpId = sessionStorage.getItem('empId');
    const token = sessionEmpId ? localStorage.getItem(`token_${sessionEmpId}`) : null;

    if (!sessionEmpId || !token) {
      setError('Please log in to update an employee.');
      setSnackbarMessage('Please log in to update an employee.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/update_employee_field/${empId}`, {
        headers: { Authorization: token },
      });
      const data = { ...response.data.employee };

      // Remove fields not allowed in the form
      const disallowedFields = ['emp_id', 'candidate_status', 'resume', 'photo'];
      disallowedFields.forEach(field => delete data[field]);

      // Define allowed fields per backend
      const allowedFields = [
        'first_name', 'last_name', 'nick_name', 'email', 'department', 'designation',
        'user_role', 'employment_type', 'employee_status', 'source_of_hire', 'date_of_joining',
        'current_experience', 'total_experience', 'reporting_manager', 'date_of_birth', 'age',
        'gender', 'marital_status', 'phone', 'extension', 'work_from', 'office_location', 'tags',
        'personal_mobile', 'personal_email', 'date_of_exit', 'onboarding_status', 'present_address',
        'permanent_address', 'aadhaar', 'pan', 'uan', 'added_by', 'modified_by', 'added_time',
        'modified_time', 'pf_number', 'esic_ip_number'
      ];

      // Sanitize data to prevent null values
      const sanitizedData = {};
      allowedFields.forEach(field => {
        if (data[field] === null || data[field] === undefined) {
          sanitizedData[field] = '';
        } else if (['date_of_joining', 'date_of_birth', 'date_of_exit'].includes(field)) {
          sanitizedData[field] = data[field] ? data[field].slice(0, 10) : '';
        } else if (['added_time', 'modified_time'].includes(field)) {
          sanitizedData[field] = data[field] ? data[field].slice(0, 16).replace(' ', 'T') : new Date().toISOString().slice(0, 16);
        } else {
          sanitizedData[field] = data[field].toString();
        }
      });

      setInitialValues(sanitizedData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch employee:', err);
      setError(err.response?.data?.error || 'Failed to fetch employee data.');
      setSnackbarMessage(err.response?.data?.error || 'Failed to fetch employee data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
    }
  }, [empId, navigate]);

  useEffect(() => {
    if (location.pathname === `/edit-employee/${empId}`) {
      setOpen(true);
      fetchEmployee();
    } else {
      setOpen(false);
    }
  }, [location.pathname, empId, fetchEmployee]);

  const validationSchema = Yup.object({
    first_name: Yup.string().required('Required'),
    last_name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string().required('Required'),
    work_from: Yup.string()
      .oneOf(['office', 'home'], 'Work from must be office or home')
      .required('Required'),
    added_time: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date-time format')
      .required('Required'),
    modified_time: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date-time format')
      .required('Required'),
    age: Yup.number()
      .min(0, 'Age must be at least 0')
      .max(150, 'Age must be at most 150')
      .nullable(),
    date_of_joining: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
      .nullable(),
    date_of_birth: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
      .nullable(),
    date_of_exit: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
      .nullable(),
    user_role: Yup.string()
      .oneOf(['Admin', 'HR', 'Manager', 'Employee'], 'Invalid user role')
      .nullable(),
    employment_type: Yup.string()
      .oneOf(['Full Time', 'Part Time', 'Intern'], 'Invalid employment type')
      .nullable(),
    employee_status: Yup.string()
      .oneOf(['Active', 'Inactive'], 'Invalid employee status')
      .nullable(),
    gender: Yup.string()
      .oneOf(['Male', 'Female', 'Prefer not to mention'], 'Invalid gender')
      .nullable(),
    marital_status: Yup.string()
      .oneOf(['Married', 'Unmarried'], 'Invalid marital status')
      .nullable(),
    onboarding_status: Yup.string()
      .oneOf(['Completed', 'Pending', 'In Progress'], 'Invalid onboarding status')
      .nullable()
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    const sessionEmpId = sessionStorage.getItem('empId');
    const token = sessionEmpId ? localStorage.getItem(`token_${sessionEmpId}`) : null;

    if (!sessionEmpId || !token) {
      setError('Authorization token not found. Please log in again.');
      setSnackbarMessage('Authorization token not found. Please log in again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      navigate('/login');
      return;
    }

    try {
      // Filter out empty or unchanged fields
      const updates = {};
      Object.keys(values).forEach(field => {
        if (values[field] !== '' && values[field] !== initialValues[field]) {
          if (['added_time', 'modified_time'].includes(field)) {
            updates[field] = values[field].replace('T', ' ') + ':00';
          } else {
            updates[field] = values[field];
          }
        }
      });

      if (Object.keys(updates).length === 0) {
        setSnackbarMessage('No changes to update.');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setSubmitting(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: token
      };

      const response = await axios.put(
        `${API_URL}/update_employee_field/${empId}`,
        updates,
        { headers }
      );

      setSnackbarMessage(response.data.error); // Backend uses 'error' key even for success
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setOpen(false);
      navigate('/viewall-employees');
    } catch (error) {
      console.error('Update failed:', error);
      setError(error.response?.data?.error || 'Update failed');
      setSnackbarMessage(error.response?.data?.error || 'Update failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    navigate(-2);
  };

  const fields = [
    'first_name', 'last_name', 'nick_name', 'email', 'department', 'designation',
    'user_role', 'employment_type', 'employee_status', 'source_of_hire', 'date_of_joining',
    'current_experience', 'total_experience', 'reporting_manager', 'date_of_birth', 'age',
    'gender', 'marital_status', 'phone', 'extension', 'work_from', 'office_location', 'tags',
    'personal_mobile', 'personal_email', 'date_of_exit', 'onboarding_status', 'present_address',
    'permanent_address', 'aadhaar', 'pan', 'uan', 'added_by', 'modified_by', 'added_time',
    'modified_time', 'pf_number', 'esic_ip_number'
  ];

  const dropdownOptions = {
    user_role: ['Admin', 'HR', 'Manager', 'Employee'],
    employment_type: ['Full Time', 'Part Time', 'Intern'],
    employee_status: ['Active', 'Inactive'],
    gender: ['Male', 'Female', 'Prefer not to mention'],
    marital_status: ['Married', 'Unmarried'],
    work_from: ['office', 'home'],
    onboarding_status: ['Completed', 'Pending', 'In Progress']
  };

  if (loading || !initialValues) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppNavbar />
        <Grid container sx={{ flexGrow: 1 }}>
          <Grid item>
            <DynamicSidebar />
          </Grid>
          <Grid item xs sx={{ p: 2, textAlign: 'center', mt: 5 }}>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <CircularProgress />
            )}
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box className="bg-light" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppNavbar />
      <Grid container sx={{ flexGrow: 1 }}>
        <Grid item>
          <DynamicSidebar />
        </Grid>
        <Grid item xs sx={{ p: 2 }}>
          <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                maxHeight: '90vh',
                minWidth: { xs: '90vw', sm: '80vw', md: '600px' },
              },
            }}
          >
            <DialogTitle>
              <Typography variant="h5">Update Employee</Typography>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ overflowY: 'auto', p: 3 }}>
              <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    {fields.map((field) => {
                      const label = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <Box key={field} sx={{ mb: 2 }}>
                          <Field name={field}>
                            {({ field: formikField, meta }) => (
                              <>
                                {dropdownOptions[field] ? (
                                  <TextField
                                    select
                                    label={label}
                                    {...formikField}
                                    fullWidth
                                    variant="outlined"
                                    error={Boolean(meta.touched && meta.error)}
                                    helperText={<ErrorMessage name={field} />}
                                  >
                                    <MenuItem value="">Select {label}</MenuItem>
                                    {dropdownOptions[field].map((option) => (
                                      <MenuItem key={option} value={option}>
                                        {option}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                ) : (
                                  <TextField
                                    label={label}
                                    {...formikField}
                                    fullWidth
                                    variant="outlined"
                                    type={
                                      field === 'added_time' || field === 'modified_time'
                                        ? 'datetime-local'
                                        : field.includes('date')
                                        ? 'date'
                                        : field === 'age'
                                        ? 'number'
                                        : 'text'
                                    }
                                    InputLabelProps={
                                      (field === 'added_time' || field === 'modified_time' || field.includes('date'))
                                        ? { shrink: true }
                                        : undefined
                                    }
                                    error={Boolean(meta.touched && meta.error)}
                                    helperText={<ErrorMessage name={field} />}
                                  />
                                )}
                              </>
                            )}
                          </Field>
                        </Box>
                      );
                    })}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Updating...' : 'Update'}
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Footer />
    </Box>
  );
};

export default EmployeeUForm;
