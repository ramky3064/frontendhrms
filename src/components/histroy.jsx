import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Table } from 'react-bootstrap';
import { TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const History = () => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [navbarHeight, setNavbarHeight] = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);

  const storedEmpId = location.state?.empId || sessionStorage.getItem('empId');

  // Dropdown options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 10 }, (_, i) => 2020 + i);

  // Set current date as default
  useEffect(() => {
    const currentDate = new Date();
    setMonth(months[currentDate.getMonth()]);
    setYear(currentDate.getFullYear());
  }, []);

  // Calculate navbar height
  useEffect(() => {
    if (navbarRef.current) {
      const height = navbarRef.current.getBoundingClientRect().height;
      setNavbarHeight(height || 70);
    }
  }, []);

  // Function to get token and empId
  const getTokenAndEmpId = () => {
    let token;
    let empId = storedEmpId;

    if (empId) {
      token = localStorage.getItem(`token_${empId}`);
    }

    if (!token && !empId) {
      const fallbackToken = localStorage.getItem('token');
      if (fallbackToken) {
        try {
          const decoded = jwtDecode(fallbackToken);
          empId = decoded.sub || decoded.emp_id || decoded.user_id || md5(fallbackToken);
          token = fallbackToken;
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem('empId', empId);
        } catch (error) {
          console.error('Error decoding fallback token:', error);
          empId = md5(fallbackToken);
          token = fallbackToken;
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem('empId', empId);
        }
      }
    }

    return { token, empId };
  };

  // Function to fetch attendance data for all employees
  const fetchAttendanceData = async () => {
    const { token, empId } = getTokenAndEmpId();

    if (!token || !empId) {
      setError('Token or employee ID missing. Please log in again.');
      setSnackbar({ open: true, message: 'Token or employee ID missing. Please log in again.', severity: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/employee_attendance_all_dates`, {
        headers: { Authorization: token }
      });

      let filteredData = response.data.data;

      // Filter by year and month if provided
      if (year || month) {
        const monthIndex = month ? months.indexOf(month) + 1 : '';
        filteredData = response.data.data.filter((record) => {
          const recordDate = new Date(record.punch_date);
          const recordYear = recordDate.getFullYear();
          const recordMonth = recordDate.getMonth() + 1;

          const yearMatch = year ? recordYear === parseInt(year) : true;
          const monthMatch = month ? recordMonth === monthIndex : true;
          const dayMatch = day ? recordDate.getDate() === parseInt(day) : true;

          return yearMatch && monthMatch && dayMatch;
        });
      }

      const employeeData = filteredData.map((record) => ({
        id: record.employee_id,
        name: `${record.first_name} ${record.last_name}`,
        firstName: record.first_name,
        lastName: record.last_name,
        punchIn: record.first_punchin
          ? new Date(record.first_punchin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        punchOut: record.punch_out
          ? new Date(record.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        duration: record.total_daily_duration || '',
        punchDate: record.punch_date // Include punch_date for display
      }));

      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (err) {
      console.error('Error fetching attendance data:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Unauthorized access. Please log in again.');
        setSnackbar({ open: true, message: 'Unauthorized access. Please log in again.', severity: 'error' });
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access forbidden. Only Admin/HR can view this data.');
        setSnackbar({ open: true, message: 'Access forbidden. Only Admin/HR can view this data.', severity: 'error' });
        navigate('/');
      } else {
        setError('Failed to fetch attendance data. Please try again.');
        setSnackbar({ open: true, message: 'Failed to fetch attendance data. Please try again.', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        (employee) =>
          employee.id.toString().toLowerCase().includes(query) ||
          employee.firstName.toLowerCase().includes(query) ||
          employee.lastName.toLowerCase().includes(query)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch data when month or year changes (even if day is not selected)
  useEffect(() => {
    fetchAttendanceData();
  }, [day, month, year]);

  // Internal styles
  const styles = {
    pageContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
    },
    sidebar: {
      flexShrink: 0,
      backgroundColor: '#f8f9fa',
    },
    contentContainer: {
      flexGrow: 1,
      padding: '20px',
      backgroundColor: '#f8f9fa',
    },
    mainContent: {
      marginTop: `${navbarHeight}px`,
    },
    tableContainer: {
      maxHeight: '400px',
      overflowY: 'auto',
      marginTop: '20px',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
    },
    table: {
      marginBottom: '0',
    },
    tableCell: {
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    title: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    dropdownContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
    },
    dropdown: {
      width: '100px',
      '& .MuiInputBase-root': {
        height: '40px',
        fontSize: '0.9rem',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.9rem',
        top: '-5px',
      },
    },
    searchBar: {
      width: '200px',
      '& .MuiInputBase-root': {
        height: '40px',
        fontSize: '0.9rem',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.9rem',
        top: '-5px',
      },
    },
  };

  // MenuProps for scrollable dropdowns
  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
        overflowY: 'auto',
      },
    },
  };

  const dayMenuProps = {
    PaperProps: {
      style: {
        maxHeight: 200,
        overflowY: 'auto',
      },
    },
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.sidebar}>
        <DynamicSidebar />
      </div>
      <div style={styles.contentContainer}>
        <div ref={navbarRef}>
          <AppNavbar />
        </div>
        <Container style={styles.mainContent}>
          <h1 style={styles.title}>All Employee History</h1>
          <div style={styles.dropdownContainer}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <TextField
                select
                label="Day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                sx={styles.dropdown}
                MenuProps={dayMenuProps}
              >
                <MenuItem value="">All Days</MenuItem>
                {days.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                sx={styles.dropdown}
                MenuProps={menuProps}
              >
                <MenuItem value="">All Months</MenuItem>
                {months.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                sx={styles.dropdown}
                MenuProps={menuProps}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <TextField
              label="Search by ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={styles.searchBar}
            />
          </div>
          <div style={styles.tableContainer}>
            <Table striped bordered hover style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableCell}>Employee ID</th>
                  <th style={styles.tableCell}>Name</th>
                  <th style={styles.tableCell}>Punch Date</th>
                  <th style={styles.tableCell}>Punch In</th>
                  <th style={styles.tableCell}>Punch Out</th>
                  <th style={styles.tableCell}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={styles.tableCell}>
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" style={styles.tableCell}>
                      {error}
                    </td>
                  </tr>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr key={`${employee.id}-${employee.punchDate}`}>
                      <td style={styles.tableCell}>{employee.id}</td>
                      <td style={styles.tableCell}>{employee.name}</td>
                      <td style={styles.tableCell}>{employee.punchDate}</td>
                      <td style={styles.tableCell}>{employee.punchIn}</td>
                      <td style={styles.tableCell}>{employee.punchOut}</td>
                      <td style={styles.tableCell}>{employee.duration}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={styles.tableCell}>
                      {year || month || day
                        ? searchQuery
                          ? 'No employees found matching the search criteria'
                          : 'No data available for the selected filters'
                        : 'Please select at least one filter to view attendance'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </div>
    </div>
  );
};

export default History;