import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Link,
  Snackbar,
  IconButton,
  Tooltip,
  Badge,
  Skeleton,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { keyframes } from "@mui/system";
import { motion } from "framer-motion";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import AppNavbar from "./Hrmnav";
import ProjectManagement from "./createProject";
import PunchSystem from "./geo";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloseIcon from "@mui/icons-material/Close";
import CakeIcon from "@mui/icons-material/Cake";
import WorkIcon from "@mui/icons-material/Work";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EmployeeRequestForm from "./icons/employeeRequestForm";
import PendingLeaveRequests from "./icons/pending";
import CheckInDashboard from "./CheckInCard";
import DynamicSidebar from "./Sidebar";
import Leavecard from "./LeaveCard";
import EmployeeCheckin from "./EmployeeCheckin";
import BirthdayCard from "./BirthdayCard";
import TotalDuration from "./TotalDuration";
import HolidaySlider from "./Holidays";
import EmployeeAttendanceCalendar from "./Calendar";
import EditHolidays from "./EditHolidays";
import ManagerInbox from "./WFH_Approvalform";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#a0c3e8", "#2772a0", "#a0c3e8", "#2772a0", "#a0c3e8"];

// Color palette
const COLORS = {
  primary: "#a0c3e8",
  secondary: "#2772a0",
  text: "#ffffff",
  border: "#ddd",
  error: "#d32f2f",
};

