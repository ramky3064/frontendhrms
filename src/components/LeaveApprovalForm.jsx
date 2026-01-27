import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, IconButton, Box, Typography, Badge, Snackbar, Alert } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const LeaveApprovalForm = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleOpen = () => {
    const userRole = localStorage.getItem('userRole');
    if (!['manager', 'hr', 'admin'].includes(userRole)) {
      setSnackbarMessage('Only Manager, HR, or Admin can view pending leave requests');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchRequests = async () => {
      const token = getToken();
      const managerEmpId = sessionStorage.getItem('empId');
      if (!token || !managerEmpId) {
        setError('Please log in to view leave requests');
        setSnackbarMessage('Please log in to view leave requests');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/pending_leave_requests/${managerEmpId}`, {
          headers: { Authorization: token },
        });
        setRequests(response.data.requests || []);
        setError('');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch leave requests';
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    if (open) {
      fetchRequests();
    }
  }, [open]);

  const handleAction = async (leaveId, action) => {
    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to process this request');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/update_leave_status/${leaveId}`,
        { status: action },
        { headers: { Authorization: token } }
      );
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRequests(prev => prev.filter(req => req.id !== leaveId));
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} leave request`;
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleViewDocument = async (leaveId) => {
    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to view document');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/get_leave_document/${leaveId}`, {
        headers: { Authorization: token },
        responseType: 'blob',
      });
      const mimeType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch document';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="relative">
      <IconButton
        onClick={handleOpen}
        className="fixed top-4 right-4"
        color="primary"
        title="View Leave Requests"
      >
        <Badge badgeContent={requests.length} color="error" showZero>
          <Notifications className="text-blue-600 hover:text-blue-800" style={{ fontSize: '2rem' }} />
        </Badge>
      </IconButton>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="leave-requests-modal"
        aria-describedby="leave-requests-inbox"
      >
        <Box sx={modalStyle}>
          <Typography id="leave-requests-modal" variant="h5" component="h2" className="text-center mb-4 font-bold">
            Leave Request Inbox
          </Typography>
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
          <div className="space-y-4">
            {requests.length === 0 && !error && <p className="text-center">No pending leave requests</p>}
            {error && <p className="text-center text-red-600">{error}</p>}
            {requests.map((req) => (
              <div key={req.id} className="p-4 border rounded-md bg-gray-50">
                <p><strong>Request ID:</strong> {req.id}</p>
                <p><strong>Employee:</strong> {req.first_name} {req.last_name} ({req.emp_id})</p>
                <p><strong>Leave Type:</strong> {req.leave_type}</p>
                <p><strong>Used Leave Type:</strong> {req.used_leave_type}</p>
                <p><strong>Start Date:</strong> {req.start_date}</p>
                <p><strong>End Date:</strong> {req.end_date}</p>
                <p><strong>Days:</strong> {req.days}</p>
                <p><strong>Reason:</strong> {req.reason}</p>
                <p><strong>Status:</strong> {req.status}</p>
                {req.document_type && (
                  <p>
                    <strong>Document:</strong>{' '}
                    <button
                      className="text-blue-600 underline"
                      onClick={() => handleViewDocument(req.id)}
                    >
                      View Document ({req.document_type})
                    </button>
                  </p>
                )}
                <div className="mt-2 flex items-center space-x-4">
                  <Button
                    variant="success"
                    onClick={() => handleAction(req.id, 'approved')}
                    className="px-4 py-2"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="px-4 py-2"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default LeaveApprovalForm;
