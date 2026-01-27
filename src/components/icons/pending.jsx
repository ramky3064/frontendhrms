import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Modal,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import 'bootstrap/dist/css/bootstrap.min.css';

// Set the base URL for axios
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// Path to notification sound
const NOTIFICATION_SOUND = '/notification.wav';

// Utility function to format date to 'Weekday, DD-MMM-YYYY'
const formatLeaveDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Invalid Date';
  }
};

// Utility function to format leave type for display
const formatLeaveType = (leaveType) => {
  if (!leaveType) return '-';
  return leaveType === 'compensatory_off'
    ? 'Compensatory Off'
    : leaveType.charAt(0).toUpperCase() + leaveType.slice(1);
};

// Utility function to format document type
const formatDocumentType = (docType) => {
  if (!docType) return 'No document';
  return docType.toUpperCase();
};

// Utility function to get token
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

const PendingLeaveRequest = ({ setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen, setPendingLeaveCount }) => {
  const [currentRequests, setCurrentRequests] = useState([]);
  const [futureRequests, setFutureRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [updatingStatuses, setUpdatingStatuses] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({
    url: null,
    type: null,
    error: null,
    loading: false,
  });
  const [searchParams, setSearchParams] = useState({
    employeeName: '',
  });
  const [highlightedEmployee, setHighlightedEmployee] = useState(null);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [snackbarOpen, setLocalSnackbarOpen] = useState(false);
  const [snackbarMessage, setLocalSnackbarMessage] = useState('');
  const [snackbarSeverity, setLocalSnackbarSeverity] = useState('info');
  const prevRequestIds = useRef(new Set());
  const isInitialFetch = useRef(true);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  // Initialize audioRef
  useEffect(() => {
    try {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
      audioRef.current.preload = 'auto';
    } catch (err) {
      console.error('Failed to initialize audio:', err);
      setLocalSnackbarMessage('Failed to load notification sound.');
      setLocalSnackbarSeverity('warning');
      setLocalSnackbarOpen(true);
      setSnackbarMessage('Failed to load notification sound.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  }, [setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  // Sync newRequestCount with parent pendingLeaveCount
  useEffect(() => {
    setPendingLeaveCount(newRequestCount);
  }, [newRequestCount, setPendingLeaveCount]);

  const handleCloseSnackbar = () => {
    setLocalSnackbarMessage('');
    setLocalSnackbarSeverity('info');
    setLocalSnackbarOpen(false);
    setSnackbarMessage('');
    setSnackbarSeverity('info');
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'info') => {
    setLocalSnackbarMessage(message);
    setLocalSnackbarSeverity(severity);
    setLocalSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleRetry = () => {
    setRetryTrigger(retryTrigger + 1);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
    setHighlightedEmployee(null);
  };

  const fetchPendingLeaveRequest = async (search = false) => {
    setLoading(true);
    setError('');
    setMessage('');
    setCurrentRequests([]);
    setFutureRequests([]);
    setHighlightedEmployee(null);

    try {
      const managerEmpId = sessionStorage.getItem('empId');
      const token = getToken();
      if (!managerEmpId || !token) {
        setError('No employee ID or token found. Please log in again.');
        showSnackbar('Please log in again.', 'error');
        setLoading(false);
        return;
      }

      let url = `/pending_leave_requests/${managerEmpId}`;
      if (search) {
        url += `?employeeName=${encodeURIComponent(searchParams.employeeName)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: token },
        timeout: 10000,
      });

      if (response.data.message === 'Pending leave requests retrieved successfully') {
        const currentYear = new Date('2025-08-13').getFullYear();
        const currentYearRequests = (response.data.current_year_requests || []).filter(
          (req) => new Date(req.start_date).getFullYear() === currentYear
        ).map((req) => ({
          ...req,
          leave_type: formatLeaveType(req.leave_type),
          used_leave_type: formatLeaveType(req.used_leave_type),
          applied_date: formatLeaveDate(req.applied_date),
          start_date: formatLeaveDate(req.start_date),
          end_date: formatLeaveDate(req.end_date),
          document_type: formatDocumentType(req.document_type),
        }));
        const futureYearRequests = [
          ...(response.data.current_year_requests || []).filter(
            (req) => new Date(req.start_date).getFullYear() > currentYear
          ),
          ...(response.data.future_year_requests || []),
        ].map((req) => ({
          ...req,
          leave_type: formatLeaveType(req.leave_type),
          used_leave_type: formatLeaveType(req.used_leave_type),
          applied_date: formatLeaveDate(req.applied_date),
          start_date: formatLeaveDate(req.start_date),
          end_date: formatLeaveDate(req.end_date),
          document_type: formatDocumentType(req.document_type),
        }));

        const newRequests = [...currentYearRequests, ...futureYearRequests];
        const newRequestIds = new Set(newRequests.map(req => req.id));

        if (!isInitialFetch.current && newRequestIds.size > prevRequestIds.current.size && audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('Error playing notification sound:', err);
            showSnackbar('Failed to play notification sound.', 'warning');
          });
        }

        prevRequestIds.current = newRequestIds;
        isInitialFetch.current = false;

        setCurrentRequests(currentYearRequests);
        setFutureRequests(futureYearRequests);
        setNewRequestCount(newRequests.length);
        showSnackbar(response.data.message, 'success');

        if (search && searchParams.employeeName) {
          const foundEmployee = newRequests.find(
            (req) =>
              `${req.first_name} ${req.last_name}`.toLowerCase() === searchParams.employeeName.toLowerCase() ||
              req.emp_id.toString() === searchParams.employeeName
          );
          setHighlightedEmployee(foundEmployee ? foundEmployee.id : null);
        }
      } else if (response.data.message === 'No pending leave requests found') {
        setMessage(response.data.message);
        setNewRequestCount(0);
        showSnackbar('No pending leave requests found.', 'info');
      } else {
        setError(response.data.message || 'Unexpected response from server.');
        showSnackbar(response.data.message || 'Failed to fetch pending leave requests.', 'error');
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        let errorMessage = err.response.data.message || 'Failed to fetch pending leave requests.';
        if (status === 401) {
          errorMessage = 'Invalid or missing authentication token. Please log in again.';
          showSnackbar(errorMessage, 'error');
          handleSessionExpiry();
        } else if (status === 403) {
          errorMessage = 'You are not authorized to view pending leave requests.';
          showSnackbar(errorMessage, 'error');
        } else if (status === 404) {
          errorMessage = 'No pending leave requests found.';
          setMessage(errorMessage);
          setNewRequestCount(0);
          showSnackbar(errorMessage, 'info');
        } else {
          showSnackbar(errorMessage, 'error');
        }
        setError(errorMessage);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
        showSnackbar('Request timed out. Please try again.', 'error');
      } else {
        setError('Unable to connect to the server. Please check your network or try again later.');
        showSnackbar('Network error. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkForNewRequests = async () => {
    try {
      const managerEmpId = sessionStorage.getItem('empId');
      const token = getToken();
      if (!managerEmpId || !token) return;

      const response = await axios.get(`/pending_leave_requests/${managerEmpId}`, {
        headers: { Authorization: token },
        timeout: 5000,
      });

      if (response.data.message === 'Pending leave requests retrieved successfully') {
        const currentYear = new Date('2025-08-13').getFullYear();
        const newCurrentYearRequests = (response.data.current_year_requests || []).filter(
          (req) => new Date(req.start_date).getFullYear() === currentYear
        ).map((req) => ({
          ...req,
          leave_type: formatLeaveType(req.leave_type),
          used_leave_type: formatLeaveType(req.used_leave_type),
          applied_date: formatLeaveDate(req.applied_date),
          start_date: formatLeaveDate(req.start_date),
          end_date: formatLeaveDate(req.end_date),
          document_type: formatDocumentType(req.document_type),
        }));
        const newFutureYearRequests = [
          ...(response.data.current_year_requests || []).filter(
            (req) => new Date(req.start_date).getFullYear() > currentYear
          ),
          ...(response.data.future_year_requests || []),
        ].map((req) => ({
          ...req,
          leave_type: formatLeaveType(req.leave_type),
          used_leave_type: formatLeaveType(req.used_leave_type),
          applied_date: formatLeaveDate(req.applied_date),
          start_date: formatLeaveDate(req.start_date),
          end_date: formatLeaveDate(req.end_date),
          document_type: formatDocumentType(req.document_type),
        }));

        const newRequests = [...newCurrentYearRequests, ...newFutureYearRequests];
        const newRequestIds = new Set(newRequests.map(req => req.id));
        const addedRequests = newRequests.filter(req => !prevRequestIds.current.has(req.id));

        if (!isInitialFetch.current && addedRequests.length > 0 && audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('Error playing notification sound:', err);
            showSnackbar('Failed to play notification sound.', 'warning');
          });
        }

        prevRequestIds.current = newRequestIds;
        isInitialFetch.current = false;

        setCurrentRequests(newCurrentYearRequests);
        setFutureRequests(newFutureYearRequests);
        setNewRequestCount(newRequests.length);
      }
    } catch (err) {
      console.error('Error checking for new requests:', err);
    }
  };

  const handleSessionExpiry = () => {
    const managerEmpId = sessionStorage.getItem('empId');
    if (managerEmpId) {
      localStorage.removeItem(`token_${managerEmpId}`);
    }
    sessionStorage.clear();
    showSnackbar('Session expired. Redirecting to login in 3 seconds.', 'error');
    setTimeout(() => navigate('/login'), 3000);
  };

  const handleViewDocument = async (leaveId) => {
    setSelectedDocument({ url: null, type: null, error: null, loading: true });
    setModalOpen(true);

    try {
      const empId = sessionStorage.getItem('empId');
      const token = getToken();

      if (!empId || !token) {
        setSelectedDocument({
          url: null,
          type: null,
          error: 'Please log in to view the document',
          loading: false,
        });
        showSnackbar('Please log in to view the document.', 'error');
        return;
      }

      const response = await axios.get(`/get_leave_document/${leaveId}`, {
        headers: { Authorization: token },
        responseType: 'blob',
        timeout: 10000,
      });

      const contentType = response.headers['content-type'];
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(contentType)) {
        throw new Error('Unsupported document type');
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      setSelectedDocument({
        url,
        type: contentType,
        error: null,
        loading: false,
      });
    } catch (err) {
      let errorMessage = 'Failed to load document';
      if (err.response) {
        try {
          const errorData = await err.response.data.text();
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          if (err.response.status === 401) {
            errorMessage = 'Invalid or missing authentication token. Please log in again.';
            handleSessionExpiry();
          } else if (err.response.status === 403) {
            errorMessage = 'You are not authorized to view this document.';
          } else if (err.response.status === 404) {
            errorMessage = 'No document available for this leave request.';
          }
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Document fetch timed out. Please try again.';
      } else if (err.message === 'Unsupported document type') {
        errorMessage = 'Unsupported document type. Only PDF and JPEG/JPG are supported.';
      }
      setSelectedDocument({
        url: null,
        type: null,
        error: errorMessage,
        loading: false,
      });
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleUpdateStatus = async (leaveId, newStatus, isFuture = false) => {
    const managerEmpId = sessionStorage.getItem('empId');
    const token = getToken();

    if (!managerEmpId || !token) {
      showSnackbar('Please log in to update leave statuses.', 'error');
      handleSessionExpiry();
      return;
    }

    const actionKey = `${leaveId}-${newStatus}`;
    setUpdatingStatuses((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await axios.put(
        `/update_leave_status/${leaveId}`,
        { status: newStatus, is_future: isFuture },
        {
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      showSnackbar(response.data.message, 'success');
      if (isFuture) {
        setFutureRequests((prev) => prev.filter((req) => req.id !== leaveId));
      } else {
        setCurrentRequests((prev) => prev.filter((req) => req.id !== leaveId));
      }
      setNewRequestCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      let errorMessage = err.response?.data?.message || 'Failed to update leave status.';
      if (err.response?.status === 401) {
        errorMessage = 'Invalid or missing authentication token. Please log in again.';
        showSnackbar(errorMessage, 'error');
        handleSessionExpiry();
      } else if (err.response?.status === 403) {
        errorMessage = 'You are not authorized to update this leave request.';
        showSnackbar(errorMessage, 'error');
      } else if (err.response?.status === 404) {
        errorMessage = 'Leave request not found.';
        showSnackbar(errorMessage, 'error');
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
        showSnackbar(errorMessage, 'error');
      } else {
        showSnackbar(errorMessage, 'error');
      }
    } finally {
      setUpdatingStatuses((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  useEffect(() => {
    fetchPendingLeaveRequest();
    const interval = setInterval(() => {
      checkForNewRequests();
    }, 3000);
    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [retryTrigger]);

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        position: 'relative',
        maxHeight: '90vh',
        overflow: 'auto',
        paddingRight: 0,
        paddingLeft: 0,
        marginTop: 0,
      }}
    >
      <div className="container-fluid p-2">
        {loading && (
          <div className="text-center">
            <CircularProgress size={32} />
            <Typography className="mt-2">Loading...</Typography>
          </div>
        )}

        {error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRetry}
                className="btn btn-link"
              >
                Retry
              </Button>
            }
            className="mb-3"
          >
            {error}
          </Alert>
        )}

        {message && !error && message !== 'Pending leave requests retrieved successfully' && (
          <Alert severity="info" className="mb-3">
            {message}
          </Alert>
        )}

        {!loading && !error && (
          <div className="row g-4">
            <div className="col-12">
              <Paper elevation={3} className="p-4">
                <Typography variant="h6" fontWeight="medium" className="mb-3">
                  Current Year Pending Requests
                </Typography>
                <div className="row mb-3">
                  <div className="col-3">
                    <input
                      type="text"
                      className="form-control"
                      name="employeeName"
                      value={searchParams.employeeName}
                      onChange={handleSearchChange}
                      placeholder="Employee Name or ID"
                    />
                  </div>
                  <div className="col">
                    <Button
                      variant="contained"
                      color="warning"
                      className="btn btn-warning"
                      onClick={() => fetchPendingLeaveRequest(true)}
                    >
                      Search
                    </Button>
                  </div>
                </div>
                {currentRequests.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Apply Date</TableCell>
                          <TableCell>Leave From</TableCell>
                          <TableCell>Leave To</TableCell>
                          <TableCell>No of Days</TableCell>
                          <TableCell>Leave Type</TableCell>
                          <TableCell>
                            <Tooltip title="The leave type used based on available balance (sick, compensatory off, or loss of pay).">
                              <span>Used Leave Type</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>Document</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            style={{
                              backgroundColor: highlightedEmployee === request.id ? '#fff3cd' : 'inherit',
                            }}
                          >
                            <TableCell>
                              {request.emp_id}<br />{`${request.first_name} ${request.last_name}`}
                            </TableCell>
                            <TableCell>{request.applied_date}</TableCell>
                            <TableCell>{request.start_date}</TableCell>
                            <TableCell>{request.end_date}</TableCell>
                            <TableCell>{request.days}</TableCell>
                            <TableCell>{request.leave_type}</TableCell>
                            <TableCell>{request.used_leave_type}</TableCell>
                            <TableCell>
                              {request.document_type !== 'No document' ? (
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size="small"
                                  onClick={() => handleViewDocument(request.id)}
                                  className="rounded-pill"
                                  style={{ minWidth: '120px' }}
                                >
                                  View Document
                                </Button>
                              ) : (
                                'No document'
                              )}
                            </TableCell>
                            <TableCell>{request.status}</TableCell>
                            <TableCell>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleUpdateStatus(request.id, 'approved', false)}
                                  disabled={updatingStatuses[`${request.id}-approved`]}
                                  startIcon={updatingStatuses[`${request.id}-approved`] ? <CircularProgress size={16} /> : null}
                                  className="rounded-pill"
                                  style={{ minWidth: '90px' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => handleUpdateStatus(request.id, 'rejected', false)}
                                  disabled={updatingStatuses[`${request.id}-rejected`]}
                                  startIcon={updatingStatuses[`${request.id}-rejected`] ? <CircularProgress size={16} /> : null}
                                  className="rounded-pill"
                                  style={{ minWidth: '90px' }}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No current year pending leave requests found.
                  </Typography>
                )}
              </Paper>
            </div>

            <div className="col-12">
              <Paper elevation={3} className="p-4">
                <Typography variant="h6" fontWeight="medium" className="mb-3">
                  Future Year Pending Requests
                </Typography>
                {futureRequests.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Apply Date</TableCell>
                          <TableCell>Leave From</TableCell>
                          <TableCell>Leave To</TableCell>
                          <TableCell>No of Days</TableCell>
                          <TableCell>Leave Type</TableCell>
                          <TableCell>
                            <Tooltip title="The leave type used based on available balance (sick, compensatory off, or loss of pay).">
                              <span>Used Leave Type</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>Document</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {futureRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            style={{
                              backgroundColor: highlightedEmployee === request.id ? '#fff3cd' : 'inherit',
                            }}
                          >
                            <TableCell>
                              {request.emp_id}<br />{`${request.first_name} ${request.last_name}`}
                            </TableCell>
                            <TableCell>{request.applied_date}</TableCell>
                            <TableCell>{request.start_date}</TableCell>
                            <TableCell>{request.end_date}</TableCell>
                            <TableCell>{request.days}</TableCell>
                            <TableCell>{request.leave_type}</TableCell>
                            <TableCell>{request.used_leave_type}</TableCell>
                            <TableCell>
                              {request.document_type !== 'No document' ? (
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size="small"
                                  onClick={() => handleViewDocument(request.id)}
                                  className="rounded-pill"
                                  style={{ minWidth: '120px' }}
                                >
                                  View Document
                                </Button>
                              ) : (
                                'No document'
                              )}
                            </TableCell>
                            <TableCell>{request.status}</TableCell>
                            <TableCell>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleUpdateStatus(request.id, 'approved', true)}
                                  disabled={updatingStatuses[`${request.id}-approved`]}
                                  startIcon={updatingStatuses[`${request.id}-approved`] ? <CircularProgress size={16} /> : null}
                                  className="rounded-pill"
                                  style={{ minWidth: '90px' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => handleUpdateStatus(request.id, 'rejected', true)}
                                  disabled={updatingStatuses[`${request.id}-rejected`]}
                                  startIcon={updatingStatuses[`${request.id}-rejected`] ? <CircularProgress size={16} /> : null}
                                  className="rounded-pill"
                                  style={{ minWidth: '90px' }}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No future year pending leave requests found.
                  </Typography>
                )}
              </Paper>
            </div>
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => {
            if (selectedDocument.url) {
              window.URL.revokeObjectURL(selectedDocument.url);
            }
            setModalOpen(false);
            setSelectedDocument({ url: null, type: null, error: null, loading: false });
          }}
          aria-labelledby="document-viewer-modal"
          className="d-flex align-items-center justify-content-center"
        >
          <Box
            sx={{
              width: '90%',
              maxWidth: 1200,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              position: 'relative',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <IconButton
              onClick={() => {
                if (selectedDocument.url) {
                  window.URL.revokeObjectURL(selectedDocument.url);
                }
                setModalOpen(false);
                setSelectedDocument({ url: null, type: null, error: null, loading: false });
              }}
              className="position-absolute top-0 end-0 mt-2 me-2"
            >
              <CloseIcon />
            </IconButton>
            {selectedDocument.loading && (
              <div className="text-center">
                <CircularProgress size={32} />
                <Typography className="mt-2">Loading document...</Typography>
              </div>
            )}
            {selectedDocument.error && (
              <Alert severity="error" className="mb-3">
                {selectedDocument.error}
              </Alert>
            )}
            {selectedDocument.url && (
              <>
                {selectedDocument.type === 'application/pdf' ? (
                  <iframe
                    src={selectedDocument.url}
                    style={{ width: '100%', height: '600px', border: 'none' }}
                    title="Leave Document"
                  />
                ) : (
                  <img
                    src={selectedDocument.url}
                    alt="Leave Document"
                    style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
                  />
                )}
              </>
            )}
          </Box>
        </Modal>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} className="w-100">
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </Box>
  );
};

export default PendingLeaveRequest;