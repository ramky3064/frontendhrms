import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Trash, PersonAdd, Eye, PencilSquare } from 'react-bootstrap-icons';
import { motion } from 'framer-motion';
import Select from 'react-select';
import { Snackbar, Alert } from '@mui/material';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

// Constants
const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const ROLES = ['Project Manager', 'HR', 'TL', 'Employee'];

// Utility function to get token (unchanged)
const getToken = () => {
  let empId = sessionStorage.getItem('empId');
  let token = '';

  if (empId) {
    token = localStorage.getItem(`token_${empId}`);
    console.log('Token for empId:', empId, token);
  }

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

  if (!token) {
    console.log('No token found in localStorage');
    return '';
  }

  return token;
};

// ProjectTree component
const ProjectTree = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openHierarchyModal, setOpenHierarchyModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [employeeAssignments, setEmployeeAssignments] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employees, setEmployees] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [hierarchyEditEmpId, setHierarchyEditEmpId] = useState('');
  const [hierarchyEditRole, setHierarchyEditRole] = useState('');
  const [hierarchyEditLoading, setHierarchyEditLoading] = useState(false);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // New state for sidebar hover
  const token = getToken();
  const empId = sessionStorage.getItem('empId') || '';

  // Handle Sidebar hover events
  const handleMouseEnter = () => setIsSidebarHovered(true);
  const handleMouseLeave = () => setIsSidebarHovered(false);

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Show Snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Fetch projects and their assigned employees
  const fetchProjects = useCallback(async () => {
    if (!empId || !token) {
      showSnackbar('Please log in to view projects.', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const projectResponse = await axios.get(`${API_URL}/view_projects`, {
        headers: { Authorization: token },
      });

      if (
        projectResponse.status === 200 &&
        projectResponse.data.status === 'success' &&
        Array.isArray(projectResponse.data.projects)
      ) {
        const formattedProjects = await Promise.all(
          projectResponse.data.projects.map(async (proj, index) => {
            return {
              id: index,
              project_id: proj.project_id || 'N/A',
              project_name: proj.project_name || 'N/A',
              start_date: proj.start_date
                ? new Date(proj.start_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A',
              end_date: proj.end_date
                ? new Date(proj.end_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'In Progress',
            };
          })
        );

        setProjects(formattedProjects);
        setError('');
      } else {
        throw new Error(projectResponse.data.message || 'Unable to load projects.');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      const errorMessage =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : err.response?.data?.message || 'Unable to load projects. Please try again.';
      showSnackbar(errorMessage, 'error');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
      }
    } finally {
      setLoading(false);
    }
  }, [empId, token]);

  // Fetch all employees for the dropdown
  const fetchEmployees = useCallback(async () => {
    if (!empId || !token) {
      showSnackbar('Please log in to view employees.', 'error');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/active_employees_with_count`, {
        headers: { Authorization: token },
      });

      if (
        response.status === 200 &&
        response.data.status === 'success' &&
        Array.isArray(response.data.employees)
      ) {
        const formattedEmployees = response.data.employees.map((emp) => ({
          emp_id: emp.emp_id || 'N/A',
          first_name: emp.first_name || 'N/A',
          last_name: emp.last_name || '',
          email: emp.email || 'N/A',
          label: `${emp.first_name} ${emp.last_name}`,
          value: emp.emp_id,
        }));
        formattedEmployees.sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        );
        setEmployees(formattedEmployees);
      } else {
        throw new Error(response.data.message || 'Unable to load employees.');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      showSnackbar('Unable to load employees. Please try again.', 'error');
    }
  }, [empId, token]);

  // Fetch project members for the hierarchy modal with role sorting
  const fetchProjectMembers = useCallback(async (projectId) => {
    if (!empId || !token) {
      showSnackbar('Please log in to view project members.', 'error');
      return;
    }

    try {
      setHierarchyLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: token },
      });

      if (
        response.status === 200 &&
        response.data.project &&
        Array.isArray(response.data.project.employees)
      ) {
        const formattedMembers = response.data.project.employees.map((emp) => ({
          emp_id: emp.emp_id || 'N/A',
          first_name: emp.first_name || 'N/A',
          last_name: emp.last_name || '',
          email: emp.email || 'N/A',
          role: emp.role || 'N/A',
        }));

        const rolePriority = {
          'Project Manager': 1,
          'HR': 2,
          'TL': 3,
          'Employee': 4,
        };
        formattedMembers.sort((a, b) => (rolePriority[a.role] || 5) - (rolePriority[b.role] || 5));

        setProjectMembers(formattedMembers);
        setError('');
        console.log('Fetched project members:', formattedMembers);
      } else {
        throw new Error(response.data.message || 'Unable to load project members.');
      }
    } catch (err) {
      console.error('Error fetching project members:', err);
      showSnackbar('Unable to load project members. Please try again.', 'error');
    } finally {
      setHierarchyLoading(false);
    }
  }, [empId, token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Automatic employee addition
  useEffect(() => {
    if (employeeId && employeeRole && editingIndex === null) {
      const selectedEmployee = employees.find((emp) => emp.emp_id === employeeId);
      if (selectedEmployee && ROLES.includes(employeeRole)) {
        setEmployeeAssignments((prev) => [
          ...prev,
          { emp_id: employeeId, role: employeeRole },
        ]);
        setEmployeeId('');
        setEmployeeRole('');
        setError('');
      } else {
        showSnackbar('Please select a valid employee and role.', 'error');
      }
    }
  }, [employeeId, employeeRole, employees, editingIndex]);

  const handleOpenAssignModal = (project) => {
    setSelectedProject(project);
    setEmployeeAssignments([]);
    setEmployeeId('');
    setEmployeeRole('');
    setEditingIndex(null);
    fetchEmployees();
    setOpenAssignModal(true);
  };

  const handleOpenHierarchyModal = (project) => {
    setSelectedProject(project);
    setProjectMembers([]);
    setHierarchyEditEmpId('');
    setHierarchyEditRole('');
    setHierarchyLoading(true);
    fetchProjectMembers(project.project_id);
    setOpenHierarchyModal(true);
  };

  const handleCloseAssignModal = () => {
    setOpenAssignModal(false);
    setSelectedProject(null);
    setEmployeeAssignments([]);
    setEmployeeId('');
    setEmployeeRole('');
    setEditingIndex(null);
    setEmployees([]);
    setAssignLoading(false);
    setError('');
  };

  const handleCloseHierarchyModal = () => {
    setOpenHierarchyModal(false);
    setSelectedProject(null);
    setProjectMembers([]);
    setHierarchyEditEmpId('');
    setHierarchyEditRole('');
    setHierarchyEditLoading(false);
    setHierarchyLoading(false);
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
    setDeleteLoading({});
    setError('');
  };

  const handleEditEmployee = (index) => {
    const assignment = employeeAssignments[index];
    setEmployeeId(assignment.emp_id);
    setEmployeeRole(assignment.role);
    setEditingIndex(index);
  };

  const handleRemoveEmployee = (index) => {
    setEmployeeAssignments((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEmployeeId('');
      setEmployeeRole('');
    }
  };

  const handleAssignEmployees = async () => {
    if (!selectedProject || employeeAssignments.length === 0) {
      showSnackbar('Please add at least one employee to assign.', 'error');
      return;
    }

    const isValid = employeeAssignments.every(
      (assignment) => assignment.emp_id && ROLES.includes(assignment.role)
    );

    if (!isValid) {
      showSnackbar('One or more assignments have invalid employee or role details.', 'error');
      return;
    }

    try {
      setAssignLoading(true);
      const response = await axios.post(
        `${API_URL}/projects/${selectedProject.project_id}/assign`,
        {
          employees: employeeAssignments,
          assigned_by: empId,
        },
        { headers: { Authorization: token } }
      );

      if (response.status === 201) {
        showSnackbar('Employees assigned successfully!');
        handleCloseAssignModal();
        fetchProjects();
      } else {
        throw new Error(response.data.message || 'Unable to assign employees.');
      }
    } catch (err) {
      console.error('Error assigning employees:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : err.response?.status === 409
          ? 'One or more employees are already assigned to this project.'
          : err.response?.data?.message || 'Unable to assign employees. Please try again.';
      showSnackbar(errorMessage, 'error');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const handleEditProjectMember = (member) => {
    setHierarchyEditEmpId(member.emp_id);
    setHierarchyEditRole(member.role);
  };

  const handleSaveProjectMember = async () => {
    if (!selectedProject || !hierarchyEditEmpId || !hierarchyEditRole) {
      showSnackbar('Please select a role to update.', 'error');
      return;
    }

    if (!ROLES.includes(hierarchyEditRole)) {
      showSnackbar('Please select a valid role.', 'error');
      return;
    }

    try {
      setHierarchyEditLoading(true);
      const response = await axios.put(
        `${API_URL}/projects/${selectedProject.project_id}/edit`,
        {
          employees: [{ emp_id: hierarchyEditEmpId, action: 'update', new_role: hierarchyEditRole }],
          modified_by: empId,
        },
        { headers: { Authorization: token } }
      );

      if (response.status === 200) {
        showSnackbar('Employee role updated successfully!');
        setHierarchyEditEmpId('');
        setHierarchyEditRole('');
        fetchProjectMembers(selectedProject.project_id);
      } else {
        throw new Error(response.data.message || 'Unable to update employee role.');
      }
    } catch (err) {
      console.error('Error updating employee role:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : err.response?.data?.message || 'Unable to update employee role. Please try again.';
      showSnackbar(errorMessage, 'error');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
      }
    } finally {
      setHierarchyEditLoading(false);
    }
  };

  const handleDeleteProjectMember = async (empIdToDelete) => {
    if (!selectedProject) {
      showSnackbar('No project selected.', 'error');
      return;
    }

    try {
      setDeleteLoading((prev) => ({ ...prev, [empIdToDelete]: true }));
      const response = await axios.put(
        `${API_URL}/projects/${selectedProject.project_id}/edit`,
        {
          employees: [{ emp_id: empIdToDelete, action: 'delete' }],
          modified_by: empId,
        },
        { headers: { Authorization: token } }
      );

      if (response.status === 200) {
        showSnackbar('Employee removed from project successfully!');
        if (hierarchyEditEmpId === empIdToDelete) {
          setHierarchyEditEmpId('');
          setHierarchyEditRole('');
        }
        setShowDeleteConfirm(false);
        setEmployeeToDelete(null);
        fetchProjectMembers(selectedProject.project_id);
      } else {
        throw new Error(response.data.message || 'Unable to remove employee.');
      }
    } catch (err) {
      console.error('Error deleting employee:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.response?.status === 401 || err.response?.status === 403
          ? 'Your session has expired. Please log in again.'
          : err.response?.data?.message || 'Unable to remove employee. Please try again.';
      showSnackbar(errorMessage, 'error');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
      }
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [empIdToDelete]: false }));
    }
  };

  const confirmDelete = (empId) => {
    setEmployeeToDelete(empId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ced4da',
      '&:hover': { borderColor: '#adb5bd' },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#007bff'
        : state.isFocused
        ? '#f8f9fa'
        : 'white',
      color: state.isSelected ? 'white' : '#212529',
      '&:hover': {
        backgroundColor: '#f8f9fa',
        color: '#212529',
      },
    }),
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <div className="d-flex flex-grow-1 overflow-hidden">
        <div
          className="sidebar-container"
          style={{
            position: 'absolute',
            top: '56px',
            height: 'calc(100vh - 56px)',
            width: isSidebarHovered ? '250px' : '60px', // Expand to 250px on hover, collapse to 60px
            transition: 'width 0.3s ease', // Smooth transition
            zIndex: 1000, // Ensure sidebar is above content
            backgroundColor: '#f8f9fa', // Match Bootstrap bg-light or customize
            overflow: 'hidden', // Hide content when collapsed
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DynamicSidebar isExpanded={isSidebarHovered} />
        </div>
        <div
          className="container-fluid py-4 bg-light mt-5"
          style={{
            marginLeft: isSidebarHovered ? '250px' : '60px', // Adjust content margin to match sidebar width
            transition: 'margin-left 0.3s ease', // Smooth transition for content
            width: 'calc(100% - 60px)', // Ensure content takes remaining space
          }}
        >
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                <h3 className="card-title mb-4 text-primary">Project Management</h3>
                {loading ? (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered">
                      <thead className="table-primary">
                        <tr>
                          <th>Project ID</th>
                          <th>Project Name</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Actions</th>
                          <th>Hierarchy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr key={project.id}>
                            <td>{project.project_id}</td>
                            <td>{project.project_name}</td>
                            <td>{project.start_date}</td>
                            <td>{project.end_date}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleOpenAssignModal(project)}
                              >
                                <PersonAdd className="me-2" />
                                Assign
                              </button>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenHierarchyModal(project)}
                              >
                                <Eye className="me-2" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Assign Employees Modal */}
          <div className={`modal fade ${openAssignModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    Assign Employees to {selectedProject?.project_name || 'Project'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCloseAssignModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="employeeSelect" className="form-label">
                      Employee
                    </label>
                    <Select
                      id="employeeSelect"
                      options={employees}
                      value={employees.find((emp) => emp.value === employeeId) || null}
                      onChange={(selectedOption) => setEmployeeId(selectedOption ? selectedOption.value : '')}
                      placeholder="Search and select an employee..."
                      isClearable
                      styles={customSelectStyles}
                      noOptionsMessage={() => "No employees found"}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="roleSelect" className="form-label">
                      Role
                    </label>
                    <select
                      id="roleSelect"
                      className="form-select"
                      value={employeeRole}
                      onChange={(e) => setEmployeeRole(e.target.value)}
                    >
                      <option value="">Select a role</option>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ul className="list-group mb-3">
                    {employeeAssignments.map((emp, index) => {
                      const assignedEmployee = employees.find((e) => e.emp_id === emp.emp_id);
                      return (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <strong>Employee:</strong> {assignedEmployee ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}` : emp.emp_id}
                            <br />
                            <small>Role: {emp.role}</small>
                          </div>
                          <div>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEditEmployee(index)}
                            >
                              <PencilSquare />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveEmployee(index)}
                            >
                              <Trash />
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseAssignModal}
                    disabled={assignLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAssignEmployees}
                    disabled={assignLoading}
                  >
                    {assignLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : (
                      'Assign'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Hierarchy Modal */}
          <div className={`modal fade ${openHierarchyModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    Project Hierarchy: {selectedProject?.project_name || 'Project'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCloseHierarchyModal}
                  ></button>
                </div>
                <div className="modal-body">
                  {showDeleteConfirm && (
                    <div className="alert alert-warning alert-dismissible fade show" role="alert">
                      <strong>Confirm Deletion</strong>
                      <p>
                        Are you sure you want to delete {projectMembers.find((m) => m.emp_id === employeeToDelete)?.first_name} {projectMembers.find((m) => m.emp_id === employeeToDelete)?.last_name} from this project?
                      </p>
                      <button
                        type="button"
                        className="btn btn-danger me-2"
                        onClick={() => handleDeleteProjectMember(employeeToDelete)}
                        disabled={deleteLoading[employeeToDelete]}
                      >
                        {deleteLoading[employeeToDelete] ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        ) : (
                          'Confirm'
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={cancelDelete}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {hierarchyEditEmpId && !showDeleteConfirm && (
                    <div className="mb-3">
                      <label htmlFor="hierarchyRoleSelect" className="form-label">
                        Edit Role for {projectMembers.find((m) => m.emp_id === hierarchyEditEmpId)?.first_name || ''} {projectMembers.find((m) => m.emp_id === hierarchyEditEmpId)?.last_name || ''}
                      </label>
                      <select
                        id="hierarchyRoleSelect"
                        className="form-select"
                        value={hierarchyEditRole}
                        onChange={(e) => setHierarchyEditRole(e.target.value)}
                      >
                        <option value="">Select a role</option>
                        {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      </select>
                      <div className="mt-2">
                        <button
                          className="btn btn-primary me-2"
                          onClick={handleSaveProjectMember}
                          disabled={!hierarchyEditRole || hierarchyEditLoading}
                        >
                          {hierarchyEditLoading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          ) : (
                            'Save Role'
                          )}
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setHierarchyEditEmpId('');
                            setHierarchyEditRole('');
                          }}
                          disabled={hierarchyEditLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {hierarchyLoading ? (
                    <div className="text-center my-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : projectMembers.length === 0 && !showDeleteConfirm ? (
                    <p className="text-muted">No employees assigned to this project.</p>
                  ) : (
                    <ul className="list-group">
                      {projectMembers.map((member, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <strong>{`${member.first_name} ${member.last_name}`}</strong>
                            <br />
                            <small>Role: {member.role} | Email: {member.email}</small>
                          </div>
                          <div>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEditProjectMember(member)}
                              disabled={hierarchyEditLoading || hierarchyEditEmpId !== '' || showDeleteConfirm}
                            >
                              <PencilSquare />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => confirmDelete(member.emp_id)}
                              disabled={hierarchyEditLoading || hierarchyEditEmpId !== '' || showDeleteConfirm}
                            >
                              {deleteLoading[member.emp_id] ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <Trash />
                              )}
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                  {error && !showDeleteConfirm && (
                    <div className="alert alert-danger mt-3" role="alert">
                      {error}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseHierarchyModal}
                    disabled={hierarchyEditLoading || showDeleteConfirm}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTree;