import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Snackbar,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Fab,
  useMediaQuery,
  useTheme,
  Skeleton,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { keyframes } from "@mui/system";
import { motion } from "framer-motion";
import CakeIcon from "@mui/icons-material/Cake";
import WorkIcon from "@mui/icons-material/Work";
import GroupIcon from "@mui/icons-material/Group";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

// Direct imports
import ProjectManagement from "./createProject";
import PunchSystem from "./geo";
import SetWFHLocation from "./icons/SetWFHLocation";
import SetDefaultOffice from "./icons/timetracking";
import EmployeeRequestForm from "./icons/employeeRequestForm";
import ManagePayslip from "./ManagePayslip";
import PayslipEdit from "./ViewAndEditPay";
import PendingLeaveRequests from "./icons/pending";
import Leavecard from "./LeaveCard";
import EmployeeCheckin from "./EmployeeCheckin";
import EditHolidays from "./EditHolidays";
import BirthdayCard from "./BirthdayCard";
import TotalDuration from "./TotalDuration";
import EmployeeAttendanceCalendar from "./Calendar";
import ManagerInbox from "./WFH_Approvalform";

// Constants
const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const NOTIFICATION_SOUND = "/notification.wav";
const CACHE_VERSION = "v2";
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
    transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease",
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

// ProfileCard component
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

// Utility function to get token
const getToken = () => {
  const empId = sessionStorage.getItem("empId");
  if (!empId) {
    console.log("No empId found in sessionStorage");
    return "";
  }
  const token = localStorage.getItem(`token_${empId}`);
  console.log("Token for empId:", empId, token);
  return token || "";
};

