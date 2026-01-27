import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Box,
  Avatar,
  Stack,
  Tooltip,
} from "@mui/material";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#4CAF50", "#FF9800", "#F44336", "#2196F3", "#9C27B0"];

const EmployeeCheckin = () => {
  const [earlyCheckins, setEarlyCheckins] = useState([]);
  const [lateCheckins, setLateCheckins] = useState([]);
  const [notYetPunchedIn, setNotYetPunchedIn] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState(null);

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

  const toTitleCase = (str) => {
    if (!str || typeof str !== "string") {
      console.warn("Invalid string for title case:", str);
      return "";
    }
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const resolveUserRole = () => {
      const rawUserRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
      const role = rawUserRole ? rawUserRole.trim().toLowerCase() : null;
      if (role) {
        setUserRole(role);
        setRoleLoading(false);
      } else {
        const timeout = setTimeout(() => {
          setRoleError("User role not found. Please log in again.");
          setRoleLoading(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    };

    resolveUserRole();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const empId = sessionStorage.getItem("empId");
      const token = empId ? localStorage.getItem(`token_${empId}`) : null;

      if (!token) {
        setSnackbar({
          open: true,
          message: "Unauthorized. Token not found.",
          severity: "error",
        });
        return;
      }

      const response = await axios.get(`${API_URL}/employee_first_punchin`, {
        headers: {
          Authorization: token,
        },
      });

      console.log("Full API Response:", JSON.stringify(response.data, null, 2));
      console.log("Data Array Length:", response.data.data?.length);
      response.data.data.forEach((record, idx) => {
        console.log(`Record ${idx}:`, JSON.stringify(record, null, 2));
      });

      if (response.status === 200) {
        const data = response.data.data || [];
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from API");
        }

        const today = new Date().toISOString().split("T")[0];
        const earlyThreshold = new Date(`${today}T09:00:00+05:30`).getTime();

        const early = data.filter(
          (p) =>
            p.first_punchin &&
            new Date(p.first_punchin).getTime() <= earlyThreshold
        );

        const late = data.filter(
          (p) =>
            p.first_punchin &&
            new Date(p.first_punchin).getTime() > earlyThreshold
        );

        const transformedEarly = early.map((record, idx) => {
          let firstName = "";
          let lastName = "";
          if (record.first_name && record.last_name) {
            firstName = toTitleCase(record.first_name);
            lastName = toTitleCase(record.last_name);
          } else if (record.name) {
            const [fName, lName] = toTitleCase(record.name).split(" ");
            firstName = fName || "";
            lastName = lName || "";
          } else if (record.employee_name) {
            const [fName, lName] = toTitleCase(record.employee_name).split(" ");
            firstName = fName || "";
            lastName = lName || "";
          }
          console.log(
            `Early - Raw first_name: ${record.first_name}, Raw last_name: ${record.last_name}, Raw name: ${record.name}, Raw employee_name: ${record.employee_name}, Transformed: ${firstName} ${lastName}`
          );
          const name =
            firstName && lastName
              ? `${firstName} ${lastName}`
              : `Employee ${record.employee_id || "Unknown"}`;
          return {
            ...record,
            name,
            initials:
              firstName && lastName
                ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                : `E${record.employee_id || "UNK"}`,
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };
        });
        setEarlyCheckins(transformedEarly);
        console.log("Updated earlyCheckins:", transformedEarly);

        const transformedLate = late.map((record, idx) => {
          let firstName = "";
          let lastName = "";
          if (record.first_name && record.last_name) {
            firstName = toTitleCase(record.first_name);
            lastName = toTitleCase(record.last_name);
          } else if (record.name) {
            const [fName, lName] = toTitleCase(record.name).split(" ");
            firstName = fName || "";
            lastName = lName || "";
          } else if (record.employee_name) {
            const [fName, lName] = toTitleCase(record.employee_name).split(" ");
            firstName = fName || "";
            lastName = lName || "";
          }
          console.log(
            `Late - Raw first_name: ${record.first_name}, Raw last_name: ${record.last_name}, Raw name: ${record.name}, Raw employee_name: ${record.employee_name}, Transformed: ${firstName} ${lastName}`
          );
          const name =
            firstName && lastName
              ? `${firstName} ${lastName}`
              : `Employee ${record.employee_id || "Unknown"}`;
          return {
            ...record,
            name,
            initials:
              firstName && lastName
                ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                : `E${record.employee_id || "UNK"}`,
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };
        });
        setLateCheckins(transformedLate);
        console.log("Updated lateCheckins:", transformedLate);

        const notPunchedResponse = await axios.get(`${API_URL}/employee-status/${today}`, {
          headers: {
            Authorization: token,
          },
        });

        if (notPunchedResponse.status === 200) {
          const notPunchedData = notPunchedResponse.data || [];
          if (!Array.isArray(notPunchedData)) {
            throw new Error("Invalid data format received from employee-status API");
          }

          const transformedNotPunched = notPunchedData.map((record, idx) => {
            const name = toTitleCase(record.name);
            const [firstName, lastName] = name.split(" ");
            console.log(
              `Not Punched - Raw name: ${record.name}, Status: ${record.status}, Transformed: ${name}`
            );
            return {
              ...record,
              name,
              initials:
                firstName && lastName
                  ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                  : `E${record.emp_id || "UNK"}`,
              color: AVATAR_COLORS[(idx + early.length + late.length) % AVATAR_COLORS.length],
            };
          });
          setNotYetPunchedIn(transformedNotPunched);
          console.log("Updated notYetPunchedIn:", transformedNotPunched);
        } else {
          throw new Error(notPunchedResponse.data.message || "Failed to fetch not punched in data");
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch punch-ins");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Server error while fetching data";
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
      console.error("Error fetching data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (roleLoading || roleError) return;

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [roleLoading, roleError]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderCheckinList = (checkins) =>
    checkins.map((emp) => {
      const displayText = emp.first_punchin
        ? new Date(emp.first_punchin).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : emp.status || "N/A";
      const tooltipText = (
        <>
          Employee ID: {emp.employee_id || emp.emp_id || "N/A"}
          <br />
          {emp.first_punchin ? "Punch-in Time" : "Status"}: {displayText}
        </>
      );

      return (
        <Box
          key={emp.employee_id || emp.emp_id}
          sx={{
            minWidth: 100,
            maxWidth: 100,
            borderRadius: 1,
            textAlign: "center",
            m: 0,
            p: 0,
          }}
        >
          <Stack spacing={1} alignItems="center">
            <Tooltip title={tooltipText} arrow>
              <Avatar
                sx={{
                  bgcolor: emp.color,
                  color: colors.textAndAccent,
                  border: `2px solid ${colors.chipBorder}`,
                }}
              >
                {emp.initials}
              </Avatar>
            </Tooltip>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                wordBreak: "break-word",
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: colors.chipText,
              }}
            >
              {emp.name}
            </Typography>
          </Stack>
        </Box>
      );
    });

  if (roleLoading) {
    return (
      <Container
        sx={{
          p: 2,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "430px",
          height: "150px",
          backgroundColor: "#F5E8D3",
          border: "1px solid rgba(44,62,80,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: "12px", color: "#34495E" }}
        >
          Loading user role...
        </Typography>
      </Container>
    );
  }

  if (roleError) {
    return (
      <Container
        sx={{
          p: 2,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "430px",
          height: "200px",
          backgroundColor: "#F5E8D3",
          border: "1px solid rgba(44,62,80,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Alert
          severity="error"
          sx={{
            width: "100%",
            maxWidth: 300,
            fontSize: "12px",
            backgroundColor: "#e74c3c",
            color: "#ffffff",
            "& .MuiAlert-icon": {
              color: "#ffffff",
            },
          }}
        >
          {roleError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      sx={{
        p: 2,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        width: "430px",
        height: "270px",
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.borderColor}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: colors.textAndAccent, marginBottom: 1 }}
        >
          Today's Check-Ins
        </Typography>
        {refreshing && (
          <Typography
            component="span"
            sx={{
              fontSize: "1.4rem",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
              color: colors.textAndAccent,
            }}
          >
            ⏳
          </Typography>
        )}
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="check-in tabs"
        sx={{
          mb: 1,
          borderBottom: `1px solid ${colors.borderColor}`,
          "& .MuiTabs-indicator": {
            backgroundColor: colors.selectedDateBg,
          },
          backgroundColor: "transparent",
          minHeight: "36px",
          pb: "5px",
        }}
      >
        <Tab
          icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
          label="Early Check-ins"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: tabValue === 0 ? colors.textAndAccent : `rgba(${colors.textAndAccent === "#ffffff" ? "255,255,255" : "52,73,94"}, 0.7)`,
            "&:hover": { color: colors.hoverButtonBg },
            "&.Mui-selected": { color: colors.textAndAccent },
            minHeight: "36px",
            padding: "6px 12px",
            fontSize: "0.85rem",
          }}
        />
        <Tab
          icon={<HourglassEmptyIcon sx={{ fontSize: 18 }} />}
          label="Late Check-ins"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: tabValue === 1 ? colors.textAndAccent : `rgba(${colors.textAndAccent === "#ffffff" ? "255,255,255" : "52,73,94"}, 0.7)`,
            "&:hover": { color: colors.hoverButtonBg },
            "&.Mui-selected": { color: colors.textAndAccent },
            minHeight: "36px",
            padding: "6px 12px",
            fontSize: "0.85rem",
          }}
        />
        <Tab
          icon={<PersonOffIcon sx={{ fontSize: 18 }} />}
          label="Not Yet Punched In"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: tabValue === 2 ? colors.textAndAccent : `rgba(${colors.textAndAccent === "#ffffff" ? "255,255,255" : "52,73,94"}, 0.7)`,
            "&:hover": { color: colors.hoverButtonBg },
            "&.Mui-selected": { color: colors.textAndAccent },
            minHeight: "36px",
            padding: "6px 5px",
            fontSize: "0.85rem",
          }}
        />
      </Tabs>

      <Box
        sx={{
          mt: 1,
          flex: 1,
          overflowY: "scroll", // Force vertical scrollbar
          overflowX: "hidden", // Prevent horizontal scrollbar here
          scrollbarWidth: "auto", // For Firefox
          "&::-webkit-scrollbar": {
            width: "8px", // Vertical scrollbar width
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: colors.chipBorder,
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.selectedDateBg,
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: colors.hoverButtonBg,
            },
          },
        }}
      >
        {tabValue === 0 && (
          <Box
            sx={{
              borderRadius: 2,
              p: 2,
              backgroundColor: colors.chipBg,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflowX: "scroll", // Force horizontal scrollbar
              overflowY: "hidden", // Prevent vertical scrollbar here
              whiteSpace: "nowrap", // Ensure horizontal layout
              scrollbarWidth: "auto", // For Firefox
              border: `1px solid ${colors.chipBorder}`,
              "&::-webkit-scrollbar": {
                height: "8px", // Horizontal scrollbar height
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: colors.chipBorder,
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: colors.selectedDateBg,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: colors.hoverButtonBg,
                },
              },
            }}
          >
            {earlyCheckins.length === 0 ? (
              <Typography
                textAlign="center"
                py={2}
                sx={{ color: colors.chipText, whiteSpace: "normal" }}
              >
                No early check-ins today.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                {renderCheckinList(earlyCheckins)}
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box
            sx={{
              borderRadius: 2,
              p: 2,
              backgroundColor: colors.chipBg,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflowX: "scroll", // Force horizontal scrollbar
              overflowY: "hidden", // Prevent vertical scrollbar here
              whiteSpace: "nowrap", // Ensure horizontal layout
              scrollbarWidth: "auto", // For Firefox
              border: `1px solid ${colors.chipBorder}`,
              "&::-webkit-scrollbar": {
                height: "8px", // Horizontal scrollbar height
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: colors.chipBorder,
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: colors.selectedDateBg,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: colors.hoverButtonBg,
                },
              },
            }}
          >
            {lateCheckins.length === 0 ? (
              <Typography
                textAlign="center"
                py={2}
                sx={{ color: colors.chipText, whiteSpace: "normal" }}
              >
                No late check-ins today.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                {renderCheckinList(lateCheckins)}
              </Box>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box
            sx={{
              borderRadius: 2,
              p: 2,
              backgroundColor: colors.chipBg,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflowX: "scroll", // Force horizontal scrollbar
              overflowY: "hidden", // Prevent vertical scrollbar here
              whiteSpace: "nowrap", // Ensure horizontal layout
              scrollbarWidth: "auto", // For Firefox
              border: `1px solid ${colors.chipBorder}`,
              "&::-webkit-scrollbar": {
                height: "8px", // Horizontal scrollbar height
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "white",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: colors.selectedDateBg,
                border: `2px solid ${colors.chipBorder}`,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: colors.hoverButtonBg,
                },
              },
            }}
          >
            {notYetPunchedIn.length === 0 ? (
              <Typography
                textAlign="center"
                py={2}
                sx={{ color: colors.chipText, whiteSpace: "normal" }}
              >
                All employees have punched in today.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                {renderCheckinList(notYetPunchedIn)}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor:
              snackbar.severity === "error"
                ? "#e74c3c"
                : snackbar.severity === "info"
                ? colors.buttonBg
                : "#2ecc71",
            color: colors.buttonText,
          },
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            backgroundColor:
              snackbar.severity === "error"
                ? "#e74c3c"
                : snackbar.severity === "info"
                ? colors.buttonBg
                : "#2ecc71",
            color: colors.buttonText,
            "& .MuiAlert-icon": {
              color: colors.buttonText,
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeCheckin;