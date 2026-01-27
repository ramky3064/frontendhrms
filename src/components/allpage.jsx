import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { debounce } from "lodash";
import {
  Box,
  Typography,
  Card,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Button as MuiButton,
  styled,
  Snackbar,
  Alert,
  Stack,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Form as BootstrapForm,
  Button as BootstrapButton,
} from "react-bootstrap";
import InfiniteScroll from "react-infinite-scroll-component";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import { keyframes } from "@emotion/react";
import { Link as MuiLink } from "@mui/material";
import DynamicSidebar from "./Sidebar";
import AppNavbar from "./Hrmnav";

// API Base URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
axios.defaults.baseURL = API_BASE_URL;

// Constants
const ALLOWED_LEAVE_TYPES = ["sick", "compensatory_off"];
const ITEMS_PER_PAGE = 5;

// Pulse animation for breadcrumb separator
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// // Utility function to get month and year dynamically
// const getCurrentMonthYear = (date = new Date()) => {
//   return date.toLocaleString("default", { month: "long", year: "numeric" });
// };

// // Utility function to format date to YYYY-MM-DD
// const formatDate = (dateStr) => {
//   if (!dateStr) return "-";
//   const date = new Date(dateStr);
//   return date.toISOString().split("T")[0];
// };

// // Utility function to generate month options from leave data
// const generateMonthOptions = (leaveData) => {
//   const monthSet = new Set();
//   leaveData.forEach((leave) => {
//     if (leave.start_date) {
//       const startDate = new Date(leave.start_date);
//       const startMonthYear = startDate.toISOString().slice(0, 7);
//       monthSet.add(startMonthYear);
//     }
//     if (leave.end_date) {
//       const endDate = new Date(leave.end_date);
//       const endMonthYear = endDate.toISOString().slice(0, 7);
//       monthSet.add(endMonthYear);
//     }
//   });

//   const options = Array.from(monthSet).map((monthValue) => {
//     const date = new Date(monthValue + "-01");
//     const monthYear = date.toLocaleString("default", {
//       month: "long",
//       year: "numeric",
//     });
//     return { value: monthValue, label: monthYear };
//   });

//   return options.sort((a, b) => b.value.localeCompare(a.value));
// };

// Styled Components
const StyledCard = styled(Card)({
  borderRadius: "15px",
  padding: "1rem",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fff",
  marginBottom: 0,
  marginTop: 5,
});

const HistoryCard = styled(Card)({
  borderRadius: "15px",
  padding: "1rem",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fff",
  maxHeight: "400px",
  overflowY: "auto",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
  border: "2px solid #e5e7eb",
});

const RequestCard = styled(Card)({
  borderRadius: "15px",
  padding: "1rem",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fff",
  maxHeight: "500px",
  overflowY: "auto",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
  border: "2px solid #e5e7eb",
});

const ApplyLeaveCard = styled(Card)({
  borderRadius: "15px",
  padding: "1.5rem",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fff",
  width: "100%",
  maxWidth: "600px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const DashboardCard = styled(Card)({
  borderRadius: "15px",
  padding: "2rem",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
  height: "120px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  backgroundColor: "#f8f9fa",
});

const StyledTextField = styled(TextField)({
  "& .MuiInputBase-root": {
    borderRadius: "20px",
    color: "#374151",
  },
  "& .MuiInputLabel-root": {
    color: "#6b7280",
  },
  "& .MuiInputBase-input": {
    color: "#374151",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#e5e7eb",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2B3E52",
    },
  },
});

const StyledSelect = styled(Select)({
  borderRadius: "20px",
  color: "#374151",
  "& .MuiSelect-icon": {
    color: "#6b7280",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e5e7eb",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#2B3E52",
  },
});

const StyledButton = styled(MuiButton)({
  backgroundColor: "#2B3E52",
  color: "#fff",
  borderRadius: "20px",
  padding: "0.5rem 1.5rem",
  fontWeight: "bold",
  textTransform: "none",
  "&:disabled": {
    backgroundColor: "#a1a1aa",
    color: "#fff",
  },
  "&.MuiButton-outlined": {
    backgroundColor: "transparent",
    color: "#2B3E52",
    borderColor: "#2B3E52",
    "&:hover": {
      backgroundColor: "#f3f4f6",
      borderColor: "#1e2a38",
    },
  },
});

const LeaveRequestItem = styled(Card)({
  borderRadius: "8px",
  padding: "1rem",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  backgroundColor: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  border: "2px solid #e5e7eb",
});

