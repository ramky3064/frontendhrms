import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from '../App';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import 'bootstrap/dist/css/bootstrap.min.css';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, '');

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/,/, '');
};

const RegularizationApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [buttonLoading, setButtonLoading] = useState({});
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();

  const { state } = location;
  const empId = state?.empId || sessionStorage.getItem('empId') || localStorage.getItem('empId');

  useEffect(() => {
    const fetchRequests = async () => {
      let token;
      let localEmpId = empId;

      if (!localEmpId) {
        token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            localEmpId = decoded.sub || decoded.emp_id || decoded.user_id || md5(token);
            localStorage.setItem(`token_${localEmpId}`, token);
            sessionStorage.setItem('empId', localEmpId);
            localStorage.setItem('empId', localEmpId);
          } catch (error) {
            console.error('Error decoding fallback token:', error);
            localEmpId = md5(token);
            localStorage.setItem(`token_${localEmpId}`, token);
            sessionStorage.setItem('empId', localEmpId);
            localStorage.setItem('empId', localEmpId);
          }
        }
      } else {
        token = localStorage.getItem(`token_${localEmpId}`);
      }

      if (!token || !localEmpId) {
        setError('Token or employee ID missing. Please log in.');
        showSnackbar('Token or employee ID missing. Please log in.', 'error');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/pending_adjustment_requests`, {
          headers: { Authorization: token },
        });

        const requestData = response.data?.data || [];
        if (!Array.isArray(requestData)) {
          console.error('Response data is not an array:', requestData);
          setError('Invalid response format from server.');
          showSnackbar('Invalid response format from server.', 'error');
          setRequests([]);
        } else {
          setRequests(requestData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch requests error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          setError('Invalid or expired token. Please log in again.');
          showSnackbar('Invalid or expired token. Please log in again.', 'error');
          navigate('/login');
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view these requests.');
          showSnackbar('You are not authorized to view these requests.', 'error');
          navigate('/login');
        } else {
          setError('Failed to fetch requests. Please try again.');
          showSnackbar('Failed to fetch requests. Please try again.', 'error');
        }
        setLoading(false);
      }
    };
    fetchRequests();
  }, [empId, navigate, showSnackbar]);

  const handleAction = async (attendanceId, action) => {
    setButtonLoading((prev) => ({ ...prev, [attendanceId]: action }));
    let token;
    let localEmpId = empId;

    if (!localEmpId) {
      token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          localEmpId = decoded.sub || decoded.emp_id || decoded.user_id || md5(token);
          localStorage.setItem(`token_${localEmpId}`, token);
          sessionStorage.setItem('empId', localEmpId);
          localStorage.setItem('empId', localEmpId);
        } catch (error) {
          console.error('Error decoding fallback token:', error);
          localEmpId = md5(token);
          localStorage.setItem(`token_${localEmpId}`, token);
          sessionStorage.setItem('empId', localEmpId);
          localStorage.setItem('empId', localEmpId);
        }
      }
    } else {
      token = localStorage.getItem(`token_${localEmpId}`);
    }

    if (!token || !localEmpId) {
      setError('Token or employee ID missing. Please log in.');
      showSnackbar('Token or employee ID missing. Please log in.', 'error');
      setButtonLoading((prev) => ({ ...prev, [attendanceId]: null }));
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/adjustment_request/${attendanceId}/action`,
        { action },
        { headers: { Authorization: token } }
      );
      setSuccess(response.data.message);
      showSnackbar(response.data.message, 'success');
      setRequests(requests.filter((req) => req.id !== attendanceId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Action error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Failed to process request.';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
      setTimeout(() => setError(null), 3000);
    } finally {
      setButtonLoading((prev) => ({ ...prev, [attendanceId]: null }));
    }
  };

  return (
    <>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            position: 'fixed',
            left: 0,
            height: '100%',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            zIndex: 1000,
          }}
        >
          <DynamicSidebar />
        </div>

        <div
          style={{
            paddingTop: '70px',
            width: '100%',
          }}
        >
          <AppNavbar />
          <div className="container">
            <h1 className="text-center mb-4">Pending Regularization Requests</h1>

            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSuccess(null)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {requests.length === 0 ? (
                  <div className="alert alert-info text-center">
                    No pending regularization requests found.
                  </div>
                ) : (
                  <div className="row g-4">
                    {requests.map((request) => (
                      <div key={request.id} className="col-12">
                        <div className="card shadow-sm">
                          <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="card-title mb-2">
                                Employee: {request.employee_name} (ID: {request.employee_id})
                              </h5>
                              <p className="card-text mb-1">
                                <strong>Request ID:</strong> {request.id}
                              </p>
                              <p className="card-text mb-1">
                                <strong>Date:</strong> {formatDate(request.punch_date)}
                              </p>
                              <p className="card-text mb-1">
                                <strong>Request Type:</strong> {request.request_type || 'Not specified'}
                              </p>
                              <p className="card-text mb-1">
                                <strong>Total Daily Duration:</strong>{' '}
                                {request.total_daily_duration
                                  ? `${request.total_daily_duration}`
                                  : 'Not specified'}
                              </p>
                              <p className="card-text">
                                <strong>Reason:</strong>{' '}
                                {request.reason || 'No reason provided'}
                              </p>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleAction(request.id, 'approve')}
                                className="btn btn-success btn-sm"
                                disabled={buttonLoading[request.id] === 'approve'}
                              >
                                {buttonLoading[request.id] === 'approve' ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Approving...
                                  </>
                                ) : (
                                  'Approve'
                                )}
                              </button>
                              <button
                                onClick={() => handleAction(request.id, 'reject')}
                                className="btn btn-danger btn-sm"
                                disabled={buttonLoading[request.id] === 'reject'}
                              >
                                {buttonLoading[request.id] === 'reject' ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Rejecting...
                                  </>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegularizationApprovals;