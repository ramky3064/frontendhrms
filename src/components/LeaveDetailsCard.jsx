import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Container,
  createTheme,
  ThemeProvider,
  Avatar,
  Snackbar,
  Alert,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { keyframes } from '@mui/system';
import Chart from 'chart.js/auto';
import axios from 'axios';
import  {jwtDecode}  from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
// import Sidebar from './Sidebar'; // Adjust path as needed
// import AppNavbar from './Hrmnav'; // Adjust path as needed

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#FFA500", "#FFC800", "#FFA450", "#1E90FF", "#20B2AA"];

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// Custom MUI Theme
const theme = createTheme({
  palette: {
    primary: { main: "#007bff" },
    secondary: { main: "#6c757d" },
    background: { default: "#E3F2FD" },
    danger: { main: "#dc3545" },
    warning: { main: "#ffc107" },
    success: { main: "#28a745" },
    error: { main: "#dc3545" },
    custom: {
      darkBg: "#1E3A8A",
      orange: "#F15A24",
      darkGray: "#2E3746",
      lightGray: "#D1D5DB",
      textDark: "#0F172A",
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

const Leavecard = () => {
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
  const [photoBase64, setPhotoBase64] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState({
    annual_leaves: [],
    monthly_leaves: [],
    loss_of_pay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const empId = sessionStorage.getItem("empId");
        if (!empId) {
          throw new Error("Employee ID missing. Please log in again.");
        }

        const token = localStorage.getItem(`token_${empId}`);
        if (!token) {
          throw new Error("Authentication token missing. Please log in again.");
        }

        let decoded;
        try {
          decoded = jwtDecode(token);
          const tokenEmpId = decoded.emp_id || decoded.sub;
          if (tokenEmpId !== empId) {
            throw new Error("Token emp_id does not match session empId");
          }
        } catch (err) {
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          throw new Error("Invalid or malformed token. Please log in again.");
        }

        // Fetch employee details
        const empResponse = await axios.get(`${API_URL}/self_employee_details`, {
          headers: { Authorization: token },
        });
        if (empResponse.data.message === "Employee details retrieved successfully") {
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
          setSnackbarMessage("Employee details loaded successfully");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } else {
          throw new Error(empResponse.data.message || "Failed to fetch employee details");
        }

        // Fetch employee photo
        const photoResponse = await axios.get(`${API_URL}/get_employee_photo/${empId}`, {
          headers: { Authorization: token },
        });
        if (photoResponse.data.photo_base64) {
          setPhotoBase64(`data:image/jpeg;base64,${photoResponse.data.photo_base64}`);
        } else {
          setPhotoBase64(null);
        }

        // Fetch leave balances
        const leaveResponse = await axios.get(`${API_URL}/leave_balance/${empId}`, {
          headers: { Authorization: token },
        });
        if (leaveResponse.data.message === "Leave balances retrieved successfully") {
          setLeaveBalances(leaveResponse.data.balances);
          setSnackbarMessage(leaveResponse.data.message);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } else {
          throw new Error(leaveResponse.data.message || "Failed to fetch leave balances");
        }

        // Fetch loss of pay count
        const lopResponse = await axios.get(`${API_URL}/loss_of_pay_count/${empId}`, {
          headers: { Authorization: token },
        });
        if (lopResponse.data.message.includes("retrieved")) {
          setLeaveBalances((prev) => ({
            ...prev,
            loss_of_pay: lopResponse.data.loss_of_pay_days || 0,
          }));
        }
      } catch (error) {
        let errorMessage = "Failed to fetch data.";
        if (error.response?.status === 401) {
          errorMessage = "Invalid or missing authentication token. Please log in again.";
          localStorage.removeItem(`token_${sessionStorage.getItem("empId")}`);
          sessionStorage.removeItem("empId");
          navigate("/login", { replace: true });
        } else if (error.response?.status === 403) {
          errorMessage = "You are not authorized to view this data.";
        } else if (error.response?.status === 404) {
          errorMessage = error.response.data.message || "Data not found.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = "Unable to connect to the server. Please try again later.";
        }
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!loading && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      const leaveData = [];

      // Process annual leaves
      leaveBalances.annual_leaves.forEach((leave, index) => {
        if (leave.remaining > 0) {
          leaveData.push({
            label: leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1),
            value: leave.remaining,
            color: AVATAR_COLORS[index % AVATAR_COLORS.length],
          });
        }
      });

      // Process monthly leaves
      leaveBalances.monthly_leaves.forEach((leave, index) => {
        if (leave.remaining > 0) {
          leaveData.push({
            label: `${leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} (Monthly)`,
            value: leave.remaining,
            color: AVATAR_COLORS[(index + leaveBalances.annual_leaves.length) % AVATAR_COLORS.length],
          });
        }
      });

      // Add Loss of Pay
      if (leaveBalances.loss_of_pay > 0) {
        leaveData.push({
          label: "Loss of Pay",
          value: leaveBalances.loss_of_pay,
          color: "#9966FF",
        });
      }

      // Calculate total leaves for the chart
      const totalLeaves = leaveData.reduce((sum, item) => sum + item.value, 0);
      if (totalLeaves > 0) {
        leaveData.unshift({
          label: "Total Leaves",
          value: totalLeaves,
          color: "#FF9F40",
        });
      }

      const chartLabels = leaveData.map((item) => item.label);
      const chartValues = leaveData.map((item) => item.value);
      const chartColors = leaveData.map((item) => item.color);

      chartInstanceRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: chartLabels,
          datasets: [
            {
              data: chartValues,
              backgroundColor: chartColors,
              borderColor: theme.palette.custom.darkBg || "#1E3A8A",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "white",
                font: {
                  size: 10,
                  family: theme.typography.fontFamily,
                },
                filter: (legendItem, chartData) => {
                  return chartData.datasets[0].data[legendItem.index] > 0;
                },
              },
            },
            tooltip: {
              backgroundColor: theme.palette.custom.darkGray || "#2E3746",
              titleFont: { size: 12 },
              bodyFont: { size: 10 },
              callbacks: {
                label: (context) => `${context.label}: ${context.raw} days`,
              },
            },
          },
          cutout: "60%",
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [loading, leaveBalances]);

  const handleClose = () => {
    setSnackbarOpen(false);
  };

  const cardBgColor = theme.palette.custom?.darkBg || "#1E3A8A";
  const orangeColor = theme.palette.custom?.orange || "#F15A24";
  const lightGrayColor = theme.palette.custom?.lightGray || "#D1D5DB";

  return (
    <ThemeProvider theme={theme}>
      <style>{`:root { --navbar-height: 64px; }`}</style>
      <div style={{ display: "flex" }}>
        {/* <Sidebar /> */}
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "100vh",
          }}
        >
          {/* <AppNavbar /> */}
          <Box sx={{ height: "var(--navbar-height)" }} />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {/* Employee Details Section */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    bgcolor: cardBgColor,
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    animation: `${slideIn} 0.5s ease-out`,
                  }}
                >
                  <CardContent>
                    {loading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <CircularProgress color="inherit" />
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              border: "2px solid white",
                              bgcolor: !photoBase64
                                ? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
                                : "transparent",
                            }}
                            src={photoBase64}
                            alt={`${employeeDetails.first_name} ${employeeDetails.last_name}`}
                          >
                            {!photoBase64 &&
                              `${
                                employeeDetails.first_name?.charAt(0) || ""
                              }${employeeDetails.last_name?.charAt(0) || ""}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" fontSize="14px">
                              {`${employeeDetails.first_name} ${employeeDetails.last_name || ""}`.trim()}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {employeeDetails.designation || "N/A"}
                              </Typography>
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  bgcolor: orangeColor,
                                  borderRadius: "50%",
                                }}
                              />
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {employeeDetails.department || "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <hr style={{ borderColor: lightGrayColor, margin: "16px 0" }} />
                        <Box sx={{ color: "white", "& > div": { mb: 1.5 } }}>
                          <Box>
                            <Typography variant="caption">Employee ID</Typography>
                            <Typography variant="body2">{employeeDetails.emp_id || "N/A"}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption">Email Address</Typography>
                            <Typography variant="body2">{employeeDetails.email || "N/A"}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption">Date of Joining</Typography>
                            <Typography variant="body2">{employeeDetails.date_of_joining || "N/A"}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption">Employee Status</Typography>
                            <Typography variant="body2">{employeeDetails.employee_status || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Leave Details Section */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    bgcolor: cardBgColor,
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                    width: "100%",
                    minHeight: "330px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    animation: `${slideIn} 0.5s ease-out 0.1s`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px solid ${lightGrayColor}`,
                        pb: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" fontSize="14px">
                        Leave Details
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CalendarTodayOutlinedIcon />}
                        sx={{
                          color: "white",
                          borderColor: lightGrayColor,
                          textTransform: "none",
                          fontSize: "0.75rem",
                          "&:hover": {
                            bgcolor: theme.palette.custom.darkGray || "#2E3746",
                            borderColor: lightGrayColor,
                          },
                        }}
                      >
                        {new Date().getFullYear()}
                      </Button>
                    </Box>
                    {loading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "180px",
                        }}
                      >
                        <CircularProgress color="inherit" />
                      </Box>
                    ) : leaveBalances.annual_leaves.length === 0 && leaveBalances.monthly_leaves.length === 0 ? (
                      <Typography variant="body2" color="white" textAlign="center">
                        No leave balances available.
                      </Typography>
                    ) : (
                      <Grid container spacing={1} sx={{ color: lightGrayColor }}>
                        <Grid item xs={12} sm={6}>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ mb: 0.5 }}>
                                  Total Leaves
                                </Typography>
                                <Typography variant="body2" color="white">
                                  {leaveBalances.annual_leaves.reduce(
                                    (sum, leave) => sum + (leave.remaining || 0),
                                    0
                                  ) +
                                    leaveBalances.monthly_leaves.reduce(
                                      (sum, leave) => sum + (leave.remaining || 0),
                                      0
                                    )}
                                </Typography>
                              </Box>
                              {leaveBalances.annual_leaves
                                .filter((_, index) => index % 2 === 0)
                                .map((leave, index) => (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                                    </Typography>
                                    <Typography variant="body2" color="white">
                                      {leave.remaining || 0}
                                    </Typography>
                                  </Box>
                                ))}
                              {leaveBalances.monthly_leaves
                                .filter((_, index) => index % 2 === 0)
                                .map((leave, index) => (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} (Monthly)
                                    </Typography>
                                    <Typography variant="body2" color="white">
                                      {leave.remaining || 0}
                                    </Typography>
                                  </Box>
                                ))}
                            </Grid>
                            <Grid item xs={6}>
                              {leaveBalances.annual_leaves
                                .filter((_, index) => index % 2 !== 0)
                                .map((leave, index) => (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                                    </Typography>
                                    <Typography variant="body2" color="white">
                                      {leave.remaining || 0}
                                    </Typography>
                                  </Box>
                                ))}
                              {leaveBalances.monthly_leaves
                                .filter((_, index) => index % 2 !== 0)
                                .map((leave, index) => (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} (Monthly)
                                    </Typography>
                                    <Typography variant="body2" color="white">
                                      {leave.remaining || 0}
                                    </Typography>
                                  </Box>
                                ))}
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ mb: 0.5 }}>
                                  Loss of Pay
                                </Typography>
                                <Typography variant="body2" color="white">
                                  {leaveBalances.loss_of_pay || 0}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ height: "180px", position: "relative" }}>
                            <canvas ref={chartRef} />
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 1,
                      bgcolor: "#2563EB",
                      color: "white",
                      textTransform: "none",
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      "&:hover": {
                        bgcolor: "#1E40AF",
                      },
                    }}
                    onClick={() => navigate("/leave-management")}
                  >
                    Apply New Leave
                  </Button>
                </Card>
              </Grid>
            </Grid>
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
      </div>
    </ThemeProvider>
  );
};

export default Leavecard;