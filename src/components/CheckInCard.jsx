import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import axios from 'axios';
import  {jwtDecode}  from 'jwt-decode';
import md5 from 'md5';
import { keyframes } from '@mui/system';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const avatarFadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`;

const ScrollableCheckInGrid = ({ employees, tabColor }) => (
  <Box
    sx={{
      maxHeight: '180px',
      overflowY: 'auto',
      overflowX: 'hidden',
      pb: 1,
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: tabColor,
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: '#f1f5f9',
        borderRadius: '4px',
      },
    }}
  >
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 2,
        px: 1,
      }}
    >
      {employees.map((employee, idx) => (
        <Box
          key={employee.employee_name + employee.first_punchin}
          textAlign="center"
          sx={{
            animation: `${avatarFadeIn} 0.4s ease-out ${idx * 0.1}s both`,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        >
          <Avatar
            sx={{
              bgcolor: employee.color,
              width: 40,
              height: 40,
              mx: 'auto',
              fontSize: '0.95rem',
              fontWeight: 500,
              border: '2px solid #fff',
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            {employee.initials}
          </Avatar>
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontSize: '0.75rem',
              mt: 0.5,
              color: '#3f3f46',
              fontWeight: 500,
            }}
          >
            {employee.employee_name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: '#6b7280',
              display: 'block',
            }}
          >
            {employee.first_punchin}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

function CheckInDashboard() {
  const [earlyCheckIns, setEarlyCheckIns] = useState([]);
  const [lateCheckIns, setLateCheckIns] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const today = new Date();
  const formattedToday = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  const AVATAR_COLORS = ['#FFA500', '#FFC800', '#FFA450', '#1E90FF', '#20B2AA'];

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        let empId = sessionStorage.getItem('empId');
        let token;

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
              empId = md5(fallbackToken);
              token = fallbackToken;
              localStorage.setItem(`token_${empId}`, token);
              sessionStorage.setItem('empId', empId);
            }
          }
        }

        if (!token || !empId) {
          setError('Token or employee ID missing. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/employee_first_punchin`, {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        const data = response.data.data || [];
        const nineAM = new Date();
        nineAM.setHours(9, 0, 0, 0);

        const early = [];
        const late = [];

        data.forEach((record, idx) => {
          const punchTime = new Date(record.first_punchin);
          const employee = {
            employee_name: `${record.first_name} ${record.last_name}`,
            first_punchin: punchTime.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            }),
            initials: `${record.first_name.charAt(0)}${record.last_name.charAt(0)}`.toUpperCase(),
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };

          if (punchTime < nineAM) {
            early.push(employee);
          } else {
            late.push(employee);
          }
        });

        setEarlyCheckIns(early);
        setLateCheckIns(late);
        setLoading(false);
        if (isFirstLoad) setIsFirstLoad(false);
      } catch (err) {
        console.error('Check-in fetch error:', err);
        setError('Failed to fetch check-in data.');
        setLoading(false);
      }
    };

    fetchCheckIns();
    const interval = setInterval(fetchCheckIns, 5000);
    return () => clearInterval(interval);
  }, [isFirstLoad]);

  const handleTabChange = (_, newValue) => setTab(newValue);

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: '450px',
        height: 310,
        borderRadius: 3,
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)',
        background: tab === 0 ? '#f8e098' : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        animation: `${slideIn} 0.5s ease-out`,
        '&:hover': {
          transform: 'scale(1.03) translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
        },
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          color={tab === 0 ? '#d97706' : '#1e40af'}
          gutterBottom
          sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}
        >
          Today's Check-Ins
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={2} mb={2}>
            <CircularProgress color={tab === 0 ? 'warning' : 'primary'} size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                bgcolor: 'rgba(255, 255, 250, 0.9)',
                borderRadius: 2,
                mb: 1.5,
              }}
            >
              <Tab icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} label="Early Check-ins" />
              <Tab icon={<HourglassEmptyIcon sx={{ fontSize: 18 }} />} label="Late Check-ins" />
            </Tabs>

            {tab === 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#d97706', mb: 1 }}>
                  <strong>Today ({formattedToday})</strong>
                </Typography>
                {earlyCheckIns.length > 0 ? (
                  <ScrollableCheckInGrid employees={earlyCheckIns} tabColor="#d97706" />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No Early Check-ins Today
                  </Typography>
                )}
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#1e40af', mb: 1 }}>
                  <strong>Today ({formattedToday})</strong>
                </Typography>
                {lateCheckIns.length > 0 ? (
                  <ScrollableCheckInGrid employees={lateCheckIns} tabColor="#1e40af" />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No Late Check-ins Today
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CheckInDashboard;
