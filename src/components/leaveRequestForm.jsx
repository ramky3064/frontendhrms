import React, { useState } from 'react';
import axios from 'axios';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Tooltip,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import  {jwtDecode}  from 'jwt-decode';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const getToken = () => {
  const empId = sessionStorage.getItem('empId');
  if (!empId) {
    console.log('No empId found in sessionStorage');
    return '';
  }
  console.log('Found empId:', empId);
  const token = localStorage.getItem(`token_${empId}`);
  if (token) {
    try {
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (decoded.exp < currentTime) {
        console.log('Token expired at:', new Date(decoded.exp * 1000).toISOString());
        localStorage.removeItem(`token_${empId}`);
        return '';
      }
      if (!decoded.sub) {
        console.log('Token missing sub');
        localStorage.removeItem(`token_${empId}`);
        return '';
      }
      console.log('Token valid for empId:', empId, 'Token (first 10 chars):', token.substring(0, 10));
      return token;
    } catch (error) {
      console.log('Invalid token format:', error.message);
      localStorage.removeItem(`token_${empId}`);
      return '';
    }
  }
  console.log('No token found for empId:', empId);
  return '';
};

const validationSchema = Yup.object({
  leave_type: Yup.string().required('Leave type is required'),
  start_date: Yup.string().required('Start date is required'),
  end_date: Yup.string().required('End date is required'),
  reason: Yup.string().required('Reason is required'),
  document: Yup.mixed().nullable(),
});

const LeaveRequestForm = () => {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const initialValues = {
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    document: null,
  };

  const handleSubmit = async (values, { resetForm, setFieldValue }) => {
    setIsSubmitting(true);
    const empId = sessionStorage.getItem('empId');
    const userRole = localStorage.getItem('userRole');
    const token = getToken();

    console.log('handleSubmit called with:', { empId, userRole, token: token ? token.substring(0, 10) : 'None' });

    if (!empId) {
      console.log('Missing empId, redirecting to login');
      setSnackbarMessage('No employee ID found. Please log in again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsSubmitting(false);
      return;
    }

    if (!token) {
      console.log('Missing token, redirecting to login');
      setSnackbarMessage('No valid token found. Please log in again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsSubmitting(false);
      // navigate('/login');
      return;
    }

    if (userRole !== 'Employee') {
      console.log('Invalid role:', userRole);
      setSnackbarMessage('Only employees can submit leave requests');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('leave_type', values.leave_type);
    formData.append('start_date', values.start_date);
    formData.append('end_date', values.end_date);
    formData.append('reason', values.reason);
    formData.append('emp_id', empId);
    if (values.document) {
      formData.append('document', values.document);
    }

    try {
      console.log('Sending request to /leave/apply_leave with token (first 10 chars):', token.substring(0, 10));
      const response = await axios.post(`${API_URL}/leave/apply_leave`, formData, {
        headers: {
          Authorization: token, // Raw token
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Request succeeded:', response.data);
      setSnackbarMessage(response.data.message || 'Leave applied successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      resetForm();
      setFileName('');
      setFieldValue('document', null);
      setOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit leave request';
      console.error('Request failed:', err.response?.status, errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      if (err.response?.status === 401 || errorMsg.includes('token')) {
        console.log('Token invalid/expired, clearing storage and redirecting to login');
        sessionStorage.removeItem('empId');
        localStorage.removeItem(`token_${empId}`);
        localStorage.removeItem('userRole');
        // navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setFileName('');
  };

  return (
    <>
      <Tooltip title="Request Leave" arrow>
        <Fab
          color="primary"
          onClick={() => {
            console.log('LeaveRequestForm Fab clicked');
            setOpen(true);
          }}
          disabled={open}
          aria-label="Request a leave"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1200,
          }}
        >
          <HomeIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleCancel}
        fullWidth
        maxWidth="sm"
        aria-labelledby="leave-request-dialog-title"
        sx={{ '& .MuiDialog-paper': { padding: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle id="leave-request-dialog-title">Submit Leave Request</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
                  id="leave_type"
                  select
                  name="leave_type"
                  label="Leave Type"
                  fullWidth
                  margin="normal"
                  value={values.leave_type || ''} // Ensure controlled input
                  onChange={handleChange}
                  error={touched.leave_type && Boolean(errors.leave_type)}
                  helperText={touched.leave_type && errors.leave_type}
                >
                  <MenuItem value="">Select Leave Type</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="casual">Casual Leave</MenuItem>
                  <MenuItem value="earned">Earned Leave</MenuItem>
                  <MenuItem value="maternity">Maternity Leave</MenuItem>
                  <MenuItem value="paternity">Paternity Leave</MenuItem>
                  <MenuItem value="bereavement">Bereavement Leave</MenuItem>
                  <MenuItem value="marriage">Marriage Leave</MenuItem>
                  <MenuItem value="relocation">Relocation Leave</MenuItem>
                </TextField>
                <TextField
                  id="start_date"
                  name="start_date"
                  label="Start Date"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  onChange={handleChange}
                  error={touched.start_date && Boolean(errors.start_date)}
                  helperText={touched.start_date && errors.start_date}
                />
                <TextField
                  id="end_date"
                  name="end_date"
                  label="End Date"
                  type="date"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  onChange={handleChange}
                  error={touched.end_date && Boolean(errors.end_date)}
                  helperText={touched.end_date && errors.end_date}
                />
                <TextField
                  id="reason"
                  name="reason"
                  label="Reason"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  onChange={handleChange}
                  error={touched.reason && Boolean(errors.reason)}
                  helperText={touched.reason && errors.reason}
                />
                <TextField
                  id="document"
                  name="document"
                  label="Upload Document (JPG/PDF, Optional)"
                  type="file"
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: '.jpg,.jpeg,.pdf' }}
                  onChange={(event) => {
                    const file = event.target.files[0];
                    setFieldValue('document', file);
                    setFileName(file ? file.name : '');
                  }}
                  error={touched.document && Boolean(errors.document)}
                  helperText={fileName || (touched.document && errors.document)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancel} color="secondary" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LeaveRequestForm;
