import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  zoomPlugin
);

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const TotalDuration = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // Initially null to indicate role not resolved
  const [roleLoading, setRoleLoading] = useState(true); // Track role resolution
  const navigate = useNavigate();
  const chartRef = useRef(null);

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
        line: "#0a9af3ff",
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
        line: "#2C3E50",
        chipBorder: "#2C3E50",
        hoverButtonBg: "#2C3E50",
        selectedDateBg: "#6b7280",
      };

  useEffect(() => {
    if (roleLoading) return; // Skip data fetching until role is resolved

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const empId = sessionStorage.getItem("empId");
        const token = localStorage.getItem(`token_${empId}`);
        if (!empId || !token) {
          throw new Error("No employee ID or token found. Please log in again.");
        }

        const response = await axios.get(
          `${API_URL}/employee_total_duration`,
          {
            headers: { Authorization: token },
          }
        );

        if (response.data.message.includes("retrieved successfully")) {
          processChartData(response.data.data);
        } else {
          throw new Error(response.data.message || "Unexpected response format");
        }
      } catch (error) {
        console.error("Error fetching total duration data:", {
          message: error.message,
          response: error.response ? error.response.data : "No response data",
          empId: sessionStorage.getItem("empId") || "No empId",
          token: localStorage.getItem(
            `token_${sessionStorage.getItem("empId")}`
          )
            ? "Token present"
            : "No token",
        });
        setError(
          error.response?.status === 403
            ? "Unauthorized to view work duration data."
            : error.response?.status === 401
            ? "Session expired. Please log in again."
            : `Failed to load work duration data: ${
                error.response?.data?.message || error.message
              }`
        );
        if (
          error.message.includes("token") ||
          error.message.includes("employee ID") ||
          error.response?.status === 401
        ) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    const processChartData = (data) => {
      if (!data || data.length === 0) {
        setError("No work duration data available for this employee.");
        setChartData({ labels: [], datasets: [] });
        return;
      }

      const totalDays = 30;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const dates = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(yesterday);
        date.setDate(yesterday.getDate() - (totalDays - 1 - i));
        return date.toISOString().split("T")[0];
      });

      const durations = Array(totalDays).fill(0);
      const durationStrings = Array(totalDays).fill("");

      data.forEach((record) => {
        const punchDate = record.punch_date;
        const index = dates.indexOf(punchDate);
        if (index !== -1) {
          const durationStr = record.total_daily_duration.split(" / ")[0];
          durationStrings[index] =
            durationStr.replace(/\s*\d+sec/, "").trim() || "0hrs";

          let hours = 0;
          const hourMatch = durationStr.match(/(\d+)hrs/);
          const minMatch = durationStr.match(/(\d+)min/);
          const secMatch = durationStr.match(/(\d+)sec/);
          if (hourMatch) hours += parseInt(hourMatch[1]);
          if (minMatch) hours += parseInt(minMatch[1]) / 60;
          if (secMatch) hours += parseInt(secMatch[1]) / 3600;
          durations[index] += Number(hours.toFixed(2));
        }
      });

      const formattedLabels = dates.map((date) => {
        const d = new Date(date);
        return `${d.getDate()}-${d.toLocaleString("default", {
          month: "short",
        })}`;
      });

      setChartData({
        labels: formattedLabels,
        datasets: [
          {
            label: "Total Work Duration",
            data: durations,
            durationStrings: durationStrings,
            borderColor: colors.line,
            backgroundColor: `${colors.selectedDateBg}99`,
            borderWidth: 3,
            pointBackgroundColor: colors.chipText,
            pointBorderColor: colors.textAndAccent,
            pointRadius: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      });
    };

    fetchData();
  }, [navigate, userRole, roleLoading]);

  const totalDays = 30;
  const visibleDays = 7;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Hours",
          color: colors.textAndAccent,
        },
        ticks: {
          stepSize: 3,
          color: colors.textAndAccent,
        },
        grid: {
          color: colors.borderColor,
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
          color: colors.textAndAccent,
        },
        ticks: {
          color: colors.textAndAccent,
        },
        grid: {
          color: colors.borderColor,
        },
        min: totalDays - visibleDays,
        max: totalDays - 1,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: colors.textAndAccent,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const durationStr =
              context.dataset.durationStrings[index] || "0hrs";
            return `${context.dataset.label}: ${durationStr}`;
          },
        },
      },
    },
  };

  const styles = {
    chartContainer: {
      backgroundColor: colors.cardBg,
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      height: "250px",
      display: "flex",
      flexDirection: "column",
      width: "805px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    chartTitle: {
      margin: "0",
      fontSize: "16px",
      fontWeight: "600",
      color: colors.textAndAccent,
    },
    chartWrapper: {
      flex: 1,
      width: "100%",
    },
    resetButton: {
      padding: "4px 8px",
      backgroundColor: colors.buttonBg,
      color: colors.buttonText,
      border: `1px solid ${colors.borderColor}`,
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
    },
    loading: {
      textAlign: "center",
      color: colors.textAndAccent,
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    error: {
      textAlign: "center",
      color: "#E74C3C",
      fontSize: "14px",
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  if (roleLoading) {
    return (
      <div style={styles.chartContainer}>
        <div style={styles.loading}>Loading user role...</div>
      </div>
    );
  }

  return (
    <div style={styles.chartContainer}>
      <div style={styles.header}>
        <h5 style={styles.chartTitle}>Total Work Duration</h5>
        {!loading && !error && chartData.labels.length > 0 && (
          <button
            style={styles.resetButton}
            onClick={() => chartRef.current.resetZoom()}
          >
            Restore
          </button>
        )}
      </div>
      {loading && <div style={styles.loading}>Loading...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {!loading && !error && chartData.labels.length > 0 && (
        <div style={styles.chartWrapper}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      )}
      {!loading && !error && chartData.labels.length === 0 && (
        <div style={styles.error}>No data available to display.</div>
      )}
    </div>
  );
};

export default TotalDuration;