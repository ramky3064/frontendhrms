import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useSnackbar } from "../App";
import { Box, Typography, TextField, Button as BSButton } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import md5 from "md5";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");
const OTPPage = () => {
  const [error, setError] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [view, setView] = useState("enterOTP");
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const inputRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));

  const { state } = location;
  const isPasswordReset = state?.isPasswordReset || false;
  const isLoginOTP = state?.isLoginOTP || false;
  const email = state?.email;
  const empId = state?.empId || sessionStorage.getItem("empId") || localStorage.getItem("empId");

  const otpSchema = Yup.object({
    otp: Yup.string()
      .length(6, "OTP must be 6 digits")
      .required("OTP is required"),
  });

  const handleResendOTP = async (setFieldValue) => {
    if (resendCooldown > 0 || isResending || !isLoginOTP) return;

    setIsResending(true);
    setResendCooldown(30);

    const token = localStorage.getItem(`token_${empId}`);

    if (!token || !empId) {
      setError("Token or employee ID missing. Please try again.");
      showSnackbar("Token or employee ID missing. Please try again.", "error");
      setIsResending(false);
      setResendCooldown(0);
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/login_resend_otp`,
        {},
        { headers: { Authorization: token } }
      );
      setFieldValue("otp", "");
      showSnackbar("OTP resent successfully to your email", "success");
      setView("enterOTP");
    } catch (err) {
      console.error("Resend OTP error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError("Invalid or expired token. Please log in again.");
        showSnackbar("Invalid or expired token. Please log in again.", "error");
        navigate("/login");
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your credentials.");
        showSnackbar("User not found. Please check your credentials.", "error");
      } else {
        setError("Failed to resend OTP. Please try again.");
        showSnackbar("Failed to resend OTP. Please try again.", "error");
      }
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!email && !empId) {
      showSnackbar("Invalid access. Please log in.", "error");
      navigate("/login");
    }
  }, [email, empId, navigate]);

  const handleVerifyOTP = async (values, { setFieldValue }) => {
    const { otp } = values;
    let token;
    let localEmpId = empId;

    console.log("Initial empId:", empId);
    console.log("Local empId:", localEmpId);

    if (isPasswordReset) {
      if (!email) {
        setError("Email missing. Please try again.");
        showSnackbar("Email missing. Please try again.", "error");
        navigate("/forgot-password");
        return;
      }

      try {
        console.log("Sending OTP verification for email:", email, "OTP:", otp);
        const response = await axios.post(
          `${API_URL}/verify_otp_forgot_password`,
          { otp, email }
        );

        const { token: newToken } = response.data;
        if (!newToken) {
          throw new Error("Token not found in response");
        }

        try {
          const decoded = jwtDecode(newToken);
          localEmpId = decoded.sub || decoded.emp_id || decoded.user_id || md5(newToken);
        } catch (error) {
          console.error("Error decoding token:", error);
          localEmpId = md5(newToken);
        }

        localStorage.setItem(`token_${localEmpId}`, newToken);
        sessionStorage.setItem("empId", localEmpId);
        localStorage.setItem("empId", localEmpId);

        console.log("Stored token for empId:", localEmpId, "Token:", newToken);

        showSnackbar("OTP verified successfully", "success");
        navigate("/first-mail", { state: { empId: localEmpId, email } });
      } catch (err) {
        console.error("OTP verification error:", err.response?.data || err.message);
        setError("Invalid or expired OTP. Please try again.");
        showSnackbar("Invalid or expired OTP. Please try again.", "error");
        setView("otpError");
      }
      return;
    }

    if (localEmpId) {
      token = localStorage.getItem(`token_${localEmpId}`);
    }

    if (!token) {
      token = localStorage.getItem("token");
      if (token && !localEmpId) {
        try {
          const decoded = jwtDecode(token);
          localEmpId = decoded.sub || decoded.emp_id || decoded.user_id || md5(token);
          localStorage.setItem(`token_${localEmpId}`, token);
          sessionStorage.setItem("empId", localEmpId);
          localStorage.setItem("empId", localEmpId);
        } catch (error) {
          console.error("Error decoding fallback token:", error);
          localEmpId = md5(token);
          localStorage.setItem(`token_${localEmpId}`, token);
          sessionStorage.setItem("empId", localEmpId);
          localStorage.setItem("empId", localEmpId);
        }
      }
    }

    console.log("Token:", token);
    if (!token || !localEmpId) {
      setError("Token or employee ID missing. Please try again.");
      showSnackbar("Token or employee ID missing. Please try again.", "error");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/verify_otp`,
        { otp },
        { headers: { Authorization: token } }
      );

      const { role, require_password_reset } = response.data;
      localStorage.setItem("userRole", role);
      sessionStorage.setItem("empId", localEmpId);
      localStorage.setItem("empId", localEmpId);
      sessionStorage.setItem("otpVerified", "true");
      sessionStorage.setItem("otpVerifiedTimestamp", Date.now().toString());

      showSnackbar("OTP verified successfully", "success");

      if (require_password_reset) {
        navigate("/first-mail", { state: { empId: localEmpId, email } });
      } else {
        switch (role) {
          case "HR":
            navigate("/hr-dashboard");
            break;
          case "Manager":
            navigate("/manager-dashboard");
            break;
          case "Employee":
            navigate("/employee-dashboard");
            break;
          case "Admin":
            navigate("/ceo-dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err.response?.data || err.message);
      setError("Invalid or expired OTP. Please try again.");
      showSnackbar("Invalid or expired OTP. Please try again.", "error");
      setView("otpError");
    }
  };

  const textFieldStyles = {
    '& .MuiInputBase-root': {
      color: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#fff',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#fff',
    },
    '& .MuiFormHelperText-root': {
      color: '#ffc107'
    }
  };

  const renderView = () => {
    switch (view) {
      case "enterOTP":
        return (
          <>
            <Box textAlign="center" mb={3}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Cofomo Tech
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                Enter the OTP sent to your email
              </Typography>
            </Box>

            <Formik
              initialValues={{ otp: "" }}
              validationSchema={otpSchema}
              onSubmit={handleVerifyOTP}
            >
              {({ values, setFieldValue, isSubmitting }) => (
                <Form>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    {inputRefs.current.map((ref, index) => (
                      <TextField
                        key={index}
                        inputRef={ref}
                        value={values.otp[index] || ""}
                        onChange={(e) => {
                          const { value } = e.target;
                          if (/^\d?$/.test(value)) {
                            const otpArray = values.otp.split("");
                            otpArray[index] = value;
                            const newOtp = otpArray.join("").padEnd(6, "");
                            setFieldValue("otp", newOtp);

                            if (
                              value &&
                              index < 5 &&
                              inputRefs.current[index + 1]?.current
                            ) {
                              inputRefs.current[index + 1].current.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !values.otp[index] &&
                            index > 0
                          ) {
                            inputRefs.current[index - 1]?.current?.focus();
                          }
                        }}
                        variant="outlined"
                        inputProps={{
                          maxLength: 1,
                          style: {
                            textAlign: 'center',
                            fontSize: '20px',
                            width: '48px',
                            height: '48px',
                            padding: '0',
                          },
                        }}
                        sx={{
                          width: '48px',
                          ...textFieldStyles,
                          '& .MuiInputBase-root': {
                            ...textFieldStyles['& .MuiInputBase-root'],
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                          },
                        }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ color: '#ffc107', mb: 3, textAlign: 'center' }}>
                    <ErrorMessage name="otp" component="div" />
                    {error && <div>{error}</div>}
                  </Box>

                  <BSButton
                    type="submit"
                    className="w-100 py-2"
                    style={{
                      backgroundColor: '#4fb9ed',
                      borderColor: '#4fb9ed',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: '15px',
                      borderRadius: '6px',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3ba8d7'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4fb9ed'}
                    disabled={isSubmitting}
                  >
                    Verify OTP
                  </BSButton>

                  {isLoginOTP && (
                    <Box mt={2} textAlign="center">
                      <BSButton
                        variant="link"
                        onClick={() => handleResendOTP(setFieldValue)}
                        disabled={isResending || resendCooldown > 0}
                        style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
                      >
                        {resendCooldown > 0
                          ? `Resend OTP in ${resendCooldown}s`
                          : "Resend OTP"}
                      </BSButton>
                    </Box>
                  )}

                  <Box mt={2} textAlign="center">
                    <Link
                      to="/login"
                      style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
                    >
                      Back to Login
                    </Link>
                  </Box>
                </Form>
              )}
            </Formik>
          </>
        );

      case "otpError":
        return (
          <Box textAlign="center">
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
              OTP Verification Failed
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" mb={3}>
              {error || "Invalid or expired OTP. Please try again."}
            </Typography>
            <BSButton
              onClick={() => setView("enterOTP")}
              style={{
                backgroundColor: '#4fb9ed',
                borderColor: '#4fb9ed',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '15px',
                borderRadius: '6px',
                padding: '10px 20px',
                marginRight: '10px',
              }}
            >
              Try Again
            </BSButton>
            {isLoginOTP && (
              <BSButton
                variant="link"
                onClick={() => handleResendOTP(() => { })}
                disabled={isResending || resendCooldown > 0}
                style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
              >
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend OTP"}
              </BSButton>
            )}
            <Box mt={2}>
              <Link
                to="/login"
                style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
              >
                Back to Login
              </Link>
            </Box>
          </Box>
        );

      case "passwordResetSuccess":
        return (
          <Box textAlign="center">
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
              OTP Verified
            </Typography>
            <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" mb={3}>
              Your OTP has been successfully verified. Proceed to reset your password.
            </Typography>
            <BSButton
              onClick={() => navigate("/first-mail", { state: { empId, email } })}
              style={{
                backgroundColor: '#4fb9ed',
                borderColor: '#4fb9ed',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '15px',
                borderRadius: '6px',
                padding: '10px 20px',
              }}
            >
              Reset Password
            </BSButton>
            <Box mt={2}>
              <Link
                to="/login"
                style={{ color: '#4fb9ed', textDecoration: 'none', fontSize: '0.85rem' }}
              >
                Back to Login
              </Link>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    // Clean up only unnecessary session data
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("otpVerifiedTimestamp");
    sessionStorage.removeItem("userRole");
    localStorage.removeItem("userRole");
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: { xs: '20px', md: '0 5vw' },
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      >
        <source src="./video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: -1,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1,
        }}
      >
        {/* <img
          src="./mainLogo.png"
          alt="Dolphin Logo"
          style={{
            width: '90px',
            height: 'auto',
            objectFit: 'contain',
          }}
        /> */}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1,
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#fff',
            fontSize: '0.8rem',
            marginRight: '4px',
          }}
        >
          powered by
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#4fb9ed',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Cofomo Tech
        </Typography>
      </Box>

      <Box
        sx={{
          background: 'rgba(10, 25, 41, 0.7)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: '#fff',
          maxWidth: '380px',
          width: '100%',
          padding: { xs: '1.5rem', md: '2rem' },
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.2)'
        }}
      >
        {renderView()}
      </Box>
    </Box>
  );
};

export default OTPPage;