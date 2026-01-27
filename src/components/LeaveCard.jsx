import React, { useEffect, useRef, useState } from "react";
import {
  Card, CardContent, Typography, Button, Grid, CircularProgress, Box
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { keyframes } from "@mui/system";
import Chart from "chart.js/auto";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { parse, startOfDay } from "date-fns";

// ---- Simple in-memory cache ----
const leaveCache = {};
const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const DONUT_COLORS = ["#77ad95", "#f7e2a9", "#e39e83"];

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px);}
  100% { opacity: 1; transform: translateY(0);}
`;

function cacheKey(empId) {
  return `leaveCardCache_${empId}`;
}

const Leavecard = () => {
  const [leaveBalances, setLeaveBalances] = useState({
    annual_leaves: [],
    monthly_leaves: [],
    loss_of_pay: 0,
  });
  const [holidayCount, setHolidayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const navigate = useNavigate();

  // Retrieve user role from sessionStorage first, fall back to localStorage
  const rawUserRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
  const userRole = rawUserRole ? rawUserRole.trim().toLowerCase() : "employee";

  // Define color palette based on user role
  const colors = ["hr", "admin", "manager"].includes(userRole)
    ? {
        // cardBg: "#a0c3e8",
        // textAndAccent: "#2772a0",
        // buttonBg: "#2772a0",
        // buttonText: "white",
        // borderColor: "#2772a0",
        // chartBorder: "#2772a0",
        // loadingColor: "#2772a0",

        cardBg: "#2772a0",
        textAndAccent: "#ffffff",
        buttonBg: "#a0c3e8",
        buttonText: "white",
        borderColor: "#a0c3e8",
        chartBorder: "#2772a0",
        loadingColor: "#a0c3e8",
      }
    : {
        cardBg: "#F5E8D3",
        textAndAccent: "#34495E",
        buttonBg: "#34495E",
        buttonText: "#F7E7CE",
        borderColor: "rgba(44,62,80,0.2)",
        chartBorder: "#2C3E50",
        loadingColor: "#34495E",
      };

  // --- CACHE LOGIC ----
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const empId = sessionStorage.getItem("empId");
      if (!empId) return setLoading(false);

      // Attempt to load from cache (in-memory, then sessionStorage)
      let cached = leaveCache[empId];
      if (!cached) {
        try {
          const store = sessionStorage.getItem(cacheKey(empId));
          if (store) cached = JSON.parse(store);
        } catch {}
      }
      if (cached) {
        setLeaveBalances(cached.leaveBalances);
        setHolidayCount(cached.holidayCount);
        setLoading(false); // show cache instantly!
      } else {
        setLoading(true);
      }

      // Background refresh
      try {
        const token = localStorage.getItem(`token_${empId}`);
        // parallel fetch
        const [leaveRes, lopRes, holRes] = await Promise.all([
          axios.get(`${API_URL}/leave_balance/${empId}`, { headers: { Authorization: token } }),
          axios.get(`${API_URL}/loss_of_pay_count/${empId}`, { headers: { Authorization: token } }),
          axios.get(`${API_URL}/get_holidays`, { headers: { Authorization: token } }),
        ]);
        if (cancelled) return;
        // Parse
        const balances = leaveRes.data?.balances || { annual_leaves: [], monthly_leaves: [], loss_of_pay: 0 };
        const lop = lopRes.data?.loss_of_pay_days || 0;
        balances.loss_of_pay = lop;
        let holidays = [];
        if (holRes.data?.message === "Holidays retrieved successfully") {
          const today = startOfDay(new Date());
          const endOfYear = new Date(today.getFullYear(), 11, 31);
          holidays = (holRes.data.holidays || []).filter((h, i) => {
            if (!h.holiday_date) return false;
            const dt = parse(h.holiday_date, "yyyy-MM-dd", new Date());
            return dt >= today && dt <= endOfYear && !isNaN(dt.getTime());
          });
        }
        // Update state and cache
        setLeaveBalances(balances);
        setHolidayCount(holidays.length);
        setLoading(false);
        leaveCache[empId] = { leaveBalances: balances, holidayCount: holidays.length, ts: Date.now() };
        sessionStorage.setItem(
          cacheKey(empId),
          JSON.stringify({ leaveBalances: balances, holidayCount: holidays.length, ts: Date.now() })
        );
      } catch (e) {
        if (!cached) setLoading(false);
        // else, silently fail and leave cache
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [navigate]);

  // --- CHART LOGIC ---
  useEffect(() => {
    if (loading || !chartRef.current) return;
    const leaveData = [];
    leaveBalances.annual_leaves.forEach((leave, idx) => {
      if (leave.remaining > 0)
        leaveData.push({
          label: leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1),
          value: leave.remaining,
          color: DONUT_COLORS[idx % DONUT_COLORS.length]
        });
    });
    leaveBalances.monthly_leaves.forEach((leave, idx) => {
      if (leave.remaining > 0)
        leaveData.push({
          label: leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1),
          value: leave.remaining,
          color: DONUT_COLORS[(idx + leaveBalances.annual_leaves.length) % DONUT_COLORS.length]
        });
    });
    if (leaveBalances.loss_of_pay > 0)
      leaveData.push({
        label: "Loss of Pay",
        value: leaveBalances.loss_of_pay,
        color: DONUT_COLORS[leaveData.length % DONUT_COLORS.length]
      });
    if (leaveData.length > 0) {
      leaveData.forEach((item, idx) => item.color = DONUT_COLORS[idx % DONUT_COLORS.length]);
    }
    if (holidayCount > 0) {
      leaveData.push({
        label: "Holidays",
        value: holidayCount,
        color: DONUT_COLORS[leaveData.length % DONUT_COLORS.length],
      });
    }
    const chartLabels = leaveData.map((item) => item.label);
    const chartValues = leaveData.map((item) => item.value);
    const chartColors = leaveData.map((item) => item.color);

    // CHART.JS
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartValues,
            backgroundColor: chartColors,
            borderColor: colors.chartBorder,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.textAndAccent,
              font: { size: 10, family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
              filter: (item, data) => data.datasets[0].data[item.index] > 0,
            },
          },
          tooltip: {
            backgroundColor: `rgba(${colors.textAndAccent.replace("#", "")}, 0.8)`,
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.raw} days`
            }
          }
        },
        cutout: "60%",
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [loading, leaveBalances, holidayCount, colors]);

  return (
    <Card sx={{
      backgroundColor: colors.cardBg,
      color: colors.textAndAccent,
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      width: 420,
      height: 341.3,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      animation: `${slideIn} 0.5s ease-out 0.1s`,
      position: "relative",
      zIndex: 1
    }}>
      <CardContent sx={{ padding: 0 }}>
        <Box sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `1px solid ${colors.borderColor}`,
          paddingBottom: "10px", marginBottom: "10px", paddingX: "15px"
        }}>
          <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600, color: colors.textAndAccent }}>
            Leave Details
          </Typography>
          <Button variant="outlined" size="small" startIcon={<CalendarTodayOutlinedIcon />}
            sx={{
              color: colors.buttonText,
              backgroundColor: colors.buttonBg,
              borderColor: colors.buttonBg,
              textTransform: "none",
              fontSize: "12px",
              "&:hover": { backgroundColor: colors.buttonBg, opacity: 0.9 },
            }}>
            {new Date().getFullYear()}
          </Button>
        </Box>
        {loading ? (
          <Box sx={{
            display: "flex", justifyContent: "center", alignItems: "center",
            height: "180px", position: "relative", zIndex: 2,
          }}>
            <CircularProgress sx={{ color: colors.loadingColor }} />
          </Box>
        ) : leaveBalances.annual_leaves.length === 0 &&
          leaveBalances.monthly_leaves.length === 0 &&
          holidayCount === 0 ? (
          <Typography variant="body2" sx={{ color: "#E74C3C", textAlign: "center" }}>
            No leave balances or holidays available.
          </Typography>
        ) : (
          <Grid container spacing={1} sx={{ color: colors.textAndAccent, paddingX: "15px" }}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption">Total Leaves Used</Typography>
                <Typography variant="body2" sx={{ color: colors.textAndAccent, fontWeight: 500 }}>
                  {leaveBalances.annual_leaves.reduce((s, l) => s + (l.remaining || 0), 0) +
                    leaveBalances.monthly_leaves.reduce((s, l) => s + (l.remaining || 0), 0)}
                </Typography>
              </Box>
              {leaveBalances.annual_leaves.map((leave, i) => (
                <Box key={i}>
                  <Typography variant="caption">
                    {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textAndAccent, fontWeight: 500 }}>
                    {leave.remaining || 0}
                  </Typography>
                </Box>
              ))}
              {leaveBalances.monthly_leaves.map((leave, i) => (
                <Box key={i}>
                  <Typography variant="caption">
                    {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textAndAccent, fontWeight: 500 }}>
                    {leave.remaining || 0}
                  </Typography>
                </Box>
              ))}
              <Box>
                <Typography variant="caption">Holidays (Remaining)</Typography>
                <Typography variant="body2" sx={{ color: colors.textAndAccent, fontWeight: 500 }}>
                  {holidayCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption">Loss of Pay</Typography>
                <Typography variant="body2" sx={{ color: colors.textAndAccent, fontWeight: 500 }}>
                  {leaveBalances.loss_of_pay || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{
                height: "210px", position: "relative",
                "& canvas": { maxHeight: "100%", maxWidth: "100%" },
              }}>
                <canvas ref={chartRef} />
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
      <Button
        variant="contained"
        fullWidth
        sx={{
          marginTop: "10px",
          backgroundColor: colors.buttonBg,
          color: colors.buttonText,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "12px",
          "&:hover": { backgroundColor: colors.buttonBg },
        }}
        onClick={() => navigate("/leave-management")}
      >
        Apply New Leave
      </Button>
    </Card>
  );
};

export default Leavecard;