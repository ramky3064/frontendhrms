import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, FormControl, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Snackbar, Alert } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppNavbar from './Hrmnav';
import DynamicSidebar from './Sidebar';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// Component for editing and viewing payslips
const PayslipEdit = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payslipData, setPayslipData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // State for pagination
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const navigate = useNavigate();

  // Handle Snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Retrieve token and employee ID from storage, aligned with OTPPage.jsx
  const getTokenAndEmpId = async () => {
    let empId = sessionStorage.getItem('empId');
    let token = localStorage.getItem(`token_${empId}`);

    console.log('getTokenAndEmpId - Initial empId:', empId);
    console.log('getTokenAndEmpId - Initial token:', token ? '[present]' : '[missing]');

    if (!token && !empId) {
      const fallbackToken = localStorage.getItem('token');
      console.log('getTokenAndEmpId - Fallback token:', fallbackToken ? '[present]' : '[missing]');
      if (fallbackToken) {
        try {
          const decoded = jwtDecode(fallbackToken);
          empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
          token = fallbackToken;
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem('empId', empId);
          console.log('getTokenAndEmpId - Using fallback token, new empId:', empId);
        } catch (error) {
          console.error('getTokenAndEmpId - Error decoding fallback token:', error);
          empId = md5(fallbackToken);
          token = fallbackToken;
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem('empId', empId);
          console.log('getTokenAndEmpId - Fallback token decode failed, using md5 empId:', empId);
        }
      }
    }

    if (!token || !empId) {
      const errorMessage = 'Token or employee ID missing. Please log in again.';
      console.error('getTokenAndEmpId -', errorMessage);
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      navigate('/login');
      return { token: null, empId: null };
    }

    // Validate token expiration
    try {
      const decoded = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      console.log('getTokenAndEmpId - Token decoded:', decoded);
      console.log('getTokenAndEmpId - Current time:', currentTime, 'Token exp:', decoded.exp);

      if (decoded.exp && decoded.exp < currentTime) {
        console.warn('getTokenAndEmpId - Token expired, attempting to refresh...');
        try {
          const response = await axios.post(`${API_URL}/refresh_token`, {}, {
            headers: { Authorization: token },
          });
          const newToken = response.data.token;
          if (!newToken) {
            throw new Error('No token received from refresh endpoint');
          }
          token = newToken;
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem('empId', empId);
          console.log('getTokenAndEmpId - Token refreshed successfully:', token ? '[present]' : '[missing]');
        } catch (refreshError) {
          console.error('getTokenAndEmpId - Error refreshing token:', refreshError);
          const errorMessage = 'Session expired. Please log in again.';
          setError(errorMessage);
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
          localStorage.removeItem(`token_${empId}`);
          localStorage.removeItem('token');
          sessionStorage.removeItem('empId');
          navigate('/login');
          return { token: null, empId: null };
        }
      }
    } catch (error) {
      console.error('getTokenAndEmpId - Error decoding token:', error);
      const errorMessage = 'Invalid token. Please log in again.';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      localStorage.removeItem(`token_${empId}`);
      localStorage.removeItem('token');
      sessionStorage.removeItem('empId');
      navigate('/login');
      return { token: null, empId: null };
    }

    console.log('getTokenAndEmpId - Final token:', token ? '[present]' : '[missing]');
    console.log('getTokenAndEmpId - Final empId:', empId);
    return { token, empId };
  };

  // Formik validation schema
  const validationSchema = Yup.object({
    monthly_pay: Yup.number()
      .required('Monthly pay is required')
      .min(0, 'Monthly pay cannot be negative'),
    pay_period: Yup.string()
      .required('Pay period is required')
      .matches(/^\d{4}-\d{2}$/, 'Pay period must be in YYYY-MM format'),
    bank_name: Yup.string()
      .required('Bank name is required')
      .min(1, 'Bank name cannot be empty'),
    bank_account_no: Yup.string()
      .required('Bank account number is required')
      .min(1, 'Bank account number cannot be empty'),
    payment_status: Yup.string()
      .required('Payment status is required')
      .oneOf(['Paid', 'Pending'], 'Payment status must be Paid or Pending'),
  });

  // Formik setup for form handling
  const formik = useFormik({
    initialValues: {
      monthly_pay: 0,
      pay_period: month,
      basic_salary: 0,
      house_rent_allowance: 0,
      conveyance_allowance: 0,
      other_allowance: 0,
      provident_fund: 0,
      esic: 0,
      tds: 0,
      professional_tax: 0,
      total_deductions: 0,
      monthly_net_pay: 0,
      gross_earnings: 0,
      lop_deduction: 0,
      effective_workdays: 0,
      lop_days: 0,
      total_days_in_month: 0,
      bank_name: '',
      bank_account_no: '',
      payment_status: 'Pending',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const { token } = await getTokenAndEmpId();
      if (!token || !selectedEmployee) {
        console.error('onSubmit - Skipping payslip update: No token or selected employee');
        setError('Cannot update payslip: Missing token or employee selection');
        setSnackbar({ open: true, message: 'Cannot update payslip: Missing token or employee selection', severity: 'error' });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const payload = {
          monthly_pay: Number(values.monthly_pay) || 0,
          pay_period: values.pay_period,
          bank_name: values.bank_name || 'N/A',
          bank_account_no: values.bank_account_no || 'N/A',
          payment_status: values.payment_status || 'Pending',
        };
        console.log('onSubmit - Submitting payload:', payload);
        const response = await axios.put(
          `${API_URL}/payslips/${selectedEmployee.employee_id}/${month}`,
          payload,
          { headers: { Authorization: token } }
        );
        console.log('onSubmit - Update response:', response.data);
        fetchPayslip();
        setSnackbar({ open: true, message: 'Payslip updated successfully', severity: 'success' });
      } catch (err) {
        console.error('onSubmit - Error updating payslip:', err);
        let errorMessage = 'Failed to update payslip: ' + (err.response?.data?.error || err.response?.data?.database || err.message);
        if (err.response?.status === 401) {
          errorMessage = 'Unauthorized access. Please log in again.';
          navigate('/login');
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to update payslips. Admin or HR access required.';
          navigate('/');
        } else if (err.response?.status === 404) {
          errorMessage = 'Payslip not found for this employee and month.';
        } else if (err.response?.status === 500) {
          errorMessage = 'Server error occurred. Please try again or contact support.';
        } else if (err.code === 'ERR_NETWORK') {
          errorMessage = 'Network error: Unable to reach the server. Please check if the server is running.';
        }
        setError(errorMessage);
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch employees for dropdown with role check
  useEffect(() => {
    const fetchEmployees = async () => {
      const userRole = localStorage.getItem('userRole');
      if (!['Admin', 'HR'].includes(userRole)) {
        const errorMessage = 'You do not have permission to access this page. Admin or HR access required.';
        console.error('fetchEmployees -', errorMessage);
        setError(errorMessage);
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        navigate('/');
        return;
      }

      const { token } = await getTokenAndEmpId();
      if (!token) {
        console.error('fetchEmployees - Skipping: No valid token');
        setError('Cannot fetch employees: No valid token');
        setSnackbar({ open: true, message: 'Cannot fetch employees: Please log in again', severity: 'error' });
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('fetchEmployees - Sending request to /api/employees with token:', token ? '[present]' : '[missing]');
        const response = await axios.get(`${API_URL}/employees`, {
          headers: { Authorization: token },
        });
        console.log('fetchEmployees - Employees fetched:', response.data);
        setEmployees(response.data.employees || []);
        if (response.data.employees.length === 0) {
          setError('No employees found.');
          setSnackbar({ open: true, message: 'No employees found.', severity: 'warning' });
        }
      } catch (err) {
        console.error('fetchEmployees - Error fetching employees:', err);
        let errorMessage = 'Failed to fetch employees: ' + (err.response?.data?.error || err.message);
        if (err.response?.status === 401) {
          errorMessage = 'Unauthorized access. Please log in again.';
          navigate('/login');
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to view employees. Admin or HR access required.';
          navigate('/');
        } else if (err.response?.status === 500) {
          errorMessage = 'Server error occurred. Please try again or contact support.';
        } else if (err.code === 'ERR_NETWORK') {
          errorMessage = 'Network error: Unable to reach the server. Please check if the server is running.';
        }
        setError(errorMessage);
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [navigate]);

  // Fetch payslip data when employee or month changes
  useEffect(() => {
    if (selectedEmployee && month) {
      fetchPayslip();
    }
  }, [selectedEmployee, month]);

  const fetchPayslip = async () => {
    const { token } = await getTokenAndEmpId();
    if (!token || !selectedEmployee) {
      console.error('fetchPayslip - Skipping: No token or selected employee');
      setError('Cannot fetch payslip: Missing token or employee selection');
      setSnackbar({ open: true, message: 'Cannot fetch payslip: Please log in again or select an employee', severity: 'error' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('fetchPayslip - Sending request to /api/manage_payslip with token:', token ? '[present]' : '[missing]');
      const response = await axios.get(`${API_URL}/manage_payslip`, {
        params: { employee_id: selectedEmployee.employee_id, month },
        headers: { Authorization: token },
      });
      console.log('fetchPayslip - Payslip fetched:', response.data);
      const data = response.data;
      setPayslipData(data);
      formik.setValues({
        monthly_pay: Number(data.monthly_pay) || 0,
        pay_period: data.pay_period || month,
        basic_salary: Number(data.basic_salary) || 0,
        house_rent_allowance: Number(data.house_rent_allowance) || 0,
        conveyance_allowance: Number(data.conveyance_allowance) || 0,
        other_allowance: Number(data.other_allowance) || 0,
        provident_fund: Number(data.provident_fund) || 0,
        esic: Number(data.esic) || 0,
        tds: Number(data.tds) || 0,
        professional_tax: Number(data.professional_tax) || 0,
        total_deductions: Number(data.total_deductions) || 0,
        monthly_net_pay: Number(data.monthly_net_pay) || 0,
        gross_earnings: Number(data.gross_earnings) || 0,
        lop_deduction: Number(data.lop_deduction) || 0,
        effective_workdays: Number(data.effective_workdays) || 0,
        lop_days: Number(data.lop_days) || 0,
        total_days_in_month: Number(data.total_days_in_month) || 0,
        bank_name: data.bank_name || 'N/A',
        bank_account_no: data.bank_account_no || 'N/A',
        payment_status: data.payment_status || 'Pending',
      });
    } catch (err) {
      console.error('fetchPayslip - Error fetching payslip:', err);
      let errorMessage = 'Failed to fetch payslip: ' + (err.response?.data?.error || err.message);
      if (err.response?.status === 401) {
        errorMessage = 'Unauthorized access. Please log in again.';
        navigate('/login');
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view payslips. Admin or HR access required.';
        navigate('/');
      } else if (err.response?.status === 404) {
        errorMessage = 'No payslip data found for this employee and month. Please create a new payslip.';
        setPayslipData(null);
        formik.resetForm();
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again or contact support.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Unable to reach the server. Please check if the server is running.';
      }
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button to reset form
  const handleCancel = () => {
    fetchPayslip(); // Reset form to original data
  };

  // Internal CSS styles
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
      minHeight: '50px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
      color: '#2d3436',
      fontSize: '2rem',
      fontWeight: '700',
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
    },
    inputGroup: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      marginBottom: '20px',
    },
    dropdownButton: {
      maxWidth: '400px',
      borderRadius: '8px',
      border: '2px solid rgb(178, 225, 215)',
      padding: '8px',
      fontSize: '1rem',
      backgroundColor: '#dfe6e9',
      color: '#2d3436',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    },
    monthInput: {
      maxWidth: '180px',
      borderRadius: '8px',
      border: '2px solid #00b894',
      padding: '8px',
      fontSize: '1rem',
      backgroundColor: '#dfe6e9',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    },
    formContainer: {
      padding: '20px',
      borderRadius: '8px',
      background: '#fff',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
      marginBottom: '20px',
      width: '100%',
    },
    formGroup: {
      marginBottom: '15px',
    },
    formLabel: {
      color: '#2c2c54',
      fontWeight: '600',
      fontSize: '1rem',
      marginBottom: '6px',
    },
    formControl: {
      border: '2px solid #6c5ce7',
      borderRadius: '8px',
      padding: '8px',
      fontSize: '1rem',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    },
    formError: {
      color: '#ff7675',
      fontSize: '0.8rem',
      marginTop: '4px',
      background: 'rgba(255, 118, 117, 0.2)',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '20px',
    },
    saveButton: {
      background: 'rgba(114, 228, 26, 0.86)',
      border: 'none',
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#fff',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    cancelButton: {
      background: 'rgba(237, 45, 45, 0.77)',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#fff',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    error: {
      color: '#ff7675',
      textAlign: 'center',
      fontSize: '1rem',
      fontWeight: '600',
      background: 'rgba(255, 118, 117, 0.2)',
      padding: '8px',
      borderRadius: '8px',
      marginBottom: '15px',
    },
    loading: {
      textAlign: 'center',
      fontSize: '1.1rem',
      color: '#00b894',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    spinner: {
      border: '3px solid #00b894',
      borderTop: '3px solid #fff',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      animation: 'spin 1s linear infinite',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '500px',
      marginTop: '20px',
    },
    paginationButton: {
      background: 'rgba(114, 5, 5, 0.9)',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#fff',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
    },
    paginationButtonDisabled: {
      background: 'rgba(155, 69, 69, 0.9)',
      cursor: 'not-allowed',
    },
  };

  // Inline keyframes for spinner animation, dropdown scroll, and search input
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .dropdown-menu {
      max-height: 300px;
      overflow-y: auto;
      width: auto;
      padding: 10px;
    }
    .search-input {
      margin-bottom: 8px;
      border: 2px solid #6c5ce7;
      border-radius: 8px;
      padding: 8px;
      font-size: 1rem;
      width: 100%;
    }
  `;

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) =>
    `${emp.employee_name} (ID: ${emp.employee_id})`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Render form fields based on current page
  const renderFormFields = () => {
    if (currentPage === 1) {
      return (
        <>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Monthly Pay (₹)</Form.Label>
              <FormControl
                type="number"
                name="monthly_pay"
                value={formik.values.monthly_pay}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.monthly_pay && formik.errors.monthly_pay}
                min="0"
                step="0.01"
                style={styles.formControl}
                className="form-control"
                disabled={loading}
              />
              {formik.touched.monthly_pay && formik.errors.monthly_pay && (
                <div style={styles.formError}>{formik.errors.monthly_pay}</div>
              )}
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Pay Period</Form.Label>
              <FormControl
                type="text"
                name="pay_period"
                value={formik.values.pay_period}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.pay_period && formik.errors.pay_period}
                style={styles.formControl}
                className="form-control"
                placeholder="YYYY-MM"
                disabled={loading}
              />
              {formik.touched.pay_period && formik.errors.pay_period && (
                <div style={styles.formError}>{formik.errors.pay_period}</div>
              )}
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Basic Salary (₹)</Form.Label>
              <FormControl
                type="number"
                name="basic_salary"
                value={formik.values.basic_salary}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>House Rent Allowance (₹)</Form.Label>
              <FormControl
                type="number"
                name="house_rent_allowance"
                value={formik.values.house_rent_allowance}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Conveyance Allowance (₹)</Form.Label>
              <FormControl
                type="number"
                name="conveyance_allowance"
                value={formik.values.conveyance_allowance}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Other Allowance (₹)</Form.Label>
              <FormControl
                type="number"
                name="other_allowance"
                value={formik.values.other_allowance}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Provident Fund (₹)</Form.Label>
              <FormControl
                type="number"
                name="provident_fund"
                value={formik.values.provident_fund}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>ESIC Contribution (₹)</Form.Label>
              <FormControl
                type="number"
                name="esic"
                value={formik.values.esic}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>TDS (₹)</Form.Label>
              <FormControl
                type="number"
                name="tds"
                value={formik.values.tds}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Professional Tax (₹)</Form.Label>
              <FormControl
                type="number"
                name="professional_tax"
                value={formik.values.professional_tax}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Bank Name</Form.Label>
              <FormControl
                type="text"
                name="bank_name"
                value={formik.values.bank_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.bank_name && formik.errors.bank_name}
                style={styles.formControl}
                className="form-control"
                placeholder="Enter bank name"
                disabled={loading}
              />
              {formik.touched.bank_name && formik.errors.bank_name && (
                <div style={styles.formError}>{formik.errors.bank_name}</div>
              )}
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Bank Account Number</Form.Label>
              <FormControl
                type="text"
                name="bank_account_no"
                value={formik.values.bank_account_no}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.bank_account_no && formik.errors.bank_account_no}
                style={styles.formControl}
                className="form-control"
                placeholder="Enter bank account number"
                disabled={loading}
              />
              {formik.touched.bank_account_no && formik.errors.bank_account_no && (
                <div style={styles.formError}>{formik.errors.bank_account_no}</div>
              )}
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Payment Status</Form.Label>
              <FormControl
                as="select"
                name="payment_status"
                value={formik.values.payment_status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isInvalid={formik.touched.payment_status && formik.errors.payment_status}
                style={styles.formControl}
                className="form-control"
                disabled={loading}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </FormControl>
              {formik.touched.payment_status && formik.errors.payment_status && (
                <div style={styles.formError}>{formik.errors.payment_status}</div>
              )}
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Total Deductions (₹)</Form.Label>
              <FormControl
                type="number"
                name="total_deductions"
                value={formik.values.total_deductions}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Monthly Net Pay (₹)</Form.Label>
              <FormControl
                type="number"
                name="monthly_net_pay"
                value={formik.values.monthly_net_pay}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Gross Earnings (₹)</Form.Label>
              <FormControl
                type="number"
                name="gross_earnings"
                value={formik.values.gross_earnings}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>LOP Deduction (₹)</Form.Label>
              <FormControl
                type="number"
                name="lop_deduction"
                value={formik.values.lop_deduction}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Effective Workdays</Form.Label>
              <FormControl
                type="number"
                name="effective_workdays"
                value={formik.values.effective_workdays}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
          <div style={styles.formRow}>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>LOP Days</Form.Label>
              <FormControl
                type="number"
                name="lop_days"
                value={formik.values.lop_days}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Total Days in Month</Form.Label>
              <FormControl
                type="number"
                name="total_days_in_month"
                value={formik.values.total_days_in_month}
                readOnly
                style={styles.formControl}
                className="form-control"
              />
            </Form.Group>
          </div>
        </>
      );
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppNavbar />
        <div style={{ display: 'flex', flexGrow: 1 }}>
          <DynamicSidebar />
          <div style={{ flexGrow: 1, padding: '20px', marginTop: '60px' }}>
            <div style={styles.container}>
              <h2 style={styles.header}>Edit Payslip</h2>

              {/* Employee and Month Selection */}
              <div style={styles.inputGroup}>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    style={styles.dropdownButton}
                    className="dropdown-button"
                    disabled={loading}
                  >
                    {selectedEmployee ? `${selectedEmployee.employee_name} (ID: ${selectedEmployee.employee_id})` : 'Select Employee'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <FormControl
                      type="text"
                      placeholder="Search employee..."
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ marginBottom: '8px' }}
                    />
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <Dropdown.Item
                          key={emp.employee_id}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setSearchQuery(''); // Clear search query on selection
                          }}
                        >
                          {emp.employee_name} (ID: {emp.employee_id})
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>No employees found</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                <FormControl
                  type="month"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    formik.setFieldValue('pay_period', e.target.value);
                  }}
                  style={styles.monthInput}
                  className="month-input"
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && <div style={styles.error}>{error}</div>}

              {/* Loading Indicator */}
              {loading && (
                <div style={styles.loading}>
                  <div style={styles.spinner}></div>Loading...
                </div>
              )}

              {/* Payslip Form */}
              {payslipData && (
                <div style={styles.formContainer}>
                  <Form onSubmit={formik.handleSubmit}>
                    {renderFormFields()}
                    <div style={styles.pagination}>
                      <Button
                        style={{
                          ...styles.paginationButton,
                          ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                        }}
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        style={{
                          ...styles.paginationButton,
                          ...(currentPage === 2 ? styles.paginationButtonDisabled : {}),
                        }}
                        onClick={() => setCurrentPage(2)}
                        disabled={currentPage === 2}
                      >
                        Next
                      </Button>
                    </div>
                    <div style={styles.buttonGroup}>
                      <Button
                        variant="success"
                        type="submit"
                        style={styles.saveButton}
                        disabled={!formik.isValid || formik.isSubmitting || loading || !selectedEmployee}
                        className="save-button"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleCancel}
                        style={styles.cancelButton}
                        disabled={loading || !selectedEmployee}
                        className="cancel-button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
              <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                  {snackbar.message}
                </Alert>
              </Snackbar>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayslipEdit;