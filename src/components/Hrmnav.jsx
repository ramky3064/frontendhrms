import React, { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Chat, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { useSpring, animated } from "@react-spring/web";

const AppNavbar = () => {
  const navigate = useNavigate();
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [decodedEmpId, setDecodedEmpId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const saved = localStorage.getItem("unreadCounts");
    return saved ? JSON.parse(saved) : {};
  });
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState([]);
  const bannerRef = useRef(null);
  const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

  // Retrieve user role from sessionStorage first, fall back to localStorage
  const rawUserRole =
    sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
  const userRole = rawUserRole ? rawUserRole.trim().toLowerCase() : "employee";

  // Choose logo based on user role
  const logoSrc = ["hr", "admin", "manager"].includes(userRole)
    ? "/blueLogo.png"
    : "/beigeLogo.png";

  // Log userRole and storage values for debugging
  useEffect(() => {
    console.log("userRole in AppNavbar:", userRole);
    console.log("sessionStorage userRole:", sessionStorage.getItem("userRole"));
    console.log("localStorage userRole:", localStorage.getItem("userRole"));
  }, [userRole]);

  // Define color palette based on user role
  const colors = ["hr", "admin", "manager"].includes(userRole)
    ? {
        navbarBg: "#2772a0",
        // textAndAccent: "#a0c3e8",
        textAndAccent: "white",
        skeletonBg: "rgba(160, 195, 232, 0.2)",
        menuBg: "#a0c3e8",
        menuText: "#2772a0",
      }
    : {
        navbarBg: "#34495E",
        textAndAccent: "#F7E7CE",
        skeletonBg: "rgba(247, 231, 206, 0.2)",
        menuBg: "#F5E8D3",
        menuText: "#34495E",
      };

  useEffect(() => {
    localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  useEffect(() => {
    const empId = sessionStorage.getItem("empId");
    if (!empId) {
      navigate("/login", { replace: true });
      return;
    }

    const tokenData = localStorage.getItem(`token_${empId}`);
    if (!tokenData) {
      navigate("/login", { replace: true });
      return;
    }

    setToken(tokenData);

    let decoded;
    try {
      decoded = jwtDecode(tokenData);
      const tokenEmpId = decoded.emp_id || decoded.sub || decoded.user_id;
      if (!tokenEmpId || tokenEmpId !== empId) {
        navigate("/login", { replace: true });
        return;
      }
      setDecodedEmpId(tokenEmpId);
    } catch (err) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/get_employee_photo/${empId}`,
          {
            headers: { Authorization: tokenData },
          }
        );
        const { first_name, last_name, photo_base64 } = response.data;
        setEmployeeName(`${first_name} ${last_name}`);
        setEmployeePhoto(
          photo_base64 ? `data:image/jpeg;base64,${photo_base64}` : null
        );
      } catch (error) {
        console.error("Error fetching employee data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem(`token_${empId}`);
          sessionStorage.removeItem("empId");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchUnreadCounts = async () => {
      try {
        const response = await axios.get(`${API_URL}/unread_counts`, {
          headers: { Authorization: tokenData },
          withCredentials: true,
        });
        const fetchedCounts = response.data.counts || {};
        setUnreadCounts(fetchedCounts);
        localStorage.setItem("unreadCounts", JSON.stringify(fetchedCounts));
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };

    const fetchEvents = async () => {
      try {
        const [birthdayResponse, anniversaryResponse] = await Promise.all([
          axios.get(`${API_URL}/todays_birthdays`, {
            headers: { Authorization: tokenData },
          }),
          axios.get(`${API_URL}/todays_anniversaries`, {
            headers: { Authorization: tokenData },
          }),
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
        console.error("Error fetching events:", error);
      }
    };

    fetchEmployeeData();
    fetchUnreadCounts();
    fetchEvents();

    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    const empId = sessionStorage.getItem("empId");
    localStorage.removeItem(`token_${empId}`);
    localStorage.removeItem("unreadCounts");
    localStorage.removeItem("empId");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("empId");
    navigate("/login", { replace: true });
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    if (action === "logout") {
      handleLogout();
    }
  };

  const handleAvatarClick = (event) => {
    event.stopPropagation();
    if (employeePhoto) {
      setBannerOpen(true);
    }
  };

  const handleClickOutside = (event) => {
    if (bannerRef.current && !bannerRef.current.contains(event.target)) {
      setBannerOpen(false);
    }
  };

  useEffect(() => {
    if (bannerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bannerOpen]);

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const open = Boolean(anchorEl);
  const id = open ? "profile-menu" : undefined;

  const bannerSpring = useSpring({
    opacity: bannerOpen ? 1 : 0,
    transform: bannerOpen ? "scale(1)" : "scale(0.8)",
    config: { tension: 220, friction: 16 },
  });

  // Check if the current employee's name is in today's birthdays or anniversaries
  const isBirthday = todayBirthdays.some(
    (person) => person.name === employeeName
  );
  const isAnniversary = todayAnniversaries.some(
    (person) => person.name === employeeName
  );

  // Determine which emoji to show
  const celebrationEmoji =
    isBirthday && isAnniversary
      ? "🎈🎉"
      : isBirthday
      ? "🎂"
      : isAnniversary
      ? "🏆"
      : "";

  return (
    <>
      <Navbar
        expand="lg"
        className="shadow-sm py-2 fixed-top"
        style={{
          backgroundColor: colors.navbarBg,
        }}
      >
        <Container fluid>
          <Navbar.Brand
            href="#home"
            className="fw-bold me-auto"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: colors.textAndAccent,
              fontFamily: "'Fugaz One', sans-serif",
            }}
          >
            <img
              src={logoSrc}
              alt="App Logo"
              style={{
                width: "50px",
                height: "40px",
                objectFit: "contain",
              }}
            />

            <span
              style={{
                // fontFamily: "Permanent Marker, cursive",
                fontFamily: "roboto, cursive",
                fontWeight: 600,
                color: colors.textAndAccent,
                fontSize: "30px",
              }}
            >
              Cofomo Tech
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto align-items-center gap-3">
              <Nav.Link
                onClick={() => navigate("/chat")}
                className="d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  position: "relative",
                  color: colors.textAndAccent,
                }}
              >
                <Chat
                  sx={{
                    color: colors.textAndAccent,
                    fontSize: 24,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
                {totalUnread > 0 && (
                  <Box
                    sx={{
                      bgcolor: "#E74C3C",
                      color: colors.textAndAccent,
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      position: "absolute",
                      top: -5,
                      right: -5,
                    }}
                  >
                    {totalUnread}
                  </Box>
                )}
              </Nav.Link>
              <Nav.Link
                className="d-flex align-items-center"
                onClick={handleProfileClick}
                style={{ cursor: "pointer", color: colors.textAndAccent }}
                aria-describedby={id}
              >
                {loading ? (
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ mr: 1, bgcolor: colors.skeletonBg }}
                  />
                ) : employeePhoto ? (
                  <Avatar
                    src={employeePhoto}
                    alt="Employee"
                    onClick={handleAvatarClick}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      mr: 1,
                      border: `2px solid ${colors.textAndAccent}`,
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.1)" },
                      cursor: "pointer",
                    }}
                  />
                ) : (
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ mr: 1, bgcolor: colors.skeletonBg }}
                  />
                )}
                {loading ? (
                  <Skeleton
                    variant="text"
                    width={100}
                    sx={{
                      color: colors.textAndAccent,
                      fontSize: "0.9rem",
                      bgcolor: colors.skeletonBg,
                    }}
                  />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      sx={{
                        color: colors.textAndAccent,
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      {employeeName || "No Name"}
                    </Typography>
                    {celebrationEmoji && (
                      <Typography
                        sx={{
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {celebrationEmoji}
                      </Typography>
                    )}
                  </Box>
                )}
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
        <Menu
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              backgroundColor: colors.menuBg,
              minWidth: 200,
              mt: 1,
            },
          }}
        >
          <MenuItem onClick={() => handleMenuItemClick("logout")}>
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: "#E74C3C" }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: colors.menuText,
              }}
            />
          </MenuItem>
        </Menu>
      </Navbar>
      {bannerOpen && employeePhoto && (
        <animated.div
          style={{
            ...bannerSpring,
            position: "fixed",
            top: "80px",
            right: "24px",
            zIndex: 1600,
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
          ref={bannerRef}
        >
          <img
            src={employeePhoto}
            alt="Profile Banner"
            style={{
              width: "200px",
              height: "300px",
              objectFit: "cover",
              display: "block",
            }}
          />
        </animated.div>
      )}
    </>
  );
};

export default AppNavbar;
