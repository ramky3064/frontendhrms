import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Button, Link, Snackbar, Alert
} from '@mui/material';
import {
  Email, Phone, Business, Groups, Person, Lock
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const SignupSchema = Yup.object().shape({
  firstName: Yup.string().required('First Name is required'),
  lastName: Yup.string().required('Last Name is required'),
  email: Yup.string().email('Invalid email').required('Work Email is required'),
  phone: Yup.string()
    .matches(/^\d+$/, 'Only numbers are allowed')
    .required('Phone Number is required'),
  company: Yup.string().required('Company Name is required'),
  employees: Yup.number()
    .typeError('Must be a number')
    .integer('Must be an integer')
    .min(1, 'Must be at least 1')
    .required('Number of Employees is required'),
  password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const SignupPageNew = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #667eea, #f7971e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 600, borderRadius: 3, boxShadow: 6, px: 4, py: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" fontWeight="bold">
            Company Registration
          </Typography>
          <Typography variant="body2" align="center" gutterBottom>
            Create your account
          </Typography>

          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              company: '',
              employees: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={SignupSchema}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              const payload = {
                first_name: values.firstName,
                last_name: values.lastName,
                work_email: values.email,
                phone_number: values.phone,
                company_name: values.company,
                number_of_employees: parseInt(values.employees, 10),
                password: values.password,
                confirm_password: values.confirmPassword,
              };

              axios
                .post(`${API_URL}/signup`, payload)
                .then((response) => {
                  setSnackbar({ open: true, message: 'Signed up Successfully', severity: 'success' });
                  console.log('Response:', response.data);
                  resetForm();
                  setTimeout(() => navigate('/'), 1500);
                })
                .catch((error) => {
                  setSnackbar({ 
                    open: true, 
                    message: 'Signup failed: ' + (error.response?.data?.message || 'Server error'), 
                    severity: 'error' 
                  });
                  console.error('Error:', error);
                })
                .finally(() => {
                  setSubmitting(false);
                });
            }}
          >
            {({
              values, errors, touched, handleChange,
              handleBlur, handleSubmit, isSubmitting
            }) => (
              <Form onSubmit={handleSubmit}>
                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    fullWidth margin="dense" name="firstName" label="First Name"
                    value={values.firstName} onChange={handleChange} onBlur={handleBlur}
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="primary" /></InputAdornment> }}
                  />
                  <TextField
                    fullWidth margin="dense" name="lastName" label="Last Name"
                    value={values.lastName} onChange={handleChange} onBlur={handleBlur}
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="primary" /></InputAdornment> }}
                  />
                </Box>

                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    fullWidth margin="dense" name="email" label="Work Email"
                    value={values.email} onChange={handleChange} onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email color="primary" /></InputAdornment> }}
                  />
                  <TextField
                    fullWidth margin="dense" name="phone" label="Phone Number"
                    value={values.phone}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      handleChange({ target: { name: 'phone', value: onlyNums } });
                    }}
                    onBlur={handleBlur}
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="primary" /></InputAdornment> }}
                  />
                </Box>

                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    fullWidth margin="dense" name="company" label="Company Name"
                    value={values.company} onChange={handleChange} onBlur={handleBlur}
                    error={touched.company && Boolean(errors.company)}
                    helperText={touched.company && errors.company}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Business color="primary" /></InputAdornment> }}
                  />
                  <TextField
                    fullWidth margin="dense" name="employees" label="Number of Employees"
                    type="number" inputProps={{ min: 1 }}
                    value={values.employees} onChange={handleChange} onBlur={handleBlur}
                    error={touched.employees && Boolean(errors.employees)}
                    helperText={touched.employees && errors.employees}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Groups color="primary" /></InputAdornment> }}
                  />
                </Box>

                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    fullWidth margin="dense" name="password" label="Password" type="password"
                    value={values.password} onChange={handleChange} onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment> }}
                  />
                  <TextField
                    fullWidth margin="dense" name="confirmPassword" label="Confirm Password" type="password"
                    value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="primary" /></InputAdornment> }}
                  />
                </Box>

                <Button
                  fullWidth type="submit" disabled={isSubmitting}
                  variant="contained" sx={{ mt: 2, backgroundColor: '#4f46e5', fontWeight: 'bold' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Form>
            )}
          </Formik>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              Already registered?{' '}
              <Link component={RouterLink} to="/" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignupPageNew;
