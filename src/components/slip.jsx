import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import md5 from "md5";
import {
  Box,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import html2pdf from "html2pdf.js";
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

const API_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:5000/api"; // Update with your actual API URL

const Payslipdown = () => {
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [navbarHeight, setNavbarHeight] = useState(74); // Default height
  const navbarRef = useRef(null);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  // Set default month and year to current month and year, and fetch payslip data
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setSelectedDate(new Date(currentYear, currentMonth - 1));

    const { empId, token } = getAuthToken();
    if (empId && token) {
      setLoading(true);
      fetchPayslipData(empId, currentYear.toString(), currentMonth.toString());
    } else {
      setError("Employee ID or token missing. Please log in again.");
      setSnackbar({
        open: true,
        message: "Employee ID or token missing. Please log in again.",
        severity: "error",
      });
    }
  }, []);

  // Calculate navbar height with ResizeObserver and window resize
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.getBoundingClientRect().height;
        setNavbarHeight(height || 74); // Use fallback if height is 0
      }
    };

    // Initial height calculation
    updateNavbarHeight();

    // Set up ResizeObserver to detect navbar size changes
    const observer = new ResizeObserver(() => {
      updateNavbarHeight();
    });

    if (navbarRef.current) {
      observer.observe(navbarRef.current);
    }

    // Handle window resize
    window.addEventListener('resize', updateNavbarHeight);

    // Cleanup
    return () => {
      if (navbarRef.current) {
        observer.unobserve(navbarRef.current);
      }
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  const numberToWords = (num) => {
    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const thousands = ["", "Thousand", "Lakh", "Crore"];

    if (num === 0) return "Zero";

    let words = "";
    let i = 0;
    while (num > 0) {
      const chunk = num % 1000;
      if (chunk > 0) {
        let chunkWords = "";
        let hundred = Math.floor(chunk / 100);
        let remainder = chunk % 100;
        if (hundred > 0) {
          chunkWords += units[hundred] + " Hundred";
          if (remainder > 0) chunkWords += " ";
        }
        if (remainder > 0) {
          if (remainder < 10) {
            chunkWords += units[remainder];
          } else if (remainder < 20) {
            chunkWords += teens[remainder - 10];
          } else {
            let ten = Math.floor(remainder / 10);
            let unit = remainder % 10;
            chunkWords += tens[ten];
            if (unit > 0) chunkWords += " " + units[unit];
          }
        }
        words = chunkWords + " " + thousands[i] + (words ? " " + words : "");
      }
      num = Math.floor(num / 1000);
      i++;
    }
    return words.trim() + " Rupees";
  };

  const getAuthToken = () => {
    let empId = sessionStorage.getItem("empId");
    let token = null;

    if (empId) {
      token = localStorage.getItem(`token_${empId}`);
    }

    if (!token) {
      token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          empId =
            decoded.sub || decoded.emp_id || decoded.user_id || md5(token);
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem("empId", empId);
        } catch (error) {
          console.error("Error decoding fallback token:", error);
          empId = md5(token);
          localStorage.setItem(`token_${empId}`, token);
          sessionStorage.setItem("empId", empId);
        }
      }
    }

    return { token, empId };
  };

  const fetchPayslipData = async (empId, year, month) => {
    try {
      const { token } = getAuthToken();

      if (!token || !empId) {
        setError("Token or employee ID missing. Please log in again.");
        setSnackbar({
          open: true,
          message: "Token or employee ID missing. Please log in again.",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      console.log("Token on Payslip Fetch:", token);

      const response = await axios.get(
        `${API_URL}/generate_payslip/${empId}/${year}/${month.padStart(
          2,
          "0"
        )}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setPayslipData(response.data);
      setError(null);
      setSnackbar({
        open: true,
        message: "Payslip loaded successfully",
        severity: "success",
      });
      setLoading(false);
    } catch (err) {
      console.error(
        "Error fetching payslip data:",
        err.response?.data || err.message
      );
      setPayslipData(null);
      if (err.response?.status === 401) {
        setError("Invalid or expired token. Please log in again.");
        setSnackbar({
          open: true,
          message: "Invalid or expired token. Please log in again.",
          severity: "error",
        });
      } else if (err.response?.status === 404) {
        setError(
          `Payslip not found for ${
            months.find((m) => m.value === parseInt(month))?.label
          } ${year}.`
        );
        setSnackbar({
          open: true,
          message: `Payslip not found for ${
            months.find((m) => m.value === parseInt(month))?.label
          } ${year}.`,
          severity: "error",
        });
      } else if (err.response?.status === 400) {
        setError("Invalid year or month. Please try again.");
        setSnackbar({
          open: true,
          message: "Invalid year or month. Please try again.",
          severity: "error",
        });
      } else {
        setError("Failed to load payslip data. Please try again.");
        setSnackbar({
          open: true,
          message: "Failed to load payslip data. Please try again.",
          severity: "error",
        });
      }
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = document.getElementById("payslip-container");
    const opt = {
      margin: 5,
      filename: `payslip_${
        payslipData.employee_id || "unknown"
      }_${formatSalaryMonth(payslipData.salary_month)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css"], avoid: ["table", "tr", "td"] },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        if (totalPages > 1) {
          pdf.deletePage(2);
        }
        pdf.save();
      });
  };

  const handleGeneratePayslip = () => {
    if (selectedMonth && selectedYear) {
      const { empId } = getAuthToken();
      if (empId) {
        const newDate = new Date(selectedYear, selectedMonth - 1);
        setSelectedDate(newDate);
        setLoading(true);
        setPayslipData(null);
        fetchPayslipData(
          empId,
          selectedYear.toString(),
          selectedMonth.toString()
        );
        setOpenDialog(false);
      } else {
        setError("Employee ID missing. Please log in again.");
        setSnackbar({
          open: true,
          message: "Employee ID missing. Please log in again.",
          severity: "error",
        });
        setOpenDialog(false);
      }
    } else {
      setSnackbar({
        open: true,
        message: "Please select a month and year.",
        severity: "warning",
      });
    }
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatSalaryMonth = (salaryMonth) => {
    try {
      if (!salaryMonth || salaryMonth === "N/A") {
        return selectedDate
          .toLocaleString("en-US", { month: "long", year: "numeric" })
          .toUpperCase();
      }
      const [year, month] = salaryMonth.split("-");
      const date = new Date(year, month - 1);
      return date
        .toLocaleString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
    } catch {
      return selectedDate
        .toLocaleString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Box sx={{ 
        // width: '250px', 
        flexShrink: 0, 
        bgcolor: '#f8f9fa',
        zIndex: 1000,
      }}>
        <DynamicSidebar />
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Box 
          ref={navbarRef}
          sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 1100,
            bgcolor: '#f8f9fa'
          }}
        >
          <AppNavbar />
        </Box>
        <Box sx={{ p: 2, mt: `${navbarHeight}px` }}>
          {loading ? (
            <Box>Loading payslip...</Box>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleDialogOpen}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    padding: "6px 12px",
                  }}
                >
                  Select Month and Year
                </Button>
                {payslipData && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={downloadPDF}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      padding: "6px 12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    Download Payslip
                  </Button>
                )}
                <Dialog open={openDialog} onClose={handleDialogClose}>
                  <DialogTitle>Select Month and Year</DialogTitle>
                  <DialogContent>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <FormControl
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          label="Month"
                        >
                          {months.map((month) => (
                            <MenuItem key={month.value} value={month.value}>
                              {month.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          label="Year"
                        >
                          {years.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button
                      onClick={handleGeneratePayslip}
                      disabled={!selectedMonth || !selectedYear}
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontSize: "0.875rem",
                        padding: "6px 12px",
                      }}
                    >
                      Submit
                    </Button>
                  </DialogActions>
                </Dialog>
              </Box>

              {error && !payslipData && (
                <Box>
                  <Box>{error}</Box>
                  <Snackbar
                    open={snackbar.open}
                    autoHideDuration={5000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  >
                    <Alert
                      onClose={handleSnackbarClose}
                      severity={snackbar.severity}
                      sx={{ width: "100%" }}
                    >
                      {snackbar.message}
                    </Alert>
                  </Snackbar>
                </Box>
              )}
              {payslipData && (
                <div className="payslip-container" id="payslip-container">
                  <header className="payslip-header">
                    <img
                      src="image.png"
                      alt="Company Logo"
                      className="company-logo"
                    />
                    <h2 className="payslip-title">
                      PAYSLIP FOR THE MONTH OF{" "}
                      {formatSalaryMonth(payslipData.salary_month)}
                    </h2>
                  </header>

                  <section className="company-details">
                    <h3>Cofomo Tech</h3>
                    <p>Plot no. 38 & 37, Hunters Quest, 5th floor,</p>
                    <p>Vittal Rao Nagar, Madhapur, HITEC City,</p>
                    <p>Hyderabad, Telangana - 500081</p>
                  </section>

                  <section className="employee-details">
                    <h3>Employee Details *</h3>
                    <table>
                      <tbody>
                        <tr>
                          <td>Employee ID</td>
                          <td>{payslipData.employee_id || "N/A"}</td>
                          <td>Employee Name</td>
                          <td>{payslipData.employee_name || "N/A"}</td>
                        </tr>
                        <tr>
                          <td>Designation</td>
                          <td>{payslipData.designation || "N/A"}</td>
                          <td>Department</td>
                          <td>{payslipData.department || ""}</td>
                        </tr>
                        <tr>
                          <td>Date of Joining</td>
                          <td>{payslipData.date_of_joining || "N/A"}</td>
                          <td>PAN</td>
                          <td>{payslipData.pan || "N/A"}</td>
                        </tr>
                        <tr>
                          <td>UAN</td>
                          <td>{payslipData.uan || "N/A"}</td>
                          <td>Days in Month</td>
                          <td>{payslipData.total_days_in_month || "0"}</td>
                        </tr>
                        <tr>
                          <td>Bank Name</td>
                          <td>{payslipData.bank_name || ""}</td>
                          <td>Account Number</td>
                          <td>{payslipData.bank_account_no || ""}</td>
                        </tr>
                        <tr>
                          <td>LOP Days</td>
                          <td>{payslipData.lop_days || "0"}</td>
                          <td>PF Number</td>
                          <td>{payslipData.pf_number || ""}</td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  <section className="paySummary">
                    <h3>Pay Summary *</h3>
                    <table>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Earnings</strong>
                          </td>
                          <td>
                            <strong>Amount</strong>
                          </td>
                          <td>
                            <strong>Deductions</strong>
                          </td>
                          <td>
                            <strong>Amount</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>Basic Salary</td>
                          <td>{payslipData.basic_salary.toFixed(2)}</td>
                          <td>Provident Fund</td>
                          <td>{payslipData.provident_fund.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>House Rent Allowance</td>
                          <td>{payslipData.house_rent_allowance.toFixed(2)}</td>
                          <td>ESIC</td>
                          <td>{payslipData.esic.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Conveyance Allowance</td>
                          <td>{payslipData.conveyance_allowance.toFixed(2)}</td>
                          <td>PT</td>
                          <td>{payslipData.professional_tax.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Other Allowance</td>
                          <td>{payslipData.other_allowance.toFixed(2)}</td>
                          <td>TDS</td>
                          <td>{payslipData.tds.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Gross Earnings</strong>
                          </td>
                          <td>
                            <strong>{payslipData.gross_earnings.toFixed(2)}</strong>
                          </td>
                          <td>
                            <strong>Total Deductions</strong>
                          </td>
                          <td>
                            <strong>{payslipData.total_deductions.toFixed(2)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  <footer className="payslip-footer">
                    <table>
                      <tbody>
                        <tr>
                          <td colSpan="3">
                            <strong>Total Net Payable</strong>
                          </td>
                          <td>
                            <strong className="money">
                              {payslipData.monthly_net_pay.toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="4">Gross Earnings - Total Deductions</td>
                        </tr>
                      </tbody>
                    </table>
                    <p>Amount in Words:</p>
                    <p>
                      <strong>
                        {numberToWords(Math.round(payslipData.monthly_net_pay))}
                      </strong>
                    </p>
                  </footer>

                  <style>
                    {`
                      .money {
                        padding-left: 100px;
                      }
                      .payslip-container {
                        width: 200mm;
                        max-height: 200mm;
                        margin: 0 auto;
                        padding: 15mm;
                        box-sizing: border-box;
                        border: 2px solid black;
                        overflow: hidden;
                      }
                      .payslip-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                      }
                      .company-logo {
                        width: 15%;
                        height: auto;
                      }
                      .payslip-title {
                        margin: 0;
                        text-align: right;
                        font-size: 15px;
                        font-weight: bold;
                      }
                      .company-details {
                        margin-bottom: 10px;
                      }
                      .company-details p {
                        margin: 0;
                        line-height: 1.2;
                      }
                      .employee-details,
                      .paySummary {
                        margin-bottom: 10px;
                      }
                      h3 {
                        font-size: 16px;
                        margin-bottom: 5px;
                        margin: 0;
                        font-weight: bold;
                      }
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        font-size: 12px;
                      }
                      table,
                      th,
                      td {
                        border: 1px solid black;
                      }
                      td {
                        padding: 2px;
                        text-align: left;
                        vertical-align: middle;
                      }
                      .paySummary td:nth-child(2),
                      .paySummary td:nth-child(4),
                      .paySummary td:nth-child(3) {
                        text-align: right !important;
                      }
                      tr {
                        height: auto;
                      }
                      .payslip-footer {
                        text-align: left;
                      }
                      .payslip-footer table {
                        margin: 0 auto;
                        width: 100%;
                      }
                      .payslip-footer p {
                        margin: 3px 0;
                        font-size: 12px;
                      }
                      @media print {
                        .payslip-container {
                          width: 210mm;
                          height: 297mm;
                          margin: 0;
                          padding: 15mm;
                        }
                        .MuiButton-root {
                          display: none;
                        }
                      }
                    `}
                  </style>
                </div>
              )}
              <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <Alert
                  onClose={handleSnackbarClose}
                  severity={snackbar.severity}
                  sx={{ width: "100%" }}
                >
                  {snackbar.message}
                </Alert>
              </Snackbar>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Payslipdown;