// ApplyLeave Component
const ApplyLeave = ({ showSnackbar, setActiveTab, setJustAppliedLeave }) => {
  const [token, setToken] = useState("");
  const [empId, setEmpId] = useState(sessionStorage.getItem("empId") || "");
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!empId) {
      showSnackbar("Please login to apply for leave", "error");
      navigate("/login");
      setIsValidating(false);
      return;
    }

    const storedToken = localStorage.getItem(`token_${empId}`) || "";
    setToken(storedToken);

    if (!storedToken) {
      showSnackbar("Please login to apply for leave", "error");
      navigate("/login");
      setIsValidating(false);
      return;
    }

    try {
      const payload = jwtDecode(storedToken);
      const decodedEmpId = payload.sub || payload.emp_id;

      if (decodedEmpId !== empId) {
        showSnackbar("Session mismatch. Please login again.", "error");
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login");
      }
    } catch (e) {
      showSnackbar("Invalid token. Please login again.", "error");
      localStorage.removeItem(`token_${empId}`);
      sessionStorage.removeItem("empId");
      navigate("/login");
    } finally {
      setIsValidating(false);
    }
  }, [empId, navigate, showSnackbar]);

  const validationSchema = Yup.object({
    leave_type: Yup.string()
      .required("Leave type is required")
      .oneOf(
        ALLOWED_LEAVE_TYPES,
        `Leave type must be one of ${ALLOWED_LEAVE_TYPES.join(", ")}`
      ),
    start_date: Yup.date()
      .required("Start date is required")
      .min(
        new Date("2025-07-16").toISOString().split("T")[0],
        "Start date cannot be in the past"
      )
      .test(
        "is-future-or-today",
        "Start date cannot be in the past",
        (value) => {
          if (!value) return false;
          const today = new Date("2025-07-16T16:00:00+05:30");
          today.setHours(0, 0, 0, 0);
          return new Date(value) >= today;
        }
      ),
    end_date: Yup.date()
      .required("End date is required")
      .min(Yup.ref("start_date"), "End date must be on or after start date"),
    reason: Yup.string()
      .required("Reason is required")
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason cannot exceed 500 characters"),
    document: Yup.mixed()
      .nullable()
      .test("fileType", "Document must be a JPG or PDF file", (value) => {
        if (!value) return true;
        return ["image/jpeg", "image/jpg", "application/pdf"].includes(
          value.type
        );
      })
      .test("fileSize", "File size must be less than 5MB", (value) => {
        if (!value) return true;
        return value.size <= 5 * 1024 * 1024;
      }),
  });

  const handleSubmit = debounce(
    async (values, { setSubmitting, resetForm, setFieldValue }) => {
      if (!empId || !token) {
        showSnackbar("Please login to apply for leave", "error");
        navigate("/login");
        setSubmitting(false);
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("leave_type", values.leave_type);
      formData.append(
        "start_date",
        new Date(values.start_date).toISOString().split("T")[0]
      );
      formData.append(
        "end_date",
        new Date(values.end_date).toISOString().split("T")[0]
      );
      formData.append("reason", values.reason);
      if (values.document) {
        formData.append("document", values.document);
      }

      try {
        const response = await axios.post("/apply_leave", formData, {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        });
        showSnackbar(response.data.message, "success");
        resetForm({
          values: {
            leave_type: "",
            start_date: "",
            end_date: "",
            reason: "",
            document: null,
          },
        });
        setFieldValue("document", null);
        setJustAppliedLeave(true);
        setActiveTab(3);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to apply leave";
        if (err.response?.status === 409) {
          showSnackbar(`${errorMessage}.`, "error");
        } else if (
          err.response?.status === 400 &&
          errorMessage.includes("No working days")
        ) {
          showSnackbar(errorMessage, "error");
        } else if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          showSnackbar("Session expired. Please login again.", "error");
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          navigate("/login");
        } else {
          showSnackbar(errorMessage, "error");
        }
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    300
  );

  if (isValidating) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress sx={{ color: "#2B3E52" }} />
      </Box>
    );
  }

  return (
    <ApplyLeaveCard>
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#2B3E52" }}
      >
        Apply for Leave
      </Typography>
      <Formik
        initialValues={{
          leave_type: "",
          start_date: "",
          end_date: "",
          reason: "",
          document: null,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          setFieldValue,
          values,
          errors,
          touched,
          isSubmitting,
          resetForm,
        }) => (
          <Form className="space-y-6">
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: "#6b7280" }}>Leave Type</InputLabel>
              <Field name="leave_type">
                {({ field }) => (
                  <StyledSelect
                    {...field}
                    label="Leave Type"
                    onChange={(e) =>
                      setFieldValue("leave_type", e.target.value)
                    }
                    error={touched.leave_type && !!errors.leave_type}
                  >
                    <MenuItem value="">Select Leave Type</MenuItem>
                    {ALLOWED_LEAVE_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type === "compensatory_off"
                          ? "Compensatory Off"
                          : type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                )}
              </Field>
              {touched.leave_type && errors.leave_type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.leave_type}
                </Typography>
              )}
            </FormControl>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                mb: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <StyledTextField
                  label="Start Date"
                  type="date"
                  name="start_date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date("2025-07-16").toISOString().split("T")[0],
                    "aria-label": "Start Date",
                  }}
                  onChange={(e) => setFieldValue("start_date", e.target.value)}
                  error={touched.start_date && !!errors.start_date}
                  helperText={
                    touched.start_date && errors.start_date
                      ? errors.start_date
                      : ""
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StyledTextField
                  label="End Date"
                  type="date"
                  name="end_date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date("2025-07-16").toISOString().split("T")[0],
                    "aria-label": "End Date",
                  }}
                  onChange={(e) => setFieldValue("end_date", e.target.value)}
                  error={touched.end_date && !!errors.end_date}
                  helperText={
                    touched.end_date && errors.end_date ? errors.end_date : ""
                  }
                />
              </Box>
            </Box>

            <Box sx={{ mb: 1 }}>
              <StyledTextField
                label="Reason"
                name="reason"
                multiline
                rows={3}
                fullWidth
                placeholder="Provide the reason for your leave"
                inputProps={{ "aria-label": "Reason" }}
                onChange={(e) => setFieldValue("reason", e.target.value)}
                error={touched.reason && !!errors.reason}
                helperText={
                  touched.reason && errors.reason ? errors.reason : ""
                }
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <BootstrapForm.Group>
                <BootstrapForm.Label style={{ color: "#6b7280" }}>
                  Upload Document (Optional)
                </BootstrapForm.Label>
                <BootstrapForm.Control
                  type="file"
                  name="document"
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) => setFieldValue("document", e.target.files[0])}
                  style={{
                    borderRadius: "20px",
                    color: "#374151",
                    backgroundColor: "#f9fafb",
                  }}
                />
                {values.document && (
                  <Typography variant="body2" sx={{ mt: 1, color: "#374151" }}>
                    Selected file: {values.document.name}
                  </Typography>
                )}
                {touched.document && errors.document && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.document}
                  </Typography>
                )}
              </BootstrapForm.Group>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <StyledButton
                type="submit"
                disabled={isSubmitting || loading}
                fullWidth
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={20}
                      sx={{ color: "#2B3E52", mr: 1 }}
                    />
                    Submitting...
                  </>
                ) : (
                  "Apply Leave"
                )}
              </StyledButton>
              <StyledButton
                variant="outlined"
                onClick={() => {
                  resetForm({
                    values: {
                      leave_type: "",
                      start_date: "",
                      end_date: "",
                      reason: "",
                      document: null,
                    },
                  });
                  setFieldValue("document", null);
                  navigate(-1);
                }}
                fullWidth
              >
                Cancel
              </StyledButton>
            </Box>
          </Form>
        )}
      </Formik>
    </ApplyLeaveCard>
  );
};

