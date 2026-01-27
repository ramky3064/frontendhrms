import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Modal,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  Checkbox,
  Grid,
} from "@mui/material";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import DynamicSidebar from "./Sidebar";
import AppNavbar from "./Hrmnav";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 600 },
  maxHeight: "80vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const layoutStyles = `
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .main-content-wrapper {
    display: flex;
    flex: 1;
  }
  .sidebar {
    position: fixed;
    top: 60px; /* Adjust this value to match the navbar height */
    left: 0;
    height: calc(100vh - 60px);
    overflow-y: auto;
    z-index: 1000;
    background-color: #f8f9fa;
  }
  .main-content {
    margin-left: 50px;
    flex: 1;
    padding: 20px;
    padding-top: 10px;
    min-height: calc(100vh - 60px);
  }
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px; /* Explicitly set navbar height */
    z-index: 1100;
    background-color: #ffffff;
    border-bottom: 1px solid #dee2e6;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 10px 0;
    text-align: center;
    border-top: 1px solid #dee2e6;
    width: 100%;
    position: relative;
    bottom: 0;
  }
  .form-container {
    max-width: 600px;
    margin: 0 auto;
  }
  .table-container {
    max-width: 100%;
    overflow-x: auto;
  }
  .modal-content {
    overflow-y: auto;
    flex: 1;
  }
  .modal-footer {
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    margin-top: 16px;
    position: sticky;
    bottom: 0;
    background-color: #fff;
  }
  @media (max-width: 768px) {
    // .sidebar {
    //   width: 200px;
    //   min-width: 200px;
    //   top: 60px; /* Ensure sidebar starts below navbar */
    //   height: calc(100vh - 60px); /* Adjust height */
    // }
    .main-content {
      margin-left: 200px;
    }
    .form-container {
      max-width: 100%;
      padding: 0 10px;
    }
  }
  @media (max-width: 576px) {
    // .sidebar {
    //   width: 100%;
    //   min-width: unset;
    //   height: auto;
    //   position: relative;
    //   top: 0; /* Reset top for mobile */
    //   left: unset;
    // }
    .main-content {
      margin-left: 0;
      padding-top: 60px; /* Space for navbar */
      padding: 10px;
    }
    .form-container {
      padding: 0 5px;
    }
    .table-container {
      font-size: 0.9rem;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = layoutStyles;
document.head.appendChild(styleSheet);

export default function ResumeParsing() {
  const [activeTab, setActiveTab] = useState("upload");
  const [candidates, setCandidates] = useState([]);
  const [resumeReviews, setResumeReviews] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJobRole, setCurrentJobRole] = useState({
    job_id: "",
    role_name: "",
    job_name: "",
    job_description: "",
    required_skills: "",
    company_name: "",
    experience: "",
    start_date: "",
    hiring_manager: "",
    current_status: "active",
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loadingEmails, setLoadingEmails] = useState({});
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [selectedJobRoles, setSelectedJobRoles] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const sessionEmpId = sessionStorage.getItem("empId");
  const token = sessionEmpId
    ? localStorage.getItem(`token_${sessionEmpId}`)
    : null;

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const validateJobRole = (jobRole) => {
    const errors = {};
    const today = new Date().toISOString().split("T")[0];

    if (
      !jobRole.job_id ||
      isNaN(jobRole.job_id) ||
      parseInt(jobRole.job_id) <= 0
    ) {
      errors.job_id = "Job ID must be a positive number";
    }

    if (!jobRole.role_name?.trim() || jobRole.role_name.length > 255) {
      errors.role_name =
        "Role Name is required and must be 255 characters or less";
    }

    if (!jobRole.job_name?.trim() || jobRole.job_name.length > 255) {
      errors.job_name =
        "Job Name is required and must be 255 characters or less";
    }

    if (
      !jobRole.job_description?.trim() ||
      jobRole.job_description.length > 255
    ) {
      errors.job_description =
        "Job Description is required and must be 255 characters or less";
    }

    if (
      !jobRole.required_skills?.trim() ||
      jobRole.required_skills.length > 255
    ) {
      errors.required_skills =
        "Required Skills is required and must be 255 characters or less";
    } else {
      const skills = jobRole.required_skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (skills.length === 0) {
        errors.required_skills = "At least one skill is required";
      }
    }

    if (!jobRole.company_name?.trim() || jobRole.company_name.length > 255) {
      errors.company_name =
        "Company Name is required and must be 255 characters or less";
    }

    if (jobRole.experience && jobRole.experience.length > 50) {
      errors.experience = "Experience must be 50 characters or less";
    }

    if (
      !jobRole.start_date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(jobRole.start_date)
    ) {
      errors.start_date = "Start Date must be in YYYY-MM-DD format";
    } else if (jobRole.start_date < today) {
      errors.start_date = "Start Date cannot be in the past";
    }

    if (!jobRole.hiring_manager?.trim() || jobRole.hiring_manager.length > 50) {
      errors.hiring_manager =
        "Hiring Manager is required and must be 50 characters or less";
    }

    if (!["active", "filled"].includes(jobRole.current_status)) {
      errors.current_status = 'Status must be "active" or "filled"';
    }

    return errors;
  };

  useEffect(() => {
    if (!sessionEmpId || !token) {
      setError("Please log in to access the recruitment dashboard.");
      setSnackbarMessage("Please log in to access the recruitment dashboard.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      navigate("/login");
    }
  }, [sessionEmpId, token, navigate]);

  const fetchCandidates = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/candidates`, {
        headers: { Authorization: token },
      });
      const data = await response.json();
      if (response.ok) {
        setCandidates(data);
      } else {
        setError(data.error || "Failed to fetch candidates");
        setSnackbarMessage(data.error || "Failed to fetch candidates");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error fetching candidates: " + err.message);
      setSnackbarMessage("Error fetching candidates: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const fetchResumeReviews = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/resume_review`, {
        headers: { Authorization: token },
      });
      const data = await response.json();
      if (response.ok) {
        setResumeReviews(data);
        setSelectedReviews([]);
      } else {
        setError(data.error || "Failed to fetch resume reviews");
        setSnackbarMessage(data.error || "Failed to fetch resume reviews");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error fetching resume reviews: " + err.message);
      setSnackbarMessage("Error fetching resume reviews: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const fetchJobRoles = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/job_roles`, {
        headers: { Authorization: token },
      });
      const data = await response.json();
      if (response.ok) {
        setJobRoles(data);
        setSelectedJobRoles([]);
      } else {
        setError(data.error || "Failed to fetch job roles");
        setSnackbarMessage(data.error || "Failed to fetch job roles");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error fetching job roles: " + err.message);
      setSnackbarMessage("Error fetching job roles: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (sessionEmpId && token) {
      fetchCandidates();
      fetchResumeReviews();
      fetchJobRoles();
    }
  }, [sessionEmpId, token]);

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    const formData = new FormData(e.target);
    try {
      const response = await fetch(`${API_URL}/upload_resume`, {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Resume uploaded successfully");
        setSnackbarMessage("Resume uploaded successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        fetchCandidates();
        fetchResumeReviews();
      } else {
        setError(data.error || "Failed to upload resume");
        setSnackbarMessage(data.error || "Failed to upload resume");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error uploading resume: " + err.message);
      setSnackbarMessage("Error uploading resume: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSendEmail = async (reviewId) => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    setLoadingEmails((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const response = await fetch(`${API_URL}/send_shortlist_email`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ review_id: reviewId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setSnackbarMessage(data.message);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        fetchResumeReviews();
      } else {
        setError(data.error || "Failed to send email");
        setSnackbarMessage(data.error || "Failed to send email");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error sending email: " + err.message);
      setSnackbarMessage("Error sending email: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingEmails((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleSendBulkEmails = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (selectedReviews.length === 0) {
      setError("No candidates selected");
      setSnackbarMessage("No candidates selected");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setLoadingEmails((prev) => {
      const newLoading = { ...prev };
      selectedReviews.forEach((id) => {
        newLoading[id] = true;
      });
      return newLoading;
    });

    let successCount = 0;
    let errorMessages = [];

    for (const reviewId of selectedReviews) {
      try {
        const response = await fetch(`${API_URL}/send_shortlist_email`, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ review_id: reviewId }),
        });
        const data = await response.json();
        if (response.ok) {
          successCount++;
        } else {
          errorMessages.push(
            `Failed to send email for review ${reviewId}: ${
              data.error || "Unknown error"
            }`
          );
        }
      } catch (err) {
        errorMessages.push(
          `Error sending email for review ${reviewId}: ${err.message}`
        );
      }
    }

    setLoadingEmails((prev) => {
      const newLoading = { ...prev };
      selectedReviews.forEach((id) => {
        newLoading[id] = false;
      });
      return newLoading;
    });

    if (successCount > 0) {
      setSuccess(`Successfully sent ${successCount} email(s)`);
      setSnackbarMessage(`Successfully sent ${successCount} email(s)`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      fetchResumeReviews();
    }

    if (errorMessages.length > 0) {
      setError(errorMessages.join("; "));
      setSnackbarMessage(errorMessages.join("; "));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCheckboxChange = (reviewId) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const selectableReviews = resumeReviews
        .filter((review) => !review.notified)
        .map((review) => review.id);
      setSelectedReviews(selectableReviews);
    } else {
      setSelectedReviews([]);
    }
  };

  const handleJobRoleCheckboxChange = (jobId) => {
    setSelectedJobRoles((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAllJobRoles = (event) => {
    if (event.target.checked) {
      const selectableJobRoles = filteredJobRoles.map((role) => role.job_id);
      setSelectedJobRoles(selectableJobRoles);
    } else {
      setSelectedJobRoles([]);
    }
  };

  const handleViewResume = async (candidateId) => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/candidates/${candidateId}/resume/view`,
        {
          headers: { Authorization: token },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to view resume");
        setSnackbarMessage(data.error || "Failed to view resume");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Error viewing resume: " + err.message);
      setSnackbarMessage("Error viewing resume: " + err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentJobRole({
      job_id: "",
      role_name: "",
      job_name: "",
      job_description: "",
      required_skills: "",
      company_name: "",
      experience: "",
      start_date: "",
      hiring_manager: "",
      current_status: "active",
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleOpenEditModal = (jobRole) => {
    setIsEditing(true);
    setCurrentJobRole({
      job_id: jobRole.job_id.toString(),
      role_name: jobRole.role_name || "",
      job_name: jobRole.job_name || "",
      job_description: jobRole.job_description || "",
      required_skills: jobRole.required_skills || "",
      company_name: jobRole.company_name || "",
      experience: jobRole.experience || "",
      start_date: jobRole.start_date || "",
      hiring_manager: jobRole.hiring_manager || "",
      current_status: jobRole.current_status || "active",
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleSaveJobRole = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const cleanedJobRole = {
      job_id: parseInt(currentJobRole.job_id),
      role_name: currentJobRole.role_name.trim(),
      job_name: currentJobRole.job_name.trim(),
      job_description: currentJobRole.job_description.trim(),
      required_skills: currentJobRole.required_skills.trim(),
      company_name: currentJobRole.company_name.trim(),
      experience: currentJobRole.experience
        ? currentJobRole.experience.trim()
        : null,
      start_date: currentJobRole.start_date,
      hiring_manager: currentJobRole.hiring_manager.trim(),
      current_status: currentJobRole.current_status,
    };

    const errors = validateJobRole(cleanedJobRole);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError("Please fix the errors in the form");
      setSnackbarMessage("Please fix the errors in the form");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API_URL}/job_roles/${cleanedJobRole.job_id}`
        : `${API_URL}/job_roles`;
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedJobRole),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(
          isEditing
            ? "Job role updated successfully"
            : "Job role created successfully"
        );
        setSnackbarMessage(
          isEditing
            ? "Job role updated successfully"
            : "Job role created successfully"
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setOpenModal(false);
        setCurrentJobRole({
          job_id: "",
          role_name: "",
          job_name: "",
          job_description: "",
          required_skills: "",
          company_name: "",
          experience: "",
          start_date: "",
          hiring_manager: "",
          current_status: "active",
        });
        setFormErrors({});
        fetchJobRoles();
      } else {
        setError(
          data.error || `Failed to ${isEditing ? "update" : "create"} job role`
        );
        setSnackbarMessage(
          data.error || `Failed to ${isEditing ? "update" : "create"} job role`
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError(
        `Error ${isEditing ? "updating" : "creating"} job role: ${err.message}`
      );
      setSnackbarMessage(
        `Error ${isEditing ? "updating" : "creating"} job role: ${err.message}`
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteJobRole = async (jobId, jobName) => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete job role ${jobId} (${jobName})?`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/job_roles/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || "Job role deleted successfully");
        setSnackbarMessage(data.message || "Job role deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        fetchJobRoles();
      } else {
        setError(data.error || "Failed to delete job role");
        setSnackbarMessage(data.error || "Failed to delete job role");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError(`Error deleting job role: ${err.message}`);
      setSnackbarMessage(`Error deleting job role: ${err.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleBulkDeleteJobRoles = async () => {
    if (!sessionEmpId || !token) {
      setError("Token missing. Please login again.");
      setSnackbarMessage("Token missing. Please login again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (selectedJobRoles.length === 0) {
      setError("No job roles selected");
      setSnackbarMessage("No job roles selected");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedJobRoles.length} job role(s)?`
      )
    ) {
      return;
    }

    let successCount = 0;
    let errorMessages = [];

    for (const jobId of selectedJobRoles) {
      try {
        const response = await fetch(`${API_URL}/job_roles/${jobId}`, {
          method: "DELETE",
          headers: { Authorization: token },
        });
        const data = await response.json();
        if (response.ok) {
          successCount++;
        } else {
          errorMessages.push(
            `Failed to delete job role ${jobId}: ${
              data.error || "Unknown error"
            }`
          );
        }
      } catch (err) {
        errorMessages.push(`Error deleting job role ${jobId}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      setSuccess(`Successfully deleted ${successCount} job role(s)`);
      setSnackbarMessage(`Successfully deleted ${successCount} job role(s)`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      fetchJobRoles();
    }

    if (errorMessages.length > 0) {
      setError(errorMessages.join("; "));
      setSnackbarMessage(errorMessages.join("; "));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const filteredJobRoles = jobRoles.filter((role) =>
    filterStatus === "all"
      ? true
      : role.current_status.toLowerCase() === filterStatus.toLowerCase()
  );

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (!sessionEmpId || !token) {
    return (
      <Container className="text-center mt-5">
        <Alert severity="error">
          {error || "Please log in to access the recruitment dashboard."}
        </Alert>
      </Container>
    );
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <AppNavbar />
      </div>
      <div className="main-content-wrapper">
        <div className="sidebar">
          <DynamicSidebar />
        </div>
        <div className="main-content">
          <Container fluid>
            <Row>
              <Col xs={12}>
                <h1 className="mb-4 text-center">HRMS Recruitment Dashboard</h1>
                {error && (
                  <Alert severity="error" className="mb-3">
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" className="mb-3">
                    {success}
                  </Alert>
                )}

                <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={6000}
                  onClose={handleSnackbarClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                  <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                  >
                    {snackbarMessage}
                  </Alert>
                </Snackbar>

                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "upload" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("upload")}
                    >
                      Upload Resume
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "candidates" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("candidates")}
                    >
                      Candidates
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "reviews" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("reviews")}
                    >
                      Resume Reviews
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "job_roles" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("job_roles")}
                    >
                      Job Roles
                    </button>
                  </li>
                </ul>

                {activeTab === "upload" && (
                  <Box className="form-container" sx={{ mb: 4 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                      <h2>Upload Resume</h2>
                      <form onSubmit={handleResumeUpload}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Job Role</InputLabel>
                              <Select name="role_id" required>
                                {jobRoles.map((role) => (
                                  <MenuItem
                                    key={role.job_id}
                                    value={role.job_id}
                                  >
                                    {role.job_name} ({role.company_name})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <input
                              type="file"
                              name="resume"
                              accept=".pdf"
                              className="form-control"
                              required
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              fullWidth
                            >
                              Upload Resume
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </Paper>
                  </Box>
                )}

                {activeTab === "candidates" && (
                  <Box className="table-container" sx={{ mb: 4 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                      <h2>Candidates</h2>
                      <TableContainer>
                        <Table
                          sx={{ "& .MuiTableCell-root": { py: 1.5, px: 2 } }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>ID</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Experience</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {candidates.map((candidate) => (
                              <TableRow key={candidate.id}>
                                <TableCell>{candidate.id}</TableCell>
                                <TableCell>{candidate.name}</TableCell>
                                <TableCell>{candidate.email}</TableCell>
                                <TableCell>{candidate.phone}</TableCell>
                                <TableCell>
                                  {candidate.experience || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() =>
                                      handleViewResume(candidate.id)
                                    }
                                  >
                                    View Resume
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                )}

                {activeTab === "reviews" && (
                  <Box className="table-container" sx={{ mb: 4 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                      <h2>Resume Reviews</h2>
                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSendBulkEmails}
                          disabled={
                            selectedReviews.length === 0 ||
                            selectedReviews.some((id) => loadingEmails[id])
                          }
                        >
                          Send Bulk Shortlist Emails
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table
                          sx={{ "& .MuiTableCell-root": { py: 1.5, px: 2 } }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                <Checkbox
                                  onChange={handleSelectAll}
                                  checked={
                                    resumeReviews.filter(
                                      (role) => !role.notified
                                    ).length > 0 &&
                                    selectedReviews.length ===
                                      resumeReviews.filter(
                                        (role) => !role.notified
                                      ).length
                                  }
                                  disabled={resumeReviews.every(
                                    (role) => role.notified
                                  )}
                                />
                              </TableCell>
                              <TableCell>ID</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Rating</TableCell>
                              <TableCell>Job</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell>Notified</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {resumeReviews.map((review) => (
                              <TableRow key={review.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedReviews.includes(
                                      review.id
                                    )}
                                    onChange={() =>
                                      handleCheckboxChange(review.id)
                                    }
                                    disabled={
                                      review.notified ||
                                      loadingEmails[review.id]
                                    }
                                  />
                                </TableCell>
                                <TableCell>{review.id}</TableCell>
                                <TableCell>{review.name}</TableCell>
                                <TableCell>{review.email}</TableCell>
                                <TableCell>{review.phone}</TableCell>
                                <TableCell>{review.rating}</TableCell>
                                <TableCell>{review.job_id}</TableCell>
                                <TableCell>{review.company_name}</TableCell>
                                <TableCell>
                                  {review.notified ? "Yes" : "No"}
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      onClick={() => handleSendEmail(review.id)}
                                      disabled={
                                        review.notified ||
                                        loadingEmails[review.id]
                                      }
                                    >
                                      Send Shortlist Email
                                    </Button>
                                    {loadingEmails[review.id] && (
                                      <CircularProgress size={24} />
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                )}

                {activeTab === "job_roles" && (
                  <Box className="table-container" sx={{ mb: 4 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                      <h2>Job Roles</h2>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          mb: 2,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleOpenCreateModal}
                        >
                          Add Job Role
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={handleBulkDeleteJobRoles}
                          disabled={selectedJobRoles.length === 0}
                        >
                          Delete Selected
                        </Button>
                        <FormControl sx={{ minWidth: 150, mt: 1 }}>
                          <InputLabel id="filter-status-label">
                            Filter Status
                          </InputLabel>
                          <Select
                            labelId="filter-status-label"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            label="Filter Status"
                          >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="filled">Filled</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <TableContainer>
                        <Table
                          sx={{
                            "& .MuiTableCell-root": { py: 1.5, px: 2 },
                            minWidth: 1200,
                          }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  onChange={handleSelectAllJobRoles}
                                  checked={
                                    filteredJobRoles.length > 0 &&
                                    selectedJobRoles.length ===
                                      filteredJobRoles.length
                                  }
                                />
                              </TableCell>
                              <TableCell>S.No</TableCell>
                              <TableCell>ID</TableCell>
                              <TableCell>Role Name</TableCell>
                              <TableCell>Job Name</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell>Skills</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell>Experience</TableCell>
                              <TableCell>Start Date</TableCell>
                              <TableCell>Hiring Manager</TableCell>
                              <TableCell>Created By</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell sx={{ paddingRight: "40px" }}>
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredJobRoles.map((role, index) => (
                              <TableRow key={role.job_id}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedJobRoles.includes(
                                      role.job_id
                                    )}
                                    onChange={() =>
                                      handleJobRoleCheckboxChange(role.job_id)
                                    }
                                  />
                                </TableCell>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{role.job_id}</TableCell>
                                <TableCell>{role.role_name}</TableCell>
                                <TableCell>{role.job_name}</TableCell>
                                <TableCell>
                                  {role.job_description || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.required_skills || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.company_name || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.experience || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.start_date || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.hiring_manager || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.created_by || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {role.current_status || "N/A"}
                                </TableCell>
                                <TableCell sx={{ paddingRight: "40px" }}>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      onClick={() => handleOpenEditModal(role)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      onClick={() =>
                                        handleDeleteJobRole(
                                          role.job_id,
                                          role.job_name
                                        )
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                )}

                <Modal open={openModal} onClose={() => setOpenModal(false)}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: { xs: "90%", sm: 600 },
                      maxHeight: "100vh",
                      bgcolor: "background.paper",
                      boxShadow: 24,
                      p: { xs: 2, sm: 4 },
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{ mb: 3 }}
                    >
                      {isEditing ? "Edit Job Role" : "Add New Job Role"}
                    </Typography>
                    <Box sx={{ flex: 1, overflowY: "auto", paddingTop: 2 }}>
                      <Grid container spacing={2.5}>
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <TextField
                            label="Job ID"
                            type="number"
                            fullWidth
                            value={currentJobRole.job_id}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                job_id: e.target.value,
                              })
                            }
                            disabled={isEditing}
                            required
                            size="small"
                            error={!!formErrors.job_id}
                            helperText={formErrors.job_id}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <TextField
                            label="Job Name"
                            fullWidth
                            value={currentJobRole.job_name}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                job_name: e.target.value,
                              })
                            }
                            required
                            size="small"
                            error={!!formErrors.job_name}
                            helperText={formErrors.job_name}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <TextField
                            label="Job Description"
                            fullWidth
                            value={currentJobRole.job_description}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                job_description: e.target.value,
                              })
                            }
                            required
                            multiline
                            rows={4}
                            size="small"
                            error={!!formErrors.job_description}
                            helperText={formErrors.job_description}
                            sx={{ mb: 2.5 }}
                          />
                          <TextField
                            label="Experience"
                            fullWidth
                            value={currentJobRole.experience}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                experience: e.target.value,
                              })
                            }
                            size="small"
                            error={!!formErrors.experience}
                            helperText={formErrors.experience}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <TextField
                            label="Hiring Manager"
                            fullWidth
                            value={currentJobRole.hiring_manager}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                hiring_manager: e.target.value,
                              })
                            }
                            required
                            size="small"
                            error={!!formErrors.hiring_manager}
                            helperText={formErrors.hiring_manager}
                            sx={{ "& .MuiInputBase-root": { height: 40 } }}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <TextField
                            label="Role Name"
                            fullWidth
                            value={currentJobRole.role_name}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                role_name: e.target.value,
                              })
                            }
                            required
                            size="small"
                            error={!!formErrors.role_name}
                            helperText={formErrors.role_name}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <TextField
                            label="Company Name"
                            fullWidth
                            value={currentJobRole.company_name}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                company_name: e.target.value,
                              })
                            }
                            required
                            size="small"
                            error={!!formErrors.company_name}
                            helperText={formErrors.company_name}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <TextField
                            label="Required Skills (comma-separated)"
                            fullWidth
                            value={currentJobRole.required_skills}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                required_skills: e.target.value,
                              })
                            }
                            required
                            multiline
                            rows={4}
                            size="small"
                            error={!!formErrors.required_skills}
                            helperText={formErrors.required_skills}
                            sx={{ mb: 2.5 }}
                          />
                          <TextField
                            label="Start Date (YYYY-MM-DD)"
                            fullWidth
                            value={currentJobRole.start_date}
                            onChange={(e) =>
                              setCurrentJobRole({
                                ...currentJobRole,
                                start_date: e.target.value,
                              })
                            }
                            required
                            size="small"
                            error={!!formErrors.start_date}
                            helperText={formErrors.start_date}
                            sx={{
                              "& .MuiInputBase-root": { height: 40 },
                              mb: 2.5,
                            }}
                          />
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={currentJobRole.current_status}
                              onChange={(e) =>
                                setCurrentJobRole({
                                  ...currentJobRole,
                                  current_status: e.target.value,
                                })
                              }
                              required
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="filled">Filled</MenuItem>
                            </Select>
                            {formErrors.current_status && (
                              <Typography variant="caption" color="error">
                                {formErrors.current_status}
                              </Typography>
                            )}
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                    <Box
                      sx={{
                        pt: 2,
                        borderTop: "1px solid #e0e0e0",
                        mt: 2,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveJobRole}
                        fullWidth
                      >
                        {isEditing ? "Update Job Role" : "Create Job Role"}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
      <div className="footer">
        <Footer />
      </div>
    </div>
  );
}
