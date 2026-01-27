import React, { useEffect, useState, Component, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert, Modal, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Card, Paper, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, subMonths, addMonths, isAfter, subYears, addYears, isSaturday, isSunday } from "date-fns";
import { jwtDecode } from "jwt-decode";
import md5 from "md5";
import debounce from "lodash/debounce";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// --- Error Boundary ---
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: this.props.colors.textAndAccent }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Something went wrong.</h2>
          <p style={{ fontSize: "14px" }}>{this.state.error?.message || "An error occurred."}</p>
          <Button
            variant="primary"
            style={{
              backgroundColor: this.props.colors.buttonBg,
              color: this.props.colors.buttonText,
              border: `1px solid ${this.props.colors.borderColor}`,
              borderRadius: "4px",
              fontSize: "12px",
              padding: "4px 8px",
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Date Normalization ---
const normalizeDate = (dateStr) => {
  try {
    if (!dateStr) return null;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    } else if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    }
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate)) return null;
    return format(parsedDate, "yyyy-MM-dd");
  } catch (err) {
    return null;
  }
};

// --- Attendance Calendar Component ---
const EmployeeAttendanceCalendar = () => {
  const initialDate = new Date();
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestDates, setSelectedRequestDates] = useState([]);
  const [reason, setReason] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [modalDisplayDate, setModalDisplayDate] = useState(initialDate);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const year = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const currentDate = new Date();

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

  const dayStyles = {
    P: { backgroundColor: "#75eb9181", description: "Present" },
    "P*": { backgroundColor: "#fbdd7aa8", description: "Partially Present" },
    L: { backgroundColor: "#f17f888c", description: "Leave" },
    H: { backgroundColor: "#a3c0fbb0", description: "Weekend" },
    "E-Event": { backgroundColor: "#4c35f783", description: "Holiday" },
    " ": { backgroundColor: colors.chipBg, description: "No Status" },
    default: { backgroundColor: colors.chipBg, description: "No Status" },
    today: {
      border: `2px solid ${colors.chipText}`,
      backgroundColor: colors.chipBg,
      boxSizing: "border-box",
    },
  };

  useEffect(() => {
    const resolveUserRole = () => {
      const role = sessionStorage.getItem("userRole")?.trim().toLowerCase();
      if (role) {
        setUserRole(role);
        setRoleLoading(false);
      } else {
        const timeout = setTimeout(() => {
          setUserRole("employee");
          setRoleLoading(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    };
    resolveUserRole();
  }, []);

  useEffect(() => {
    if (roleLoading) return;
    const fetchToken = () => {
      let empId = sessionStorage.getItem("empId");
      let fetchedToken;
      if (empId) {
        fetchedToken = localStorage.getItem(`token_${empId}`);
      }
      if (!fetchedToken || !empId) {
        const fallbackToken = localStorage.getItem("token");
        if (fallbackToken) {
          try {
            const decoded = jwtDecode(fallbackToken);
            empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
            fetchedToken = fallbackToken;
            localStorage.setItem(`token_${empId}`, fetchedToken);
            sessionStorage.setItem("empId", empId);
          } catch (error) {
            empId = md5(fallbackToken);
            fetchedToken = fallbackToken;
            localStorage.setItem(`token_${empId}`, fetchedToken);
            sessionStorage.setItem("empId", empId);
          }
        }
      }
      if (!fetchedToken || !empId) {
        setError("Token or employee ID missing. Please log in again.");
        setLoading(false);
        return;
      }
      setToken(fetchedToken);
    };
    fetchToken();
  }, [roleLoading]);

  // Convert duration to hours (float)
  const parseDurationToHours = (duration) => {
    if (!duration || duration === "0hrs 0min 0sec" || duration === "0hrs 0min 0sec / 0hrs") return 0;
    const match = duration.match(/^(\d+)hrs\s*(\d+)min\s*(\d+)sec/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    return hours + (minutes / 60) + (seconds / 3600);
  };

  // ---- Fetch holidays + attendance, core logic ----
  useEffect(() => {
    if (!token || roleLoading) return;
    const fetchAttendanceAndHolidays = async () => {
      try {
        setLoading(true);
        setError(null);

        // --- Fetch holidays from backend ---
        const holidayResponse = await axios.get(
          `${API_URL}/get_holidays?_=${Date.now()}`,
          { headers: { Authorization: token } }
        );
        const holidayData = holidayResponse.data.holidays || [];
        const holidayDates = holidayData
          .map((h) => ({
            date: normalizeDate(h.holiday_date),
            name: h.holiday_name,
          }))
          .filter((h) => h.date);

        setHolidays(holidayDates.length ? holidayDates : [{ date: "2025-03-13", name: "Eid-ul-Fitr" }]); // fallback

        // --- Fetch attendance data ---
        const response = await axios.get(
          `${API_URL}/employee_total_duration`,
          { headers: { Authorization: `${token}` } }
        );
        const attendance = response.data.data || [];

        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const daysInMonth = eachDayOfInterval({ start, end });
        const attendanceMap = {};
        attendance.forEach((item) => {
          const dateStr = normalizeDate(item.punch_date);
          if (dateStr) attendanceMap[dateStr] = item;
        });

        // --- Main status calculation ---
        const processedAttendance = daysInMonth.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const item = attendanceMap[dateStr];
          const durationHours = item ? parseDurationToHours(item.total_daily_duration) : 0;
          const isHoliday = holidayDates.some((holiday) => holiday.date === dateStr);
          let status;
          if (durationHours >= 8.75) status = "P";
          else if (durationHours > 0 && durationHours < 8.75) status = "P*";
          else if (isHoliday) status = "E-Event";
          else if (isSaturday(date) || isSunday(date)) status = "H";
          else status = "L";
          return {
            date: dateStr,
            duration: item ? item.total_daily_duration : null,
            status,
            duration_adjustment_status: null,
          };
        });

        setAttendanceData(processedAttendance);
      } catch (err) {
        setError("Failed to load attendance or holiday data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceAndHolidays();
  }, [year, currentMonth, token, roleLoading, selectedDate]);

  // --- Regularization
  const handleDateToggle = useCallback(
    debounce((date) => {
      if (isAfter(date, currentDate)) return;
      setSelectedRequestDates((prev) =>
        prev.some((d) => isSameDay(d, date))
          ? prev.filter((d) => !isSameDay(d, date))
          : [...prev, date]
      );
    }, 100),
    [currentDate]
  );

  const handleOpenModal = useCallback(() => {
    setSelectedRequestDates([]);
    setReason("");
    setRequestError(null);
    setRequestSuccess(null);
    setModalDisplayDate(initialDate);
    setShowModal(true);
  }, [initialDate]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedRequestDates([]);
    setReason("");
    setRequestError(null);
    setRequestSuccess(null);
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setModalDisplayDate((prev) => subMonths(prev, 1));
  }, []);
  const handleNextMonth = useCallback(() => {
    setModalDisplayDate((prev) => addMonths(prev, 1));
  }, []);
  const handlePreviousYear = useCallback(() => {
    setModalDisplayDate((prev) => subYears(prev, 1));
  }, []);
  const handleNextYear = useCallback(() => {
    setModalDisplayDate((prev) => addYears(prev, 1));
  }, []);

  // --- Regularization submit and attendance refresh logic ---
  const handleRequestSubmit = useCallback(async () => {
    if (selectedRequestDates.length === 0) {
      setRequestError("Please select at least one date.");
      return;
    }
    if (!reason.trim()) {
      setRequestError("Reason is required.");
      return;
    }
    setRequestLoading(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      const requests = selectedRequestDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        reason: reason.trim(),
      }));

      await Promise.all(
        requests.map((req) =>
          axios.post(
            `${API_URL}/request_adjustment`,
            req,
            { headers: { Authorization: `${token}` } }
          )
        )
      );
      setRequestSuccess("Requests submitted successfully.");

      // Refresh attendance after submit
      const response = await axios.get(
        `${API_URL}/employee_total_duration`,
        { headers: { Authorization: `${token}` } }
      );
      const attendance = response.data.data || [];
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const daysInMonth = eachDayOfInterval({ start, end });
      const attendanceMap = {};
      attendance.forEach((item) => {
        const dateStr = normalizeDate(item.punch_date);
        if (dateStr) attendanceMap[dateStr] = item;
      });

      // Repeat correct status priority logic
      const processedAttendance = daysInMonth.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const item = attendanceMap[dateStr];
        const durationHours = item ? parseDurationToHours(item.total_daily_duration) : 0;
        const isHoliday = holidays.some((holiday) => holiday.date === dateStr);
        let status;
        if (durationHours >= 8.75) status = "P";
        else if (durationHours > 0 && durationHours < 8.75) status = "P*";
        else if (isHoliday) status = "E-Event";
        else if (isSaturday(date) || isSunday(date)) status = "H";
        else status = "L";

        return {
          date: dateStr,
          duration: item ? item.total_daily_duration : null,
          status,
          duration_adjustment_status: null,
        };
      });
      setAttendanceData(processedAttendance);
      setTimeout(handleCloseModal, 1500);
    } catch (err) {
      setRequestError(err.response?.data?.message || "Failed to submit requests.");
    } finally {
      setRequestLoading(false);
    }
  }, [selectedRequestDates, reason, token, year, currentMonth, holidays, handleCloseModal, selectedDate]);

  // --- Renderers ---

  const generateCalendarRows = useCallback(
    (daysInMonth, statusByDate) => {
      const rows = [];
      let cells = [];
      const firstDayIndex = getDay(daysInMonth[0]);
      for (let i = 0; i < firstDayIndex; i++) {
        cells.push(
          <Col
            key={`empty-start-${i}`}
            style={{
              width: "34px",
              height: "28px",
              backgroundColor: colors.borderColor,
            }}
          />
        );
      }
      daysInMonth.forEach((date, idx) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const isHoliday = holidays.some((holiday) => holiday.date === dateStr);
        let cellStyle = {};
        let content = format(date, "d");
        const isFutureOrToday = isToday(date) || isAfter(date, currentDate);
        const record = statusByDate[dateStr] || {
          status: isHoliday ? "E-Event" : (isSaturday(date) || isSunday(date)) ? "H" : "L",
          duration: null,
        };
        cellStyle = {
          backgroundColor: isFutureOrToday ? colors.chipBg : (dayStyles[record.status]?.backgroundColor || colors.chipBg),
          width: "34px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          cursor: "default",
          color: userRole !== "employee" ? "#ffffff" : colors.chipText, // White for non-employee roles
        };
        if (isToday(date)) {
          cellStyle = {
            ...cellStyle,
            ...dayStyles.today,
          };
        }
        // Modified tooltip content logic
        const holiday = holidays.find((h) => h.date === dateStr);
        const tooltipContent =
          record.status === "E-Event" && holiday
            ? `Holiday: ${holiday.name}\nStatus: ${dayStyles[record.status]?.description || "No Status"}`
            : record.status !== " "
            ? `Duration: ${record.duration ? record.duration.split(" / ")[0] : "N/A"}\nStatus: ${dayStyles[record.status]?.description || "No Status"}`
            : "No Status";
        cells.push(
          isFutureOrToday ? (
            <Col key={dateStr} style={cellStyle}>
              <div>{content}</div>
            </Col>
          ) : (
            <OverlayTrigger
              key={dateStr}
              placement="top"
              overlay={
                <Tooltip
                  id={`tooltip-${dateStr}`}
                  style={{
                    fontSize: "10px",
                    padding: "4px",
                    lineHeight: "1.2",
                    backgroundColor: dayStyles[record.status]?.backgroundColor || colors.chipBg,
                    color: colors.chipText,
                  }}
                >
                  {tooltipContent.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </Tooltip>
              }
            >
              <Col style={cellStyle}>
                <div>{content}</div>
              </Col>
            </OverlayTrigger>
          )
        );
        if ((idx + firstDayIndex + 1) % 7 === 0) {
          rows.push(<Row key={`row-${idx}`}>{cells}</Row>);
          cells = [];
        }
      });
      if (cells.length > 0) {
        while (cells.length < 7) {
          cells.push(
            <Col
              key={`empty-end-${cells.length}`}
              style={{
                width: "34px",
                height: "28px",
                backgroundColor: colors.borderColor,
              }}
            />
          );
        }
        rows.push(<Row key="row-last">{cells}</Row>);
      }
      return rows;
    },
    [colors.chipText, colors.borderColor, colors.chipBg, currentDate, holidays, userRole]
  );

  const renderMonthlyCalendar = useCallback(() => {
    const statusByDate = {};
    attendanceData.forEach((item) => {
      statusByDate[item.date] = {
        status: item.status,
        duration: item.duration || null,
      };
    });
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    return (
      <Paper
        elevation={0}
        className="p-0 mt-1"
        style={{
          borderRadius: "8px",
          backgroundColor: colors.cardBg,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <Row className="font-bold text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Col
              key={day}
              style={{
                width: "34px",
                height: "18px",
                backgroundColor: colors.borderColor,
                fontSize: "9px",
                fontWeight: 500,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: colors.chipText,
              }}
            >
              {day}
            </Col>
          ))}
        </Row>
        {generateCalendarRows(daysInMonth, statusByDate)}
        <div
          className="mt-2"
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: "3px",
            paddingBottom: "4px",
            justifyContent: "center",
            width: "110%",
            boxSizing: "border-box",
          }}
        >
          {Object.entries(dayStyles)
            .filter(([key]) => !["default", "current", " ", "today"].includes(key))
            .map(([status, { backgroundColor, description }]) => (
              <div
                key={status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "10px",
                  flex: "0 1 120px",
                  color: colors.textAndAccent,
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor,
                    marginRight: "6px",
                    border: `1px solid ${colors.chipBorder}`,
                    borderRadius: "2px",
                  }}
                />
                <span>{`${status} - ${description}`}</span>
              </div>
            ))}
        </div>
      </Paper>
    );
  }, [attendanceData, selectedDate, colors.cardBg, colors.chipText, colors.borderColor, colors.textAndAccent, colors.chipBorder, generateCalendarRows]);

  const renderModalCalendar = () => {
    const displayDate = modalDisplayDate instanceof Date && !isNaN(modalDisplayDate) ? modalDisplayDate : new Date();
    const monthName = format(displayDate, "MMM");
    const year = displayDate.getFullYear();
    const displayText = `${monthName} ${year}`;
    const start = startOfMonth(displayDate);
    const end = endOfMonth(displayDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    const rows = [];
    let cells = [];
    const firstDayIndex = getDay(daysInMonth[0]);
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <Col
          key={`modal-empty-start-${i}`}
          style={{
            width: "34px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.borderColor,
          }}
        />
      );
    }
    daysInMonth.forEach((date, idx) => {
      const isSelected = selectedRequestDates.some((d) => isSameDay(d, date));
      const isFuture = isAfter(date, currentDate);
      cells.push(
        <Col
          key={`modal-${format(date, "yyyy-MM-dd")}`}
          style={{
            backgroundColor: isFuture ? "rgba(200, 200, 200, 0.5)" : isSelected ? colors.selectedDateBg : colors.chipBg,
            width: "34px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isFuture ? "not-allowed" : "pointer",
            border: isSelected ? `2px solid ${colors.chipBorder}` : `1px solid ${colors.chipBorder}`,
            boxSizing: "border-box",
            color: isFuture ? colors.chipText : isSelected ? colors.buttonText : (userRole !== "employee" ? "#ffffff" : colors.chipText), // White for non-employee roles
            opacity: isFuture ? 0.5 : 1,
          }}
          onClick={isFuture ? null : () => handleDateToggle(date)}
        >
          <div style={{ fontWeight: "bold", fontSize: "10px" }}>{format(date, "d")}</div>
        </Col>
      );
      if ((idx + firstDayIndex + 1) % 7 === 0) {
        rows.push(<Row key={`modal-row-${idx}`}>{cells}</Row>);
        cells = [];
      }
    });
    if (cells.length > 0) {
      while (cells.length < 7) {
        cells.push(
          <Col
            key={`modal-empty-end-${cells.length}`}
            style={{
              width: "34px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.borderColor,
            }}
          />
        );
      }
      rows.push(<Row key="modal-row-last">{cells}</Row>);
    }
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 4, backgroundColor: "#f0f0f0", padding: "4px" }}>
          <Button variant="link" size="sm" onClick={handlePreviousYear} style={{ minWidth: 30, color: colors.textAndAccent, textDecoration: "none" }}>
            &lt;&lt;
          </Button>
          <Button variant="link" size="sm" onClick={handlePreviousMonth} style={{ minWidth: 30, color: colors.textAndAccent, textDecoration: "none" }}>
            &lt;
          </Button>
          <div style={{ margin: "0 8px", fontSize: 14, color: colors.textAndAccent, backgroundColor: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>
            {displayText}
          </div>
          <Button variant="link" size="sm" onClick={handleNextMonth} style={{ minWidth: 30, color: colors.textAndAccent, textDecoration: "none" }}>
            &gt;
          </Button>
          <Button variant="link" size="sm" onClick={handleNextYear} style={{ minWidth: 30, color: colors.textAndAccent, textDecoration: "none" }}>
            &gt;&gt;
          </Button>
        </div>
        {rows}
      </div>
    );
  };

  // --- Main component render ---
  return (
    <ErrorBoundary colors={colors}>
      <Card
        style={{
          width: 520,
          minHeight: 280,
          padding: 15,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          backgroundColor: colors.cardBg,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Row style={{ marginBottom: 12, alignItems: "center" }}>
            <Col xs={3} className="d-flex align-items-center">
              <Typography variant="h6" style={{ fontSize: 18, fontWeight: 600, color: colors.textAndAccent, whiteSpace: "nowrap" }}>
                My Attendance
              </Typography>
            </Col>
            <Col xs={6} className="d-flex justify-content-center align-items-center" style={{ maxWidth: "100%", padding: "0 8px" }}>
              <DatePicker
                views={["year", "month"]}
                format="MMM yyyy"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    style: { fontSize: "13px", padding: "2px", width: "100%", maxWidth: "150px" },
                    InputProps: {
                      style: { height: "30px", fontSize: "13px", color: colors.chipText, backgroundColor: colors.chipBg, border: `1px solid ${colors.borderColor}` },
                    },
                    InputLabelProps: {
                      style: { fontSize: "13px", color: colors.textAndAccent },
                    },
                  },
                }}
              />
            </Col>
            <Col xs={3} className="d-flex justify-content-end align-items-center">
              <Button
                style={{
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: "4px",
                  fontSize: "12px",
                  padding: "4px 8px",
                }}
                size="sm"
                onClick={handleOpenModal}
              >
                Regularization
              </Button>
            </Col>
          </Row>
        </LocalizationProvider>
        {loading && <Spinner animation="border" size="sm" style={{ margin: "auto", marginTop: 20, color: colors.textAndAccent }} />}
        {error && (
          <Alert
            variant="danger"
            style={{
              fontSize: 12,
              padding: "5px 10px",
              marginBottom: 10,
              backgroundColor: "#E74C3C",
              color: colors.textAndAccent,
              border: `1px solid ${colors.borderColor}`,
            }}
          >
            {error}
          </Alert>
        )}
        {!loading && !error && <div style={{ flexGrow: 1 }}>{renderMonthlyCalendar()}</div>}

        <Modal show={showModal} onHide={handleCloseModal} size="sm" centered dialogClassName="modal-centered">
          <Modal.Header closeButton style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.borderColor}` }}>
            <Modal.Title style={{ fontSize: 14, color: colors.textAndAccent }}>Request Adjustment</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 10, backgroundColor: colors.cardBg }}>
            {renderModalCalendar()}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontSize: 12, color: colors.textAndAccent }}>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason"
                style={{ fontSize: 12, padding: "6px", color: colors.chipText, backgroundColor: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
              />
            </Form.Group>
            {requestError && (
              <Alert
                variant="danger"
                style={{
                  fontSize: 12,
                  marginTop: 8,
                  padding: "6px 10px",
                  backgroundColor: "#E74C3C",
                  color: colors.textAndAccent,
                  border: `1px solid ${colors.borderColor}`,
                }}
              >
                {requestError}
              </Alert>
            )}
            {requestSuccess && (
              <Alert
                variant="success"
                style={{
                  fontSize: 12,
                  marginTop: 8,
                  padding: "6px 10px",
                  backgroundColor: "#d4edda",
                  color: colors.textAndAccent,
                  border: `1px solid ${colors.borderColor}`,
                }}
              >
                {requestSuccess}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.cardBg, borderTop: `1px solid ${colors.borderColor}` }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseModal}
              disabled={requestLoading}
              style={{
                backgroundColor: colors.chipBg,
                color: colors.chipText,
                border: `1px solid ${colors.chipBorder}`,
                borderRadius: "4px",
                fontSize: "12px",
                padding: "4px 8px",
              }}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestSubmit}
              disabled={requestLoading}
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: "4px",
                fontSize: "12px",
                padding: "4px 8px",
              }}
            >
              {requestLoading ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" style={{ color: colors.buttonText }} />
              ) : (
                "Submit"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>
    </ErrorBoundary>
  );
};

export default EmployeeAttendanceCalendar;