const LeaveBalance = ({ showSnackbar, setLeaveData, leaveData }) => {
  const [leaveBalances, setLeaveBalances] = useState({
    monthly_leaves: [],
    future_compoffs: [],
  });
  const [lossOfPay, setLossOfPay] = useState({ month: "", days: 0 });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // Initialize to current month (e.g., "2025-08")
  );
  const [currentMonthYear, setCurrentMonthYear] = useState(
    getCurrentMonthYear(new Date())
  );
  const [monthOptions, setMonthOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empId] = useState(sessionStorage.getItem("empId") || "");
  const [token] = useState(localStorage.getItem(`token_${empId}`) || "");
  const navigate = useNavigate();

  // Fetch leave history to generate month options
  const fetchMonthOptions = useCallback(async () => {
    if (!empId || !token) return;
    try {
      const response = await axios.get(`/leave_history/${empId}`, {
        headers: { Authorization: token },
      });
      const allLeaves = [
        ...(Array.isArray(response.data.current_and_past_history)
          ? response.data.current_and_past_history
          : []),
        ...(Array.isArray(response.data.future_year_history)
          ? response.data.future_year_history
          : []),
      ];
      const options = generateMonthOptions(allLeaves);
      setMonthOptions(options);
    } catch (err) {
      console.error("Failed to fetch leave history for month options:", err);
      // Keep current monthOptions or set to empty array
      setMonthOptions([]);
    }
  }, [empId, token]);

  // Fetch leave balances
  const fetchLeaveData = useCallback(
    async (month) => {
      if (!month || !empId || !token) {
        showSnackbar("Please login to view leave balances", "error");
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const balanceResponse = await axios.get(`/leave_balance/${empId}`, {
          headers: { Authorization: token },
          params: { month },
        });

        const formattedBalances = {
          monthly_leaves: Array.isArray(
            balanceResponse.data.balances.monthly_leaves
          )
            ? balanceResponse.data.balances.monthly_leaves
                .filter((leave) => leave.month === month)
                .map((leave) => ({
                  leave_type:
                    leave.leave_type === "compensatory_off"
                      ? "Compensatory Off"
                      : leave.leave_type.charAt(0).toUpperCase() +
                        leave.leave_type.slice(1),
                  allowance: leave.allowance,
                  used: leave.used,
                  remaining: leave.remaining,
                  month: leave.month,
                }))
            : [],
          future_compoffs: Array.isArray(
            balanceResponse.data.balances.future_compoffs
          )
            ? balanceResponse.data.balances.future_compoffs.map((leave) => ({
                leave_type: "Compensatory Off (Future)",
                allowance: leave.allowance,
                used: leave.used,
                remaining: leave.remaining,
                month: leave.month,
              }))
            : [],
        };

        setLeaveBalances(formattedBalances);

        const lopResponse = await axios.get(`/loss_of_pay_count/${empId}`, {
          headers: { Authorization: token },
          params: { month },
        });
        setLossOfPay({
          month: lopResponse.data.month,
          days: lopResponse.data.loss_of_pay_days || 0,
        });

        const sickLeaveRemaining =
          formattedBalances.monthly_leaves.find(
            (leave) =>
              leave.leave_type.toLowerCase() === "sick" &&
              leave.month === month
          )?.remaining || 0;
        const compOffRemaining =
          formattedBalances.monthly_leaves.find(
            (leave) =>
              leave.leave_type.toLowerCase() === "compensatory off" &&
              leave.month === month
          )?.remaining || 0;
        const futureCompOffRemaining =
          formattedBalances.future_compoffs.find(
            (leave) => leave.month === "future"
          )?.remaining || 0;

        setLeaveData({
          sickLeavesRemaining: sickLeaveRemaining,
          compensatoryLeavesRemaining: compOffRemaining,
          futureCompOffRemaining: futureCompOffRemaining,
          lossOfPay: lopResponse.data.loss_of_pay_days || 0,
        });
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fetch leave data";
        showSnackbar(errorMessage, "error");
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [empId, token, navigate, showSnackbar, setLeaveData]
  );

  useEffect(() => {
    fetchMonthOptions();
    fetchLeaveData(selectedMonth); // Fetch data for current month on mount
  }, [fetchMonthOptions, fetchLeaveData, selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      setCurrentMonthYear(getCurrentMonthYear(new Date(`${selectedMonth}-01`)));
    }
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "600px" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            color: "#2B3E52",
            fontWeight: "bold",
            textAlign: "center",
            flexGrow: 1,
          }}
        >
          Leave Balance for {currentMonthYear}
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: "#6b7280" }}>Select Month</InputLabel>
          <StyledSelect
            value={selectedMonth}
            onChange={handleMonthChange}
            label="Select Month"
          >
            {monthOptions.length > 0 ? (
              monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value={selectedMonth}>{currentMonthYear}</MenuItem>
            )}
          </StyledSelect>
        </FormControl>
      </Box>
      {loading ? (
        <Box className="text-center">
          <CircularProgress sx={{ color: "#2B3E52" }} />
          <Typography sx={{ mt: 2, color: "#374151" }}>Loading...</Typography>
        </Box>
      ) : selectedMonth ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {[
            {
              type: "Sick Leave Available",
              value: leaveData.sickLeavesRemaining,
              color: "#f59e0b",
            },
            {
              type: "Comp Off Available",
              value: leaveData.compensatoryLeavesRemaining,
              color: "#ef4444",
            },
            {
              type: "Future Comp Off",
              value: leaveData.futureCompOffRemaining,
              color: "#60a5fa",
            },
            {
              type: "Loss of Pay",
              value: leaveData.lossOfPay,
              color: "#10b981",
            },
          ].map((leave, index) => (
            <DashboardCard key={index}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: leave.color }}
                >
                  {leave.type}
                </Typography>
                <Typography sx={{ fontSize: "2rem", color: leave.color }}>
                  {leave.value}
                </Typography>
              </Box>
            </DashboardCard>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

// Utility function to get month and year dynamically
const getCurrentMonthYear = (date = new Date()) => {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

// Utility function to format date to YYYY-MM-DD
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
};

// Utility function to generate month options from leave data
const generateMonthOptions = (leaveData) => {
  const monthSet = new Set();
  leaveData.forEach((leave) => {
    if (leave.start_date) {
      const startDate = new Date(leave.start_date);
      const startMonthYear = startDate.toISOString().slice(0, 7);
      monthSet.add(startMonthYear);
    }
    if (leave.end_date) {
      const endDate = new Date(leave.end_date);
      const endMonthYear = endDate.toISOString().slice(0, 7);
      monthSet.add(endMonthYear);
    }
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  monthSet.add(currentMonth); // Ensure current month is included

  const options = Array.from(monthSet).map((monthValue) => {
    const date = new Date(monthValue + "-01");
    const monthYear = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return { value: monthValue, label: monthYear };
  });

  return options.sort((a, b) => b.value.localeCompare(a.value)); // Latest month first
};
// LeaveHistory Component
const LeaveHistory = ({ showSnackbar }) => {
  const [currentHistory, setCurrentHistory] = useState([]);
  const [futureHistory, setFutureHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [monthOptions, setMonthOptions] = useState([]);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [hasMoreCurrent, setHasMoreCurrent] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const [currentPageCurrent, setCurrentPageCurrent] = useState(1);
  const [currentPageFuture, setCurrentPageFuture] = useState(1);
  const [empId] = useState(sessionStorage.getItem("empId") || "");
  const [token] = useState(localStorage.getItem(`token_${empId}`) || "");
  const [historyView, setHistoryView] = useState("current");
  const navigate = useNavigate();

  const fetchLeaveHistory = useCallback(
    async (pageCurrent = 1, pageFuture = 1, append = false) => {
      if (!empId || !token) {
        showSnackbar("Please login to view leave history", "error");
        navigate("/login");
        return;
      }

      try {
        const params = {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(monthFilter ? { month: monthFilter } : {}),
          page: pageCurrent,
          per_page: ITEMS_PER_PAGE,
        };

        const response = await axios.get(`/leave_history/${empId}`, {
          headers: { Authorization: token },
          params,
        });

        const formatLeave = (leave) => ({
          ...leave,
          leave_type:
            leave.leave_type === "compensatory_off"
              ? "Compensatory Off"
              : leave.leave_type.charAt(0).toUpperCase() +
                leave.leave_type.slice(1),
          used_leave_type: leave.used_leave_type
            ? leave.used_leave_type === "compensatory_off"
              ? "Compensatory Off"
              : leave.used_leave_type.charAt(0).toUpperCase() +
                leave.used_leave_type.slice(1)
            : "-",
          status: leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
          start_date: formatDate(leave.start_date),
          end_date: formatDate(leave.end_date),
        });

        const newCurrentHistory = [];
        const newFutureHistory = [];
        const seenIds = new Set(); // Track unique leave IDs to prevent duplicates

        const allLeaves = [
          ...(Array.isArray(response.data.current_and_past_history)
            ? response.data.current_and_past_history
            : []),
          ...(Array.isArray(response.data.future_year_history)
            ? response.data.future_year_history
            : []),
        ];

        allLeaves.forEach((leave) => {
          if (leave.id && !seenIds.has(leave.id)) {
            seenIds.add(leave.id);
            const startDate = leave.start_date ? new Date(leave.start_date) : null;
            const year = startDate ? startDate.getFullYear() : null;
            const matchesMonth =
              !monthFilter ||
              (leave.start_date &&
                new Date(leave.start_date).toISOString().slice(0, 7) ===
                  monthFilter) ||
              (leave.end_date &&
                new Date(leave.end_date).toISOString().slice(0, 7) ===
                  monthFilter);

            if (matchesMonth && year) {
              if (year >= 2026) {
                newFutureHistory.push(formatLeave(leave));
              } else {
                newCurrentHistory.push(formatLeave(leave));
              }
            }
          }
        });

        setCurrentHistory((prev) =>
          append ? [...prev.filter((leave) => !seenIds.has(leave.id)), ...newCurrentHistory] : newCurrentHistory
        );
        setFutureHistory((prev) =>
          append ? [...prev.filter((leave) => !seenIds.has(leave.id)), ...newFutureHistory] : newFutureHistory
        );
        setHasMoreCurrent(newCurrentHistory.length === ITEMS_PER_PAGE);
        setHasMoreFuture(newFutureHistory.length === ITEMS_PER_PAGE);
        setMonthOptions(generateMonthOptions(allLeaves));
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          showSnackbar("Session expired. Please login again.", "error");
          navigate("/login");
        } else {
          showSnackbar(
            err.response?.data?.message || "Failed to fetch leave history",
            "error"
          );
        }
      }
    },
    [empId, token, statusFilter, monthFilter, navigate, showSnackbar]
  );

  useEffect(() => {
    setCurrentPageCurrent(1);
    setCurrentPageFuture(1);
    setHasMoreCurrent(true);
    setHasMoreFuture(true);
    fetchLeaveHistory(1, 1, false);
  }, [retryTrigger, statusFilter, monthFilter, fetchLeaveHistory]);

  const loadMoreCurrent = () => {
    if (hasMoreCurrent) {
      const nextPage = currentPageCurrent + 1;
      setCurrentPageCurrent(nextPage);
      fetchLeaveHistory(nextPage, currentPageFuture, true);
    }
  };

  const loadMoreFuture = () => {
    if (hasMoreFuture) {
      const nextPage = currentPageFuture + 1;
      setCurrentPageFuture(nextPage);
      fetchLeaveHistory(currentPageCurrent, nextPage, true);
    }
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPageCurrent(1);
    setCurrentPageFuture(1);
    setHasMoreCurrent(true);
    setHasMoreFuture(true);
  };

  const handleMonthChange = (e) => {
    setMonthFilter(e.target.value);
    setCurrentPageCurrent(1);
    setCurrentPageFuture(1);
    setHasMoreCurrent(true);
    setHasMoreFuture(true);
  };

  const handleRetry = () => {
    setRetryTrigger(retryTrigger + 1);
    setCurrentPageCurrent(1);
    setCurrentPageFuture(1);
    setHasMoreCurrent(true);
    setHasMoreFuture(true);
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setHistoryView(newView);
    }
  };

  return (
    <StyledCard>
      <Typography
        variant="h5"
        sx={{ mb: 5, color: "#2B3E52", fontWeight: "bold" }}
      >
        Leave History
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 8, alignItems: "center" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: "#6b7280" }}>Filter by Status</InputLabel>
          <StyledSelect
            value={statusFilter}
            onChange={handleStatusChange}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="withdrawn">Withdrawn</MenuItem>
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: "#6b7280" }}>Filter by Month</InputLabel>
          <StyledSelect
            value={monthFilter}
            onChange={handleMonthChange}
            label="Filter by Month"
          >
            <MenuItem value="">All Months</MenuItem>
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
        <ToggleButtonGroup
          value={historyView}
          exclusive
          onChange={handleViewChange}
          aria-label="history view"
          sx={{ height: "56px" }}
        >
          <ToggleButton value="current" aria-label="current and past history">
            Current
          </ToggleButton>
          <ToggleButton value="future" aria-label="future history">
            Future
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {historyView === "current" && (
          <HistoryCard>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Current and Past Leave History
            </Typography>
            {currentHistory.length > 0 ? (
              <InfiniteScroll
                dataLength={currentHistory.length}
                next={loadMoreCurrent}
                hasMore={hasMoreCurrent}
                endMessage={
                  statusFilter.toLowerCase() === "pending" && currentHistory.length === 0 ? (
                    <Typography
                      className="text-center py-2"
                      sx={{ color: "#374151", marginBottom: 2 }}
                    >
                      No pending leave requests found.
                    </Typography>
                  ) : (
                    <Typography
                      className="text-center py-2"
                      sx={{ color: "#374151", marginBottom: 2 }}
                    >
                      No more current or past leave history to load.
                    </Typography>
                  )
                }
                style={{ overflow: "visible" }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {currentHistory.map((leave, index) => (
                    <LeaveRequestItem key={leave.id || index}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#2B3E52" }}
                      >
                        <strong>Leave Type:</strong> {leave.leave_type}
                      </Typography>
                      <Typography>
                        <strong>Used Leave Type:</strong> {leave.used_leave_type}
                      </Typography>
                      <Typography>
                        <strong>From:</strong> {leave.start_date}
                      </Typography>
                      <Typography>
                        <strong>To:</strong> {leave.end_date}
                      </Typography>
                      <Typography>
                        <strong>Days:</strong> {leave.days}
                      </Typography>
                      <Typography>
                        <strong>Reason:</strong> {leave.reason || "-"}
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {leave.status}
                      </Typography>
                      <Typography>
                        <strong>Applied Date:</strong> {leave.applied_date}
                      </Typography>
                      <Typography>
                        <strong>Modified By:</strong> {leave.modified_by || "-"}
                      </Typography>
                      <Typography>
                        <strong>Document Type:</strong>{" "}
                        {leave.document_type
                          ? leave.document_type.toUpperCase()
                          : "-"}
                      </Typography>
                    </LeaveRequestItem>
                  ))}
                </Box>
              </InfiniteScroll>
            ) : (
              <Typography sx={{ textAlign: "center", py: 2, color: "#374151" }}>
                {statusFilter.toLowerCase() === "pending"
                  ? "No pending leave requests found."
                  : "No current or past leave history found for the selected month."}
              </Typography>
            )}
            {currentHistory.length === 0 && (
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <BootstrapButton
                  onClick={handleRetry}
                  className="bg-blue-500 text-white py-1 px-2 rounded"
                >
                  Retry
                </BootstrapButton>
              </Box>
            )}
          </HistoryCard>
        )}
        {historyView === "future" && (
          <HistoryCard>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Future Leave History
            </Typography>
            {futureHistory.length > 0 ? (
              <InfiniteScroll
                dataLength={futureHistory.length}
                next={loadMoreFuture}
                hasMore={hasMoreFuture}
                endMessage={
                  statusFilter.toLowerCase() === "pending" && futureHistory.length === 0 ? (
                    <Typography
                      className="text-center py-2"
                      sx={{ color: "#374151", marginBottom: 2 }}
                    >
                      No pending leave requests found.
                    </Typography>
                  ) : (
                    <Typography
                      className="text-center py-2"
                      sx={{ color: "#374151", marginBottom: 2 }}
                    >
                      No more future leave history to load.
                    </Typography>
                  )
                }
                style={{ overflow: "visible" }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {futureHistory.map((leave, index) => (
                    <LeaveRequestItem key={leave.id || index}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#2B3E52" }}
                      >
                        <strong>Leave Type:</strong> {leave.leave_type}
                      </Typography>
                      <Typography>
                        <strong>Used Leave Type:</strong> {leave.used_leave_type}
                      </Typography>
                      <Typography>
                        <strong>From:</strong> {leave.start_date}
                      </Typography>
                      <Typography>
                        <strong>To:</strong> {leave.end_date}
                      </Typography>
                      <Typography>
                        <strong>Days:</strong> {leave.days}
                      </Typography>
                      <Typography>
                        <strong>Reason:</strong> {leave.reason || "-"}
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {leave.status}
                      </Typography>
                      <Typography>
                        <strong>Applied Date:</strong> {leave.applied_date}
                      </Typography>
                      <Typography>
                        <strong>Document Type:</strong>{" "}
                        {leave.document_type
                          ? leave.document_type.toUpperCase()
                          : "-"}
                      </Typography>
                    </LeaveRequestItem>
                  ))}
                </Box>
              </InfiniteScroll>
            ) : (
              <Typography sx={{ textAlign: "center", py: 2, color: "#374151" }}>
                {statusFilter.toLowerCase() === "pending"
                  ? "No pending leave requests found."
                  : "No future leave history found for the selected month."}
              </Typography>
            )}
            {futureHistory.length === 0 && (
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <BootstrapButton
                  onClick={handleRetry}
                  className="bg-blue-500 text-white py-1 px-2 rounded"
                >
                  Retry
                </BootstrapButton>
              </Box>
            )}
          </HistoryCard>
        )}
      </Box>
    </StyledCard>
  );
};

const LeaveRequest = ({ showSnackbar }) => {
  const [state, setState] = useState({
    leaveRequests: [],
    statusFilter: "",
    monthFilter: "",
    monthOptions: [],
    error: "",
    withdrawMessage: "",
    withdrawError: "",
    isWithdrawLoading: {},
    isUploadLoading: {},
    noData: false,
    openUploadDialog: false,
    selectedLeaveId: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [empId] = useState(sessionStorage.getItem("empId") || "");
  const [token] = useState(localStorage.getItem(`token_${empId}`) || "");
  const navigate = useNavigate();

  const fetchLeaveRequests = useCallback(
    debounce(async (page = 1, append = false, retryCount = 3, delay = 1000) => {
      if (!token || !empId) {
        showSnackbar("Please log in to view your leave requests", "error");
        navigate("/login");
        return;
      }

      try {
        const config = {
          headers: { Authorization: token },
          params: {
            ...(state.statusFilter
              ? { status: state.statusFilter.toLowerCase() }
              : {}),
            ...(state.monthFilter ? { month: state.monthFilter } : {}),
            page,
            per_page: ITEMS_PER_PAGE,
          },
        };

        const response = await axios.get(`/my_leave_requests/${empId}`, config);

        const filterByMonth = (requests) => {
          if (!state.monthFilter) return requests;
          return requests.filter((req) => {
            const startMonth = req.start_date
              ? new Date(req.start_date).toISOString().slice(0, 7)
              : "";
            const endMonth = req.end_date
              ? new Date(req.end_date).toISOString().slice(0, 7)
              : "";
            return (
              startMonth === state.monthFilter || endMonth === state.monthFilter
            );
          });
        };

        const requestsMap = new Map();
        const allRequests = Array.isArray(response.data.leave_requests)
          ? filterByMonth(response.data.leave_requests)
          : [];

        allRequests.forEach((req) => {
          if (req.id && !requestsMap.has(req.id)) {
            requestsMap.set(req.id, {
              id: req.id || "N/A",
              leave_type: req.leave_type
                ? req.leave_type === "compensatory_off"
                  ? "Compensatory Off"
                  : req.leave_type.charAt(0).toUpperCase() +
                    req.leave_type.slice(1)
                : "N/A",
              used_leave_type: req.used_leave_type
                ? req.used_leave_type === "compensatory_off"
                  ? "Compensatory Off"
                  : req.used_leave_type.charAt(0).toUpperCase() +
                    req.used_leave_type.slice(1)
                : "N/A",
              start_date: formatDate(req.start_date),
              end_date: formatDate(req.end_date),
              days: req.days || 0,
              reason: req.reason || "N/A",
              status: req.status
                ? req.status.charAt(0).toUpperCase() + req.status.slice(1)
                : "N/A",
              applied_date: req.applied_date || "N/A",
              document_type: req.document_type
                ? req.document_type.toUpperCase()
                : "N/A",
            });
          }
        });

        const uniqueRequests = Array.from(requestsMap.values());

        setState((prev) => ({
          ...prev,
          leaveRequests: append
            ? [...prev.leaveRequests.filter((req) => !requestsMap.has(req.id)), ...uniqueRequests]
            : uniqueRequests,
          error: "",
          noData: uniqueRequests.length === 0 && page === 1,
          monthOptions: generateMonthOptions(response.data.leave_requests),
        }));
        setHasMore(uniqueRequests.length === ITEMS_PER_PAGE);
        setCurrentPage(page);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          showSnackbar("Session expired. Please login again.", "error");
          navigate("/login");
        } else if (err.response?.status === 404) {
          setState((prev) => ({
            ...prev,
            leaveRequests: [],
            error: "",
            noData: true,
            monthOptions: [],
          }));
          setHasMore(false);
        } else if (
          (err.response?.status === 500 || err.code === "ERR_NETWORK") &&
          retryCount > 0
        ) {
          setTimeout(
            () => fetchLeaveRequests(page, append, retryCount - 1, delay * 2),
            delay
          );
          return;
        } else {
          const errorMessage =
            err.response?.data?.message || "Failed to fetch leave requests";
          setState((prev) => ({
            ...prev,
            error: errorMessage,
          }));
          showSnackbar(errorMessage, "error");
        }
      }
    }, 300),
    [
      empId,
      token,
      state.statusFilter,
      state.monthFilter,
      navigate,
      showSnackbar,
    ]
  );

  useEffect(() => {
    setState((prev) => ({ ...prev, withdrawMessage: "", withdrawError: "" }));
    setCurrentPage(1);
    setHasMore(true);
    fetchLeaveRequests(1, false);
  }, [state.statusFilter, state.monthFilter, fetchLeaveRequests]);

  const loadMoreRequests = () => {
    if (hasMore) {
      const nextPage = currentPage + 1;
      fetchLeaveRequests(nextPage, true);
    }
  };

  const handleStatusFilterChange = (e) => {
    setState((prev) => ({ ...prev, statusFilter: e.target.value }));
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleMonthFilterChange = (e) => {
    setState((prev) => ({ ...prev, monthFilter: e.target.value }));
    setCurrentPage(1);
    setHasMore(true);
  };

  const handleWithdraw = async (leaveId) => {
    if (
      !window.confirm(
        `Are you sure you want to withdraw leave request ID ${leaveId}?`
      )
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      withdrawMessage: "",
      withdrawError: "",
      isWithdrawLoading: { ...prev.isWithdrawLoading, [leaveId]: true },
    }));

    if (!empId || !token) {
      setState((prev) => ({
        ...prev,
        withdrawError: "Please login to withdraw leave",
        isWithdrawLoading: { ...prev.isWithdrawLoading, [leaveId]: false },
      }));
      showSnackbar("Please login to withdraw leave", "error");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.put(
        `/withdraw_leave/${leaveId}`,
        {},
        {
          headers: { Authorization: token },
        }
      );
      setState((prev) => ({
        ...prev,
        withdrawMessage: response.data.message,
        isWithdrawLoading: { ...prev.isWithdrawLoading, [leaveId]: false },
      }));
      showSnackbar(response.data.message, "success");
      fetchLeaveRequests(1, false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to withdraw leave";
      setState((prev) => ({
        ...prev,
        withdrawError: errorMessage,
        isWithdrawLoading: { ...prev.isWithdrawLoading, [leaveId]: false },
      }));
      showSnackbar(errorMessage, "error");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login");
      }
    }
  };

  const handleViewDocument = async (leaveId) => {
    if (!empId || !token) {
      showSnackbar("Please log in to view documents", "error");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`/get_leave_document/${leaveId}`, {
        headers: { Authorization: token },
        responseType: "blob",
      });

      if (response.status !== 200) {
        throw new Error("Failed to retrieve document");
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to retrieve document";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleOpenUploadDialog = (leaveId) => {
    setState((prev) => ({
      ...prev,
      openUploadDialog: true,
      selectedLeaveId: leaveId,
    }));
  };

  const handleCloseUploadDialog = () => {
    setState((prev) => ({
      ...prev,
      openUploadDialog: false,
      selectedLeaveId: null,
    }));
  };

  const handleUploadSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!empId || !token) {
      showSnackbar("Please login to upload document", "error");
      navigate("/login");
      setSubmitting(false);
      return;
    }

    setState((prev) => ({
      ...prev,
      isUploadLoading: {
        ...prev.isUploadLoading,
        [state.selectedLeaveId]: true,
      },
    }));

    try {
      const formData = new FormData();
      formData.append("document", values.document);
      const response = await axios.post(
        `/upload_leave_document/${state.selectedLeaveId}`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      showSnackbar(response.data.message, "success");
      resetForm();
      setState((prev) => ({
        ...prev,
        openUploadDialog: false,
        selectedLeaveId: null,
        isUploadLoading: {
          ...prev.isUploadLoading,
          [state.selectedLeaveId]: false,
        },
      }));
      fetchLeaveRequests(1, false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to upload document";
      showSnackbar(errorMessage, "error");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login");
      }
      setState((prev) => ({
        ...prev,
        isUploadLoading: {
          ...prev.isUploadLoading,
          [state.selectedLeaveId]: false,
        },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const validationSchema = Yup.object({
    document: Yup.mixed()
      .required("Document is required")
      .test("fileType", "Document must be a JPG or PDF file", (value) => {
        if (!value) return false;
        return ["image/jpeg", "image/jpg", "application/pdf"].includes(
          value.type
        );
      })
      .test("fileSize", "File size must be less than 5MB", (value) => {
        if (!value) return false;
        return value.size <= 5 * 1024 * 1024;
      }),
  });

  return (
    <RequestCard>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h5" sx={{ color: "#2B3E52", fontWeight: "600" }}>
          My Leave Requests
        </Typography>
        <StyledButton
          onClick={() => fetchLeaveRequests(1, false)}
          sx={{
            bgcolor: "#2B3E52",
            color: "#fff",
          }}
        >
          Refresh
        </StyledButton>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: "#6b7280" }}>Filter by Status</InputLabel>
          <StyledSelect
            value={state.statusFilter}
            onChange={handleStatusFilterChange}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="withdrawn">Withdrawn</MenuItem>
          </StyledSelect>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: "#6b7280" }}>Filter by Month</InputLabel>
          <StyledSelect
            value={state.monthFilter}
            onChange={handleMonthFilterChange}
            label="Filter by Month"
          >
            <MenuItem value="">All Months</MenuItem>
            {state.monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
      </Box>

      {state.withdrawMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {state.withdrawMessage}
        </Alert>
      )}
      {state.withdrawError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.withdrawError}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      <InfiniteScroll
        dataLength={state.leaveRequests.length}
        next={loadMoreRequests}
        hasMore={hasMore}
        endMessage={
          state.noData && state.statusFilter.toLowerCase() === "pending" ? (
            <Typography
              className="text-center py-2"
              sx={{ color: "#374151", marginBottom: 2 }}
            >
              No pending leave requests found.
            </Typography>
          ) : (
            <Typography
              className="text-center py-2"
              sx={{ color: "#374151", marginBottom: 2 }}
            >
              No more leave requests to load.
            </Typography>
          )
        }
        style={{ overflow: "visible" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {state.noData && state.statusFilter.toLowerCase() !== "pending" ? (
            <Box
              sx={{
                textAlign: "center",
                padding: "7rem",
                color: "#374151",
                gridColumn: "1 / -1",
              }}
            >
              No leave requests found for the selected month. Try applying for
              a leave or changing the status filter.
            </Box>
          ) : (
            state.leaveRequests.map((request) => (
              <LeaveRequestItem
                key={request.id || `request-${Math.random()}`}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#2B3E52" }}
                >
                  <strong>Leave Type:</strong> {request.leave_type}
                </Typography>
                <Typography>
                  <strong>Used Leave Type:</strong> {request.used_leave_type}
                </Typography>
                <Typography>
                  <strong>From:</strong> {request.start_date}
                </Typography>
                <Typography>
                  <strong>To:</strong> {request.end_date}
                </Typography>
                <Typography>
                  <strong>Days:</strong> {request.days}
                </Typography>
                <Typography>
                  <strong>Reason:</strong> {request.reason}
                </Typography>
                <Typography>
                  <strong>Status:</strong> {request.status}
                </Typography>
                <Typography>
                  <strong>Applied Date:</strong> {request.applied_date}
                </Typography>
                <Typography>
                  <strong>Document Type:</strong> {request.document_type}
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  {request.status.toLowerCase() === "pending" && (
                    <>
                      <StyledButton
                        size="small"
                        onClick={() => handleWithdraw(request.id)}
                        disabled={
                          state.isWithdrawLoading[request.id] || !request.id
                        }
                        sx={{ bgcolor: "#2B3E52", color: "#fff" }}
                      >
                        {state.isWithdrawLoading[request.id] ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: "#fff" }}
                          />
                        ) : (
                          "Withdraw"
                        )}
                      </StyledButton>
                      <StyledButton
                        size="small"
                        onClick={() => handleOpenUploadDialog(request.id)}
                        disabled={
                          state.isUploadLoading[request.id] || !request.id
                        }
                        sx={{ bgcolor: "#3b82f6", color: "#fff" }}
                      >
                        {state.isUploadLoading[request.id] ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: "#fff" }}
                          />
                        ) : (
                          "Upload"
                        )}
                      </StyledButton>
                    </>
                  )}
                  {request.document_type !== "N/A" && (
                    <StyledButton
                      size="small"
                      onClick={() => handleViewDocument(request.id)}
                      sx={{ bgcolor: "#f59e0b", color: "#fff" }}
                    >
                      View Doc
                    </StyledButton>
                  )}
                </Stack>
              </LeaveRequestItem>
            ))
          )}
        </Box>
      </InfiniteScroll>

      <Dialog
        open={state.openUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "15px",
            padding: "1.5rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#2B3E52", fontWeight: "bold" }}>
          Upload Document for Leave Request
        </DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ document: null }}
            validationSchema={validationSchema}
            onSubmit={handleUploadSubmit}
          >
            {({ setFieldValue, values, errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <Box>
                  <Typography sx={{ color: "#6b7280", mb: 1 }}>
                    Select a JPG or PDF file (max 5MB)
                  </Typography>
                  <BootstrapForm.Control
                    type="file"
                    accept=".jpg,.jpeg,.pdf"
                    onChange={(e) =>
                      setFieldValue("document", e.target.files[0])
                    }
                    style={{
                      borderRadius: "10px",
                      color: "#374151",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                  {values.document && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "#374151" }}
                    >
                      Selected file: {values.document.name}
                    </Typography>
                  )}
                  {touched.document && errors.document && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.document}
                    </Typography>
                  )}
                </Box>
                <DialogActions>
                  <StyledButton
                    onClick={handleCloseUploadDialog}
                    sx={{ bgcolor: "#6b7280", color: "#fff" }}
                  >
                    Cancel
                  </StyledButton>
                  <StyledButton
                    type="submit"
                    disabled={
                      isSubmitting ||
                      state.isUploadLoading[state.selectedLeaveId]
                    }
                  >
                    {state.isUploadLoading[state.selectedLeaveId] ? (
                      <>
                        <CircularProgress
                          size={20}
                          sx={{ color: "#fff", mr: 1 }}
                        />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </StyledButton>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </RequestCard>
  );
};

