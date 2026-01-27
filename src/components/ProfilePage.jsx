import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import {
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Box,
  Tabs,
  Tab,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
  Slide,
  IconButton,
} from "@mui/material";
import {
  WorkOutline,
  LocationOn,
  Email,
  Phone,
  Cake,
  Celebration,
  AddPhotoAlternate,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import DynamicSidebar from "./Sidebar";
import AppNavbar from "./Hrmnav";

const ProfilePage = () => {
  const [employee, setEmployee] = useState(null);
  const [photo, setPhoto] = useState("/cardimg.png"); // Default image from public folder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [tabValue, setTabValue] = useState(0);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const storedEmpId =
          location.state?.empId || sessionStorage.getItem("empId");
        const token =
          localStorage.getItem(`token_${storedEmpId}`) ||
          localStorage.getItem("token");

        if (!token || !storedEmpId) {
          throw new Error("Token or employee ID missing");
        }

        const response = await axios.get(`${API_URL}/self_employee_details`, {
          headers: { Authorization: token },
        });
        setEmployee(response.data.employee);

        const photoResponse = await axios.get(
          `${API_URL}/get_employee_photo/${storedEmpId}`,
          {
            headers: { Authorization: token },
          }
        );

        if (photoResponse.data.photo_base64) {
          setPhoto(`data:image/jpeg;base64,${photoResponse.data.photo_base64}`);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        const status = err.response?.status;
        const errorMessage =
          err.response?.data?.message || "Failed to fetch employee data";

        if (status === 401 || status === 422) {
          setError("Session expired or invalid. Please log in again.");
          setSnackbar({
            open: true,
            message: "Session expired. Redirecting to login...",
            severity: "error",
          });
          setTimeout(() => navigate("/login"), 2000);
        } else if (status === 404) {
          setError("Employee not found.");
          setSnackbar({
            open: true,
            message: "Employee not found.",
            severity: "error",
          });
        } else {
          setError(errorMessage);
          setSnackbar({ open: true, message: errorMessage, severity: "error" });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [navigate, location.state]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      file.type.startsWith("image/") &&
      ["image/jpeg", "image/jpg"].includes(file.type)
    ) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSnackbar({
        open: true,
        message: "Please select a valid JPG/JPEG file",
        severity: "error",
      });
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: "Please select a file to upload",
        severity: "error",
      });
      return;
    }

    const empId = sessionStorage.getItem("empId");
    const token = localStorage.getItem(`token_${empId}`);
    if (!empId || !token) {
      setSnackbar({
        open: true,
        message: "Session expired. Please log in again.",
        severity: "error",
      });
      navigate("/login", { replace: true });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      await axios.post(`${API_URL}/get_employee_photo/${empId}`, formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });

      const photoResponse = await axios.get(
        `${API_URL}/get_employee_photo/${empId}`,
        {
          headers: { Authorization: token },
        }
      );

      if (photoResponse.data.photo_base64) {
        setPhoto(`data:image/jpeg;base64,${photoResponse.data.photo_base64}`);
      }

      setSnackbar({
        open: true,
        message: "Profile photo uploaded successfully",
        severity: "success",
      });
      setOpenUploadDialog(false);
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error("Error uploading photo:", error);
      let errorMessage =
        error.response?.data?.message || "Failed to upload photo";
      if (error.response?.status === 401) {
        errorMessage = "Unauthorized: Token missing or invalid";
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login", { replace: true });
      } else if (error.response?.status === 403) {
        errorMessage = "Forbidden: User not found";
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login", { replace: true });
      } else if (error.response?.status === 404) {
        errorMessage = `Employee with ID ${empId} not found`;
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data.message ||
          "Invalid file type or no file selected";
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  // const handleDeletePhoto = () => {
  //   setPhoto("/cardimg.png"); // Reset to default image
  //   setSnackbar({
  //     open: true,
  //     message: "Profile photo reset to default",
  //     severity: "success",
  //   });
  //   setOpenUploadDialog(false);
  // };

  const handleCloseDialog = () => {
    setOpenUploadDialog(false);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spinner animation="border" variant="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              fontFamily: '"Roboto", sans-serif',
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backgroundColor:
                snackbar.severity === "error" ? "#EF5350" : "#4CAF50",
              color: "#FFFFFF",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      {/* Navbar */}
      <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <AppNavbar />
      </Box>

      {/* Main Content with Sidebar */}
      <Box sx={{ display: "flex", mt: "64px" }}>
        {/* Sidebar */}
        <Box
          sx={{
            position: "fixed",
            // top: "64px",
            bottom: 0,
            overflowY: "auto",
            bgcolor: "#f5f7fa",
            zIndex: 1100,
          }}
        >
          <DynamicSidebar />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            width: "100vw",
            flexGrow: 1,
            // p: 3,
            minHeight: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          <Container maxWidth={false} style={{ padding: 0 }}>
            <Card
              style={{
                borderRadius: "8px",
                // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Box
                sx={{
                  borderBottom: "1px solid #e0e0e0",
                  bgcolor: "#1a1a1a",
                  color: "#fff",
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="profile tabs"
                  textColor="inherit"
                  indicatorColor="secondary"
                  sx={{ padding: "0 10px" }}
                >
                  <Tab
                    label="Personal Details"
                    sx={{
                      textTransform: "none",
                      fontSize: "14px",
                      padding: "10px 20px",
                    }}
                  />
                </Tabs>
              </Box>

              <Card.Body>
                <Row>
                  <Col
                    md={3}
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#f5f7fa",
                    }}
                  >
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={photo}
                        alt="Profile"
                        style={{
                          width: "150px",
                          height: "150px",
                          borderRadius: "50%",
                          border: "4px solid #fff",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <IconButton
                        onClick={() => setOpenUploadDialog(true)}
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          bgcolor: "#34495E",
                          color: "#F7E7CE",
                          "&:hover": {
                            bgcolor: "#2C3E50",
                            transform: "scale(1.1)",
                          },
                          transition: "transform 0.2s",
                        }}
                      >
                        <AddPhotoAlternate />
                      </IconButton>
                      {photo !== "/cardimg.png" && null}
                    </Box>
                    <Typography
                      variant="h6"
                      style={{ marginTop: "15px", fontWeight: 500 }}
                    >
                      {employee.first_name} {employee.last_name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      style={{ marginBottom: "10px" }}
                    >
                      {employee.emp_id}
                    </Typography>
                    <List dense>
                      {[
                        {
                          icon: <WorkOutline />,
                          primary: "Designation",
                          secondary: employee.designation,
                        },
                        {
                          icon: <LocationOn />,
                          primary: "Work From",
                          secondary: employee.work_from,
                        },
                        {
                          icon: <Email />,
                          primary: "Email",
                          secondary: employee.email,
                        },
                        {
                          icon: <Phone />,
                          primary: "Phone",
                          secondary: employee.phone,
                        },
                        {
                          icon: <Cake />,
                          primary: "Birthday",
                          secondary: employee.date_of_birth,
                        },
                        {
                          icon: <Celebration />,
                          primary: "Anniversary",
                          secondary: employee.date_of_joining,
                        },
                      ].map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={item.primary}
                            secondary={item.secondary || "N/A"}
                            primaryTypographyProps={{
                              variant: "body2",
                              color: "textSecondary",
                              style: { fontSize: "12px" },
                            }}
                            secondaryTypographyProps={{
                              variant: "body1",
                              style: { fontSize: "14px" },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <div style={{ marginTop: "15px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 10px",
                          backgroundColor: "#cce5ff",
                          color: "#004085",
                          borderRadius: "12px",
                          marginRight: "10px",
                        }}
                      >
                        {employee.employee_status}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 10px",
                          backgroundColor: "#d4edda",
                          color: "#155724",
                          borderRadius: "12px",
                        }}
                      >
                        {employee.employment_type}
                      </span>
                    </div>
                  </Col>

                  <Col md={9} style={{ padding: "20px" }}>
                    <Typography
                      variant="h6"
                      style={{ marginTop: "15px", fontWeight: 500 }}
                    >
                      Personal Information
                    </Typography>
                    <Paper
                      elevation={1}
                      style={{ padding: "15px", borderRadius: "8px" }}
                    >
                      <List dense>
                        <Row>
                          <Col md={6}>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>First Name</strong>}
                                secondary={employee.first_name || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Last Name</strong>}
                                secondary={employee.last_name || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>AADHAAR</strong>}
                                secondary={employee.aadhaar || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Added By</strong>}
                                secondary={employee.added_by || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Added Time</strong>}
                                secondary={employee.added_time || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Age</strong>}
                                secondary={employee.age || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Current Experience</strong>}
                                secondary={employee.current_experience || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Department</strong>}
                                secondary={employee.department || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Designation</strong>}
                                secondary={employee.designation || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Email</strong>}
                                secondary={employee.email || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Emp ID</strong>}
                                secondary={employee.emp_id || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Employment Type</strong>}
                                secondary={employee.employment_type || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Extension</strong>}
                                secondary={employee.extension || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                          </Col>
                          <Col md={6}>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Gender</strong>}
                                secondary={employee.gender || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Marital Status</strong>}
                                secondary={employee.marital_status || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Modified By</strong>}
                                secondary={employee.modified_by || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Modified Time</strong>}
                                secondary={employee.modified_time || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Nick Name</strong>}
                                secondary={employee.nick_name || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Office Location</strong>}
                                secondary={employee.office_location || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Phone</strong>}
                                secondary={employee.phone || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Reporting Manager</strong>}
                                secondary={employee.reporting_manager || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Source of Hire</strong>}
                                secondary={employee.source_of_hire || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Total Experience</strong>}
                                secondary={employee.total_experience || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={<strong>Personal Mobile</strong>}
                                secondary={employee.personal_mobile || "N/A"}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: "textSecondary",
                                  style: {
                                    fontSize: "12px",
                                    minWidth: "150px",
                                  },
                                }}
                                secondaryTypographyProps={{
                                  variant: "body1",
                                  style: { fontSize: "14px" },
                                }}
                              />
                            </ListItem>
                          </Col>
                        </Row>
                      </List>
                    </Paper>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Upload Photo Dialog */}
            <Dialog
              open={openUploadDialog}
              onClose={handleCloseDialog}
              TransitionComponent={Slide}
              TransitionProps={{ direction: "up" }}
              sx={{ zIndex: 1600 }}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  backgroundColor: "#ffffff",
                  width: { xs: "90%", sm: 400 },
                  maxWidth: 400,
                  p: 3,
                  fontFamily: '"Roboto", sans-serif',
                },
              }}
            >
              <DialogTitle
                sx={{
                  p: 0,
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: "#1A3C34",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                  }}
                >
                  Upload Profile Photo
                </Typography>
                <IconButton
                  onClick={handleCloseDialog}
                  sx={{
                    color: "#1A3C34",
                    "&:hover": { backgroundColor: "#E8F0EF" },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 0, textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>
                  {filePreview || photo !== "/cardimg.png" ? (
                    <Avatar
                      src={filePreview || photo}
                      alt="Profile Preview"
                      sx={{
                        width: 120,
                        height: 120,
                        mx: "auto",
                        border: "2px solid #1A3C34",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        mx: "auto",
                        borderRadius: "50%",
                        backgroundColor: "#E8F0EF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed #1A3C34",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#1A3C34",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        No Photo
                      </Typography>
                    </Box>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  ref={fileInputRef}
                />
                <Button
                  variant="outlined"
                  onClick={handleChooseFile}
                  sx={{
                    color: "#1A3C34",
                    borderColor: "#1A3C34",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 4,
                    mb: 2,
                    "&:hover": {
                      backgroundColor: "#E8F0EF",
                      borderColor: "#1A3C34",
                    },
                  }}
                >
                  Choose File
                </Button>
                {uploading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <CircularProgress size={24} sx={{ color: "#1A3C34" }} />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 0, mt: 2, justifyContent: "center" }}>
                <Button
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{
                    color: "#1A3C34",
                    borderColor: "#1A3C34",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 4,
                    "&:hover": {
                      backgroundColor: "#E8F0EF",
                      borderColor: "#1A3C34",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  variant="contained"
                  disabled={!selectedFile || uploading}
                  sx={{
                    backgroundColor: "#1A3C34",
                    color: "#FFFFFF",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 4,
                    "&:hover": { backgroundColor: "#15332D" },
                    "&:disabled": {
                      backgroundColor: "#B0BEC5",
                      color: "#FFFFFF",
                    },
                  }}
                >
                  Upload
                </Button>
              </DialogActions>
            </Dialog>

            <Snackbar
              open={snackbar.open}
              autoHideDuration={5000}
      onClose={handleSnackbarClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <Alert
                onClose={handleSnackbarClose}
                severity={snackbar.severity}
                sx={{
                  width: "100%",
                  fontFamily: '"Roboto", sans-serif',
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  backgroundColor:
                    snackbar.severity === "error" ? "#EF5350" : "#4CAF50",
                  color: "#FFFFFF",
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;