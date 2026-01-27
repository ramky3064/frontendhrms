import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Snackbar, Alert } from "@mui/material";

const WorkingHoursChart = () => {
  const baseTimeLabels = [
    "08:30", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00"
  ];

  const extendedTimeLabels = [
    "19:00", "20:00", "21:00", "22:00", "23:00", "23:59"
  ];

  const [productiveSeconds, setProductiveSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastPunchStatus, setLastPunchStatus] = useState(null);
  const [error, setError] = useState(null);
  const [punchInOffset, setPunchInOffset] = useState(0);
  const [timeLabels, setTimeLabels] = useState(baseTimeLabels);
  const [firstPunchInTime, setFirstPunchInTime] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [hoverData, setHoverData] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "");
  const empId = sessionStorage.getItem("empId");
  const token = empId ? localStorage.getItem(`token_${empId}`) : null;
  const totalBarWidth = 1000;
  const totalDaySeconds = 55800; // 15.5 hours (08:30 to 23:59)

  const parseDuration = (durationStr) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/(\d+)hrs\s+(\d+)min\s+(\d+)sec/);
    if (!match) return 0;
    const [_, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getTimeLabelTimestamps = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return timeLabels.map((label) => {
      const [hours, minutes] = label.split(":").map(Number);
      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    });
  };

  const calculatePunchInOffset = (punchTime) => {
    const timestamps = getTimeLabelTimestamps();
    const start = timestamps[0]; // First timestamp (08:30)
    const end = timestamps[timestamps.length - 1]; // Last timestamp (18:00 or 23:59)
    const punchTimestamp = new Date(punchTime).getTime();
    if (isNaN(punchTimestamp)) return 0;
    const clamped = Math.max(start, Math.min(punchTimestamp, end));
    const progress = (clamped - start) / (end - start);
    return progress * totalBarWidth;
  };

  const validateToken = () => {
    if (!token || !empId) {
      setError("Authentication token or employee ID missing. Please log in.");
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        setError("Token has expired. Please log in again.");
        return false;
      }
      return true;
    } catch (err) {
      setError("Invalid token format. Please log in again.");
      return false;
    }
  };

  const fetchFirstPunchInTime = async (empId, token) => {
    if (token && empId) {
      try {
        const response = await axios.get(`${API_URL}/employee_first_punchin`, {
          headers: { Authorization: token },
        });
        const records = response.data.data || [];
        const employeeRecord = records.find((record) => record.employee_id === empId);
        if (employeeRecord && employeeRecord.first_punchin) {
          const firstPunchIn = new Date(employeeRecord.first_punchin);
          if (!isNaN(firstPunchIn.getTime())) {
            setFirstPunchInTime(firstPunchIn);
            localStorage.setItem(`firstPunchInTime_${empId}`, firstPunchIn.toISOString());
            localStorage.setItem(`sessionDate_${empId}`, new Date().toISOString().split("T")[0]);
            return true;
          }
        }
        setFirstPunchInTime(null);
        localStorage.removeItem(`firstPunchInTime_${empId}`);
      } catch (error) {
        console.error("Failed to fetch first punch-in time:", error);
        setSnackbarMessage("Failed to fetch first punch-in time.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
    return false;
  };

  const calculateHours = (punchHistory, isCurrentlyCheckedIn) => {
    let productive = 0;
    let breakTime = 0;
    let overtime = 0;

    const today6PM = new Date();
    today6PM.setHours(18, 0, 0, 0);
    const overtimeStart = today6PM.getTime();
    const currentTime = new Date().getTime();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dayStart = todayStart.getTime();

    const sessions = [];

    let lastPunchOut = null;
    for (let i = 0; i < punchHistory.length; i++) {
      const session = punchHistory[i];
      if (session.punch_in_time) {
        const punchIn = new Date(session.punch_in_time).getTime();
        const punchOut = session.punch_out_time
          ? new Date(session.punch_out_time).getTime()
          : isCurrentlyCheckedIn && i === punchHistory.length - 1
            ? currentTime
            : punchIn;
        const sessionDuration = Math.max(0, Math.floor((punchOut - punchIn) / 1000));
        productive += sessionDuration;

        sessions.push({
          serial: session.serial,
          start_time: session.punch_in_time,
          end_time: session.punch_out_time,
          duration_seconds: sessionDuration,
          duration_formatted: formatTime(sessionDuration),
          status: "productive"
        });

        if (punchOut > overtimeStart) {
          overtime += Math.max(0, Math.floor((punchOut - Math.max(punchIn, overtimeStart)) / 1000));
        }

        if (lastPunchOut && punchIn > lastPunchOut) {
          const breakDuration = Math.floor((punchIn - lastPunchOut) / 1000);
          breakTime += breakDuration;
          sessions.push({
            serial: `break_${session.serial}`,
            start_time: new Date(lastPunchOut).toISOString(),
            end_time: session.punch_in_time,
            duration_seconds: breakDuration,
            duration_formatted: formatTime(breakDuration),
            status: "break"
          });
        }
        lastPunchOut = punchOut;
      }
    }

    // Add break session from last punch-out to current time if not checked in
    if (!isCurrentlyCheckedIn && lastPunchOut && lastPunchOut < currentTime) {
      const breakDuration = Math.floor((currentTime - lastPunchOut) / 1000);
      breakTime += breakDuration;
      sessions.push({
        serial: `break_${punchHistory.length + 1}`,
        start_time: new Date(lastPunchOut).toISOString(),
        end_time: new Date(currentTime).toISOString(),
        duration_seconds: breakDuration,
        duration_formatted: formatTime(breakDuration),
        status: "break"
      });
    }

    // Add initial break from day start to first punch-in
    if (punchHistory.length > 0 && firstPunchInTime) {
      const firstPunchIn = new Date(firstPunchInTime).getTime();
      if (firstPunchIn > dayStart) {
        const initialBreak = Math.floor((firstPunchIn - dayStart) / 1000);
        breakTime += initialBreak;
        sessions.unshift({
          serial: "break_initial",
          start_time: new Date(dayStart).toISOString(),
          end_time: firstPunchInTime.toISOString(),
          duration_seconds: initialBreak,
          duration_formatted: formatTime(initialBreak),
          status: "break"
        });
      }
    }

    if (overtime > 0) {
      setTimeLabels([...baseTimeLabels, ...extendedTimeLabels]);
    } else {
      setTimeLabels(baseTimeLabels);
    }

    localStorage.setItem(`punch_sessions_${empId}`, JSON.stringify(sessions));

    return { productive, breakTime, overtime };
  };

  const fetchPunchData = async () => {
    if (!validateToken()) return;

    try {
      const res = await axios.get(`${API_URL}/punch-status`, {
        headers: { Authorization: token },
        params: { employee_id: empId },
      });

      const { status, work_duration, punch_in_time } = res.data;
      const isIn = status === "punched_in";
      setIsCheckedIn(isIn);

      let punchHistory = JSON.parse(localStorage.getItem(`punch_history_${empId}`) || "[]");
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      punchHistory = punchHistory.filter((r) => new Date(r.punch_in_time).getTime() >= todayStart.getTime());

      if (isIn && lastPunchStatus !== "punched_in" && punch_in_time) {
        const serial = punchHistory.length > 0 ? punchHistory[punchHistory.length - 1].serial + 1 : 1;
        punchHistory.push({ serial, punch_in_time, punch_out_time: null });
      } else if (!isIn && lastPunchStatus === "punched_in") {
        const last = punchHistory[punchHistory.length - 1];
        if (last && !last.punch_out_time) {
          last.punch_out_time = new Date().toISOString();
        }
      }

      setLastPunchStatus(status);
      localStorage.setItem(`punch_history_${empId}`, JSON.stringify(punchHistory));

      let { productive, breakTime, overtime } = calculateHours(punchHistory, isIn);

      if (!punchHistory.length && isIn && punch_in_time) {
        const punchIn = new Date(punch_in_time).getTime();
        const now = Date.now();
        productive = Math.floor((now - punchIn) / 1000);
        const session = {
          serial: 1,
          start_time: punch_in_time,
          end_time: null,
          duration_seconds: productive,
          duration_formatted: formatTime(productive),
          status: "productive"
        };
        localStorage.setItem(`punch_sessions_${empId}`, JSON.stringify([session]));
      }

      setProductiveSeconds(productive);
      setBreakSeconds(breakTime);
      setOvertimeSeconds(overtime);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch punch data.";
      setError(message);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (validateToken()) {
      fetchFirstPunchInTime(empId, token).then((success) => {
        if (success && firstPunchInTime) {
          setPunchInOffset(calculatePunchInOffset(firstPunchInTime));
        }
      });
    }
  }, [empId, token, firstPunchInTime]);

  useEffect(() => {
    fetchPunchData();
    const interval = setInterval(fetchPunchData, 2000);
    return () => clearInterval(interval);
  }, [token, empId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const punchHistory = JSON.parse(localStorage.getItem(`punch_history_${empId}`) || "[]");
      const { productive, breakTime, overtime } = calculateHours(punchHistory, isCheckedIn);
      setProductiveSeconds(productive);
      setBreakSeconds(breakTime);
      setOvertimeSeconds(overtime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, empId]);

  const barSegments = [];
  const punchSessions = JSON.parse(localStorage.getItem(`punch_sessions_${empId}`) || "[]");
  punchSessions.forEach((session, idx) => {
    if (session.start_time) {
      const offset = calculatePunchInOffset(session.start_time);
      let duration = session.duration_seconds;
      let endTime = session.end_time;

      // Update duration for ongoing productive session
      if (session.status === "productive" && !session.end_time && isCheckedIn && idx === punchSessions.length - 1) {
        const startTime = new Date(session.start_time).getTime();
        const currentTime = new Date().getTime();
        duration = Math.floor((currentTime - startTime) / 1000);
        endTime = new Date(currentTime).toISOString();
      }

      const width = (duration / totalDaySeconds) * totalBarWidth;
      const type = session.status === "productive" ? "green" : "yellow";
      const tooltip = session.status === "productive" ? "Productive Time" : "Break Time";
      barSegments.push({
        type,
        width,
        offset,
        startTime: session.start_time,
        endTime,
        duration,
        status: tooltip
      });
    }
  });

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <style>{`
        .working-hours-container {
          background-color: white;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: sans-serif;
          margin-top: 16px;
        }
        .summary-section {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .summary-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 30%;
          margin-bottom: 12px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-bottom: 4px;
        }
        .dot.green { background-color: #22c55e; }
        .dot.yellow { background-color: #facc15; }
        .dot.blue { background-color: #3b82f6; }
        .summary-value {
          font-weight: bold;
          font-size: 1.125rem;
          color: #111827;
        }
        .graph-bar {
          display: flex;
          position: relative;
          height: 24px;
          width: 1000px;
          background-color: #f3f4f6;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .bar {
          height: 100%;
          border-radius: 6px;
          position: absolute;
        }
        .bar.green { background-color: #22c55e; }
        .bar.yellow { background-color: #facc15; }
        .timeline {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          width: 1000px;
        }
        .time-label {
          min-width: 40px;
          text-align: center;
        }
        .error-message {
          color: red;
          text-align: center;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="working-hours-container">
        {error && <div className="error-message">{error}</div>}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <div className="summary-section">
          <div className="summary-box">
            <div className="dot green" />
            <div>
              <div>Productive Hours</div>
              <div className="summary-value">{formatTime(productiveSeconds)}</div>
            </div>
          </div>
          <div className="summary-box">
            <div className="dot yellow" />
            <div>
              <div>Break Hours</div>
              <div className="summary-value">{formatTime(breakSeconds)}</div>
            </div>
          </div>
          <div className="summary-box">
            <div className="dot blue" />
            <div>
              <div>Overtime</div>
              <div className="summary-value">{formatTime(overtimeSeconds)}</div>
            </div>
          </div>
        </div>

        <div className="graph-bar">
          {barSegments.map((segment, idx) => (
            <div
              key={idx}
              className={`bar ${segment.type}`}
              style={{
                left: `${segment.offset}px`,
                width: `${segment.width}px`
              }}
              onMouseEnter={(e) =>
                setHoverData({
                  x: e.clientX,
                  y: e.clientY,
                  start: new Date(segment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  end: segment.endTime
                    ? new Date(segment.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Ongoing",
                  duration: formatTime(segment.duration),
                  status: segment.status
                })
              }
              onMouseLeave={() => setHoverData(null)}
            />
          ))}
          {hoverData && (
            <div
              style={{
                position: "fixed",
                top: hoverData.y + 10,
                left: hoverData.x + 10,
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                pointerEvents: "none",
                zIndex: 999
              }}
            >
              <div><strong>Status:</strong> {hoverData.status}</div>
              <div><strong>Start:</strong> {hoverData.start}</div>
              <div><strong>End:</strong> {hoverData.end}</div>
              <div><strong>Duration:</strong> {hoverData.duration}</div>
            </div>
          )}
        </div>

        <div className="timeline">
          {timeLabels.map((label, idx) => (
            <div key={idx} className="time-label">
              {label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default WorkingHoursChart;