// UploadDocument Component
const UploadDocument = ({ leaveId, onUploadSuccess, showSnackbar }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [empId] = useState(sessionStorage.getItem("empId") || "");
  const [token] = useState(localStorage.getItem(`token_${empId}`) || "");
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    document: Yup.mixed()
      .required("Document is required")
      .test("fileType", "Document must be a JPG or PDF file", (value) => {
        if (!value) return false;
        return ["image/jpeg", "image/jpg", "application/pdf"].includes(
          value.type
        );
      })
      .test("fileSize", "File size must be less than 5MB", (value) => {
        if (!value) return false;
        return value.size <= 5 * 1024 * 1024;
      }),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!empId || !token) {
      showSnackbar("Please login to upload document", "error");
      navigate("/login");
      setSubmitting(false);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("document", values.document);

    try {
      const response = await axios.post(
        `/upload_leave_document/${leaveId}`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      showSnackbar(response.data.message, "success");
      resetForm();
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to upload document";
      showSnackbar(errorMessage, "error");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        navigate("/login");
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Formik
        initialValues={{ document: null }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, errors, touched, isSubmitting }) => (
          <Form>
            <BootstrapForm.Group>
              <BootstrapForm.Label style={{ color: "#6b7280" }}>
                Upload Document (JPG or PDF, max 5MB)
              </BootstrapForm.Label>
              <BootstrapForm.Control
                type="file"
                accept=".jpg,.jpeg,.pdf"
                onChange={(e) => {
                  setFieldValue("document", e.target.files[0]);
                  setFile(e.target.files[0]);
                }}
                style={{
                  borderRadius: "20px",
                  color: "#374151",
                  backgroundColor: "#f9fafb",
                }}
              />
              {values.document && (
                <Typography variant="body2" sx={{ mt: 1, color: "#374151" }}>
                  Selected file: {values.document.name}
                </Typography>
              )}
              {touched.document && errors.document && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.document}
                </Typography>
              )}
            </BootstrapForm.Group>
            <Box mt={2} display="flex" gap={2}>
              <StyledButton type="submit" disabled={isSubmitting || loading}>
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "#2B3E52" }} />
                ) : (
                  "Upload"
                )}
              </StyledButton>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