// Main Dashboard component
const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projects, setProjects] = useState([]);
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
  const [loading, setLoading] = useState({ projects: true, employee: true });
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [openDialog, setOpenDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openManagePayDialog, setOpenManagePayDialog] = useState(false);
  const [openEditPayslipDialog, setOpenEditPayslipDialog] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [prevLeaveCount, setPrevLeaveCount] = useState(0);
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  const cacheKey = useMemo(
    () => `dashboard_data_${sessionStorage.getItem("empId") || "guest"}`,
    []
  );
  const cacheExpiration = 10 * 60 * 1000;

  const empId = useMemo(() => sessionStorage.getItem("empId") || "", []);
  const token = useMemo(() => getToken(), [empId]);
  const decodedToken = useMemo(() => {
    if (!token || !empId) return null;
    try {
      return jwtDecode(token);
    } catch (err) {
      return null;
    }
  }, [token, empId]);

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
        link: "/viewall-employees",
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
  }, [prevLeaveCount, navigate, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  const fetchDashboardData = useCallback(
    async (forceFetch = false) => {
      if (!empId || !token) {
        setSnackbarMessage(
          "Authentication details missing. Please log in again."
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        navigate("/login", { replace: true });
        return;
      }

      if (!forceFetch) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            const {
              timestamp,
              totalEmployees,
              totalProjects,
              projects,
              version,
            } = parsedData;

            if (
              version === CACHE_VERSION &&
              Date.now() - timestamp < cacheExpiration &&
              typeof totalEmployees === "number" &&
              typeof totalProjects === "number" &&
              Array.isArray(projects)
            ) {
              setTotalEmployees(totalEmployees);
              setTotalProjects(totalProjects);
              setProjects(projects);
              setLoading((prev) => ({ ...prev, projects: false }));
              return;
            }
          } catch (parseError) {
            console.error("Error parsing cached data:", parseError);
            localStorage.removeItem(cacheKey);
          }
        }
      }

      try {
        setLoading((prev) => ({ ...prev, projects: true }));

        const [empResponse, projectsResponse, projResponse] = await Promise.all(
          [
            axios.get(`${API_URL}/active_employees_with_count`, {
              headers: { Authorization: token },
            }),
            axios.get(`${API_URL}/active_projects`, {
              headers: { Authorization: token },
            }),
            axios.get(`${API_URL}/view_projects`, {
              headers: { Authorization: token },
            }),
          ]
        );

        let newTotalEmployees = 0;
        if (
          empResponse.status === 200 &&
          empResponse.data.status === "success"
        ) {
          newTotalEmployees = empResponse.data.active_employee_count || 0;
          setTotalEmployees(newTotalEmployees);
        } else {
          console.warn("Invalid employee count response:", empResponse.data);
        }

        let newTotalProjects = 0;
        if (
          projectsResponse.status === 200 &&
          projectsResponse.data.status === "success"
        ) {
          newTotalProjects = projectsResponse.data.active_project_count || 0;
          setTotalProjects(newTotalProjects);
        } else {
          console.warn(
            "Invalid projects count response:",
            projectsResponse.data
          );
        }

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
          console.warn("Invalid projects response:", projResponse.data);
        }

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            totalEmployees: newTotalEmployees,
            totalProjects: newTotalProjects,
            projects: formattedProjects,
            version: CACHE_VERSION,
          })
        );

        setLoading((prev) => ({ ...prev, projects: false }));
        setError("");
      } catch (error) {
        setLoading((prev) => ({ ...prev, projects: false }));
        const errorMsg =
          error.response?.data?.message || "Failed to fetch dashboard data";
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          navigate("/login", { replace: true });
        }
        console.error("Error fetching dashboard data:", error);
      }
    },
    [
      empId,
      token,
      navigate,
      cacheKey,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
    ]
  );

  const fetchEmployeeData = useCallback(async () => {
    if (!empId || !token || !decodedToken) {
      setSnackbarMessage(
        "Authentication details missing. Please log in again."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      navigate("/login", { replace: true });
      return;
    }

    const tokenEmpId =
      decodedToken.emp_id || decodedToken.sub || decodedToken.user_id;
    if (!tokenEmpId || tokenEmpId !== empId) {
      setSnackbarMessage("Token empId mismatch or invalid");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      navigate("/login", { replace: true });
      return;
    }

    const employeeCacheKey = `employee_data_${empId}`;
    const cachedEmployeeData = localStorage.getItem(employeeCacheKey);
    if (cachedEmployeeData) {
      try {
        const parsedData = JSON.parse(cachedEmployeeData);
        const { timestamp, employeeDetails, photoBase64, version } = parsedData;

        if (
          version === CACHE_VERSION &&
          Date.now() - timestamp < cacheExpiration &&
          employeeDetails &&
          employeeDetails.first_name
        ) {
          setEmployeeDetails(employeeDetails);
          setPhotoBase64(photoBase64 || "");
          setLoading((prev) => ({ ...prev, employee: false }));
          return;
        }
      } catch (parseError) {
        console.error("Error parsing cached employee data:", parseError);
        localStorage.removeItem(employeeCacheKey);
      }
    }

    try {
      setLoading((prev) => ({ ...prev, employee: true }));

      const empResponse = await axios.get(`${API_URL}/self_employee_details`, {
        headers: { Authorization: token },
      });

      let newEmployeeDetails = {
        emp_id: "N/A",
        first_name: "N/A",
        last_name: "",
        designation: "N/A",
        department: "N/A",
        email: "N/A",
        date_of_joining: "N/A",
        employee_status: "N/A",
      };

      if (
        empResponse.status === 200 &&
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
        newEmployeeDetails = {
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
        setEmployeeDetails(newEmployeeDetails);
      } else {
        throw new Error(
          empResponse.data.message || "Failed to fetch employee details"
        );
      }

      const photoResponse = await axios.get(
        `${API_URL}/get_employee_photo/${empId}`,
        {
          headers: { Authorization: token },
        }
      );
      const newPhotoBase64 = photoResponse.data.photo_base64
        ? `data:image/jpeg;base64,${photoResponse.data.photo_base64}`
        : "";

      setPhotoBase64(newPhotoBase64);

      localStorage.setItem(
        employeeCacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          employeeDetails: newEmployeeDetails,
          photoBase64: newPhotoBase64,
          version: CACHE_VERSION,
        })
      );
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setEmployeeDetails({
        emp_id: "N/A",
        first_name: "Guest",
        last_name: "",
        designation: "N/A",
        department: "N/A",
        email: "N/A",
        date_of_joining: "N/A",
        employee_status: "N/A",
      });
      setPhotoBase64("");
      setSnackbarMessage(
        error.response?.data?.message || "Failed to fetch employee data"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading((prev) => ({ ...prev, employee: false }));
    }
  }, [
    empId,
    token,
    decodedToken,
    navigate,
    setSnackbarMessage,
    setSnackbarSeverity,
    setSnackbarOpen,
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchEmployeeData(),
        fetchDashboardData(),
        fetchPendingCounts(),
      ]);
    };
    fetchAllData();

    const intervalId = setInterval(() => {
      fetchPendingCounts();
    }, 10000); // 10 seconds interval for pending leave counts

    // return () => {
    //   clearInterval(intervalId);
    //   audioRef.current.pause();
    //   audioRef.current.currentTime = 0;
    // };
  }, [fetchEmployeeData, fetchDashboardData, fetchPendingCounts]);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  }, []);

  const handleOpenDialog = useCallback(() => setOpenDialog(true), []);
  const handleCloseDialog = useCallback(() => setOpenDialog(false), []);
  const handleCloseProjectDialog = useCallback(
    () => setOpenProjectDialog(false),
    []
  );
  const handleOpenManagePayDialog = useCallback(
    () => setOpenManagePayDialog(true),
    []
  );
  const handleCloseManagePayDialog = useCallback(
    () => setOpenManagePayDialog(false),
    []
  );
  const handleOpenEditPayslipDialog = useCallback(
    () => setOpenEditPayslipDialog(true),
    []
  );
  const handleCloseEditPayslipDialog = useCallback(
    () => setOpenEditPayslipDialog(false),
    []
  );
  const handleOpenLeaveDialog = useCallback(() => setOpenLeaveDialog(true), []);
  const handleCloseLeaveDialog = useCallback(
    () => setOpenLeaveDialog(false),
    []
  );
  const handleProjectCreated = useCallback(() => {
    fetchDashboardData(true);
    setOpenDialog(false);
  }, [fetchDashboardData]);

  return (
    <Box
      sx={{
        // maxWidth: { xs: "100%", sm: "90%", md: "80%", lg: "1280px" },
        // mx: "auto",
        // mt: { xs: 2, sm: 4, md: 6, lg: 10 },
        // px: { xs: 1, sm: 1 },
        marginTop: { xs: 2, sm: 4, md: 4, lg: 6 },
      }}
    >
      <Card
        sx={{
          ...commonStyles.card,
          mb: { xs: 2, sm: 3, md: 4 },
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
                src={photoBase64}
                sx={{
                  width: { xs: 36, sm: 40, md: 48 },
                  height: { xs: 36, sm: 40, md: 48 },
                  bgcolor: COLORS.primary,
                  color: COLORS.text,
                }}
                alt="Employee portrait"
              />
              <Box>
                {loading.employee ? (
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
                    Welcome{" "}
                    {`${employeeDetails.first_name} ${employeeDetails.last_name || ""
                      }`.trim()}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 1.5, md: 2 },
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Add Project",
                  icon: <AddCircleIcon />,
                  action: handleOpenDialog,
                },
                {
                  label: "Recruitment",
                  icon: <AddCircleIcon />,
                  to: "/parse-resume",
                },
                {
                  label: "Add Employee",
                  icon: <PersonAddIcon />,
                  to: "/add-employee",
                },
              ].map((button, index) => (
                <Button
                  key={index}
                  variant="contained"
                  component={button.to ? Link : "button"}
                  to={button.to}
                  onClick={button.action}
                  startIcon={button.icon}
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
                    minWidth: { xs: "80px", sm: "100px", md: "120px" },
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {[
        {
          open: openDialog,
          setOpen: setOpenDialog,
          component: ProjectManagement,
          title: "Create New Project",
          onProjectCreated: handleProjectCreated,
        },
        {
          open: openProjectDialog,
          setOpen: setOpenProjectDialog,
          title: "Projects",
        },
        {
          open: openManagePayDialog,
          setOpen: setOpenManagePayDialog,
          component: ManagePayslip,
          title: "Manage Payslip",
        },
        {
          open: openEditPayslipDialog,
          setOpen: setOpenEditPayslipDialog,
          component: PayslipEdit,
          title: "Edit Payslip",
          minHeight: { xs: "350px", sm: "400px", md: "500px" },
          maxHeight: "80vh",
        },
        {
          open: openLeaveDialog,
          setOpen: setOpenLeaveDialog,
          component: PendingLeaveRequests,
          title: "Pending Leave Requests",
          props: { setPendingLeaveCount },
        },
      ].map((dialog, idx) => (
        <Dialog
          key={idx}
          open={dialog.open}
          onClose={() => dialog.setOpen(false)}
          maxWidth={
            isMobile
              ? "xs"
              : dialog.title === "Projects" || dialog.title === "Pending Leave Requests"
                ? "lg"
                : "md"
          }
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              ...commonStyles.dialogPaper,
              minHeight: dialog.minHeight,
              maxHeight: dialog.maxHeight,
            },
          }}
        >
          <DialogTitle
            sx={{
              ...commonStyles.dialogTitle,
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
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
              overflowY: dialog.title === "Edit Payslip" ? "auto" : "inherit",
              ...(dialog.title === "Projects" && { color: "#2772a0" }),
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
                {loading.projects ? (
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
                    rows={projects}
                    columns={projectColumns}
                    pageSizeOptions={[5]}
                    disableRowSelectionOnClick
                    disableColumnMenu
                    sx={{
                      "& .MuiDataGrid-root": { border: "none" },
                      "& .MuiDataGrid-cell": {
                        padding: { xs: "2px", sm: "4px", md: "6px" },
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                        color: "#2772a0",
                      },
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: COLORS.primary,
                        color: "#2772a0",
                        fontWeight: "bold",
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
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

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 3, md: 4 } }}
      >
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ProfileCard
            employeeDetails={employeeDetails}
            photoBase64={photoBase64}
            loading={loading.employee}
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
                              component={card.link ? Link : "button"}
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
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TotalDuration
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarSeverity={setSnackbarSeverity}
              setSnackbarOpen={setSnackbarOpen}
            />
          </Grid>
        </Grid>
        <Grid
          container
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
          spacing={{ xs: 1.5, sm: 2, md: 3 }}
        >
          <Grid item xs={12} sm={6}>
            <BirthdayCard
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarSeverity={setSnackbarSeverity}
              setSnackbarOpen={setSnackbarOpen}
            />
          </Grid>
          <Grid item xs={12} sm={6}></Grid>
        </Grid>
        <Grid item xs={12}>
          <EmployeeAttendanceCalendar />
        </Grid>
        <Grid>
          <EmployeeCheckin />
        </Grid>
      </Grid>

      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 10, sm: 15, md: 207 },
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
          <SetWFHLocation
            key="set-wfh-location"
            sx={{ ...commonStyles.fab, width: 56, height: 56 }}
          />,
          <EmployeeRequestForm
            key="employee-request-form"
            sx={{ ...commonStyles.fab, width: 56, height: 56 }}
          />,
          <SetDefaultOffice
            key="set-default-office"
            sx={{ ...commonStyles.fab, width: 56, height: 56 }}
          />,
          <Tooltip
            title="View Pending Leave Requests"
            arrow
            key="leave-requests"
          >
            <Fab
              onClick={handleOpenLeaveDialog}
              sx={{ ...commonStyles.fab, width: 56, height: 56 }}
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
            </Fab>
          </Tooltip>,
          <Tooltip
            title="Manager Inbox"
            arrow
            key="manager-inbox"
          >
            <ManagerInbox
              sx={{ ...commonStyles.fab, width: 56, height: 56, position: "fixed", bottom: 180 }}
            />
          </Tooltip>,
        ].map((component, index) => (
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

      <audio ref={audioRef} src={NOTIFICATION_SOUND} preload="auto" />
    </Box>
  );
};

export default Dashboard;