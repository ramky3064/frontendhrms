import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
  Alert,
  Link as MuiLink,
  Snackbar,
  Skeleton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { keyframes } from "@mui/system";
import AppNavbar from "./Hrmnav";
import SetDefaultOffice from "./icons/timetracking";
import PunchSystem from "./geo";
import SetWFHLocation from "./icons/SetWFHLocation";
import ProjectManagement from "./createProject";
import LeaveCard from "./LeaveCard";
import GroupIcon from "@mui/icons-material/Group";
import CloseIcon from "@mui/icons-material/Close";
import WorkIcon from "@mui/icons-material/Work";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ManagePayslip from "./ManagePayslip";
import PayslipEdit from "./ViewAndEditPay";
import DynamicSidebar from "./Sidebar";
import EmployeeCheckin from "./EmployeeCheckin";
import BirthdayCard from "./BirthdayCard";
import TotalDuration from "./TotalDuration";
import "bootstrap/dist/css/bootstrap.min.css";
import EditHolidays from "./EditHolidays";
import EmployeeAttendanceCalendar from "./Calendar";
import { useTheme } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { Link } from "react-router-dom";
import { Chip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";

// Constants
const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#a0c3e8", "#2772a0", "#a0c3e8", "#2772a0", "#a0c3e8"];

// Color palette from Dashboard
const COLORS = {
  primary: "#a0c3e8", // Light blue for backgrounds, buttons
  secondary: "#2772a0", // Deep blue for hover states, accents
  text: "#ffffff", // White for text and icons
  border: "#ddd", // Light gray for borders
  error: "#d32f2f", // Standard MUI error color for badges
};

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// ProfileCard component
const ProfileCard = ({ employeeDetails, photoBase64, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const formattedName = `${employeeDetails.first_name
    ?.charAt(0)
    ?.toUpperCase()}${
    employeeDetails.first_name?.slice(1)?.toLowerCase() || ""
  } ${employeeDetails.last_name?.charAt(0)?.toUpperCase() || ""}${
    employeeDetails.last_name?.slice(1)?.toLowerCase() || ""
  }`.trim();

  return (
    <Card
      sx={{
        width: { xs: "100%", sm: 250, md: 250 },
        maxWidth: "100%",
        bgcolor: COLORS.secondary,
        borderRadius: "8px",
        border: `1px solid ${COLORS.border}`,
        p: { xs: 1, sm: 1.5, md: 2 },
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        animation: `${slideIn} 0.5s ease-out`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          bgcolor: COLORS.secondary,
          color: COLORS.primary,
        },
        fontFamily: '"Inter", sans-serif',
        height: { xs: "auto", sm: 300, md: 340 },
      }}
    >
      <CardContent sx={{ p: { xs: 1, sm: 2, md: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: COLORS.text,
              fontWeight: 700,
              fontSize: { xs: "0.85rem", sm: "0.9rem", md: "1.1rem" },
            }}
          >
            Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLORS.text,
              fontWeight: 500,
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "1rem" },
              cursor: "pointer",
              "&:hover": { color: COLORS.primary },
            }}
            component={Link}
            to="/profile"
          >
            View
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          {loading ? (
            <Skeleton
              variant="rectangular"
              width={isMobile ? 80 : isTablet ? 100 : 120}
              height={isMobile ? 80 : isTablet ? 100 : 120}
              sx={{ borderRadius: "12px" }}
            />
          ) : (
            <Avatar
              alt={`${employeeDetails.first_name || ""} ${
                employeeDetails.last_name || ""
              }`}
              src={photoBase64}
              sx={{
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                borderRadius: "12px",
                objectFit: "cover",
                bgcolor: photoBase64
                  ? "transparent"
                  : AVATAR_COLORS[
                      Math.floor(Math.random() * AVATAR_COLORS.length)
                    ],
                fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
                fontWeight: 500,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: `4px solid ${COLORS.primary}`,
              }}
              imgProps={{
                loading: "lazy",
                onError: (e) => (e.target.src = ""),
              }}
            >
              {!photoBase64 &&
                `${employeeDetails.first_name?.charAt(0) || ""}${
                  employeeDetails.last_name?.charAt(0) || ""
                }`}
            </Avatar>
          )}
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: COLORS.text,
            fontWeight: 600,
            fontSize: { xs: "0.85rem", sm: "0.9rem", md: "1.1rem" },
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
            color: COLORS.text,
            fontWeight: 900,
            fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
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
              color: COLORS.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
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
              color: COLORS.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
              mb: 0.3,
              cursor: "pointer",
              "&:hover": { color: COLORS.primary },
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
              color: COLORS.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
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
              color: COLORS.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
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
              color: COLORS.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.75rem" },
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

const CEOComponent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState({
    employees: true,
    projects: true,
    employeeData: true,
  });
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [openDialog, setOpenDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openManagePayDialog, setOpenManagePayDialog] = useState(false);
  const [openEditPayslipDialog, setOpenEditPayslipDialog] = useState(false);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
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

  const employeeColumns = [
    { field: "emp_id", headerName: "Employee ID", width: isMobile ? 100 : 150 },
    { field: "name", headerName: "Name", width: isMobile ? 150 : 200 },
    { field: "email", headerName: "Email", width: isMobile ? 200 : 250 },
    { field: "phone", headerName: "Phone", width: isMobile ? 100 : 150 },
    { field: "role", headerName: "Role", width: isMobile ? 100 : 120 },
  ];

  const projectColumns = [
    {
      field: "project_id",
      headerName: "Project ID",
      width: isMobile ? 100 : 150,
    },
    {
      field: "project_name",
      headerName: "Project Name",
      width: isMobile ? 200 : 250,
    },
  ];

  const cardData = [
    {
      title: ["Total", "Employees"],
      value: `${totalEmployees}`,
      icon: <GroupIcon />,
      iconBg: COLORS.secondary,
      gradient: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
      action: () => navigate("/active-employees"),
    },
    {
      title: ["Total", "Projects"],
      value: `${totalProjects}`,
      icon: <WorkIcon />,
      iconBg: COLORS.secondary,
      gradient: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
      action: () => setOpenProjectDialog(true),
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const empId = sessionStorage.getItem("empId");
      if (!empId) {
        setSnackbarMessage("Employee ID not found. Please log in again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        navigate("/login", { replace: true });
        return;
      }

      const token = localStorage.getItem(`token_${empId}`);
      if (!token) {
        setSnackbarMessage(
          "Authorization token not found. Please log in again."
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        navigate("/login", { replace: true });
        return;
      }

      const empResponse = await axios.get(
        `${API_URL}/active_employees_with_count`,
        {
          headers: { Authorization: token },
        }
      );
      if (empResponse.status === 200 && empResponse.data.status === "success") {
        setTotalEmployees(empResponse.data.active_employee_count);
      } else {
        setSnackbarMessage(
          empResponse.data.message || "Failed to fetch total employees"
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

      const employeesResponse = await axios.get(
        `${API_URL}/active_employees_with_count`,
        {
          headers: { Authorization: token },
        }
      );
      if (
        employeesResponse.status === 200 &&
        empResponse.data.status === "success"
      ) {
        const formatted = employeesResponse.data.employees.map(
          (emp, index) => ({
            id: index,
            emp_id: emp.emp_id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            phone: emp.phone,
            role: emp.user_role,
          })
        );
        setEmployees(formatted);
      } else {
        setSnackbarMessage(
          employeesResponse.data.message || "Failed to fetch employees"
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

      const projectsResponse = await axios.get(`${API_URL}/active_projects`, {
        headers: { Authorization: token },
      });
      if (
        projectsResponse.status === 200 &&
        projectsResponse.data.status === "success"
      ) {
        setTotalProjects(projectsResponse.data.active_project_count);
      } else {
        setSnackbarMessage(
          projectsResponse.data.message || "Failed to fetch total projects"
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

      const projResponse = await axios.get(`${API_URL}/view_projects`, {
        headers: { Authorization: token },
      });
      if (
        projResponse.status === 200 &&
        projResponse.data.status === "success"
      ) {
        const formattedProjects = projResponse.data.projects.map(
          (proj, index) => ({
            id: index,
            project_id: proj.project_id,
            project_name: proj.project_name,
          })
        );
        setProjects(formattedProjects);
      } else {
        setSnackbarMessage(
          projResponse.data.message || "Failed to fetch projects"
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch dashboard data";
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${sessionStorage.getItem("empId")}`);
        sessionStorage.removeItem("empId");
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading((prev) => ({ ...prev, employees: false, projects: false }));
    }
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const empId = sessionStorage.getItem("empId");
        if (!empId) {
          setSnackbarMessage("No empId found in sessionStorage");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          navigate("/login", { replace: true });
          return;
        }

        const token = localStorage.getItem(`token_${empId}`);
        if (!token) {
          setSnackbarMessage("No token found for empId");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          navigate("/login", { replace: true });
          return;
        }

        let decoded;
        try {
          decoded = jwtDecode(token);
          const tokenEmpId = decoded.emp_id || decoded.sub || decoded.user_id;
          if (!tokenEmpId || tokenEmpId !== empId) {
            setSnackbarMessage("Token empId mismatch or invalid");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            navigate("/login", { replace: true });
            return;
          }
        } catch (err) {
          setSnackbarMessage("Token decode failed");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          navigate("/login", { replace: true });
          return;
        }

        const empResponse = await axios.get(
          `${API_URL}/self_employee_details`,
          { headers: { Authorization: token } }
        );

        if (
          empResponse.data.message === "Employee details retrieved successfully"
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
          setEmployeeDetails({
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
          });
        } else {
          throw new Error(
            empResponse.data.message || "Failed to fetch employee details"
          );
        }

        const response = await axios.get(
          `${API_URL}/get_employee_photo/${empId}`,
          {
            headers: { Authorization: token },
          }
        );
        const { first_name, last_name, photo_base64 } = response.data;
        setEmployeeName(`${first_name} ${last_name}`);
        setEmployeePhoto(
          photo_base64 ? `data:image/jpeg;base64,${photo_base64}` : null
        );
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setEmployeePhoto(null);
        setSnackbarMessage(
          error.response?.data?.message || "Failed to fetch employee data"
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem(`token_${sessionStorage.getItem("empId")}`);
          sessionStorage.removeItem("empId");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading((prev) => ({ ...prev, employeeData: false }));
      }
    };

    fetchEmployeeData();
    fetchDashboardData();
  }, [navigate]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseProjectDialog = () => setOpenProjectDialog(false);
  const handleOpenManagePayDialog = () => setOpenManagePayDialog(true);
  const handleCloseManagePayDialog = () => setOpenManagePayDialog(false);
  const handleOpenEditPayslipDialog = () => setOpenEditPayslipDialog(true);
  const handleCloseEditPayslipDialog = () => setOpenEditPayslipDialog(false);
  const handleProjectCreated = () => {
    fetchDashboardData();
    setOpenDialog(false);
  };

  return (
    <div className="bg-light">
      <AppNavbar />
      <div className="d-flex" style={{ marginTop: isMobile ? "56px" : "60px" }}>
        <DynamicSidebar />
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 2, md: 2 },
            maxWidth: { xs: "100%", md: "1500px" },
            width: "100%",
            mx: "auto",
            bgcolor: "#f5f5f5",
          }}
          className="container"
        >
          {/* Welcome Card */}
          <Card
            sx={{
              mb: { xs: 1, sm: 2, md: 2 },
              p: { xs: 0.5, sm: 1, md: 1.5 },
              boxShadow: 1,
              backgroundColor: COLORS.secondary,
              transition: "box-shadow 0.3s ease",
              "&:hover": {
                boxShadow: 6,
              },
              width: "100%",
              minHeight: { xs: "auto", sm: "auto", md: "auto" },
            }}
            className="mx-auto"
          >
            <Grid
              container
              spacing={{ xs: 1, sm: 2, md: 1 }}
              alignItems="center"
              justifyContent="space-between"
            >
              <Grid item xs={12} sm={7} md={8}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <Avatar
                    src={employeePhoto}
                    sx={{
                      width: { xs: 32, sm: 40, md: 48 },
                      height: { xs: 32, sm: 40, md: 48 },
                      bgcolor: COLORS.primary,
                      color: COLORS.text,
                    }}
                    alt="Employee portrait"
                  />
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
                          color: COLORS.text,
                        }}
                      >
                        Welcome{" "}
                        {loading.employeeData ? (
                          <Skeleton
                            variant="text"
                            width={isMobile ? 80 : 100}
                          />
                        ) : (
                          employeeName || "Employee"
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={5} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    gap: { xs: 0.8, sm: 1, md: 1.5 },
                    justifyContent: { xs: "start", sm: "end" },
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    {
                      text: "Add Project",
                      icon: <AddCircleIcon />,
                      action: handleOpenDialog,
                    },
                    {
                      text: "Recruitment",
                      icon: <AddCircleIcon />,
                      to: "/parse-resume",
                    },
                    {
                      text: "Add Employee",
                      icon: <PersonAddIcon />,
                      to: "/add-employee",
                    },
                  ].map((btn, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      component={btn.to ? RouterLink : "button"}
                      to={btn.to}
                      onClick={btn.action}
                      sx={{
                        bgcolor: COLORS.primary,
                        color: COLORS.text,
                        "&:hover": {
                          bgcolor: COLORS.secondary,
                          color: COLORS.primary,
                        },
                        fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.9rem" },
                        textTransform: "none",
                        px: { xs: 0.8, sm: 1, md: 1.5 },
                        py: { xs: 0.3, sm: 0.5, md: 0.75 },
                        minWidth: { xs: "auto", sm: "80px" },
                      }}
                      startIcon={btn.icon}
                    >
                      {btn.text}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Main Dashboard Grid */}
          <Grid
            container
            spacing={{ xs: 1, sm: 2, md: 1.5 }}
            justifyContent="flex-start"
          >
            <Grid item xs={12} sm={4} md={3} lg={3}>
              <ProfileCard
                employeeDetails={employeeDetails}
                photoBase64={employeePhoto}
                loading={loading.employeeData}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3} lg={3}>
              <LeaveCard
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarSeverity={setSnackbarSeverity}
                setSnackbarOpen={setSnackbarOpen}
              />
            </Grid>
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
                            animation: `${slideIn} 0.5s ease-out ${
                              index * 0.1
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
                              width: "225.5px",
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
                                color: COLORS.text,
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
                                  sx={{
                                    fontSize: "0.9rem",
                                    lineHeight: 1.3,
                                    margin: 0,
                                    padding: 0,
                                    color: COLORS.text,
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
                                  sx={{
                                    fontSize: "1.3rem",
                                    margin: 0,
                                    padding: 0,
                                    color: COLORS.text,
                                  }}
                                >
                                  {card.value}
                                </Typography>
                                <Chip
                                  label="View All"
                                  onClick={card.action}
                                  sx={{
                                    color: COLORS.text,
                                    bgcolor: COLORS.primary,
                                    fontSize: "0.65rem",
                                    fontWeight: 500,
                                    mt: 1,
                                    height: 20,
                                    "& .MuiChip-label": {
                                      padding: "0 8px",
                                    },
                                    "&:hover": {
                                      bgcolor: COLORS.secondary,
                                      color: COLORS.primary,
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
                  <EditHolidays />
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
            <Grid item xs={12} sm={4} md={3} lg={3}>
              <BirthdayCard
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarSeverity={setSnackbarSeverity}
                setSnackbarOpen={setSnackbarOpen}
              />
            </Grid>
            <Grid item>
              <EmployeeAttendanceCalendar />
            </Grid>
            <Grid item xs={12}>
              <EmployeeCheckin
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarSeverity={setSnackbarSeverity}
                setSnackbarOpen={setSnackbarOpen}
              />
            </Grid>
          </Grid>

          {/* Dialogs */}
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            sx={{
              "& .MuiDialog-paper": {
                width: { xs: "95%", sm: "90%", md: "100%" },
                bgcolor: COLORS.primary,
                border: `1px solid ${COLORS.border}`,
              },
            }}
          >
            <DialogTitle sx={{ bgcolor: COLORS.secondary, color: COLORS.text }}>
              Create New Project
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: COLORS.text,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <ProjectManagement
                setSnackbarMessage={setSnackbarMessage}
                setSnackbarSeverity={setSnackbarSeverity}
                setSnackbarOpen={setSnackbarOpen}
                onProjectCreated={handleProjectCreated}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseDialog}
                sx={{
                  bgcolor: COLORS.primary,
                  color: COLORS.text,
                  "&:hover": {
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openProjectDialog}
            onClose={handleCloseProjectDialog}
            maxWidth="lg"
            fullWidth
            sx={{
              "& .MuiDialog-paper": {
                width: { xs: "95%", sm: "90%", md: "100%" },
                bgcolor: COLORS.primary,
                border: `1px solid ${COLORS.border}`,
              },
            }}
          >
            <DialogTitle sx={{ bgcolor: COLORS.secondary, color: COLORS.text }}>
              Projects
              <IconButton
                aria-label="close"
                onClick={handleCloseProjectDialog}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: COLORS.text,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                color: "#2772a0", // Apply text color for Projects dialog
              }}
            >
              {loading.projects ? (
                <Box display="flex" justifyContent="center" mt={4}>
                  <CircularProgress sx={{ color: COLORS.secondary }} />
                </Box>
              ) : error ? (
                <Alert
                  severity="error"
                  sx={{
                    width: "100%",
                    bgcolor: COLORS.primary,
                    color: "#2772a0", // Update Alert text color
                    "& .MuiAlert-icon": { color: "#2772a0" }, // Update Alert icon color
                  }}
                >
                  {error}
                </Alert>
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
                      "& .MuiDataGrid-cell": {
                        padding: { xs: "2px", sm: "4px", md: "6px" },
                        color: "#2772a0", // Update DataGrid cell text color
                      },
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: COLORS.primary,
                        color: "#2772a0", // Update DataGrid header text color
                        fontWeight: "bold",
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" },
                      },
                    }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseProjectDialog}
                sx={{
                  bgcolor: COLORS.primary,
                  color: "#2772a0", // Update Button text color
                  "&:hover": {
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openManagePayDialog}
            onClose={handleCloseManagePayDialog}
            maxWidth="md"
            fullWidth
            sx={{
              "& .MuiDialog-paper": {
                width: { xs: "95%", sm: "90%", md: "100%" },
                bgcolor: COLORS.primary,
                border: `1px solid ${COLORS.border}`,
              },
            }}
          >
            <DialogTitle sx={{ bgcolor: COLORS.secondary, color: COLORS.text }}>
              Manage Pay
              <IconButton
                aria-label="close"
                onClick={handleCloseManagePayDialog}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: COLORS.text,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <ManagePayslip />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseManagePayDialog}
                sx={{
                  bgcolor: COLORS.primary,
                  color: COLORS.text,
                  "&:hover": {
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openEditPayslipDialog}
            onClose={handleCloseEditPayslipDialog}
            maxWidth="md"
            fullWidth
            sx={{
              "& .MuiDialog-paper": {
                minHeight: { xs: "400px", sm: "450px", md: "500px" },
                maxHeight: "80vh",
                width: { xs: "95%", sm: "90%", md: "100%" },
                bgcolor: COLORS.primary,
                border: `1px solid ${COLORS.border}`,
              },
            }}
          >
            <DialogTitle sx={{ bgcolor: COLORS.secondary, color: COLORS.text }}>
              Edit Payslip
              <IconButton
                aria-label="close"
                onClick={handleCloseEditPayslipDialog}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: COLORS.text,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                overflowY: "auto",
                padding: { xs: 1, sm: 2, md: 3 },
              }}
            >
              <Box
                sx={{ minHeight: { xs: "350px", sm: "400px", md: "450px" } }}
              >
                <PayslipEdit />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseEditPayslipDialog}
                sx={{
                  bgcolor: COLORS.primary,
                  color: COLORS.text,
                  "&:hover": {
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{
                width: "100%",
                bgcolor: COLORS.primary,
                color: COLORS.text,
                "& .MuiAlert-icon": { color: COLORS.text },
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          {/* Icons at the bottom-right corner */}
          <Box
            sx={{
              position: "fixed",
              bottom: 10,
              right: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton
              sx={{
                bgcolor: COLORS.primary,
                color: COLORS.text,
                "&:hover": { bgcolor: COLORS.secondary, color: COLORS.primary },
                padding: 0, // Explicitly se et padding to 0
              }}
              size="large"
            >
              <SetDefaultOffice />
            </IconButton>
            <IconButton
              sx={{
                bgcolor: COLORS.primary,
                color: COLORS.text,
                "&:hover": { bgcolor: COLORS.secondary, color: COLORS.primary },
                padding: 0, // Explicitly set padding to 0
              }}
              size="large"
            >
              <SetWFHLocation />
            </IconButton>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default CEOComponent;