// LeaveManagementPage Component
const LeaveManagementPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [empId, setEmpId] = useState(sessionStorage.getItem("empId") || "");
  const [token, setToken] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [justAppliedLeave, setJustAppliedLeave] = useState(false);
  const [leaveData, setLeaveData] = useState({
    sickLeavesRemaining: 0,
    compensatoryLeavesRemaining: 0,
    futureCompOffRemaining: 0,
    lossOfPay: 0,
  });
  const navigate = useNavigate();
  const navbarRef = useRef(null);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(70); // Initial sidebar width (70px for collapsed)

  // Function to calculate navbar height
  const updateNavbarHeight = () => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }
  };

  // Calculate height on mount and window resize
  useEffect(() => {
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  useEffect(() => {
    if (!empId) {
      showSnackbar("Please login to access leave management", "error");
      navigate("/login");
      return;
    }

    const storedToken = localStorage.getItem(`token_${empId}`) || "";
    setToken(storedToken);

    if (!storedToken) {
      showSnackbar("Please login to access leave management", "error");
      navigate("/login");
      return;
    }

    try {
      const payload = jwtDecode(storedToken);
      const decodedEmpId = payload.sub || payload.emp_id;

      if (decodedEmpId !== empId) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem("empId");
        showSnackbar("Session mismatch. Please login again.", "error");
        navigate("/login");
      }
    } catch (e) {
      localStorage.removeItem(`token_${empId}`);
      sessionStorage.removeItem("empId");
      showSnackbar("Invalid token. Please login again.", "error");
      navigate("/login");
    }
  }, [empId, navigate, showSnackbar]);

  // Handle sidebar width change on hover
  const handleSidebarHover = (isHovering) => {
    setSidebarWidth(isHovering ? 250 : 70);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#F5E8D3",
        overflowX: "hidden",
      }}
    >
      <Box ref={navbarRef}>
        <AppNavbar />
      </Box>
      <Box
        sx={{
          display: "flex",
          flex: 1,
          width: "100%",
          mt: `${navbarHeight}px`,
        }}
      >
        <Box
          sx={{
            width: { xs: "0", md: `${sidebarWidth}px` },
            transition: "width 0.3s ease",
            flexShrink: 0,
            position: "fixed",
            top: navbarHeight,
            height: `calc(100vh - ${navbarHeight}px)`,
            zIndex: 1000,
            left: 0,
          }}
          onMouseEnter={() => handleSidebarHover(true)}
          onMouseLeave={() => handleSidebarHover(false)}
        >
          <DynamicSidebar />
        </Box>
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, md: { top: 10, right: 4, bottom: 10, left: 4 } },
            ml: { xs: 0, md: `${sidebarWidth}px` },
            transition: "margin-left 0.3s ease",
            width: { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` },
            maxWidth: "100%",
            mx: "auto",
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 3 }, mt: { xs: 4, sm: 7 } }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: "black",
                mb: 1,
              }}
            >
              Leave Management
            </Typography>
            <Breadcrumbs
              aria-label="breadcrumb"
              separator={
                <Typography
                  sx={{
                    mx: 0.75,
                    color: "#CA763A",
                    fontSize: "1rem",
                    animation: `${pulse} 1.5s infinite`,
                  }}
                >
                  →
                </Typography>
              }
              sx={{
                "& .MuiBreadcrumbs-ol": {
                  alignItems: "center",
                },
              }}
            >
              <MuiLink
                underline="none"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#2b3e52",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    opacity: 0.9,
                  },
                  cursor: "pointer",
                }}
                onClick={() => navigate(-1)}
              >
                <HomeIcon
                  sx={{ mr: 0.5, fontSize: "20px", color: "#CA763A" }}
                />
                Dashboard
              </MuiLink>
              <Typography
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#2b3e52",
                }}
              >
                <GroupIcon
                  sx={{ mr: 0.5, fontSize: "20px", color: "#CA763A" }}
                />
                Leave Management
              </Typography>
            </Breadcrumbs>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box sx={{ display: "flex", gap: "1rem" }}>
              <StyledButton
                variant="contained"
                onClick={() => setActiveTab(0)}
                sx={{ borderRadius: "20px" }}
              >
                Apply Leave
              </StyledButton>
              <StyledButton
                variant="contained"
                onClick={() => setActiveTab(1)}
                sx={{ borderRadius: "20px" }}
              >
                History
              </StyledButton>
              <StyledButton
                variant="contained"
                onClick={() => setActiveTab(3)}
                sx={{ borderRadius: "20px" }}
              >
                Requests
              </StyledButton>
            </Box>
          </Box>

          {activeTab === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
              }}
            >
              <Box sx={{ flex: "1", maxWidth: { md: "50%" } }}>
                <ApplyLeave
                  showSnackbar={showSnackbar}
                  setActiveTab={setActiveTab}
                  setJustAppliedLeave={setJustAppliedLeave}
                />
              </Box>
              <Box sx={{ flex: "1", maxWidth: { md: "50%" } }}>
                <LeaveBalance
                  showSnackbar={showSnackbar}
                  setLeaveData={setLeaveData}
                  leaveData={leaveData}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: "100%", mx: "auto" }}>
              {activeTab === 1 && <LeaveHistory showSnackbar={showSnackbar} />}
              {activeTab === 3 && <LeaveRequest showSnackbar={showSnackbar} />}
            </Box>
          )}

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default LeaveManagementPage;