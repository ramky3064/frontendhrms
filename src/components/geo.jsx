import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import md5 from "md5";
import { Snackbar, Alert, Box, Chip } from "@mui/material";

// --- Helper Functions ---
const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)hrs\s+(\d+)min\s+(\d+)sec/);
  if (!match) {
    console.warn("Invalid duration format:", durationStr);
    return 0;
  }
  const [_, hours, minutes, seconds] = match;
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
};

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

const formatPunchInTime = (punchInTime) => {
  if (!punchInTime) return "N/A";
  const date = new Date(punchInTime);
  if (isNaN(date.getTime())) return "N/A";
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// --- Main Component ---
const PunchSystem = () => {
  const [token, setToken] = useState(null);
  const [empId, setEmpId] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workMode, setWorkMode] = useState("");
  const [firstPunchInTime, setFirstPunchInTime] = useState(null);
  const [isWorkModeLoading, setIsWorkModeLoading] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
  const rawUserRole = sessionStorage.getItem("userRole");
  const userRole = rawUserRole ? rawUserRole.trim().toLowerCase() : "employee";

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
    };

  // --- Update current time every second ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const formattedTime = `${displayHour}:${minutes}:${seconds} ${ampm}`;
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // --- Fetch First Punch-In Time ---
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

  // --- Refresh First Punch-In Time ---
  const refreshFirstPunchInTime = async () => {
    if (empId && token) {
      localStorage.removeItem(`firstPunchInTime_${empId}`); // Clear cache
      await fetchFirstPunchInTime(empId, token);
    }
  };

  // --- Auto-refresh first punch-in time every 5 minutes ---
  useEffect(() => {
    if (empId && token) {
      const interval = setInterval(() => {
        refreshFirstPunchInTime();
      }, 300000);
      return () => clearInterval(interval);
    }
  }, [empId, token]);

  // --- Initialize token, empId, timer, punchInTime, firstPunchInTime ---
  useEffect(() => {
    const initialize = async () => {
      const storedEmpId = sessionStorage.getItem("empId");
      let selectedToken;

      // Daily reset logic
      if (storedEmpId) {
        const storedSessionDate = localStorage.getItem(`sessionDate_${storedEmpId}`);
        const today = new Date().toISOString().split("T")[0];
        if (storedSessionDate && storedSessionDate !== today) {
          localStorage.removeItem(`timer_${storedEmpId}`);
          localStorage.removeItem(`punchInTime_${storedEmpId}`);
          localStorage.removeItem(`firstPunchInTime_${storedEmpId}`);
          localStorage.setItem(`sessionDate_${storedEmpId}`, today);
        } else if (!storedSessionDate) {
          localStorage.setItem(`sessionDate_${storedEmpId}`, today);
        }
      }

      // Token and empId setup
      if (storedEmpId) {
        selectedToken = localStorage.getItem(`token_${storedEmpId}`);
        if (selectedToken) {
          setEmpId(storedEmpId);
          setToken(selectedToken);
          await refreshFirstPunchInTime();

          // Timer state
          const storedTimer = localStorage.getItem(`timer_${storedEmpId}`);
          const storedPunchInTime = localStorage.getItem(`punchInTime_${storedEmpId}`);
          const storedIsCheckedIn = localStorage.getItem(`isCheckedIn_${storedEmpId}`);
          const storedFirstPunchInTime = localStorage.getItem(`firstPunchInTime_${storedEmpId}`);

          if (storedIsCheckedIn === "true" && storedFirstPunchInTime) {
            const firstPunchIn = new Date(storedFirstPunchInTime);
            if (!isNaN(firstPunchIn.getTime())) {
              const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchIn) / 1000));
              setTimer(elapsedSeconds);
              setIsCheckedIn(true);
              setIsTimerRunning(true);
              localStorage.setItem(`timer_${storedEmpId}`, elapsedSeconds);
            } else if (storedTimer && storedPunchInTime) {
              const elapsedSeconds = Math.max(0, Math.floor((new Date() - new Date(storedPunchInTime)) / 1000));
              setTimer(parseInt(storedTimer) + elapsedSeconds);
              setIsCheckedIn(true);
              setIsTimerRunning(true);
            } else if (storedTimer) {
              setTimer(parseInt(storedTimer));
            }
          } else if (storedTimer) {
            setTimer(parseInt(storedTimer));
          }
        }
      }

      if (!selectedToken) {
        const fallbackToken = localStorage.getItem("token");
        if (fallbackToken) {
          try {
            const decoded = jwtDecode(fallbackToken);
            const userEmpId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
            selectedToken = localStorage.getItem(`token_${userEmpId}`) || fallbackToken;
            setEmpId(userEmpId);
            setToken(selectedToken);
            sessionStorage.setItem("empId", userEmpId);
            await refreshFirstPunchInTime();

            const storedTimer = localStorage.getItem(`timer_${userEmpId}`);
            const storedPunchInTime = localStorage.getItem(`punchInTime_${userEmpId}`);
            const storedIsCheckedIn = localStorage.getItem(`isCheckedIn_${userEmpId}`);
            const storedFirstPunchInTime = localStorage.getItem(`firstPunchInTime_${userEmpId}`);

            if (storedIsCheckedIn === "true" && storedFirstPunchInTime) {
              const firstPunchIn = new Date(storedFirstPunchInTime);
              if (!isNaN(firstPunchIn.getTime())) {
                const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchIn) / 1000));
                setTimer(elapsedSeconds);
                setIsCheckedIn(true);
                setIsTimerRunning(true);
                localStorage.setItem(`timer_${userEmpId}`, elapsedSeconds);
              } else if (storedTimer && storedPunchInTime) {
                const elapsedSeconds = Math.max(0, Math.floor((new Date() - new Date(storedPunchInTime)) / 1000));
                setTimer(parseInt(storedTimer) + elapsedSeconds);
                setIsCheckedIn(true);
                setIsTimerRunning(true);
              } else if (storedTimer) {
                setTimer(parseInt(storedTimer));
              }
            } else if (storedTimer) {
              setTimer(parseInt(storedTimer));
            }
          } catch (error) {
            const fallbackId = md5(fallbackToken);
            setEmpId(fallbackId);
            setToken(fallbackToken);
            sessionStorage.setItem("empId", fallbackId);
            await refreshFirstPunchInTime();

            setSnackbarMessage("Invalid token format. Please re-login if issues persist.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);

            const storedTimer = localStorage.getItem(`timer_${fallbackId}`);
            const storedPunchInTime = localStorage.getItem(`punchInTime_${fallbackId}`);
            const storedIsCheckedIn = localStorage.getItem(`isCheckedIn_${fallbackId}`);
            const storedFirstPunchInTime = localStorage.getItem(`firstPunchInTime_${fallbackId}`);

            if (storedIsCheckedIn === "true" && storedFirstPunchInTime) {
              const firstPunchIn = new Date(storedFirstPunchInTime);
              if (!isNaN(firstPunchIn.getTime())) {
                const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchIn) / 1000));
                setTimer(elapsedSeconds);
                setIsCheckedIn(true);
                setIsTimerRunning(true);
                localStorage.setItem(`timer_${fallbackId}`, elapsedSeconds);
              } else if (storedTimer && storedPunchInTime) {
                const elapsedSeconds = Math.max(0, Math.floor((new Date() - new Date(storedPunchInTime)) / 1000));
                setTimer(parseInt(storedTimer) + elapsedSeconds);
                setIsCheckedIn(true);
                setIsTimerRunning(true);
              } else if (storedTimer) {
                setTimer(parseInt(storedTimer));
              }
            } else if (storedTimer) {
              setTimer(parseInt(storedTimer));
            }
          }
        }
      }
    };

    initialize();
  }, []);

  // --- Fetch Work Mode ---
  const fetchWorkMode = async (retries = 3) => {
    if (!token || !empId) return false;
    for (let i = 0; i < retries; i++) {
      try {
        setIsWorkModeLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await axios.get(`${API_URL}/work_mode/${empId}`, {
          headers: { Authorization: token },
          withCredentials: true,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const { work_mode } = response.data;
        const workModeMap = {
          office: "Work From Office",
          home: "Work From Home",
          hybrid: "Hybrid",
        };
        const normalizedWorkMode = typeof work_mode === "string" ? work_mode.toLowerCase() : "";
        const newWorkMode = workModeMap[normalizedWorkMode] || "Work From Office";
        setWorkMode(newWorkMode);
        localStorage.setItem(`workMode_${empId}`, newWorkMode);
        return true;
      } catch (error) {
        if (i === retries - 1) {
          setWorkMode("N/A");
          localStorage.setItem(`workMode_${empId}`, "N/A");
          setSnackbarMessage("Failed to fetch work mode after retries.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      } finally {
        setIsWorkModeLoading(false);
      }
    }
    return false;
  };

  // --- Fetch Punch Status ---
  const fetchPunchStatus = async () => {
    if (!token || !empId) return;
    try {
      const response = await axios.get(`${API_URL}/punch-status`, {
        headers: { Authorization: token },
      });

      const { status, punch_in_time, work_duration } = response.data;
      const isCurrentlyCheckedIn = status === "punched_in";
      setIsCheckedIn(isCurrentlyCheckedIn);
      setIsTimerRunning(isCurrentlyCheckedIn);
      localStorage.setItem(`isCheckedIn_${empId}`, isCurrentlyCheckedIn);

      // Timer logic
      const durationSeconds = parseDuration(work_duration || "0hrs 0min 0sec");
      const storedFirstPunchInTime = localStorage.getItem(`firstPunchInTime_${empId}`);

      if (isCurrentlyCheckedIn && storedFirstPunchInTime) {
        const firstPunchIn = new Date(storedFirstPunchInTime);
        if (!isNaN(firstPunchIn.getTime())) {
          const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchIn) / 1000));
          const newTimer = Math.max(durationSeconds, elapsedSeconds);
          setTimer(newTimer);
          localStorage.setItem(`timer_${empId}`, newTimer);
          localStorage.setItem(`punchInTime_${empId}`, punch_in_time || new Date().toISOString());
        } else {
          const storedTimer = parseInt(localStorage.getItem(`timer_${empId}`) || "0");
          const elapsedSeconds = punch_in_time
            ? Math.max(0, Math.floor((new Date() - new Date(punch_in_time)) / 1000))
            : 0;
          const newTimer = Math.max(storedTimer, durationSeconds + elapsedSeconds);
          setTimer(newTimer);
          localStorage.setItem(`timer_${empId}`, newTimer);
          if (punch_in_time) localStorage.setItem(`punchInTime_${empId}`, punch_in_time);
        }
      } else {
        const storedTimer = parseInt(localStorage.getItem(`timer_${empId}`) || "0");
        const newTimer = Math.max(storedTimer, durationSeconds);
        setTimer(newTimer);
        localStorage.setItem(`timer_${empId}`, newTimer);
        localStorage.removeItem(`punchInTime_${empId}`);
      }

      await fetchWorkMode();
      await refreshFirstPunchInTime();
    } catch (error) {
      setSnackbarMessage(
        error.response?.data?.message || "Failed to fetch punch status."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (token && empId) {
      fetchPunchStatus();
    }
  }, [token, empId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTimerRunning && firstPunchInTime) {
        const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchInTime) / 1000));
        setTimer(elapsedSeconds);
        if (empId) localStorage.setItem(`timer_${empId}`, elapsedSeconds);
      } else if (isTimerRunning) {
        setTimer((prev) => {
          const newTimer = prev + 1;
          if (empId) localStorage.setItem(`timer_${empId}`, newTimer);
          return newTimer;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, empId, firstPunchInTime]);

  useEffect(() => {
    if (!empId) return;
    const handleStorageChange = (e) => {
      if (e.key === `isCheckedIn_${empId}`) {
        const newValue = e.newValue === "true";
        setIsCheckedIn(newValue);
        setIsTimerRunning(newValue);
        if (!newValue) fetchPunchStatus();
      } else if (e.key === `timer_${empId}`) {
        setTimer(parseInt(e.newValue) || 0);
      } else if (e.key === `firstPunchInTime_${empId}`) {
        const newFirstPunchIn = e.newValue ? new Date(e.newValue) : null;
        setFirstPunchInTime(newFirstPunchIn);
        if (newFirstPunchIn && isCheckedIn) {
          const elapsedSeconds = Math.max(0, Math.floor((new Date() - newFirstPunchIn) / 1000));
          setTimer(elapsedSeconds);
          localStorage.setItem(`timer_${empId}`, elapsedSeconds);
        }
      } else if (e.key === `punchInTime_${empId}`) {
        if (e.newValue && isCheckedIn && !firstPunchInTime) {
          const elapsedSeconds = Math.max(0, Math.floor((new Date() - new Date(e.newValue)) / 1000));
          const storedTimer = parseInt(localStorage.getItem(`timer_${empId}`) || "0");
          setTimer(storedTimer + elapsedSeconds);
        }
      } else if (e.key === `workMode_${empId}`) {
        setWorkMode(e.newValue || "N/A");
        setIsWorkModeLoading(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [empId, isCheckedIn, firstPunchInTime]);

  useEffect(() => {
    if (empId) {
      localStorage.setItem(`isCheckedIn_${empId}`, isCheckedIn);
      if (firstPunchInTime) {
        localStorage.setItem(`firstPunchInTime_${empId}`, firstPunchInTime.toISOString());
      }
      localStorage.setItem(`workMode_${empId}`, workMode);
    }
  }, [isCheckedIn, empId, firstPunchInTime, workMode]);

  const handlePunch = async () => {
    if (!token || !empId) {
      setSnackbarMessage("Authentication token missing. Please log in again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const action = isCheckedIn ? "punchout" : "punchin";
          if (!isCheckedIn) {
            const statusResponse = await axios.get(`${API_URL}/punch-status`, {
              headers: { Authorization: token },
            });
            const { work_duration } = statusResponse.data;
            const durationSeconds = parseDuration(work_duration || "0hrs 0min 0sec");
            const storedTimer = parseInt(localStorage.getItem(`timer_${empId}`) || "0");
            setTimer(Math.max(storedTimer, durationSeconds));
            localStorage.setItem(`timer_${empId}`, Math.max(storedTimer, durationSeconds));
          }

          const response = await axios.post(
            `${API_URL}/punch`,
            new URLSearchParams({ action, latitude, longitude }),
            {
              headers: {
                Authorization: token,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          setSnackbarMessage(response.data.message);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);

          if (isCheckedIn) {
            setIsCheckedIn(false);
            setIsTimerRunning(false);
            localStorage.setItem(`isCheckedIn_${empId}`, false);
            localStorage.removeItem(`punchInTime_${empId}`);
            await fetchPunchStatus();
          } else {
            setIsCheckedIn(true);
            setIsTimerRunning(true);
            localStorage.setItem(`isCheckedIn_${empId}`, true);
            localStorage.setItem(`punchInTime_${empId}`, new Date().toISOString());
            await fetchWorkMode();
            await refreshFirstPunchInTime();
            if (firstPunchInTime) {
              const elapsedSeconds = Math.max(0, Math.floor((new Date() - firstPunchInTime) / 1000));
              setTimer(elapsedSeconds);
              localStorage.setItem(`timer_${empId}`, elapsedSeconds);
            }
          }
        } catch (error) {
          setSnackbarMessage(
            error.response?.data?.message ||
            "Network error during punch operation."
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      },
      (err) => {
        setSnackbarMessage("Failed to fetch location. Please enable location services.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    );
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // ---- RENDER -----
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.cardBg,
          padding: "20px",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          width: "300px",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "18px", color: colors.textAndAccent, fontWeight: "600" }}>
              {formattedTime}
            </div>
            <div style={{ fontSize: "12px", color: colors.textAndAccent }}>
              {formattedDate}
            </div>
          </div>
          <Box>
            <Chip
              label={isWorkModeLoading ? "Loading..." : workMode || "N/A"}
              clickable={false}
              sx={{
                bgcolor: colors.chipBg,
                color: colors.chipText,
                fontSize: "10px",
                height: "24px",
                border: `1px solid ${colors.chipBorder}`,
                pointerEvents: "none",
                opacity: 0.8,
              }}
            />
          </Box>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "150px",
            height: "150px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            marginBottom: "20px",
            boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "16px",
                color: colors.chipBorder,
                fontWeight: "500",
              }}
            >
              TOTAL HOURS
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: colors.chipBorder,
              }}
            >
              {formatTime(timer)}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "14px",
            color: colors.textAndAccent,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: isCheckedIn ? "green" : "red",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
            }}
          >
            <i className="fas fa-fingerprint"></i>
          </span>

          First Punch in at {formatPunchInTime(firstPunchInTime)}
        </div>

        <button
          style={{
            padding: "12px",
            width: "100%",
            fontSize: "16px",
            fontWeight: "600",
            color: colors.buttonText,
            backgroundColor: colors.buttonBg,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "background-color 0.3s ease",
          }}
          onClick={handlePunch}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.hoverButtonBg)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.buttonBg)}
        >
          {isCheckedIn ? "PUNCH OUT" : "PUNCH IN"}
        </button>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%", backgroundColor: colors.cardBg, color: colors.textAndAccent }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default PunchSystem;