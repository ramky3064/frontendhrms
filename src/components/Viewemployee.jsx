import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import  {jwtDecode}  from 'jwt-decode';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';
import Footer from './Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ViewEmployee = () => {
  const { emp_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const fetchTokenAndEmployee = useCallback(async () => {
    try {
      const sessionEmpId = sessionStorage.getItem('empId');
      let token = sessionEmpId ? localStorage.getItem(`token_${sessionEmpId}`) : null;

      if (!sessionEmpId || !token) {
        console.warn("No session empId or token found for emp_id:", emp_id);
        try {
          const authResponse = await axios.post(`${API_URL}/request_auth_token`, {
            emp_id: emp_id,
          });

          if (authResponse.status === 200 && authResponse.data.token) {
            token = authResponse.data.token;
            localStorage.setItem(`token_${emp_id}`, token);
            sessionStorage.setItem('empId', emp_id);
          } else {
            setError('Failed to retrieve authentication token.');
            navigate("/loginpage", { replace: true });
            return;
          }
        } catch (authError) {
          console.error("Token fetch failed:", authError);
          setError('Authentication failed. Please log in.');
          navigate("/loginpage", { replace: true });
          return;
        }
      }

      let decoded;
      try {
        decoded = jwtDecode(token);
        const tokenEmpId = decoded.emp_id || decoded.sub || decoded.user_id;

        if (!tokenEmpId) {
          console.error("No emp_id in token");
          setError('Invalid token: No employee ID found. Please log in again.');
          localStorage.removeItem(`token_${sessionEmpId}`);
          sessionStorage.removeItem('empId');
          navigate("/loginpage", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Token decode failed:", err);
        setError('Invalid token. Please log in again.');
        localStorage.removeItem(`token_${sessionEmpId}`);
        sessionStorage.removeItem('empId');
        navigate("/loginpage", { replace: true });
        return;
      }

      const response = await axios.get(`${API_URL}/employee_details/${emp_id}`, {
        headers: {
          Authorization: token
        }
      });

      if (response.status === 200) {
        setEmployee(response.data.employee);
      } else {
        setError(response.data.message || 'Employee not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  }, [emp_id, navigate]);

  useEffect(() => {
    if (location.pathname === `/view-employee/${emp_id}`) {
      setOpen(true);
      fetchTokenAndEmployee();
    } else {
      setOpen(false);
    }
  }, [location.pathname, emp_id, fetchTokenAndEmployee]);

  const handleClose = () => {
    setOpen(false);
    navigate(-2);
  };

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
              <Typography variant="h5">Employee Details</Typography>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                {/* <CloseIcon /> */}
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ overflowY: 'auto', p: 3 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : employee ? (
                <Box>
                  {Object.entries(employee).map(([key, value]) => (
                    <Typography key={key} sx={{ mb: 1 }}>
                      <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography>No employee data available.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ViewEmployee;
