import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Form, InputGroup, Dropdown, Table, Spinner,
  Modal, Toast, ToastContainer, Badge, FormCheck
} from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

// Define backend API URL
const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Utility function to format date to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
const formatToMySQLDateTime = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const Todo = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ratings, setRatings] = useState({ daily: [], monthly: [], yearly: [] });
  const [newTask, setNewTask] = useState({ task_title: '', description: '', deadline: '', assigned_to: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [viewFileUrl, setViewFileUrl] = useState('');
  const [viewFileType, setViewFileType] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [hasTaskAccess, setHasTaskAccess] = useState(null); // Initialize as null to indicate loading

  const userRole = sessionStorage.getItem('userRole');
  let empId = sessionStorage.getItem('empId');
  let token = empId ? localStorage.getItem(`token_${empId}`) : null;

  if (!token && !empId) {
    const fallbackToken = localStorage.getItem('token');
    if (fallbackToken) {
      try {
        const decoded = jwtDecode(fallbackToken);
        empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
        token = fallbackToken;
        localStorage.setItem(`token_${empId}`, token);
        sessionStorage.setItem('empId', empId);
      } catch (error) {
        console.error('Error decoding fallback token:', error);
        empId = md5(fallbackToken);
        token = fallbackToken;
        localStorage.setItem(`token_${empId}`, token);
        sessionStorage.setItem('empId', empId);
      }
    }
  }

  // Check task access for the user
  const checkTaskAccess = async () => {
    if (!token || !empId) {
      setHasTaskAccess(false);
      return false;
    }
    try {
      const response = await axios.get(`${API_URL}/todo/employees`, {
        headers: { Authorization: token }
      });
      const currentEmployee = response.data.employees.find(emp => emp.emp_id === empId);
      const canAccess = ['Admin', 'Manager', 'HR'].includes(userRole) || (currentEmployee?.task_permissions === 1);
      setHasTaskAccess(canAccess);
      return canAccess;
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to check task access: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Check task access error:', err.response?.data || err.message);
      setHasTaskAccess(false);
      return false;
    }
  };

  useEffect(() => {
    if (!token || !empId) {
      setSnackbar({
        show: true,
        message: 'Token or employee ID missing. Please log in again.',
        variant: 'danger'
      });
      setHasTaskAccess(false);
      return;
    }
    const initializeData = async () => {
      const canAccess = await checkTaskAccess();
      if (canAccess) {
        fetchEmployees();
      }
      fetchTasks();
    };
    initializeData();
    return () => {
      if (viewFileUrl) {
        window.URL.revokeObjectURL(viewFileUrl);
      }
    };
  }, []);

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/todo/employees`, {
        headers: { Authorization: token }
      });
      if (!response.data.employees || !Array.isArray(response.data.employees)) {
        throw new Error('Invalid employees response format');
      }
      const mappedEmployees = response.data.employees
        .filter(emp => emp.task_permissions !== 1) // Exclude employees with task_permissions = 1
        .map(emp => {
          if (!emp.emp_id || !emp.name) {
            console.warn('Invalid employee data:', emp);
            return { emp_id: 'unknown', name: 'Unknown Employee', task_permissions: null };
          }
          return {
            emp_id: String(emp.emp_id),
            name: emp.name,
            task_permissions: emp.task_permissions
          };
        })
        .filter(emp => emp.emp_id !== 'unknown');
      setEmployees(mappedEmployees);
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to fetch employees: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Fetch employees error:', err.response?.data || err.message);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: token }
      });
      setTasks(response.data.tasks || []);
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to fetch tasks: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Fetch tasks error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (emp_id, buttonId) => {
    setButtonLoading(prev => ({ ...prev, [buttonId]: true }));
    try {
      const response = await axios.get(`${API_URL}/employee_ratings/${emp_id}`, {
        headers: { Authorization: token }
      });
      setRatings({
        daily: response.data.daily_ratings,
        monthly: response.data.monthly_ratings,
        yearly: response.data.yearly_ratings
      });
      setShowRatingsModal(true);
      setSnackbar({
        show: true,
        message: 'Employee ratings fetched successfully',
        variant: 'success'
      });
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to fetch ratings: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Fetch ratings error:', err.response?.data || err.message);
    } finally {
      setButtonLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  };

  const handleAssignTask = async () => {
    setAssignLoading(true);
    if (employeesLoading) {
      setSnackbar({
        show: true,
        message: 'Please wait until employee data is loaded',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    if (!employees || employees.length === 0) {
      setSnackbar({
        show: true,
        message: 'No employees available to assign tasks',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    if (!newTask.task_title.trim()) {
      setSnackbar({
        show: true,
        message: 'Task title is required',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    if (!newTask.description.trim()) {
      setSnackbar({
        show: true,
        message: 'Task description is required',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    if (!newTask.deadline) {
      setSnackbar({
        show: true,
        message: 'Deadline is required',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    if (newTask.assigned_to.length === 0) {
      setSnackbar({
        show: true,
        message: 'At least one employee must be assigned',
        variant: 'danger'
      });
      setAssignLoading(false);
      return;
    }
    const validEmployeeIds = employees.map(emp => emp.emp_id);
    const invalidIds = newTask.assigned_to.filter(id => !validEmployeeIds.includes(String(id)));
    if (invalidIds.length > 0) {
      const invalidNames = invalidIds
        .map(id => employees.find(emp => emp.emp_id === id)?.name || id)
        .join(', ');
      setSnackbar({
        show: true,
        message: `Invalid employee(s): ${invalidNames}`,
        variant: 'danger'
      });
      console.error(`Invalid employee(s): ${invalidNames}`);
      setAssignLoading(false);
      return;
    }
    let taskData;
    try {
      taskData = {
        task_title: newTask.task_title,
        description: newTask.description,
        deadline: formatToMySQLDateTime(newTask.deadline),
        assigned_to: newTask.assigned_to.map(id => String(id))
      };
    } catch (error) {
      setSnackbar({
        show: true,
        message: `Date formatting error: ${error.message}`,
        variant: 'danger'
      });
      console.error('Date formatting error:', error);
      setAssignLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/assign_task`, taskData, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      });
      const assignedTaskIds = response.data.task_ids || [];
      if (assignedTaskIds.length > 0) {
        const emailPromises = assignedTaskIds.map(taskId =>
          axios.post(`${API_URL}/send_task_email/${taskId}`, {}, {
            headers: { Authorization: token }
          })
        );
        try {
          await Promise.all(emailPromises);
          setSnackbar({
            show: true,
            message: 'Task assigned and emails sent successfully',
            variant: 'success'
          });
        } catch (emailErr) {
          setSnackbar({
            show: true,
            message: 'Task assigned, but some email notifications failed to send',
            variant: 'warning'
          });
          console.error('Send task email error:', emailErr.response?.data || emailErr.message);
        }
      } else if (response.data.warning) {
        const failedIds = response.data.warning.match(/emp_id\(s\): (.*?)$/)[1].split(', ');
        const failedNames = failedIds
          .map(id => employees.find(emp => emp.emp_id === id)?.name || id)
          .join(', ');
        setSnackbar({
          show: true,
          message: `Task assigned, but email sending failed for: ${failedNames}`,
          variant: 'warning'
        });
        console.error(`Task assigned, but email sending failed for: ${failedNames}`);
      } else {
        setSnackbar({
          show: true,
          message: 'Task assigned successfully',
          variant: 'success'
        });
      }
      setNewTask({ task_title: '', description: '', deadline: '', assigned_to: [] });
      setShowAssignModal(false);
      setSelectAll(false);
      fetchTasks();
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to assign task: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Assign task error:', err.response?.data || err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, status, buttonId) => {
    setButtonLoading(prev => ({ ...prev, [buttonId]: true }));
    try {
      const response = await axios.post(`${API_URL}/update_task_status`, { task_id: taskId, status }, {
        headers: { Authorization: token }
      });
      setSnackbar({
        show: true,
        message: `Task status updated to ${status}`,
        variant: 'success'
      });
      fetchTasks();
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to update task status: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Update status error:', err.response?.data || err.message);
    } finally {
      setButtonLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  };

  const handleSubmitTask = async () => {
    if (!file || !selectedTask) {
      setSnackbar({
        show: true,
        message: 'Please select a file and task to submit',
        variant: 'danger'
      });
      return;
    }
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('task_id', selectedTask.id);
      formData.append('file', file);
      const response = await axios.post(`${API_URL}/submit_task`, formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSnackbar({
        show: true,
        message: 'Task submitted successfully',
        variant: 'success'
      });
      setShowSubmitModal(false);
      setFile(null);
      fetchTasks();
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to submit task: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Submit task error:', err.response?.data || err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewSubmission = async (taskId, buttonId) => {
    setButtonLoading(prev => ({ ...prev, [buttonId]: true }));
    try {
      const response = await axios.get(`${API_URL}/view_submission/${taskId}`, {
        headers: { Authorization: token },
        responseType: 'blob'
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `task_submission_${taskId}.bin`;
      if (viewFileUrl) {
        window.URL.revokeObjectURL(viewFileUrl);
      }
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      setViewFileUrl(url);
      setViewFileType(contentType);
      setShowViewModal(true);
      setSnackbar({
        show: true,
        message: 'Submission loaded successfully',
        variant: 'success'
      });
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to view submission: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('View submission error:', err.response?.data || err.message);
    } finally {
      setButtonLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  };

  const handleDownloadSubmission = async (taskId, buttonId) => {
    setButtonLoading(prev => ({ ...prev, [buttonId]: true }));
    try {
      const response = await axios.get(`${API_URL}/view_submission/${taskId}`, {
        headers: { Authorization: token },
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'];
      const task = tasks.find(t => t.id === taskId);
      const defaultFilename = task?.submission_filename || `task_submission_${taskId}.bin`;
      let filename = defaultFilename;
      if (contentDisposition) {
        if (contentDisposition.includes('filename=')) {
          filename = contentDisposition.split('filename=')[1]?.replace(/"/g, '') || defaultFilename;
        }
        if (contentDisposition.includes('filename*=')) {
          const encodedFilename = contentDisposition.split('filename*=')[1]?.split("''")[1];
          filename = encodedFilename ? decodeURIComponent(encodedFilename) : defaultFilename;
        }
      }
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({
        show: true,
        message: 'Submission downloaded successfully',
        variant: 'success'
      });
    } catch (err) {
      setSnackbar({
        show: true,
        message: `Failed to download submission: ${err.response?.data?.message || err.message}`,
        variant: 'danger'
      });
      console.error('Download submission error:', err.response?.data || err.message);
    } finally {
      setButtonLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filter === 'all' ? true : task.status === filter;
    const matchesSearch = searchTerm
      ? task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employees.find(emp => emp.emp_id === task.assigned_to)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const filteredEmployees = employees.filter(emp =>
    (emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.emp_id.toLowerCase().includes(employeeSearch.toLowerCase())) &&
    emp.task_permissions !== 1 // Exclude employees with task_permissions = 1
  );

  const getActionItems = (task) => {
    const items = [];
    items.push({
      value: 'viewRatings',
      label: 'View Ratings',
      onClick: () => fetchRatings(task.assigned_to, `viewRatings_${task.id}`),
      loading: buttonLoading[`viewRatings_${task.id}`]
    });
    if (task.has_submission && (hasTaskAccess || task.assigned_by === empId || task.assigned_to === empId)) {
      items.push({
        value: 'viewSubmission',
        label: 'View Submission',
        onClick: () => handleViewSubmission(task.id, `viewSubmission_${task.id}`),
        loading: buttonLoading[`viewSubmission_${task.id}`]
      });
      items.push({
        value: 'downloadSubmission',
        label: 'Download Submission',
        onClick: () => handleDownloadSubmission(task.id, `downloadSubmission_${task.id}`),
        loading: buttonLoading[`downloadSubmission_${task.id}`]
      });
    }
    if (userRole === 'Employee' && task.assigned_to === empId && task.status !== 'Completed') {
      if (task.status !== 'In Progress') {
        items.push({
          value: 'start',
          label: 'Start',
          onClick: () => handleUpdateStatus(task.id, 'In Progress', `start_${task.id}`),
          loading: buttonLoading[`start_${task.id}`]
        });
      }
      items.push({
        value: 'submit',
        label: 'Submit',
        onClick: () => {
          setSelectedTask(task);
          setShowSubmitModal(true);
        },
        disabled: task.status !== 'In Progress',
        loading: false
      });
    }
    return items;
  };

  const handleSelectAll = (event) => {
    setSelectAll(event.target.checked);
    if (event.target.checked) {
      setNewTask({ ...newTask, assigned_to: employees.map(emp => emp.emp_id) });
    } else {
      setNewTask({ ...newTask, assigned_to: [] });
    }
  };

  const handleEmployeeSelect = (empId) => {
    let updatedAssignedTo;
    if (newTask.assigned_to.includes(empId)) {
      updatedAssignedTo = newTask.assigned_to.filter(id => id !== empId);
    } else {
      updatedAssignedTo = [...newTask.assigned_to, empId];
    }
    setNewTask({ ...newTask, assigned_to: updatedAssignedTo });
    setSelectAll(updatedAssignedTo.length === employees.length);
  };

  const handleDone = () => {
    setButtonLoading(prev => ({ ...prev, done: true }));
    setTimeout(() => {
      setShowEmployeeModal(false);
      setEmployeeSearch('');
      setButtonLoading(prev => ({ ...prev, done: false }));
    }, 500);
  };

  const handleCancelAssignModal = () => {
    setButtonLoading(prev => ({ ...prev, cancelAssign: true }));
    setTimeout(() => {
      setShowAssignModal(false);
      setNewTask({ ...newTask, assigned_to: [] });
      setSelectAll(false);
      setButtonLoading(prev => ({ ...prev, cancelAssign: false }));
    }, 500);
  };

  const handleCancelEmployeeModal = () => {
    setButtonLoading(prev => ({ ...prev, cancelEmployee: true }));
    setTimeout(() => {
      setShowEmployeeModal(false);
      setNewTask({ ...newTask, assigned_to: [] });
      setSelectAll(false);
      setEmployeeSearch('');
      setButtonLoading(prev => ({ ...prev, cancelEmployee: false }));
    }, 500);
  };

  const handleCancelSubmitModal = () => {
    setButtonLoading(prev => ({ ...prev, cancelSubmit: true }));
    setTimeout(() => {
      setShowSubmitModal(false);
      setButtonLoading(prev => ({ ...prev, cancelSubmit: false }));
    }, 500);
  };

  const handleCloseViewModal = () => {
    setButtonLoading(prev => ({ ...prev, closeView: true }));
    setTimeout(() => {
      setShowViewModal(false);
      setViewFileUrl('');
      setViewFileType('');
      if (viewFileUrl) window.URL.revokeObjectURL(viewFileUrl);
      setButtonLoading(prev => ({ ...prev, closeView: false }));
    }, 500);
  };

  const handleCloseRatingsModal = () => {
    setButtonLoading(prev => ({ ...prev, closeRatings: true }));
    setTimeout(() => {
      setShowRatingsModal(false);
      setButtonLoading(prev => ({ ...prev, closeRatings: false }));
    }, 500);
  };

  const getPieChartData = (ratingsData, type) => {
    let labels = [];
    let data = [];
    let backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    if (type === 'daily') {
      const ratingCounts = ratingsData.reduce((acc, rating) => {
        const ratingValue = rating.daily_rating;
        acc[ratingValue] = (acc[ratingValue] || 0) + 1;
        return acc;
      }, {});
      labels = Object.keys(ratingCounts).map(r => `Rating ${r}`);
      data = Object.values(ratingCounts);
    } else if (type === 'monthly') {
      const ratingCounts = ratingsData.reduce((acc, rating) => {
        const ratingValue = rating.monthly_rating;
        acc[ratingValue] = (acc[ratingValue] || 0) + 1;
        return acc;
      }, {});
      labels = Object.keys(ratingCounts).map(r => `Rating ${r}`);
      data = Object.values(ratingCounts);
    } else if (type === 'yearly') {
      const ratingCounts = ratingsData.reduce((acc, rating) => {
        const ratingValue = rating.yearly_rating;
        acc[ratingValue] = (acc[ratingValue] || 0) + 1;
        return acc;
      }, {});
      labels = Object.keys(ratingCounts).map(r => `Rating ${r}`);
      data = Object.values(ratingCounts);
    }
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 2,
      }],
    };
  };

  const renderFileContent = () => {
    if (!viewFileUrl || !viewFileType) return null;
    if (viewFileType === 'application/pdf') {
      return <iframe src={viewFileUrl} title="Submission" style={{ width: '100%', height: '100%', border: 'none' }} />;
    } else if (viewFileType.startsWith('image/')) {
      return <img src={viewFileUrl} alt="Submission" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
    } else if (['text/plain', 'application/javascript', 'text/javascript'].includes(viewFileType)) {
      return (
        <div className="bg-light p-3 rounded" style={{ height: '100%', overflow: 'auto' }}>
          <pre id="file-content" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            Loading text content...
          </pre>
        </div>
      );
    } else {
      return <p>Preview not available for this file type. Please download to view.</p>;
    }
  };

  useEffect(() => {
    if (viewFileUrl && ['text/plain', 'application/javascript', 'text/javascript'].includes(viewFileType)) {
      fetch(viewFileUrl)
        .then(res => res.text())
        .then(text => {
          const pre = document.createElement('pre');
          pre.textContent = text;
          pre.style.cssText = 'margin: 0; white-space: pre-wrap; word-break: break-word;';
          const contentDiv = document.getElementById('file-content');
          if (contentDiv) {
            contentDiv.innerHTML = '';
            contentDiv.appendChild(pre);
          }
        })
        .catch(err => {
          setSnackbar({
            show: true,
            message: `Error loading text content: ${err.message}`,
            variant: 'danger'
          });
          console.error('Error loading text content:', err);
          const contentDiv = document.getElementById('file-content');
          if (contentDiv) {
            contentDiv.innerHTML = '<p>Error loading text content.</p>';
          }
        });
    }
  }, [viewFileUrl, viewFileType]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <div className="d-flex flex-grow-1 overflow-hidden">
        <div className="position-sticky" style={{ top: '56px', height: 'calc(100vh - 56px)', flexShrink: 0 }}>
          <DynamicSidebar />
        </div>
        <Container fluid className="p-3 mt-5">
          <Row>
            <Col>
              <h4 className="mb-3">Task Management</h4>
              {hasTaskAccess === null ? (
                <div className="d-flex justify-content-center align-items-center">
                  <Spinner animation="border" />
                </div>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center">
                    {hasTaskAccess && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setButtonLoading(prev => ({ ...prev, assignNewTask: true }));
                          setTimeout(() => {
                            setShowAssignModal(true);
                            setButtonLoading(prev => ({ ...prev, assignNewTask: false }));
                          }, 500);
                        }}
                        disabled={employeesLoading || buttonLoading.assignNewTask}
                        style={{ borderRadius: '20px', padding: '8px 16px' }}
                      >
                        {buttonLoading.assignNewTask || employeesLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          'Assign New Task'
                        )}
                      </Button>
                    )}
                    <Form.Select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      style={{ width: '180px', borderRadius: '20px' }}
                      className="form-control"
                    >
                      <option value="all">All</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                    <InputGroup style={{ width: '180px' }}>
                      <Form.Control
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: '20px 0 0 20px' }}
                      />
                      <InputGroup.Text style={{ borderRadius: '0 20px 20px 0' }}>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </div>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center flex-grow-1">
                      <Spinner animation="border" />
                    </div>
                  ) : (
                    <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                      <Table striped bordered hover responsive>
                        <thead className="table-primary">
                          <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th style={{ width: '150px' }}>Title</th>
                            <th style={{ width: '200px' }}>Description</th>
                            <th style={{ width: '100px' }}>Deadline</th>
                            <th style={{ width: '100px' }}>Status</th>
                            {hasTaskAccess && <th style={{ width: '120px' }}>Assigned To</th>}
                            <th style={{ width: '120px' }}>Assigned By</th>
                            <th style={{ width: '100px' }}>File</th>
                            <th style={{ width: '120px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map(task => (
                            <tr key={task.id}>
                              <td>{task.id}</td>
                              <td>{task.task_title}</td>
                              <td>{task.description}</td>
                              <td>{new Date(task.deadline).toLocaleDateString()}</td>
                              <td>
                                <Badge
                                  bg={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'warning' : 'secondary'}
                                >
                                  {task.status}
                                </Badge>
                              </td>
                              {hasTaskAccess && (
                                <td>{employees.find(emp => emp.emp_id === task.assigned_to)?.name || task.assigned_to}</td>
                              )}
                              <td>
                                {hasTaskAccess
                                  ? employees.find(emp => emp.emp_id === task.assigned_by)?.name || task.assigned_by
                                  : task.assigned_by}
                              </td>
                              <td>
                                {task.has_submission ? (
                                  <span>
                                    <i className="bi bi-paperclip"></i> Submitted
                                  </span>
                                ) : (
                                  'No submission'
                                )}
                              </td>
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle
                                    variant="outline-primary"
                                    size="sm"
                                    style={{ borderRadius: '20px' }}
                                  >
                                    Actions
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    {getActionItems(task).map(item => (
                                      <Dropdown.Item
                                        key={item.value}
                                        onClick={item.onClick}
                                        disabled={item.disabled || item.loading}
                                      >
                                        {item.loading ? (
                                          <Spinner animation="border" size="sm" />
                                        ) : (
                                          item.label
                                        )}
                                      </Dropdown.Item>
                                    ))}
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
          <ToastContainer position="bottom-end" className="p-3">
            <Toast
              show={snackbar.show}
              onClose={() => setSnackbar({ ...snackbar, show: false })}
              delay={5000}
              autohide
              bg={snackbar.variant}
            >
              <Toast.Header>
                <strong className="me-auto">
                  {snackbar.variant === 'success' ? 'Success' : snackbar.variant === 'warning' ? 'Warning' : 'Error'}
                </strong>
              </Toast.Header>
              <Toast.Body className={snackbar.variant === 'danger' ? 'text-white' : ''}>
                {snackbar.message}
              </Toast.Body>
            </Toast>
          </ToastContainer>
          {hasTaskAccess && (
            <Modal
              show={showAssignModal}
              onHide={handleCancelAssignModal}
              centered
            >
              <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Assign New Task</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Task Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={newTask.task_title}
                      onChange={(e) => setNewTask({ ...newTask, task_title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Deadline</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setButtonLoading(prev => ({ ...prev, selectEmployees: true }));
                        setTimeout(() => {
                          setShowEmployeeModal(true);
                          setButtonLoading(prev => ({ ...prev, selectEmployees: false }));
                        }, 500);
                      }}
                      disabled={employeesLoading || buttonLoading.selectEmployees}
                      className="w-100 text-start"
                    >
                      {buttonLoading.selectEmployees ? (
                        <Spinner animation="border" size="sm" />
                      ) : newTask.assigned_to.length > 0 ? (
                        `Selected (${newTask.assigned_to.length})`
                      ) : (
                        'Select Employees To Assign Task'
                      )}
                    </Button>
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline-secondary"
                  onClick={handleCancelAssignModal}
                  disabled={buttonLoading.cancelAssign}
                >
                  {buttonLoading.cancelAssign ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    'Cancel'
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssignTask}
                  disabled={employeesLoading || !newTask.task_title.trim() || !newTask.description.trim() || !newTask.deadline || newTask.assigned_to.length === 0 || assignLoading}
                >
                  {assignLoading ? <Spinner animation="border" size="sm" /> : 'Assign'}
                </Button>
              </Modal.Footer>
            </Modal>
          )}
          <Modal
            show={showEmployeeModal}
            onHide={handleCancelEmployeeModal}
            centered
            size="lg"
          >
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>Select Employees</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or ID"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </InputGroup>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <FormCheck
                  label="Select All"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  disabled={employeesLoading}
                />
                <Button
                  variant="primary"
                  onClick={handleDone}
                  disabled={employeesLoading || buttonLoading.done}
                >
                  {buttonLoading.done ? <Spinner animation="border" size="sm" /> : 'Done'}
                </Button>
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table striped bordered hover>
                  <thead className="table-primary">
                    <tr>
                      <th style={{ width: '60px' }}>Actions</th>
                      <th style={{ width: '100px' }}>Employee ID</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <tr key={emp.emp_id}>
                          <td>
                            <FormCheck
                              checked={newTask.assigned_to.includes(emp.emp_id)}
                              onChange={() => handleEmployeeSelect(emp.emp_id)}
                              disabled={employeesLoading}
                            />
                          </td>
                          <td>{emp.emp_id}</td>
                          <td>{emp.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>No employees found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleCancelEmployeeModal}
                disabled={buttonLoading.cancelEmployee}
              >
                {buttonLoading.cancelEmployee ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Cancel'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          <Modal
            show={showSubmitModal}
            onHide={handleCancelSubmitModal}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Submit Task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Task: {selectedTask?.task_title}</p>
              <Form.Group>
                <Form.Control
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleCancelSubmitModal}
                disabled={buttonLoading.cancelSubmit}
              >
                {buttonLoading.cancelSubmit ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Cancel'
                )}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitTask}
                disabled={!file || submitLoading}
              >
                {submitLoading ? <Spinner animation="border" size="sm" /> : 'Submit'}
              </Button>
            </Modal.Footer>
          </Modal>
          <Modal
            show={showViewModal}
            onHide={handleCloseViewModal}
            size="xl"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>View Submission</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ height: '50vh' }}>
              {renderFileContent()}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleCloseViewModal}
                disabled={buttonLoading.closeView}
              >
                {buttonLoading.closeView ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Close'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          <Modal
            show={showRatingsModal}
            onHide={handleCloseRatingsModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>Employee Ratings</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <h5>Daily Ratings</h5>
              <div className="d-flex justify-content-center mb-3">
                <div style={{ width: '250px', height: '250px' }}>
                  <Pie
                    data={getPieChartData(ratings.daily, 'daily')}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: { enabled: true },
                      },
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <Table striped bordered hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Date</th>
                      <th>Total Tasks</th>
                      <th>Completed</th>
                      <th>On Time</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.daily.map(rating => (
                      <tr key={rating.date}>
                        <td>{new Date(rating.date).toLocaleDateString()}</td>
                        <td>{rating.total_tasks}</td>
                        <td>{rating.completed_tasks}</td>
                        <td>{rating.on_time_tasks}</td>
                        <td>{rating.daily_rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <h5 className="mt-3">Monthly Ratings</h5>
              <div className="d-flex justify-content-center mb-3">
                <div style={{ width: '250px', height: '250px' }}>
                  <Pie
                    data={getPieChartData(ratings.monthly, 'monthly')}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: { enabled: true },
                      },
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <Table striped bordered hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Month/Year</th>
                      <th>Total Tasks</th>
                      <th>Completed</th>
                      <th>On Time</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.monthly.map(rating => (
                      <tr key={`${rating.month}-${rating.year}`}>
                        <td>{`${rating.month}/${rating.year}`}</td>
                        <td>{rating.total_tasks}</td>
                        <td>{rating.completed_tasks}</td>
                        <td>{rating.on_time_tasks}</td>
                        <td>{rating.monthly_rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <h5 className="mt-3">Yearly Ratings</h5>
              <div className="d-flex justify-content-center mb-3">
                <div style={{ width: '250px', height: '250px' }}>
                  <Pie
                    data={getPieChartData(ratings.yearly, 'yearly')}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: { enabled: true },
                      },
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <Table striped bordered hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Financial Year</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.yearly.map(rating => (
                      <tr key={rating.financial_year}>
                        <td>{rating.financial_year}</td>
                        <td>{rating.yearly_rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleCloseRatingsModal}
                disabled={buttonLoading.closeRatings}
              >
                {buttonLoading.closeRatings ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Close'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default Todo;  