import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Modal, Box, Typography, Badge, Snackbar, Alert, Fab, Tooltip,
  Card, CardContent, CardActions, Button, Checkbox, FormControlLabel,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress
} from '@mui/material';
import { Notifications, Close as CloseIcon } from '@mui/icons-material';

const NOTIFICATION_SOUND = '/notification.wav';
const API_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "");

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
  maxWidth: '960px',
  backgroundColor: 'white',
  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
  padding: '2.5rem',
  borderRadius: '1.5rem',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const ManagerInbox = () => {
  const [requests, setRequests] = useState([]);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [error, setError] = useState('');
  const [permanentSelections, setPermanentSelections] = useState({});
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentRequestIds, setCurrentRequestIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevRequestIds = useRef(new Set());
  const audioRef = useRef(null);
  const isInitialFetch = useRef(true);

  const handleOpen = () => {
    setOpen(true);
    setNewRequestCount(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  const handleClose = () => setOpen(false);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleRejectDialogOpen = (requestIds) => {
    setCurrentRequestIds(Array.isArray(requestIds) ? requestIds : [requestIds]);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectReason('');
    setCurrentRequestIds([]);
  };

  const fetchRequests = async () => {
    const token = getToken();
    if (!token) {
      setError('Please log in to view requests');
      setSnackbarMessage('Please log in to view requests');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/wfh_requests`, {
        headers: { Authorization: token },
      });
      const newRequests = response.data;
      const newRequestIds = new Set(newRequests.map(req => req.request_id));

      if (!isInitialFetch.current) {
        const addedRequests = newRequests.filter(req => !prevRequestIds.current.has(req.request_id));
        if (addedRequests.length > 0) {
          console.log('New requests detected:', addedRequests.length, 'Total newRequestCount:', newRequestCount + addedRequests.length);
          setNewRequestCount(prev => prev + addedRequests.length);
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('Error playing notification sound:', err);
              setSnackbarMessage('Notification sound blocked by browser. Please interact with the page first.');
              setSnackbarSeverity('warning');
              setSnackbarOpen(true);
            });
          }
        }
      }

      prevRequestIds.current = newRequestIds;
      isInitialFetch.current = false;

      setRequests(newRequests);
      setError('');
      setSelectedRequests(prev => prev.filter(id => newRequestIds.has(id)));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch requests';
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.load();
    audioRef.current.onerror = () => {
      console.error('Failed to load notification sound');
      setSnackbarMessage('Failed to load notification sound file');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    };

    fetchRequests();
    const intervalId = setInterval(fetchRequests, 3000);
    return () => {
      clearInterval(intervalId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handleAction = async (requestId, action, reason = '') => {
    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to process this request');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const isPermanent = permanentSelections[requestId] || false;
      const payload = { action, is_permanent: isPermanent };
      if (action === 'reject') {
        if (!reason) {
          setSnackbarMessage('Please provide a reason for rejection');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          return;
        }
        payload.reject_reason = reason;
      }
      const response = await axios.post(
        `${API_URL}/wfh_request/${requestId}/action`,
        payload,
        { headers: { Authorization: token } }
      );
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRequests(prev => prev.filter(req => req.request_id !== requestId));
      setPermanentSelections(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
      if (action === 'reject') {
        handleRejectDialogClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} request`;
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleBulkAction = async (action, requestIds = selectedRequests) => {
    if (action === 'reject') {
      handleRejectDialogOpen(requestIds);
      return;
    }

    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to process requests');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const promises = requestIds.map(requestId => {
        const isPermanent = permanentSelections[requestId] || false;
        return axios.post(
          `${API_URL}/wfh_request/${requestId}/action`,
          { action, is_permanent: isPermanent },
          { headers: { Authorization: token } }
        );
      });

      await Promise.all(promises);
      setSnackbarMessage(`Successfully ${action}d ${requestIds.length} request(s)`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRequests(prev => prev.filter(req => !requestIds.includes(req.request_id)));
      setPermanentSelections(prev => {
        const updated = { ...prev };
        requestIds.forEach(id => delete updated[id]);
        return updated;
      });
      setSelectedRequests([]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} selected requests`;
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleBulkRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setSnackbarMessage('Please provide a reason for rejection');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const token = getToken();
    if (!token) {
      setSnackbarMessage('Please log in to process requests');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const promises = currentRequestIds.map(requestId => {
        const isPermanent = permanentSelections[requestId] || false;
        return axios.post(
          `${API_URL}/wfh_request/${requestId}/action`,
          { action: 'reject', is_permanent: isPermanent, reject_reason: rejectReason },
          { headers: { Authorization: token } }
        );
      });

      await Promise.all(promises);
      setSnackbarMessage(`Successfully rejected ${currentRequestIds.length} request(s)`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRequests(prev => prev.filter(req => !currentRequestIds.includes(req.request_id)));
      setPermanentSelections(prev => {
        const updated = { ...prev };
        currentRequestIds.forEach(id => delete updated[id]);
        return updated;
      });
      setSelectedRequests(prev => prev.filter(id => !currentRequestIds.includes(id)));
      handleRejectDialogClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reject selected requests';
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(req => req.request_id));
    }
  };

  const togglePermanent = (requestId) => {
    setPermanentSelections(prev => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const toggleSelectRequest = (requestId) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <Tooltip title="View WFH Requests" arrow>
        <Fab
          color="primary"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 156,
            right: 20,
            zIndex: 1000,
            backgroundColor: '#1d4ed8',
            '&:hover': { backgroundColor: '#1e40af' },
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          <Badge
            badgeContent={newRequestCount}
            color="error"
            invisible={newRequestCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#2772a0',
                color: '#ffffff',
              },
            }}
          >
            <Notifications className="text-white" sx={{ fontSize: 28 }} />
          </Badge>
        </Fab>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="wfh-requests-modal"
        aria-describedby="wfh-requests-inbox"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              id="wfh-requests-modal"
              variant="h4"
              component="h2"
              className="text-center font-extrabold text-gray-900 tracking-tight"
            >
              Work-From-Home Requests
            </Typography>
            <IconButton onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{
                width: '100%',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '1rem',
                padding: '1rem',
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleSelectAll}
              disabled={requests.length === 0}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'medium',
                backgroundColor: '#0288d1',
                '&:hover': { backgroundColor: '#0277bd' },
              }}
            >
              {selectedRequests.length === requests.length && requests.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleBulkAction('approve')}
              disabled={selectedRequests.length === 0}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'medium',
                backgroundColor: '#16a34a',
                '&:hover': { backgroundColor: '#15803d' },
              }}
            >
              Approve Selected
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleBulkAction('reject')}
              disabled={selectedRequests.length === 0}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'medium',
                backgroundColor: '#dc2626',
                '&:hover': { backgroundColor: '#b91c1c' },
              }}
            >
              Reject Selected
            </Button>
          </Box>
          <div className="space-y-2">
            {requests.length === 0 && !error && (
              <Card sx={{ backgroundColor: 'gray.50', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', mb: 5 }}>
                <CardContent>
                  <Typography variant="h6" className="text-center text-gray-500 font-medium">
                    No pending requests
                  </Typography>
                </CardContent>
              </Card>
            )}
            {requests.map((req) => (
              <Card
                key={req.request_id}
                sx={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  '&:hover': {
                    border: '2px dotted rgba(0,0,0,0.1)',
                  },
                }}
                className="mb-2"
              >
                <CardContent sx={{ padding: '1.5rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Checkbox
                      checked={selectedRequests.includes(req.request_id)}
                      onChange={() => toggleSelectRequest(req.request_id)}
                      color="primary"
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      <span className="font-semibold text-gray-900">Request ID:</span> {req.request_id}
                    </Typography>
                  </Box>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">Employee Name:</span> {req.employee_name || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">Employee ID:</span> {req.employee_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">Start Date:</span> {req.start_date}
                      </Typography>
                    </div>
                    <div className="space-y-2">
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">End Date:</span> {req.end_date || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">Reason:</span> {req.reason}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <span className="font-semibold text-gray-900">Status:</span>
                        <span
                          className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            req.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : req.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </Typography>
                    </div>
                  </div>
                </CardContent>
                <CardActions sx={{ padding: '0 1.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex space-x-2.5">
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleAction(req.request_id, 'approve')}
                      sx={{
                        marginRight: '1.2rem',
                        py: 1,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        backgroundColor: '#16a34a',
                        '&:hover': { backgroundColor: '#15803d' },
                      }}
                      className="mr-1.5"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleRejectDialogOpen(req.request_id)}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        backgroundColor: '#dc2626',
                        '&:hover': { backgroundColor: '#b91c1c' },
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permanentSelections[req.request_id] || false}
                        onChange={() => togglePermanent(req.request_id)}
                        color="primary"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                      />
                    }
                    label="Permanent WFH"
                    sx={{ margin: 0, '& .MuiTypography-root': { fontSize: '0.875rem', fontWeight: 'medium' } }}
                  />
                </CardActions>
              </Card>
            ))}
          </div>
        </Box>
      </Modal>

      <Dialog
        open={rejectDialogOpen}
        onClose={handleRejectDialogClose}
        aria-labelledby="reject-dialog-title"
        aria-describedby="reject-dialog-description"
      >
        <DialogTitle id="reject-dialog-title">Reason for Rejection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" id="reject-dialog-description">
            Please provide a reason for rejecting {currentRequestIds.length > 1 ? 'these requests' : 'this request'}.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleRejectDialogClose}
            sx={{
              textTransform: 'none',
              color: '#6b7280',
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkRejectConfirm}
            variant="contained"
            color="error"
            disabled={loading || !rejectReason.trim()}
            sx={{
              textTransform: 'none',
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" />
                Processing...
              </>
            ) : (
              'Confirm Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ManagerInbox;