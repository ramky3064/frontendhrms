import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  TextField,
  InputAdornment,
  Skeleton,
  Backdrop,
  Zoom,
  Typography,
  Paper,
  Avatar,
  Stack,
  Chip,
  Grid,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import axios from "axios";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AppNavbar from "./Hrmnav";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const AVATAR_COLORS = ["#2b3e52", "#CA763A"];
const FALLBACK_IMAGE = "/cardimg.png";

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ProfileCard = ({
  employee,
  index,
  onClick,
  isPopup = false,
  onView,
  onEdit,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: isPopup ? "auto" : 280,
        minWidth: isPopup ? 400 : 280,
        borderRadius: "20px",
        overflow: "hidden",
        textAlign: "center",
        border: "3px solid #CA763A",
        position: "relative",
        fontFamily: "sans-serif",
        mx: isPopup ? 0 : "auto",
        mt: isPopup ? 0 : 4,
        animation: isPopup
          ? "none"
          : `${slideIn} 0.5s ease-out ${index * 0.1}s`,
        transition: isPopup
          ? "none"
          : "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": isPopup
          ? {}
          : {
              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
              transform: "scale(1.02)",
            },
        cursor: isPopup ? "default" : "pointer",
      }}
      onClick={isPopup ? null : onClick}
    >
      <Box
        sx={{
          backgroundColor: "#2b3e52",
          height: 100,
          borderBottomLeftRadius: "10%",
          borderBottomRightRadius: "10%",
        }}
      ></Box>

      <Avatar
        alt={toTitleCase(employee.name)}
        src={employee.photo || FALLBACK_IMAGE}
        sx={{
          width: isPopup ? 120 : 100,
          height: isPopup ? 120 : 100,
          border: "4px solid white",
          mx: "auto",
          mt: -6,
          bgcolor: employee.photo
            ? "transparent"
            : AVATAR_COLORS[index % AVATAR_COLORS.length],
          fontSize: isPopup ? "2rem" : "1.5rem",
          fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
        imgProps={{
          loading: "lazy",
          onError: (e) => {
            e.target.src = FALLBACK_IMAGE;
          },
        }}
      >
        {!employee.photo &&
          toTitleCase(employee.name)
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
      </Avatar>

      <Box sx={{ p: isPopup ? 3 : 2 }}>
        <Typography
          variant={isPopup ? "h5" : "h6"}
          sx={{ fontWeight: 600, color: "#2b3e52" }}
        >
          {toTitleCase(employee.name)}
        </Typography>

        <Chip
          label={employee.role || "N/A"}
          sx={{
            backgroundColor: "#CA763A",
            color: "#fff",
            fontWeight: 500,
            mt: 1,
            mb: 2,
          }}
        />

        <Stack spacing={1} alignItems="flex-start" sx={{ textAlign: "left" }}>
          <Typography variant="body2" sx={{ color: "#2b3e52" }}>
            <strong>ID No</strong>: {employee.emp_id || "N/A"}
          </Typography>
          <Box
            sx={{
              width: "100%",
              overflow: isPopup ? "visible" : "hidden",
              textOverflow: isPopup ? "clip" : "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Typography variant="body2" sx={{ color: "#2b3e52" }}>
              <strong>E-mail</strong>: {employee.email || "N/A"}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#2b3e52" }}>
            <strong>Role</strong>: {employee.role || "N/A"}
          </Typography>
          {isPopup && (
            <Typography variant="body2" sx={{ color: "#2b3e52" }}>
              <strong>Work From</strong>: {employee.work_from || "N/A"}
            </Typography>
          )}
        </Stack>

        {!isPopup && (
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <IconButton
              component={RouterLink}
              to={`/view-employee/${employee.emp_id}`}
              aria-label="view"
              onClick={(e) => {
                e.stopPropagation();
                onView(employee);
              }}
              sx={{
                color: "#2b3e52",
                "&:hover": {
                  color: "#CA763A",
                  transform: "scale(1.1)",
                },
              }}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              component={RouterLink}
              to={`/edit-employee/${employee.emp_id}`}
              aria-label="edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(employee);
              }}
              sx={{
                color: "#2b3e52",
                "&:hover": {
                  color: "#CA763A",
                  transform: "scale(1.1)",
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

const ActiveEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [employeePhotos, setEmployeePhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const navbarRef = useRef(null);
  const employeesPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.getBoundingClientRect().height;
        setNavbarHeight(height > 0 ? height : 64);
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const empId = sessionStorage.getItem("empId");
        const token = localStorage.getItem(`token_${empId}`);
        if (!empId || !token) {
          navigate("/login", { replace: true });
          return;
        }

        const empCountResponse = await axios.get(
          `${API_URL}/active_employees_with_count`,
          { headers: { Authorization: token } }
        );
        if (
          empCountResponse.status === 200 &&
          empCountResponse.data.status === "success"
        ) {
          const formatted = empCountResponse.data.employees.map(
            (emp, index) => ({
              id: index,
              emp_id: emp.emp_id,
              name: `${emp.first_name} ${emp.last_name}`,
              email: emp.email,
              phone: emp.phone,
              role: emp.user_role,
              work_from: emp.work_from,
            })
          );
          setEmployees(formatted);

          const fetchPhoto = async (emp, delay) => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            try {
              const response = await axios.get(
                `${API_URL}/get_employee_photo/${emp.emp_id}`,
                { headers: { Authorization: token }, timeout: 10000 }
              );
              return {
                emp_id: emp.emp_id,
                photo: response.data.photo_base64
                  ? `data:image/jpeg;base64,${response.data.photo_base64}`
                  : FALLBACK_IMAGE,
              };
            } catch (error) {
              console.error(`Failed to fetch photo for ${emp.emp_id}:`, error);
              return { emp_id: emp.emp_id, photo: FALLBACK_IMAGE };
            }
          };

          const photoPromises = formatted.map((emp, index) =>
            fetchPhoto(emp, index * 100)
          );

          const photos = await Promise.all(photoPromises);
          const photoMap = photos.reduce((acc, { emp_id, photo }) => {
            acc[emp_id] = photo;
            return acc;
          }, {});
          setEmployeePhotos(photoMap);
        } else {
          throw new Error(
            empCountResponse.data.message || "Failed to fetch employees"
          );
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [navigate]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleCardClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleClosePopup = () => {
    setSelectedEmployee(null);
  };

  const handleViewEmployee = (employee) => {
    navigate(`/view-employee/${employee.emp_id}`);
  };

  const handleEditEmployee = (employee) => {
    navigate(`/edit-employee/${employee.emp_id}`);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emp_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedEmployees = filteredEmployees.slice(
    0,
    page * employeesPerPage
  );

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#585858",
        minHeight: "100vh",
        position: "relative",
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "#f5eada",
          minHeight: "100vh",
          position: "relative",
          zIndex: 0,
        }}
      >
        <div ref={navbarRef}>
          <AppNavbar />
        </div>
        <Box sx={{ height: navbarHeight }} />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              mb: 3,
            }}
          >
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  color: "black",
                  mb: 1,
                }}
              >
                Active Employees
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
                  onClick={() => navigate(-1)} // Navigate to the previous page
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
                  Active Employees
                </Typography>
              </Breadcrumbs>
            </Box>
            <TextField
              variant="outlined"
              placeholder="Search by Name or ID"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{
                width: { xs: "100%", sm: 320 },
                bgcolor: "#fff",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.2s, transform 0.2s",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: "#CA763A",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#CA763A",
                    borderWidth: 2,
                  },
                  "&.Mui-focused": {
                    transform: "scale(1.02)",
                  },
                },
                "& .MuiInputBase-input": {
                  py: 1.2,
                  fontSize: "0.9rem",
                },
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#6b7280", fontSize: "20px" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={3}
                    sx={{
                      width: 280,
                      borderRadius: "20px",
                      overflow: "hidden",
                      textAlign: "center",
                      border: "1px solid #CA763A",
                      position: "relative",
                      fontFamily: "sans-serif",
                      mx: "auto",
                      mt: 4,
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: "#2b3e52",
                        height: 100,
                        borderBottomLeftRadius: "100%",
                        borderBottomRightRadius: "100%",
                      }}
                    ></Box>
                    <Skeleton
                      variant="circular"
                      width={100}
                      height={100}
                      sx={{ mx: "auto", mt: -6 }}
                    />
                    <Box sx={{ p: 2 }}>
                      <Skeleton
                        variant="text"
                        width={120}
                        sx={{ mx: "auto" }}
                      />
                      <Skeleton
                        variant="text"
                        width={80}
                        sx={{ mx: "auto", mt: 1, mb: 2 }}
                      />
                      <Stack spacing={1} alignItems="flex-start">
                        <Skeleton variant="text" width={150} />
                        <Skeleton variant="text" width={150} />
                        <Skeleton variant="text" width={150} />
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filteredEmployees.length > 0 ? (
            <>
              <Grid
                container
                spacing={3}
                sx={{ filter: selectedEmployee ? "blur(4px)" : "none" }}
              >
                {displayedEmployees.map((employee, index) => (
                  <Grid item xs={12} sm={6} md={4} key={employee.id}>
                    <ProfileCard
                      employee={{
                        ...employee,
                        photo: employeePhotos[employee.emp_id],
                      }}
                      index={index}
                      onClick={() => handleCardClick(employee)}
                      onView={handleViewEmployee}
                      onEdit={handleEditEmployee}
                    />
                  </Grid>
                ))}
              </Grid>
              {displayedEmployees.length < filteredEmployees.length && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={handleLoadMore}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "2px solid #CA763A",
                      backgroundColor: "#2b3e52",
                      color: "#CA763A",
                      fontWeight: 600,
                      fontSize: "14px",
                      textTransform: "uppercase",
                      transition: "all 0.3s ease",
                      boxShadow: "0 3px 6px rgba(0, 0, 0, 0.2)",
                      "&:hover": {
                        backgroundColor: "#1a2c3e",
                        color: "#fff",
                        borderColor: "#CA763A",
                        transform: "scale(1.05)",
                        boxShadow: "0 5px 10px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    Load More
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ fontSize: "0.75rem", mt: 1, fontStyle: "italic" }}
            >
              {searchTerm
                ? "No employees match your search"
                : "No Active Employees"}
            </Typography>
          )}
          <Backdrop
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
              bgcolor: "rgba(0,0,0,0.5)",
            }}
            open={!!selectedEmployee}
            onClick={handleClosePopup}
          >
            {selectedEmployee && (
              <Zoom in={!!selectedEmployee}>
                <Box onClick={(e) => e.stopPropagation()}>
                  <ProfileCard
                    employee={{
                      ...selectedEmployee,
                      photo: employeePhotos[selectedEmployee.emp_id],
                    }}
                    index={selectedEmployee.id}
                    isPopup={true}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                  />
                </Box>
              </Zoom>
            )}
          </Backdrop>
        </Container>
      </Box>
    </div>
  );
};

export default ActiveEmployees;
