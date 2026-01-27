import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Spinner } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import md5 from "md5";
import DynamicSidebar from "./Sidebar";
import AppNavbar from "./Hrmnav";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ScheduleInterviewForm = ({ navigate }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const empId = sessionStorage.getItem("empId");
  const token = localStorage.getItem(`token_${empId}`);

  const validationSchema = Yup.object({
    review_id: Yup.number()
      .positive("Review ID must be a positive integer")
      .required("Review ID is required"),
    interview_date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .required("Interview date is required")
      .test("is-future-date", "Interview date cannot be in the past", (value) => {
        if (!value) return false;
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate >= today;
      }),
    interview_link: Yup.string()
      .url("Must be a valid URL")
      .max(255, "Interview link must not exceed 255 characters")
      .nullable(),
    interview_rounds: Yup.array()
      .of(Yup.string().oneOf(["Walk-In", "Aptitude", "Technical", "HR Interview"]))
      .min(1, "At least one interview round is required")
      .required("Interview rounds are required"),
    force_reschedule: Yup.boolean(),
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    if (!token || !empId) {
      const errorMessage = "Authentication required. Please ensure you are logged in.";
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/schedule_interview`,
        {
          review_id: values.review_id,
          interview_date: values.interview_date,
          interview_link: values.interview_link || "",
          interview_rounds: values.interview_rounds,
          force_reschedule: values.force_reschedule,
        },
        { headers: { Authorization: token } }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Interview scheduled successfully!",
        severity: "success",
      });

      resetForm();
    } catch (err) {
      let errorMessage = "Failed to schedule interview. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Invalid or expired token. Please log in again.";
            navigate("/login");
            break;
          case 403:
            errorMessage = "Access denied: Insufficient privileges.";
            break;
          case 404:
            errorMessage = `Review ID ${values.review_id} not found.`;
            break;
          case 400:
            errorMessage = err.response.data.message || "Invalid input data.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = "An unexpected error occurred.";
        }
      }
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4" color="#1A202C" fontWeight="bold" textAlign="center" mb={2}>
          Schedule Interview
        </Typography>
        <Typography variant="body1" color="#4A5568" textAlign="center" mb={4}>
          Plan and schedule candidate interviews
        </Typography>

        <Formik
          initialValues={{
            review_id: "",
            interview_date: "",
            interview_link: "",
            interview_rounds: [],
            force_reschedule: false,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="grid gap-6">
              <Box>
                <label htmlFor="review_id" className="text-sm font-medium text-gray-700">
                  Review ID
                </label>
                <Field
                  as={TextField}
                  name="review_id"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, bgcolor: "#FFFFFF" }}
                  inputProps={{ "aria-label": "Review ID" }}
                />
                <ErrorMessage name="review_id" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              <Box>
                <label htmlFor="interview_date" className="text-sm font-medium text-gray-700">
                  Interview Date
                </label>
                <Field
                  as={TextField}
                  name="interview_date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, bgcolor: "#FFFFFF" }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ "aria-label": "Interview Date" }}
                />
                <ErrorMessage name="interview_date" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              <Box>
                <label htmlFor="interview_link" className="text-sm font-medium text-gray-700">
                  Interview Link (Optional)
                </label>
                <Field
                  as={TextField}
                  name="interview_link"
                  type="text"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, bgcolor: "#FFFFFF" }}
                  inputProps={{ "aria-label": "Interview Link" }}
                />
                <ErrorMessage name="interview_link" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium" color="#4A5568">
                  Interview Rounds
                </Typography>
                <Box sx={{ mt: 2, display: "flex", flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
                  {["Walk-In", "Aptitude", "Technical", "HR Interview"].map((round) => (
                    <label key={round} className="flex items-center">
                      <Field
                        type="checkbox"
                        name="interview_rounds"
                        value={round}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFieldValue(
                            "interview_rounds",
                            isChecked
                              ? [...values.interview_rounds, round]
                              : values.interview_rounds.filter((r) => r !== round)
                          );
                        }}
                        aria-label={`Select ${round} round`}
                      />
                      <Typography variant="body2" sx={{ ml: 1, color: "#4A5568" }}>
                        {round}
                      </Typography>
                    </label>
                  ))}
                </Box>
                <ErrorMessage name="interview_rounds" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              <Box>
                <label className="flex items-center">
                  <Field
                    type="checkbox"
                    name="force_reschedule"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label="Force Reschedule"
                  />
                  <Typography variant="body2" sx={{ ml: 1, color: "#4A5568" }}>
                    Force Reschedule
                  </Typography>
                </label>
              </Box>

              {error && <Typography color="error" variant="body2">{error}</Typography>}

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || loading}
                aria-label="Schedule Interview"
                sx={{
                  mt: 2,
                  py: 1.5,
                  bgcolor: "#1E88E5",
                  "&:hover": { bgcolor: "#1565C0" },
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
                fullWidth
              >
                {loading && <Spinner animation="border" size="sm" className="mr-2" />}
                Schedule Interview
              </Button>
            </Form>
          )}
        </Formik>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

const HrDecisionForm = () => {
  const [reviewId, setReviewId] = useState("");
  const [decision, setDecision] = useState("selected");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [token, setToken] = useState("");
  const [empId, setEmpId] = useState("");

  useEffect(() => {
    const empIdFromSession = sessionStorage.getItem("empId");
    if (!empIdFromSession) {
      setSnackbar({
        open: true,
        message: "Employee ID not found. Please complete OTP authentication.",
        severity: "error",
      });
      return;
    }

    const tokenFromStorage = localStorage.getItem(`token_${empIdFromSession}`);
    if (!tokenFromStorage) {
      setSnackbar({
        open: true,
        message: "Authentication token not found. Please log in via OTP again.",
        severity: "error",
      });
      return;
    }

    setEmpId(empIdFromSession);
    setToken(tokenFromStorage);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reviewId || !decision) {
      setSnackbar({
        open: true,
        message: "Review ID and decision are required.",
        severity: "warning",
      });
      return;
    }

    if (!token || !empId) {
      setSnackbar({
        open: true,
        message: "Authentication required. Please log in via OTP.",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/submit_hr_decision`,
        {
          review_id: parseInt(reviewId),
          hr_decision: decision,
        },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Decision submitted successfully!",
        severity: "success",
      });

      setReviewId("");
      setDecision("selected");
    } catch (err) {
      const status = err.response?.status;
      let message = "Something went wrong.";

      if (status === 401) {
        message = err.response?.data?.message || "Invalid or expired token from OTP authentication.";
      } else if (status === 403) {
        message = "Access denied. Only HR/Admin can submit decisions.";
      } else if (status === 404) {
        message = `Review ID ${reviewId} not found.`;
      } else if (status === 400) {
        message = err.response?.data?.message || "Invalid input.";
      } else if (status === 500) {
        message = "Server error. Please try again.";
      } else if (err.message.includes("Network Error") || err.code === "ERR_FAILED") {
        message = "CORS error or server not reachable. Check Flask and CORS config.";
      }

      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ bgcolor: "#FFFFFF", p: 5, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4" color="#1A202C" fontWeight="bold" textAlign="center" mb={2}>
          HR Decision
        </Typography>
        <Typography variant="body1" color="#4A5568" textAlign="center" mb={4}>
          Select or reject a candidate based on the review ID
        </Typography>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <Box>
            <TextField
              label="Review ID"
              type="number"
              fullWidth
              value={reviewId}
              onChange={(e) => setReviewId(e.target.value)}
              variant="outlined"
              size="small"
              required
              inputProps={{ "aria-label": "Review ID" }}
              sx={{ bgcolor: "#FFFFFF" }}
            />
          </Box>

          <Box sx={{ my: 2 }} />

          <Box>
            <TextField
              select
              label="Decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{ "aria-label": "Decision" }}
              sx={{ bgcolor: "#FFFFFF" }}
            >
              <MenuItem value="selected">Selected</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !token || !empId}
            aria-label="Submit Decision"
            sx={{
              mt: 3,
              py: 1.5,
              bgcolor: "#1E88E5",
              "&:hover": { bgcolor: "#1565C0" },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "bold",
            }}
            fullWidth
          >
            {loading && <Spinner animation="border" size="sm" className="mr-2" />}
            Submit Decision
          </Button>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

const AssignInterviewerForm = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const navigate = useNavigate();

  const empId = sessionStorage.getItem("empId");
  const token = localStorage.getItem(`token_${empId}`);

  const validationSchema = Yup.object({
    review_id: Yup.number()
      .positive("Review ID must be a positive integer")
      .required("Review ID is required"),
    interviewer_emp_id: Yup.string()
      .trim()
      .required("Interviewer Employee ID is required"),
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    if (!token || !empId) {
      const errorMessage = "Authentication required. Please ensure you are logged in.";
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/assign_interviewer`,
        {
          review_id: values.review_id,
          interviewer_emp_id: values.interviewer_emp_id.trim(),
        },
        { headers: { Authorization: token } }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Interviewer assigned successfully!",
        severity: "success",
      });

      resetForm();
    } catch (err) {
      let errorMessage = "Failed to assign interviewer. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Invalid or expired token. Please log in again.";
            navigate("/login");
            break;
          case 403:
            errorMessage = "Access denied: Insufficient privileges.";
            break;
          case 404:
            errorMessage = `Review ID ${values.review_id} or Employee ID ${values.interviewer_emp_id} not found.`;
            break;
          case 400:
            errorMessage = err.response.data.message || "Invalid input data.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = err.message.includes("CORS")
              ? "CORS error: Backend is not configured to allow requests from this origin."
              : "An unexpected error occurred.";
        }
      } else if (err.message.includes("Network Error")) {
        errorMessage = "Network error: Unable to connect to the server.";
      }
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4" color="#1A202C" fontWeight="bold" textAlign="center" mb={2}>
          Assign Interviewer
        </Typography>
        <Typography variant="body1" color="#4A5568" textAlign="center" mb={4}>
          Assign an interviewer to a review
        </Typography>

        <Formik
          initialValues={{
            review_id: "",
            interviewer_emp_id: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="grid gap-6">
              <Box>
                <label htmlFor="review_id" className="text-sm font-medium text-gray-700">
                  Review ID
                </label>
                <Field
                  as={TextField}
                  name="review_id"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, bgcolor: "#FFFFFF" }}
                  inputProps={{ "aria-label": "Review ID" }}
                />
                <ErrorMessage name="review_id" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              <Box>
                <label htmlFor="interviewer_emp_id" className="text-sm font-medium text-gray-700">
                  Interviewer Employee ID
                </label>
                <Field
                  as={TextField}
                  name="interviewer_emp_id"
                  type="text"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, bgcolor: "#FFFFFF" }}
                  inputProps={{ "aria-label": "Interviewer Employee ID" }}
                />
                <ErrorMessage name="interviewer_emp_id" component="div" className="text-red-500 text-sm mt-1" />
              </Box>

              {error && <Typography color="error" variant="body2">{error}</Typography>}

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || loading}
                aria-label="Assign Interviewer"
                sx={{
                  mt: 2,
                  py: 1.5,
                  bgcolor: "#1E88E5",
                  "&:hover": { bgcolor: "#1565C0" },
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
                fullWidth
              >
                {loading && <Spinner animation="border" size="sm" className="mr-2" />}
                Assign Interviewer
              </Button>
            </Form>
          )}
        </Formik>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

const InterviewFeedback = () => {
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [manualReviewId, setManualReviewId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const reviewId = queryParams.get("review_id");

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFeedback(null);
  };

  const fetchFeedback = async (id) => {
    if (!id) {
      setError("Missing review_id parameter");
      setSnackbar({ open: true, message: "Missing review_id parameter", severity: "error" });
      return;
    }

    setLoading(true);
    setError(null);

    let token;
    let empId = sessionStorage.getItem("empId");

    try {
      if (empId) {
        token = localStorage.getItem(`token_${empId}`);
      }

      if (!token && !empId) {
        const fallbackToken = localStorage.getItem("token");
        if (fallbackToken) {
          try {
            const decoded = jwtDecode(fallbackToken);
            empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
            token = fallbackToken;
            localStorage.setItem(`token_${empId}`, token);
            sessionStorage.setItem("empId", empId);
          } catch (error) {
            console.error("Error decoding fallback token:", error);
            empId = md5(fallbackToken);
            token = fallbackToken;
            localStorage.setItem(`token_${empId}`, token);
            sessionStorage.setItem("empId", empId);
          }
        }
      }

      if (!token || !empId) {
        setError("Token or employee ID missing. Please log in again.");
        setSnackbar({
          open: true,
          message: "Token or employee ID missing. Please log in again.",
          severity: "error",
        });
        await navigate("/login");
        return;
      }

      const response = await axios.get(
        `${API_URL}/get_interview_feedback?review_id=${id}`,
        { headers: { Authorization: token } }
      );

      setFeedback(response.data);
      setOpenDialog(true);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });
    } catch (err) {
      console.error("Error fetching feedback:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError("Invalid or expired token. Please log in again.");
        setSnackbar({
          open: true,
          message: "Invalid or expired token. Please log in again.",
          severity: "error",
        });
        await navigate("/login");
      } else if (err.response?.status === 403) {
        setError("Access denied: Insufficient privileges.");
        setSnackbar({
          open: true,
          message: "Access denied: Insufficient privileges.",
          severity: "error",
        });
      } else if (err.response?.status === 404) {
        setError(err.response.data.message || "Review or interviewer not found.");
        setSnackbar({
          open: true,
          message: err.response.data.message || "Review or interviewer not found.",
          severity: "error",
        });
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || "Invalid review_id.");
        setSnackbar({
          open: true,
          message: err.response.data.message || "Invalid review_id.",
          severity: "error",
        });
      } else {
        setError("Failed to fetch feedback. Please try again.");
        setSnackbar({
          open: true,
          message: "Failed to fetch feedback. Please try again.",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reviewId) {
      fetchFeedback(reviewId);
    }
  }, [reviewId]);

  const handleManualFetch = () => {
    fetchFeedback(manualReviewId);
  };

  return (
    <Card sx={{ p: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4" color="#1A202C" fontWeight="bold" textAlign="center" mb={2}>
          Interview Feedback
        </Typography>
        <Typography variant="body1" color="#4A5568" textAlign="center" mb={4}>
          View feedback for a specific review
        </Typography>

        {!reviewId && (
          <Box mb={3}>
            <TextField
              fullWidth
              label="Enter Review ID"
              value={manualReviewId}
              onChange={(e) => setManualReviewId(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2, bgcolor: "#FFFFFF" }}
              inputProps={{ "aria-label": "Review ID" }}
            />
            <Button
              onClick={handleManualFetch}
              disabled={!manualReviewId || loading}
              variant="contained"
              sx={{
                py: 1.5,
                bgcolor: "#1E88E5",
                "&:hover": { bgcolor: "#1565C0" },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
              fullWidth
            >
              Fetch Feedback
            </Button>
          </Box>
        )}

        {loading && (
          <Box textAlign="center" my={3}>
            <Spinner animation="border" size="sm" className="me-2" />
            <Typography variant="body2">Loading feedback...</Typography>
          </Box>
        )}

        {error && (
          <Box textAlign="center" my={3}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Dialog
          open={openDialog}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
          aria-labelledby="feedback-dialog-title"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              bgcolor: "#FFFFFF",
            },
          }}
        >
          <DialogTitle id="feedback-dialog-title" sx={{ bgcolor: "#1E88E5", color: "#fff", py: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Interview Feedback - Review ID: {reviewId || manualReviewId || "N/A"}
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4, bgcolor: "#FFFFFF" }}>
            {feedback && feedback.status === "success" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Candidate Name
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.candidate_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Candidate Email
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.candidate_email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Job Name
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.job_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Company Name
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.company_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Interviewer Name
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.interviewer_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Interviewer Email
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.interviewer_email}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#E3F2FD", p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold" color="#1A202C" sx={{ mb: 1 }}>
                    Feedback
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.feedback}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#E3F2FD", p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold" color="#1A202C" sx={{ mb: 1 }}>
                    Result
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.result}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#E3F2FD", p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold" color="#1A202C" sx={{ mb: 1 }}>
                    Rating
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.rating}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Interview Date
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.interview_date || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Interview Mode
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.interview_mode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Current Round
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.current_round}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#E3F2FD", p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold" color="#1A202C" sx={{ mb: 1 }}>
                    Interview Rounds
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.interview_rounds.join(", ") || "N/A"}
                  </Typography>
                </Box>
                {feedback.next_round && (
                  <Box>
                    <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                      Next Round
                    </Typography>
                    <Typography variant="body2" color="#4A5568">
                      {feedback.next_round}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Feedback Submitted At
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.feedback_submitted_at || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#1A202C" sx={{ mb: 1 }}>
                    Result Updated By
                  </Typography>
                  <Typography variant="body2" color="#4A5568">
                    {feedback.result_updated_by}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: "#F4F6F8" }}>
            <Button
              onClick={handleDialogClose}
              variant="contained"
              sx={{
                bgcolor: "#F57C00",
                "&:hover": { bgcolor: "#EF6C00" },
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 1,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Button
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{
            mt: 2,
            py: 1.5,
            borderColor: "#1E88E5",
            color: "#1E88E5",
            "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "bold",
          }}
          fullWidth
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
};

const InterviewProcess = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const navbarRef = useRef(null);
  const navigate = useNavigate();

  const updateNavbarHeight = () => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  const handleSidebarHover = (isHovering) => {
    setSidebarWidth(isHovering ? 250 : 70);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#FFFFFF",
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
            p: { xs: 2, md: 4 },
            ml: { xs: 0, md: `${sidebarWidth}px` },
            transition: "margin-left 0.3s ease",
            width: { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` },
            maxWidth: "100%",
            mx: "auto",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "800px", mx: "auto", mt: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: "#1A202C", textAlign: "center" }}>
              Interview Management
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#4A5568", mt: 1, textAlign: "center" }}>
              Streamline your interview and hiring process
            </Typography>
            <Box
              sx={{
                mt: 4,
                backgroundColor: "#FFFFFF",
                borderRadius: 3,
                p: 1,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                centered
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  "& .MuiTab-root": {
                    fontSize: { xs: "0.75rem", md: "1rem" },
                    fontWeight: "medium",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#E3F2FD" },
                    flex: 1,
                  },
                }}
                aria-label="HR Portal Navigation Tabs"
              >
                <Tab label="Schedule Interview" aria-controls="schedule-interview-panel" />
                <Tab label="Assign Interviewer" aria-controls="assign-interviewer-panel" />
                <Tab label="HR Decision" aria-controls="hr-decision-panel" />
                <Tab label="Interview Feedback" aria-controls="interview-feedback-panel" />
              </Tabs>
            </Box>
            <Box sx={{ mt: 4, maxWidth: "600px", mx: "auto" }}>
              <Box role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                {activeTab === 0 && <ScheduleInterviewForm navigate={navigate} />}
                {activeTab === 1 && <AssignInterviewerForm />}
                {activeTab === 2 && <HrDecisionForm />}
                {activeTab === 3 && <InterviewFeedback />}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};



export default InterviewProcess;