import React, { useState, useEffect } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const GiveFeedback = ({ open, onClose }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "info", // success, error
  });

  const userRole = (sessionStorage.getItem("userRole") || localStorage.getItem("userRole")).trim().toLowerCase();

  const colors = ["hr", "admin", "manager"].includes(userRole)
    ? {
      cardBg: "#2772a0",
      textAndAccent: "#ffffff",
      buttonBg: "#a0c3e8",
      buttonText: "white",
      borderColor: "#a0c3e8",
      chipBg: "#a0c3e8",
      chipText: "#2772a0",
      chipBorder: "#2772a0",
      hoverButtonBg: "#8bb0d8",
      selectedDateBg: "#6b9ac4",
    }
    : {
      cardBg: "#F5E8D3",
      textAndAccent: "#34495E",
      buttonBg: "#34495E",
      buttonText: "#F7E7CE",
      borderColor: "rgba(44,62,80,0.2)",
      chipBg: "#F7E7CE",
      chipText: "#2C3E50",
      chipBorder: "#2C3E50",
      hoverButtonBg: "#2C3E50",
      selectedDateBg: "#6b7280",
    };

  const feedbackSchema = Yup.object({
    message: Yup.string()
      .required("Feedback message is required")
      .min(10, "Feedback must be at least 10 characters")
      .max(500, "Feedback cannot exceed 500 characters")
      .test(
        "word-count",
        "Feedback cannot exceed 300 words",
        (value) => {
          if (!value) return true;
          const wordCount = value.trim().split(/\s+/).length;
          return wordCount <= 300;
        }
      ),
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Auto-hide snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        handleCloseSnackbar();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleSubmitFeedback = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(
        `${API_URL}/feedback`,
        { message: values.message }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Feedback submitted successfully",
        type: "success",
      });
      resetForm();
      onClose(); // Close dialog on success
    } catch (err) {
      console.error("Feedback submission error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = "Failed to submit feedback. Please try again.";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || "Feedback message is required.";
        } else if (err.response.status === 500) {
          errorMessage = err.response.data.error || "Server error. Please try again later.";
        } else if (err.code === "ERR_NETWORK") {
          errorMessage = "Network error. Please check your connection or server status.";
        } else {
          errorMessage = err.response.data?.error || "An unexpected error occurred.";
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
            minWidth: "300px",
            maxWidth: "400px",
            width: "100%",
            color: colors.textAndAccent,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", color: colors.textAndAccent }}>
          Cofomo Tech  
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 2, color: colors.textAndAccent }}
          >
            Submit Your Feedback
          </Typography>
          <Formik
            initialValues={{ message: "" }}
            validationSchema={feedbackSchema}
            onSubmit={handleSubmitFeedback}
          >
            {({ values, handleChange, isSubmitting }) => (
              <Form>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    name="message"
                    label="Feedback"
                    value={values.message}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your Feedback"
                    InputProps={{
                      sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        color: colors.textAndAccent,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: colors.borderColor,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: colors.textAndAccent,
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: colors.textAndAccent },
                    }}
                  />
                  <Box
                    sx={{
                      color: "#ffca28",
                      fontSize: "0.75rem",
                      textAlign: "center",
                      mt: 1,
                    }}
                  >
                    <ErrorMessage name="message" component="div" />
                  </Box>
                </Box>

                <DialogActions sx={{ justifyContent: "space-between", gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      minWidth: "180px", // Moved here
                      fontWeight: "bold",
                      backgroundColor: colors.buttonBg,
                      color: colors.buttonText,
                      "&:hover": {
                        backgroundColor: colors.hoverButtonBg,
                      },
                    }}
                  >
                    Submit Feedback
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={onClose}
                    sx={{
                      fontWeight: "bold",
                      borderColor: colors.borderColor,
                      color: colors.textAndAccent,
                      "&:hover": {
                        borderColor: colors.textAndAccent,
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        sx={{ zIndex: 1500 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          sx={{
            width: "300px",
            backgroundColor: snackbar.type === "success" ? "#4caf50" : "#f44336",
            color: "#fff",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GiveFeedback;