import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import DatePicker from "react-datepicker";
import { Form } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { startOfDay, isSameDay } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import CalendarToday from "@mui/icons-material/CalendarToday";
import AppNavbar from "./Hrmnav";
import DynamicSidebar from "./Sidebar";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ViewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [snackbar, setSnackbar] = useState({ show: false, message: "", type: "info" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [feedbacksToDelete, setFeedbacksToDelete] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    if (snackbar.show) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.show]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get(`${API_URL}/feedbacks`);
        const feedbacksWithIST = (response.data.feedbacks || []).map(
          (feedback) => ({
            ...feedback,
            submitted_at: `${feedback.submitted_at}+05:30`,
          })
        );
        setFeedbacks(feedbacksWithIST);
        setFilteredFeedbacks(feedbacksWithIST);
      } catch (err) {
        let errorMessage = "Failed to fetch feedbacks. Please try again.";
        if (err.response) {
          if (err.response.status === 500) {
            errorMessage =
              err.response.data.error || "Server error. Please try again later.";
          } else if (err.code === "ERR_NETWORK") {
            errorMessage =
              "Network error. Please check your connection or server status.";
          } else {
            errorMessage =
              err.response.data?.error || "An unexpected error occurred.";
          }
        }
        setSnackbar({ show: true, message: errorMessage, type: "error" });
      }
    };
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    let updatedFeedbacks = [...feedbacks];
    if (searchTerm) {
      updatedFeedbacks = updatedFeedbacks.filter((feedback) =>
        feedback.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedDate) {
      updatedFeedbacks = updatedFeedbacks.filter((feedback) => {
        const feedbackDate = startOfDay(new Date(feedback.submitted_at));
        const selected = startOfDay(selectedDate);
        return isSameDay(feedbackDate, selected);
      });
    }
    updatedFeedbacks.sort((a, b) => {
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return dateB - dateA;
    });
    setFilteredFeedbacks(updatedFeedbacks);
  }, [searchTerm, selectedDate, feedbacks]);

  const filterInputSx = {
    mb: 1,
    width: "200px",
    "& .MuiInputBase-root": {
      height: "40px",
      fontSize: "0.875rem",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#fff",
      padding: "0 12px",
    },
    "& .MuiInputBase-input": {
      padding: "0",
    },
  };

  const handleCheckboxChange = (feedbackId) => {
    setFeedbacksToDelete((prev) =>
      prev.includes(feedbackId)
        ? prev.filter((id) => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFeedbacksToDelete([]);
    } else {
      setFeedbacksToDelete(filteredFeedbacks.map((feedback) => feedback.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (feedbacksToDelete.length > 0) {
      setOpenDialog(true);
    } else {
      setSnackbar({
        show: true,
        message: "Please select at least one feedback to delete",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        feedbacksToDelete.map((id) =>
          axios.delete(`${API_URL}/delete_feedback/${id}`)
        )
      );
      setFeedbacks(
        feedbacks.filter((feedback) => !feedbacksToDelete.includes(feedback.id))
      );
      setFeedbacksToDelete([]);
      setSelectAll(false);
      setSnackbar({
        show: true,
        message: `Successfully deleted ${feedbacksToDelete.length} feedback(s)`,
        type: "success",
      });
    } catch (err) {
      let errorMessage = "Failed to delete feedbacks. Please try again.";
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage =
            err.response.data.error || "One or more feedbacks not found.";
        } else if (err.response.status === 500) {
          errorMessage =
            err.response.data.error || "Server error. Please try again later.";
        } else if (err.code === "ERR_NETWORK") {
          errorMessage =
            "Network error. Please check your connection or server status.";
        } else {
          errorMessage =
            err.response.data?.error || "An unexpected error occurred.";
        }
      }
      setSnackbar({ show: true, message: errorMessage, type: "error" });
    }
    setOpenDialog(false);
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setFeedbacksToDelete([]);
    setSelectAll(false);
  };

  const openDatePicker = () => {
    if (datePickerRef.current) {
      datePickerRef.current.setOpen(true);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <AppNavbar />
      <div className="d-flex flex-grow-1">
        <div>
          <DynamicSidebar />
        </div>
        <div
          className="container flex-grow-1"
          style={{ overflowX: "hidden", marginTop: "64px" }}
        >
          <div className="row mb-3 align-items-center">
            <div className="col-md-3 d-flex align-items-start">
              <h1 className="mb-0 me-3">Feedbacks</h1>
            </div>
            <div className="col-md-9 d-flex justify-content-end align-content-center">
              <div className="d-flex flex-column me-4">
                <label htmlFor="search" style={{ marginBottom: "4px" }}>
                  Search
                </label>
                <TextField
                  id="search"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  label={null}
                  sx={filterInputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <div className="d-flex flex-column">
                <label htmlFor="datePicker" style={{ marginBottom: "4px" }}>
                  Filter by Date
                </label>
                <Form.Group>
                  <div
                    className="form-control d-flex align-items-center"
                    style={{
                      height: "40px",
                      width: "200px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      padding: "0 12px",
                      cursor: "pointer",
                    }}
                    onClick={openDatePicker}
                  >
                    <CalendarToday style={{ fontSize: "1.25rem", color: "#666" }} />
                    {selectedDate && (
                      <span style={{ marginLeft: "8px", fontSize: "0.875rem" }}>
                        {new Date(selectedDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <DatePicker
                    id="datePicker"
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="d-none"
                    // wrapperClassName="w-100"
                    popperClassName="date-picker-popper"
                    ref={datePickerRef}
                    showPopperArrow={false}
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Group>
              </div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-12 d-flex align-items-center">
              <input
                type="checkbox"
                className="me-2"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <label className="me-3">Select All</label>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteSelected}
                disabled={feedbacksToDelete.length === 0}
              >
                Delete Selected
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div
                style={{
                  maxHeight: "600px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {filteredFeedbacks.length === 0 ? (
                  <p>No feedback available.</p>
                ) : (
                  <div className="row gx-3">
                    {filteredFeedbacks.map((feedback) => (
                      <div
                        key={feedback.id || feedback.submitted_at}
                        className="col-md-3 mb-3"
                        style={{ boxSizing: "border-box" }}
                      >
                        <div
                          className="card shadow-sm"
                          style={{
                            boxSizing: "border-box",
                            width: "100%",
                            height: "250px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div
                            className="card-body"
                            style={{
                              flex: "1",
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                flex: "1",
                                overflowY: "auto",
                                paddingRight: "10px",
                              }}
                            >
                              <div className="d-flex align-items-center mb-2">
                                <input
                                  type="checkbox"
                                  className="me-2"
                                  checked={feedbacksToDelete.includes(feedback.id)}
                                  onChange={() => handleCheckboxChange(feedback.id)}
                                />
                                <p style={{ margin: "0" }}>
                                  <strong>Anonymous</strong>
                                </p>
                              </div>
                              <p style={{ margin: "0 0 8px 0" }}>
                                <strong>Message:</strong> {feedback.message}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Submitted:</strong>{" "}
                                {isNaN(new Date(feedback.submitted_at).getTime())
                                  ? "Invalid Date"
                                  : new Date(feedback.submitted_at).toLocaleString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        timeZone: "Asia/Kolkata",
                                      }
                                    )}
                              </p>
                            </div>
                            <button
                              className="btn btn-danger btn-sm mt-2"
                              onClick={() => {
                                setFeedbacksToDelete([feedback.id]);
                                setOpenDialog(true);
                              }}
                              style={{ flexShrink: 0 }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Dialog
            open={openDialog}
            onClose={handleCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Are you sure you want to delete {feedbacksToDelete.length}{" "}
                feedback(s)?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleDelete} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={snackbar.show}
            autoHideDuration={5000}
            onClose={() => setSnackbar({ ...snackbar, show: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            sx={{ maxWidth: "30rem", zIndex: 50 }}
          >
            <Alert
              severity={snackbar.type}
              onClose={() => setSnackbar({ ...snackbar, show: false })}
              sx={{ boxShadow: 3, borderRadius: 1 }}
            >
              <strong>{snackbar.type === "success" ? "Success" : "Error"}</strong>:{" "}
              {snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      </div>
      <style>
        {`
          .form-control {
            height: 40px;
            font-size: 0.875rem;
            border-radius: 10px;
            border: none;
            background-color: #fff;
            padding: 0 12px;
            width: 200px;
          }
          .date-picker-popper {
            z-index: 1000;
          }
        `}
      </style>
    </div>
  );
};

export default ViewFeedback;