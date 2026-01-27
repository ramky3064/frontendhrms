import React, { useState } from 'react';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
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
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const getToken = () => {
  const empId = sessionStorage.getItem('empId');
  if (!empId) {
    console.log('No empId found in sessionStorage');
    return '';
  }
  const token = localStorage.getItem(`token_${empId}`);
  console.log('Token for empId:', empId, token);
  return token || '';
};

const validationSchema = Yup.object({
  start_date: Yup.string().required('Start date is required'),
  end_date: Yup.string().required('End date is required'),
  reason: Yup.string().required('Reason is required'),
});

const EmployeeRequestForm = () => {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    start_date: '',
    end_date: '',
    reason: '',
  };

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to submit a request');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsSubmitting(false);
      return;
    }

    const formData = {
      ...values,
      emp_id: sessionStorage.getItem('empId') || '',
    };

    try {
      const response = await axios.post(`${API_URL}/wfh_request`, formData, {
        headers: { Authorization: token },
      });

      setSnackbarMessage(response.data.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      resetForm();
      setOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit WFH request';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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

  return (
    <>
      <Tooltip title="Request WFH" arrow>
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <HomeIcon />
        </Fab>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit WFH Request</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange }) => (
            <Form>
              <DialogContent dividers>
                <TextField
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
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpen(false)} color="secondary">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
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

export default EmployeeRequestForm;