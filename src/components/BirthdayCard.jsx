import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Stack,
  Skeleton,
  Alert,
} from "@mui/material";
import { keyframes } from "@mui/system";
import CakeIcon from "@mui/icons-material/Cake";
import WorkIcon from "@mui/icons-material/Work";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const nameFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const BirthdayCard = ({
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
}) => {
  const [tab, setTab] = useState(0);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null); // Initially null to indicate role not resolved
  const [roleLoading, setRoleLoading] = useState(true); // Track role resolution
  const today = new Date();
  const formattedToday = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  // Define colors based on userRole
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

  useEffect(() => {
    const resolveUserRole = () => {
      const role = sessionStorage.getItem("userRole")?.trim().toLowerCase();
      if (role) {
        setUserRole(role);
        setRoleLoading(false);
      } else {
        // Wait for a short period to allow userRole to be set
        const timeout = setTimeout(() => {
          setUserRole("employee"); // Fallback to default role
          setRoleLoading(false);
        }, 1000); // 1-second timeout
        return () => clearTimeout(timeout);
      }
    };

    resolveUserRole();
  }, []);

  useEffect(() => {
    if (roleLoading) return; // Skip data fetching until role is resolved

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const empId = sessionStorage.getItem("empId");
        const token = localStorage.getItem(`token_${empId}`);
        const headers = token ? { Authorization: token } : {};

        const [birthdayResponse, anniversaryResponse] = await Promise.all([
          axios.get(`${API_URL}/todays_birthdays`, { headers }),
          axios.get(`${API_URL}/todays_anniversaries`, { headers }),
        ]);

        const birthdayData = birthdayResponse.data.birthdays || [];
        setTodayBirthdays(
          birthdayData.map((name) => ({
            name,
          }))
        );

        const anniversaryData = anniversaryResponse.data.anniversaries || [];
        setTodayAnniversaries(
          anniversaryData.map((name) => ({
            name,
          }))
        );
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Failed to fetch events from server";
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen, roleLoading]);

  const handleTabChange = (_, newValue) => setTab(newValue);

  if (roleLoading) {
    return (
      <Card
        sx={{
          width: 450,
          height: 280,
          borderRadius: 3,
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
          background: "#F5E8D3", // Default background while loading
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          animation: `${slideIn} 0.5s ease-out`,
          "&:hover": {
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
          },
          overflow: "hidden",
          position: "relative",
        }}
      >
        <CardContent sx={{ p: 2.5, height: "100%" }}>
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ mb: 1 }}
            />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <Typography
                variant="caption"
                color="#34495E"
                textAlign="center"
                sx={{ fontSize: "0.75rem", mt: 1, fontStyle: "italic" }}
              >
                Loading user role...
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        width: 450,
        height: 280,
        borderRadius: 3,
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
        background: colors.cardBg,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        animation: `${slideIn} 0.5s ease-out`,
        "&:hover": {
          boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
        },
        overflow: "hidden",
        position: "relative",
      }}
    >
      <CardContent
        sx={{ p: 2.5, position: "relative", zIndex: 1, height: "100%" }}
      >
        {loading ? (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ mb: 1 }}
            />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <Stack direction="column" spacing={1}>
                {[...Array(5)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant="rectangular"
                    width="100%"
                    height={40}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              mb: 2,
              py: 1,
              borderRadius: 2,
              color: colors.textAndAccent,
              bgcolor: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            {error}
          </Alert>
        ) : (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <Typography
              variant="h6"
              color={colors.textAndAccent}
              gutterBottom
              sx={{ fontWeight: 600, fontSize: "1.1rem" }}
            >
              Today's Events
            </Typography>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                bgcolor: colors.chipBg,
                borderRadius: 2,
                mb: 1.5,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "0.85rem",
                  minHeight: 40,
                  py: 1,
                  color: colors.chipText,
                  transition: "color 0.3s ease, transform 0.3s ease",
                  "&:hover": {
                    color: colors.textAndAccent,
                    transform: "scale(1.05)",
                  },
                },
                "& .Mui-selected": {
                  color: colors.textAndAccent,
                  fontWeight: 600,
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  backgroundColor: colors.buttonBg,
                },
              }}
            >
              <Tab
                icon={
                  <CakeIcon
                    sx={{
                      fontSize: 18,
                      transition: "transform 0.3s ease",
                      color: colors.chipText,
                      "&:hover": { transform: "rotate(15deg)" },
                    }}
                  />
                }
                label="Birthdays"
                sx={{ minWidth: 0 }}
              />
              <Tab
                icon={
                  <WorkIcon
                    sx={{
                      fontSize: 18,
                      transition: "transform 0.3s ease",
                      color: colors.chipText,
                      "&:hover": { transform: "rotate(15deg)" },
                    }}
                  />
                }
                label="Anniversaries"
                sx={{ minWidth: 0 }}
              />
            </Tabs>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                pr: 1,
                scrollbarWidth: "thin",
                scrollbarColor: `${colors.borderColor} transparent`,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: colors.borderColor,
                  borderRadius: "6px",
                },
              }}
            >
              {tab === 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      mb: 1,
                      color: colors.textAndAccent,
                    }}
                  >
                    <strong>Best Wishes!</strong>
                  </Typography>
                  {todayBirthdays.length > 0 ? (
                    <Stack direction="column" spacing={1}>
                      {todayBirthdays.map((person, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            animation: `${nameFadeIn} 0.4s ease-out ${
                              idx * 0.1
                            }s both`,
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "scale(1.02)" },
                            bgcolor: colors.chipBg,
                            borderRadius: 1,
                            p: 1.5,
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            border: `1px solid ${colors.chipBorder}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.9rem",
                              color: colors.chipText,
                              fontWeight: 500,
                            }}
                          >
                            Happy Birthday, {person.name}!
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="caption"
                      color={colors.textAndAccent}
                      textAlign="center"
                      sx={{ fontSize: "0.75rem", mt: 1, fontStyle: "italic" }}
                    >
                      No Birthdays Today
                    </Typography>
                  )}
                </Box>
              )}
              {tab === 1 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      mb: 0.5,
                      color: colors.textAndAccent,
                    }}
                  >
                    <strong>Cheers!</strong>
                  </Typography>
                  {todayAnniversaries.length > 0 ? (
                    <Stack direction="column" spacing={1}>
                      {todayAnniversaries.map((person, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            animation: `${nameFadeIn} 0.4s ease-out ${
                              idx * 0.1
                            }s both`,
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "scale(1.02)" },
                            bgcolor: colors.chipBg,
                            borderRadius: 1,
                            p: 1.5,
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            border: `1px solid ${colors.chipBorder}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.9rem",
                              color: colors.chipText,
                              fontWeight: 500,
                            }}
                          >
                            Congrats, {person.name} on your work anniversary!
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="caption"
                      color={colors.textAndAccent}
                      textAlign="center"
                      sx={{ fontSize: "0.75rem", mt: 1, fontStyle: "italic" }}
                    >
                      No Work Anniversaries Today
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdayCard;
