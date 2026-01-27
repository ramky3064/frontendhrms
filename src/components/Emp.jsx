import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
  Container,
  createTheme,
  ThemeProvider,
  Snackbar,
  Alert,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Button,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { keyframes } from "@mui/system";
import GroupIcon from "@mui/icons-material/Group";
import WorkIcon from "@mui/icons-material/Work";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import AppNavbar from "./Hrmnav";
import PunchSystem from "./geo";
import EmployeeCheckin from "./EmployeeCheckin";
import BirthdayCard from "./BirthdayCard";
import DynamicSidebar from "./Sidebar";
import TotalDuration from "./TotalDuration";
import HolidaySlider from "./Holidays";
import EmployeeAttendanceCalendar from "./Calendar";
import Leavecard from "./LeaveCard";
import EmployeeRequestForm from "./icons/employeeRequestForm";
import WorkingHoursChart from "./Progress";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#FFA500", "#FFC800", "#FFA450", "#1E90FF", "#20B2AA"];

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const ProfileCard = ({ employeeDetails, photoBase64, loading }) => {
  // Format the name to "Abcde Fghij" style
  const formattedName = `${employeeDetails.first_name
    ?.charAt(0)
    .toUpperCase()}${employeeDetails.first_name?.slice(1).toLowerCase() || ""
    } ${employeeDetails.last_name?.charAt(0).toUpperCase()}${employeeDetails.last_name?.slice(1).toLowerCase() || ""
    }`.trim();

  return (
    <Card
      sx={{
        width: 250,
        bgcolor: "#F5E8D3",
        borderRadius: "8px",
        border: "1px solid #2C3E50",
        p: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        animation: `${slideIn} 0.5s ease-out`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
        fontFamily: '"Inter", sans-serif',
        height: 340,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{ color: "#2C3E50", fontWeight: 700, fontSize: "1rem" }}
          >
            Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontWeight: 500,
              fontSize: "1rem",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            component={RouterLink}
            to="/profile"
          >
            View
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          {loading ? (
            <Skeleton
              variant="rectangular"
              width={120}
              height={120}
              sx={{ borderRadius: "12px" }}
            />
          ) : (
            <Avatar
              alt={formattedName}
              src={photoBase64}
              sx={{
                width: 120,
                height: 120,
                borderRadius: "12px",
                objectFit: "cover",
                bgcolor: photoBase64
                  ? "transparent"
                  : AVATAR_COLORS[
                  Math.floor(Math.random() * AVATAR_COLORS.length)
                  ],
                fontSize: "1.25rem",
                fontWeight: 500,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "4px solid #F7E7CE",
              }}
              imgProps={{
                loading: "lazy",
                onError: (e) => (e.target.src = ""),
              }}
            >
              {!photoBase64 &&
                `${employeeDetails.first_name?.charAt(0) || ""}${employeeDetails.last_name?.charAt(0) || ""
                }`}
            </Avatar>
          )}
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: "#2C3E50",
            fontWeight: 600,
            fontSize: "1rem",
            mb: 0.25,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {formattedName}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#2C3E50",
            fontWeight: 900,
            fontSize: "0.75rem",
            mb: 0.5,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {employeeDetails.designation || "N/A"}
        </Typography>

        <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontSize: "0.75rem",
              mb: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span" fontWeight={700}>
              ID:
            </Box>{" "}
            {employeeDetails.emp_id || "N/A"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontSize: "0.75rem",
              mb: 0.3,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span" fontWeight={700}>
              Email:
            </Box>{" "}
            {employeeDetails.email || "N/A"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontSize: "0.75rem",
              mb: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span" fontWeight={700}>
              Dept:
            </Box>{" "}
            {employeeDetails.department || "N/A"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontSize: "0.75rem",
              mb: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span" fontWeight={700}>
              Joined:
            </Box>{" "}
            {employeeDetails.date_of_joining || "N/A"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2C3E50",
              fontSize: "0.75rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Box component="span" fontWeight={700}>
              Status:
            </Box>{" "}
            {employeeDetails.employee_status || "N/A"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const theme = createTheme({
  palette: {
    primary: { main: "#2B3E52" },
    secondary: { main: "#D8C9AE" },
    background: { default: "#D8C9AE" },
    text: { primary: "#2B3E52" },
    danger: { main: "#dc3545" },
    warning: { main: "#ffc107" },
    success: { main: "#28a745" },
    error: { main: "#dc3545" },
    custom: {
      darkBg: "#2B3E52",
      orange: "#F15A24",
      darkGray: "#2B3E52",
      lightGray: "#D8C9AE",
      textDark: "#2B3E52",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.875rem" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "transform 0.2s",
          "&:hover": { transform: "translateY(-4px)" },
        },
      },
    },
  },
});

const EmpDashboard = () => {
  const [employeeDetails, setEmployeeDetails] = useState({
    emp_id: "",
    first_name: "",
    last_name: "",
    designation: "",
    department: "",
    email: "",
    date_of_joining: "",
    employee_status: "",
  });
  const [photoBase64, setPhotoBase64] = useState("");
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const navigate = useNavigate();

  const employeeColumns = [
    { field: "emp_id", headerName: "Employee ID", width: 150 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "phone", headerName: "Phone", width: 150 },
    { field: "role", headerName: "Role", width: 120 },
  ];

  const projectColumns = [
    { field: "project_id", headerName: "Project ID", width: 150 },
    { field: "project_name", headerName: "Project Name", width: 250 },
  ];

  const fetchEmployeeData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const empId = sessionStorage.getItem("empId");
      if (!empId) {
        setSnackbarMessage("Employee ID missing. Please log in again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        navigate("login", { replace: true });
        return;
      }

      const token = localStorage.getItem(`token_${empId}`);
      if (!token) {
        setSnackbarMessage("Authentication token missing. Please log in again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        navigate("login", { replace: true });
        return;
      }

      // Validate token
      let decoded;
      try {
        decoded = jwtDecode(token);
        const tokenEmpId = decoded.emp_id || decoded.sub;
        if (tokenEmpId !== empId) {
          throw new Error("Token emp_id does not match session empId");
        }
      } catch (err) {
        setSnackbarMessage("Invalid or malformed token. Please log in again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("login", { replace: true });
        return;
      }

      const cacheKey = `dashboard_data_${empId}`;
      const cacheExpiration = 10 * 60 * 1000; // Cache for 10 minutes
      let cachedData = localStorage.getItem(cacheKey);

      if (cachedData && !forceRefresh) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (
            Date.now() - parsedData.timestamp < cacheExpiration &&
            parsedData.employeeDetails &&
            Array.isArray(parsedData.employees) &&
            Array.isArray(parsedData.projects)
          ) {
            setEmployeeDetails(parsedData.employeeDetails);
            setPhotoBase64(parsedData.photoBase64 || "");
            setTotalEmployees(parsedData.totalEmployees || 0);
            setEmployees(parsedData.employees);
            setTotalProjects(parsedData.totalProjects || 0);
            setProjects(parsedData.projects);
            setLoading(false);
            return; // Use cached data
          }
        } catch (parseError) {
          console.error("Error parsing cached data:", parseError);
          localStorage.removeItem(cacheKey);
        }
      }

      // Fetch fresh data
      const [
        empResponse,
        photoResponse,
        empCountResponse,
        projectsResponse,
        projResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/self_employee_details`, {
          headers: { Authorization: token },
        }),
        axios.get(`${API_URL}/get_employee_photo/${empId}`, {
          headers: { Authorization: token },
        }),
        axios.get(`${API_URL}/active_employees_with_count`, {
          headers: { Authorization: token },
        }),
        axios.get(`${API_URL}/active_projects`, {
          headers: { Authorization: token },
        }),
        axios.get(`${API_URL}/view_projects`, {
          headers: { Authorization: token },
        }),
      ]);

      // Process employee details
      let employeeData = {};
      if (
        empResponse.data.message === "Employee details retrieved successfully" &&
        empResponse.data.employee
      ) {
        const {
          emp_id,
          first_name,
          last_name,
          designation,
          department,
          email,
          date_of_joining,
          employee_status,
        } = empResponse.data.employee;
        employeeData = {
          emp_id: emp_id || "N/A",
          first_name: first_name || "N/A",
          last_name: last_name || "",
          designation: designation || "N/A",
          department: department || "N/A",
          email: email || "N/A",
          date_of_joining: date_of_joining
            ? new Date(date_of_joining).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            : "N/A",
          employee_status: employee_status || "N/A",
        };
        setEmployeeDetails(employeeData);
      } else {
        throw new Error(
          empResponse.data.message || "Failed to fetch employee details"
        );
      }

      // Process photo
      const photo = photoResponse.data.photo_base64
        ? `data:image/jpeg;base64,${photoResponse.data.photo_base64}`
        : "";
      setPhotoBase64(photo);

      // Process employee count and list
      let formattedEmployees = [];
      if (
        empCountResponse.status === 200 &&
        empCountResponse.data.status === "success" &&
        Array.isArray(empCountResponse.data.employees)
      ) {
        setTotalEmployees(empCountResponse.data.active_employee_count || 0);
        formattedEmployees = empCountResponse.data.employees.map(
          (emp, index) => ({
            id: index,
            emp_id: emp.emp_id || "N/A",
            name: `${emp.first_name || "N/A"} ${emp.last_name || ""}`.trim(),
            email: emp.email || "N/A",
            role: emp.user_role || "N/A",
          })
        );
        setEmployees(formattedEmployees);
      } else {
        console.warn(
          "Employee count response invalid or empty:",
          empCountResponse.data
        );
        setTotalEmployees(0);
        setEmployees([]);
      }

      // Process project count
      if (
        projectsResponse.status === 200 &&
        projectsResponse.data.status === "success"
      ) {
        setTotalProjects(projectsResponse.data.active_project_count || 0);
      } else {
        console.warn(
          "Projects count response invalid:",
          projectsResponse.data
        );
        setTotalProjects(0);
      }

      // Process projects
      let formattedProjects = [];
      if (
        projResponse.status === 200 &&
        projResponse.data.status === "success" &&
        Array.isArray(projResponse.data.projects)
      ) {
        formattedProjects = projResponse.data.projects.map((proj, index) => ({
          id: index,
          project_id: proj.project_id || "N/A",
          project_name: proj.project_name || "N/A",
        }));
        setProjects(formattedProjects);
      } else {
        console.warn(
          "Projects response invalid or empty:",
          projResponse.data
        );
        setProjects([]);
      }

      // Cache the data
      const cacheData = {
        timestamp: Date.now(),
        employeeDetails: employeeData,
        photoBase64: photo,
        totalEmployees: empCountResponse.data.active_employee_count || 0,
        employees: formattedEmployees,
        totalProjects: projectsResponse.data.active_project_count || 0,
        projects: formattedProjects,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      let errorMessage = "Failed to fetch data.";
      if (error.response?.status === 401) {
        errorMessage =
          "Invalid or missing authentication token. Please log in again.";
        localStorage.removeItem(`token_${sessionStorage.getItem("empId")}`);
        sessionStorage.removeItem("empId");
        navigate("login", { replace: true });
      } else if (error.response?.status === 403) {
        errorMessage = "You are not authorized to view this data.";
      } else if (error.response?.status === 404) {
        errorMessage =
          error.response.data.message || "Employee or data not found.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage =
          "Unable to connect to the server. Please try again later.";
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Clear cache on page load to ensure fresh data
    const empId = sessionStorage.getItem("empId");
    if (empId) {
      const cacheKey = `dashboard_data_${empId}`;
      localStorage.removeItem(cacheKey);
    }

    // Handle profile and employee details updates
    const handleProfileUpdate = (event) => {
      const { empId, newPhoto, updatedDetails } = event.detail;
      if (empId === sessionStorage.getItem("empId")) {
        // Update photo
        if (newPhoto) {
          const newPhotoBase64 = `data:image/jpeg;base64,${newPhoto}`;
          setPhotoBase64(newPhotoBase64);
        }

        // Update employee details
        if (updatedDetails) {
          setEmployeeDetails((prev) => ({
            ...prev,
            ...updatedDetails,
            date_of_joining: updatedDetails.date_of_joining
              ? new Date(updatedDetails.date_of_joining).toLocaleDateString(
                "en-US",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )
              : prev.date_of_joining,
          }));
        }

        // Invalidate cache and fetch fresh data
        const cacheKey = `dashboard_data_${empId}`;
        localStorage.removeItem(cacheKey);
        fetchEmployeeData(true); // Force refresh
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    fetchEmployeeData(true); // Force fetch fresh data on initial load/refresh

    // Cleanup
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchEmployeeData]);

  const handleClose = () => setSnackbarOpen(false);
  const handleCloseProjectDialog = () => setOpenProjectDialog(false);

  const cardData = [
    {
      title: ["Total", "Employees"],
      value: `${totalEmployees}`,
      changeColor: "#d6eaff",
      icon: <GroupIcon />,
      iconBg: "#2C3E50",
      gradient: "linear-gradient(135deg, #F5E8D3 0%, #2C3E50 100%)",
      action: () => navigate("/active-employees"),
    },
    {
      title: ["Total", "Projects"],
      value: `${totalProjects}`,
      changeColor: "error.main",
      icon: <WorkIcon />,
      iconBg: "#2C3E50",
      gradient: "linear-gradient(135deg, #F5E8D3 0%, #2C3E50 100%)",
      action: () => setOpenProjectDialog(true),
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <style>{`:root { --navbar-height: 74px; }`}</style>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <DynamicSidebar />
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "100vh",
            p: 1,
          }}
        >
          <AppNavbar />
          <Box sx={{ height: "var(--navbar-height)" }} />
          <Container maxWidth={false} sx={{ paddingLeft: 0, paddingRight: 0 }}>
            <Grid container spacing={2} justifyContent="flex-start">
              <Grid item xs={12} sm={4} md={3} lg={3}>
                <ProfileCard
                  employeeDetails={employeeDetails}
                  photoBase64={photoBase64}
                  loading={loading}
                />
              </Grid>
              <Leavecard />
              <Grid item xs={12}>
                <Grid container spacing={2} direction="column">
                  <Grid item>
                    <Grid container spacing={2}>
                      {cardData.map((card, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
                              background: card.gradient,
                              transition:
                                "transform 0.3s ease, box-shadow 0.3s ease",
                              animation: `${slideIn} 0.5s ease-out ${index * 0.1
                                }s both`,
                              "&:hover": {
                                transform: "scale(1.05) translateY(-4px)",
                                boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                              },
                              overflow: "hidden",
                              height: 150,
                              width: "100%",
                              marginBottom: 1.6,
                            }}
                          >
                            <CardContent
                              sx={{
                                p: 1.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                height: "100%",
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor: card.iconBg,
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#F7E7CE",
                                  transition: "transform 0.3s ease",
                                  "&:hover": {
                                    transform: "rotate(15deg)",
                                  },
                                }}
                              >
                                {card.icon}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  flexGrow: 1,
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    color="text.secondary"
                                    sx={{
                                      fontSize: "0.9rem",
                                      lineHeight: 1.3,
                                      margin: 0,
                                      padding: 0,
                                      color: "#2C3E50",
                                    }}
                                  >
                                    {card.title.map((line, idx) => (
                                      <span key={idx}>
                                        {line}
                                        {idx < card.title.length - 1 && <br />}
                                      </span>
                                    ))}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexGrow: 1,
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="text.primary"
                                    sx={{
                                      fontSize: "1.3rem",
                                      margin: 0,
                                      padding: 0,
                                      color: "#2C3E50",
                                    }}
                                  >
                                    {card.value}
                                  </Typography>
                                  <Chip
                                    label="View All"
                                    onClick={card.action}
                                    sx={{
                                      color: "#2C3E50",
                                      bgcolor: "#F7E7CE",
                                      fontSize: "0.65rem",
                                      fontWeight: 500,
                                      mt: 1,
                                      height: 20,
                                      "& .MuiChip-label": {
                                        padding: "0 8px",
                                      },
                                      "&:hover": {
                                        bgcolor: "#D8C9AE",
                                        color: "#34495E",
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                  <Grid item>
                    <HolidaySlider />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={4} md={3} lg={3}>
                <PunchSystem
                  setSnackbarMessage={setSnackbarMessage}
                  setSnackbarSeverity={setSnackbarSeverity}
                  setSnackbarOpen={setSnackbarOpen}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: "100%" }}>
                  <TotalDuration
                    setSnackbarMessage={setSnackbarMessage}
                    setSnackbarSeverity={setSnackbarSeverity}
                    setSnackbarOpen={setSnackbarOpen}
                  />

                </Box>
              </Grid>
              <WorkingHoursChart />
              <Grid item xs={12} sm={4} md={3} lg={3}>
                <BirthdayCard
                  setSnackbarMessage={setSnackbarMessage}
                  setSnackbarSeverity={setSnackbarSeverity}
                  setSnackbarOpen={setSnackbarOpen}
                />
              </Grid>
              <Grid item>
                <EmployeeAttendanceCalendar
                  setSnackbarMessage={setSnackbarMessage}
                  setSnackbarSeverity={setSnackbarSeverity}
                  setSnackbarOpen={setSnackbarOpen}
                />
              </Grid>
              <EmployeeRequestForm />
            </Grid>
            <Dialog
              open={openProjectDialog}
              onClose={handleCloseProjectDialog}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                Projects
                <IconButton
                  aria-label="close"
                  onClick={handleCloseProjectDialog}
                  sx={{ position: "absolute", right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {loading ? (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", overflowX: "auto" }}>
                    <DataGrid
                      rows={projects}
                      columns={projectColumns}
                      pageSizeOptions={[5]}
                      disableSelectionOnClick
                      disableColumnMenu
                      sx={{
                        "& .MuiDataGrid-root": { border: "none" },
                        "& .MuiDataGrid-cell": { padding: "6px" },
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: "#D8C9AE",
                          color: "#2B3E52",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseProjectDialog} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={3000}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <Alert
                onClose={handleClose}
                severity={snackbarSeverity}
                sx={{ width: "100%" }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default EmpDashboard;