// Common styles
const commonStyles = {
  card: {
    bgcolor: COLORS.secondary,
    borderRadius: "8px",
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition:
      "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease",
    "&:hover": {
      bgcolor: COLORS.secondary,
      color: COLORS.primary,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    fontFamily: '"Inter", sans-serif',
  },
  text: {
    color: COLORS.text,
    fontFamily: '"Inter", sans-serif',
  },
  button: {
    bgcolor: COLORS.primary,
    color: COLORS.text,
    "&:hover": {
      bgcolor: COLORS.secondary,
      color: COLORS.primary,
    },
    fontFamily: '"Inter", sans-serif',
    textTransform: "none",
  },
  fab: {
    bgcolor: COLORS.primary,
    color: COLORS.text,
    "&:hover": {
      bgcolor: COLORS.secondary,
      color: COLORS.primary,
      transform: "scale(1.1)",
    },
    transition: "all 0.3s ease",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  dialogPaper: {
    bgcolor: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    p: { xs: 1, sm: 2 },
  },
  dialogTitle: {
    bgcolor: COLORS.secondary,
    color: COLORS.text,
    fontFamily: '"Inter", sans-serif',
  },
};

// Keyframes for animations
const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const avatarFadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`;

const ProfileCard = ({ employeeDetails, photoBase64, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const formattedName = `${employeeDetails.first_name
    ?.charAt(0)
    ?.toUpperCase()}${employeeDetails.first_name?.slice(1)?.toLowerCase() || ""
    } ${employeeDetails.last_name?.charAt(0)?.toUpperCase() || ""}${employeeDetails.last_name?.slice(1)?.toLowerCase() || ""
    }`.trim();

  return (
    <Card
      sx={{
        ...commonStyles.card,
        width: "250px",
        p: { xs: 1.5, sm: 2 },
        animation: `${slideIn} 0.5s ease-out`,
        height: { xs: 300, sm: 320, md: 340 },
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              ...commonStyles.text,
              fontWeight: 700,
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
            }}
          >
            Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              ...commonStyles.text,
              fontWeight: 500,
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              cursor: "pointer",
              "&:hover": { color: COLORS.primary },
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
              width={isMobile ? 100 : 120}
              height={isMobile ? 100 : 120}
              sx={{ borderRadius: "12px" }}
            />
          ) : (
            <Avatar
              alt={`${employeeDetails.first_name || ""} ${employeeDetails.last_name || ""
                }`}
              src={photoBase64}
              sx={{
                width: { xs: 100, sm: 110, md: 120 },
                height: { xs: 100, sm: 110, md: 120 },
                borderRadius: "12px",
                objectFit: "cover",
                bgcolor: photoBase64
                  ? "transparent"
                  : AVATAR_COLORS[
                  Math.floor(Math.random() * AVATAR_COLORS.length)
                  ],
                fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" },
                fontWeight: 500,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: `4px solid ${COLORS.primary}`,
                ...commonStyles.text,
                animation: `${avatarFadeIn} 0.5s ease-out`,
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
            ...commonStyles.text,
            fontWeight: 600,
            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
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
            ...commonStyles.text,
            fontWeight: 900,
            fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
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
          {[
            "emp_id",
            "email",
            "department",
            "date_of_joining",
            "employee_status",
          ].map((field, idx) => (
            <Typography
              key={idx}
              variant="body2"
              sx={{
                ...commonStyles.text,
                fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                mb: 0.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                "&:hover":
                  field === "email"
                    ? { color: COLORS.primary, cursor: "pointer" }
                    : {},
              }}
            >
              <Box component="span" fontWeight={700}>
                {field === "emp_id"
                  ? "ID"
                  : field === "department"
                    ? "Dept"
                    : field === "date_of_joining"
                      ? "Joined"
                      : field === "employee_status"
                        ? "Status"
                        : field.charAt(0).toUpperCase() + field.slice(1)}
                :
              </Box>{" "}
              {employeeDetails[field] || "N/A"}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

function ManagerDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState({ employees: true, projects: true });
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [openDialog, setOpenDialog] = useState(false);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [employeeName, setEmployeeName] = useState("Fiona Grace");
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
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [prevLeaveCount, setPrevLeaveCount] = useState(0);
  const navbarRef = useRef(null);
  const audioRef = useRef(new Audio("./notification.wav"));

  const employeeColumns = useMemo(
    () => [
      {
        field: "emp_id",
        headerName: "Employee ID",
        width: isMobile ? 100 : isTablet ? 120 : 150,
      },
      {
        field: "name",
        headerName: "Name",
        width: isMobile ? 150 : isTablet ? 180 : 200,
      },
      {
        field: "email",
        headerName: "Email",
        width: isMobile ? 150 : isTablet ? 200 : 250,
      },
      {
        field: "role",
        headerName: "Role",
        width: isMobile ? 100 : isTablet ? 110 : 120,
      },
    ],
    [isMobile, isTablet]
  );

  const projectColumns = useMemo(
    () => [
      {
        field: "project_id",
        headerName: "Project ID",
        width: isMobile ? 100 : isTablet ? 120 : 150,
      },
      {
        field: "project_name",
        headerName: "Project Name",
        width: isMobile ? 150 : isTablet ? 200 : 250,
      },
    ],
    [isMobile, isTablet]
  );

  const cardData = useMemo(
    () => [
      {
        title: ["Total", "Employees"],
        value: `${totalEmployees}`,
        icon: <GroupIcon />,
        iconBg: COLORS.secondary,
        gradient: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        link: "/active-employees",
      },
      {
        title: ["Total", "Projects"],
        value: `${totalProjects}`,
        icon: <WorkIcon />,
        iconBg: COLORS.secondary,
        gradient: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        action: () => setOpenProjectDialog(true),
      },
    ],
    [totalEmployees, totalProjects]
  );

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setNavbarHeight(height);
        }
      }
    };

    const attemptCalculation = (attempts = 3, delay = 200) => {
      if (attempts <= 0) return;
      setTimeout(() => {
        updateNavbarHeight();
        if (
          navbarHeight === 64 &&
          navbarRef.current?.getBoundingClientRect().height === 0
        ) {
          attemptCalculation(attempts - 1, delay * 1.5);
        }
      }, delay);
    };

    attemptCalculation();

    const resizeObserver = new ResizeObserver(() => {
      updateNavbarHeight();
    });
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }

    window.addEventListener("resize", updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, [navbarHeight]);

  const fetchPendingCounts = useCallback(async () => {
  try {
    const empId = sessionStorage.getItem("empId");
    const token = localStorage.getItem(`token_${empId}`);
    if (!empId || !token) {
      setSnackbarMessage("Authentication details missing. Please log in again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const leaveResponse = await axios.get(
      `${API_URL}/pending_leave_requests/${empId}`,
      { headers: { Authorization: token } }
    );
    if (
      leaveResponse.status === 200 &&
      leaveResponse.data.message === "Pending leave requests retrieved successfully"
    ) {
      const newCount =
        (leaveResponse.data.current_year_requests?.length || 0) +
        (leaveResponse.data.future_year_requests?.length || 0);
      setPendingLeaveCount(newCount);
      if (newCount > prevLeaveCount && prevLeaveCount !== 0) {
        setSnackbarMessage("New pending leave requests received!");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
        audioRef.current?.play().catch((err) => {
          console.error("Error playing notification sound:", err);
          setSnackbarMessage("Failed to play notification sound.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
        });
      }
      setPrevLeaveCount(newCount);
    } else {
      setSnackbarMessage(
        leaveResponse.data.message || "No pending leave requests found."
      );
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    }
  } catch (err) {
    console.error("Error fetching pending counts:", err);
    const errorMsg =
      err.response?.data?.message || "Failed to fetch pending leave requests";
    setSnackbarMessage(errorMsg);
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem(`token_${sessionStorage.getItem("empId")}`);
      sessionStorage.removeItem("empId");
      navigate("/login", { replace: true });
    }
  }
}, [prevLeaveCount, navigate]);

  const fetchDashboardData = useCallback(async () => {
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
        { headers: { Authorization: token } }
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
        { headers: { Authorization: token } }
      );
      if (
        employeesResponse.status === 200 &&
        employeesResponse.data.status === "success"
      ) {
        const formatted = employeesResponse.data.employees.map(
          (emp, index) => ({
            id: index,
            emp_id: emp.emp_id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
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
      setLoading({ employees: false, projects: false });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoadingEmployee(true);
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
          { headers: { Authorization: token } }
        );
        const { first_name, last_name, photo_base64 } = response.data;
        setEmployeeName(`${first_name} ${last_name}`);
        setEmployeePhoto(
          photo_base64 ? `data:image/jpeg;base64,${photo_base64}` : null
        );
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setEmployeePhoto(null);
        setEmployeeName("Fiona Grace");
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
        setIsLoadingEmployee(false);
      }
    };

    fetchEmployeeData();
    fetchDashboardData();
    fetchPendingCounts();

    const intervalId = setInterval(fetchPendingCounts, 3000);
    return () => clearInterval(intervalId);
  }, [navigate, fetchDashboardData, fetchPendingCounts]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseEmployeeDialog = () => setOpenEmployeeDialog(false);
  const handleCloseProjectDialog = () => setOpenProjectDialog(false);
  const handleOpenLeaveDialog = () => setOpenLeaveDialog(true);
  const handleCloseLeaveDialog = () => setOpenLeaveDialog(false);
  const handleProjectCreated = () => {
    fetchDashboardData();
    setOpenDialog(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <DynamicSidebar />
      <Box
        sx={{
          flexGrow: 1,
          maxWidth: { xs: "100%", sm: "90%", md: "80%", lg: "1280px" },
          mx: "auto",
          mt: { xs: 2, sm: 4, md: 6, lg: 1 },
          px: { xs: 1, sm: 1 },
          pt: `${navbarHeight + 16}px`,
          bgcolor: "#f5f5f5",
          position: "relative",
        }}
      >
        <Box
          ref={navbarRef}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            width: "100%",
          }}
        >
          <AppNavbar />
        </Box>
        <Card
          sx={{
            ...commonStyles.card,
            mb: { xs: 2, sm: 3, md: 2 },
            p: { xs: 1, sm: 1, md: 1 },
          }}
        >
          <Grid
            container
            spacing={{ xs: 1, sm: 1.5, md: 2 }}
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item xs={12} sm={8}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 1.5, md: 2 },
                }}
              >
                <Avatar
                  src={employeePhoto}
                  sx={{
                    width: { xs: 36, sm: 40, md: 48 },
                    height: { xs: 36, sm: 40, md: 48 },
                    bgcolor: COLORS.primary,
                    color: COLORS.text,
                  }}
                  alt="Employee portrait"
                >
                  {isLoadingEmployee && (
                    <Skeleton variant="circular" width={48} height={48} />
                  )}
                </Avatar>
                <Box>
                  {isLoadingEmployee ? (
                    <Skeleton variant="text" width={150} height={30} />
                  ) : (
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        fontSize: {
                          xs: "0.9rem",
                          sm: "1rem",
                          md: "1.25rem",
                          lg: "1.5rem",
                        },
                        ...commonStyles.text,
                      }}
                    >
                      Welcome {employeeName}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" },
                      ...commonStyles.text,
                    }}
                  >
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 1.5, md: 1 },
                  justifyContent: { xs: "flex-start", sm: "flex-end" },
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "Add Project", action: handleOpenDialog },
                ].map((button, index) => (
                  <Button
                    key={index}
                    variant="contained"
                    component={button.to ? RouterLink : "button"}
                    to={button.to}
                    onClick={button.action}
                    startIcon={<AddCircleIcon />}
                    sx={{
                      ...commonStyles.button,
                      fontSize: {
                        xs: "0.6rem",
                        sm: "0.7rem",
                        md: "0.8rem",
                        lg: "0.875rem",
                      },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      py: { xs: 0.5, sm: 0.75, md: 1 },
                      minWidth: { xs: "80px", sm: "100px", md: "110px" },
                    }}
                  >
                    {button.label}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Grid
          container
          spacing={{ xs: 1.5, sm: 2, md: 3 }}
          sx={{ mb: { xs: 2, sm: 3, md: 4 } }}
        >
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <ProfileCard
              employeeDetails={employeeDetails}
              photoBase64={employeePhoto}
              loading={isLoadingEmployee}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Leavecard />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2} direction="column">
              <Grid item>
                <Grid container spacing={2}>
                  {cardData.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{
                          ...commonStyles.card,
                          background: card.gradient,
                          animation: `${slideIn} 0.5s ease-out ${index * 0.1
                            }s both`,
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
                                  ...commonStyles.text,
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
                                  ...commonStyles.text,
                                }}
                              >
                                {card.value}
                              </Typography>
                              <Chip
                                label="View All"
                                onClick={card.action}
                                component={card.link ? RouterLink : "button"}
                                to={card.link}
                                clickable
                                sx={{
                                  ...commonStyles.button,
                                  fontSize: "0.65rem",
                                  fontWeight: 500,
                                  mt: 1,
                                  height: 20,
                                  "& .MuiChip-label": {
                                    padding: "0 8px",
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
          <Grid item xs={12} sm={6} md={4} lg={3}>
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
          <Grid item xs={12} sm={6} md={4} lg={3}>
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
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <EmployeeCheckin
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarSeverity={setSnackbarSeverity}
              setSnackbarOpen={setSnackbarOpen}
            />
          </Grid>
        </Grid>
        <Box sx={{}}>
          <EmployeeRequestForm />
        </Box>
        <Box sx={{ position: "fixed", bottom: 99, width: "100%" }}>
          <ManagerInbox />
        </Box>
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 10, sm: 15, md: 90 },
            right: { xs: 10, sm: 15, md: 20 },
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: { xs: "8px", sm: "10px", md: "12px" },
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {[
            {
              component: (
                <Tooltip title="View Pending Leave Requests" arrow>
                  <IconButton
                    onClick={handleOpenLeaveDialog}
                    sx={{
                      ...commonStyles.fab,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <Badge
                      badgeContent={pendingLeaveCount}
                      color="error"
                      invisible={pendingLeaveCount === 0}
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: COLORS.secondary,
                          color: COLORS.text,
                        },
                      }}
                    >
                      <PendingActionsIcon sx={{ fontSize: 28 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              ),
            },
          ].map(({ component }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {component}
            </motion.div>
          ))}
        </Box>

        {[
          {
            open: openDialog,
            setOpen: setOpenDialog,
            component: ProjectManagement,
            title: "Create New Project",
            onProjectCreated: handleProjectCreated,
          },
          {
            open: openEmployeeDialog,
            setOpen: setOpenEmployeeDialog,
            title: "Active Employees",
          },
          {
            open: openProjectDialog,
            setOpen: setOpenProjectDialog,
            title: "Projects",
          },
          {
            open: openLeaveDialog,
            setOpen: setOpenLeaveDialog,
            component: PendingLeaveRequests,
            title: "Pending Leave Requests",
            props: {
              setPendingLeaveCount,
              setSnackbarMessage,
              setSnackbarSeverity,
              setSnackbarOpen,
            },
          },
        ].map((dialog, idx) => (
          <Dialog
            key={idx}
            open={dialog.open}
            onClose={() => dialog.setOpen(false)}
            maxWidth={
              isMobile
                ? "xs"
                : dialog.title === "Active Employees" ||
                  dialog.title === "Projects" ||
                  dialog.title === "Pending Leave Requests"
                  ? "lg"
                  : "sm"
            }
            fullWidth
            sx={{ "& .MuiDialog-paper": commonStyles.dialogPaper }}
          >
            <DialogTitle
              sx={{
                ...commonStyles.dialogTitle,
                fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
                ...(dialog.title === "Pending Leave Requests" && { bgcolor: "transparent" }),
              }}
            >
              {dialog.title}
              <IconButton
                aria-label="close"
                onClick={() => dialog.setOpen(false)}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: COLORS.text,
                }}
              >
                <CloseIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                p: { xs: 1, sm: 2, md: 3 },
                bgcolor: COLORS.primary,
                color: COLORS.text,
              }}
            >
              {dialog.component ? (
                <dialog.component
                  setSnackbarMessage={setSnackbarMessage}
                  setSnackbarSeverity={setSnackbarSeverity}
                  setSnackbarOpen={setSnackbarOpen}
                  {...(dialog.onProjectCreated
                    ? { onProjectCreated: dialog.onProjectCreated }
                    : {})}
                  {...(dialog.props || {})}
                />
              ) : (
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  {loading[
                    dialog.title === "Active Employees"
                      ? "employees"
                      : "projects"
                  ] ? (
                    <Box display="flex" justifyContent="center" mt={4}>
                      <CircularProgress
                        size={isMobile ? 20 : isTablet ? 24 : 30}
                        sx={{ color: COLORS.secondary }}
                      />
                    </Box>
                  ) : error ? (
                    <Alert
                      severity="error"
                      sx={{
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        bgcolor: COLORS.primary,
                        color: "#2772a0",
                        "& .MuiAlert-icon": { color: "#2772a0" },
                      }}
                    >
                      {error}
                    </Alert>
                  ) : (
                    <DataGrid
                      rows={
                        dialog.title === "Active Employees"
                          ? employees
                          : projects
                      }
                      columns={
                        dialog.title === "Active Employees"
                          ? employeeColumns
                          : projectColumns
                      }
                      pageSizeOptions={[5]}
                      checkboxSelection={dialog.title === "Active Employees"}
                      disableColumnMenu
                      sx={{
                        "& .MuiDataGrid-root": { border: "none" },
                        "& .MuiDataGrid-cell": {
                          padding: { xs: "2px", sm: "4px", md: "6px" },
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.8rem",
                            md: "0.9rem",
                          },
                          color:
                            dialog.title === "Projects"
                              ? "#2772a0"
                              : COLORS.text,
                        },
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: COLORS.primary,
                          color:
                            dialog.title === "Projects"
                              ? "#2772a0"
                              : COLORS.text,
                          fontWeight: "bold",
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.8rem",
                            md: "0.9rem",
                          },
                        },
                        "&::-webkit-scrollbar": {
                          width: "8px",
                          height: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: COLORS.secondary,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: COLORS.primary,
                          borderRadius: "4px",
                        },
                      }}
                    />
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => dialog.setOpen(false)}
                sx={{
                  ...commonStyles.button,
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                  ...(dialog.title === "Projects" && { color: "#2772a0" }),
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        ))}

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
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
              bgcolor: COLORS.primary,
              color: COLORS.text,
              "& .MuiAlert-icon": { color: COLORS.text },
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <audio ref={audioRef} src="./notification.wav" preload="auto" />
      </Box>
    </Box>
  );
}

export default ManagerDashboard;