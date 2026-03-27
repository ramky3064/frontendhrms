import React, { createContext, useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { SpeedInsights } from "@vercel/speed-insights/react";

import LoginPage from "./components/loginpage.jsx";
import ForgotPassword from "./components/forgotpass.jsx";
import OTPPage from "./components/otp.jsx";
import ResetPassword from "./components/Resetpassword.jsx";
import FirstUserMail from "./components/FirstUserMail.jsx";
import SignupPage from "./components/Signup.jsx";
import ManagerDashboard from "./components/manager.jsx";
import CEOComponent from "./components/Admin.jsx";
import EmpDashboard from "./components/Emp.jsx";
import Apps from "./components/Bind.jsx";
import PunchSystem from "./components/geo.jsx";
import EmployeeForm from "./components/Addemployee.jsx";
import ActiveEmployees from "./components/Activeemployees.jsx";
import EmployeeUForm from "./components/Updateemployee.jsx";
import ResumeParser from "./components/ResumeParser.jsx";
import LeaveRequestForm from "./components/leaveRequestForm.jsx";
import LeaveApprovalForm from "./components/LeaveApprovalForm.jsx";
import ProjectManagement from "./components/createProject.jsx";
import LeaveManagementPage from "./components/allpage.jsx";
import EmployeeRequestForm from "./components/icons/employeeRequestForm.jsx";
import ViewEmployee from "./components/Viewemployee.jsx";
import PendingLeaveRequests from "./components/icons/pending.jsx";
import PayslipEdit from "./components/ViewAndEditPay.jsx";
import ManagePayslip from "./components/ManagePayslip.jsx";
import Payslipdown from "./components/slip.jsx";
import Histroy from "./components/histroy.jsx";
import EmployeeAttendanceCalendar from "./components/Calendar.jsx";
import ActiveEmployeesPage from "./components/ActiveEmployeesPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import Chatting from "./components/Chatting.jsx";
import DurationAdjustment from "./components/DurationAdjustment.jsx";
import Raccept from "./components/Raccept.jsx";
import UserFeed from "./components/Feed.jsx";
import GiveFeedback from "./components/GiveFeedback.jsx";
import ViewFeedback from "./components/ViewFeedback.jsx";
import InterviewProcess from "./components/Interview.jsx";
import NotificationsBar from "./components/NotificationsBar.jsx";
import ProjectTree from "./components/Projecttree.jsx";
import Todo from "./components/ToDo.jsx";
// import Todo from "./components/todo.jsx";

// Create Snackbar context
const SnackbarContext = createContext();
export const useSnackbar = () => useContext(SnackbarContext);

// ProtectedRoute component to enforce OTP verification and role-based access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const empId = sessionStorage.getItem("empId");
  const token = localStorage.getItem(`token_${empId}`);
  const userRole = localStorage.getItem("userRole");
  const otpVerified = sessionStorage.getItem("otpVerified");

  if (!token || !empId || otpVerified !== "true") {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      localStorage.removeItem(`token_${empId}`);
      sessionStorage.removeItem("empId");
      sessionStorage.removeItem("otpVerified");
      sessionStorage.removeItem("otpVerifiedTimestamp");
      localStorage.removeItem("userRole");
      sessionStorage.removeItem("userRole");
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem(`token_${empId}`);
    sessionStorage.removeItem("empId");
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("otpVerifiedTimestamp");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Function to show Snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      <SpeedInsights />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/loginpage" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OTPPage />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/first-mail" element={<FirstUserMail />} />
          <Route path="/reg-approvals" element={<Raccept />} />
          <Route path="/feed" element={<UserFeed />} />
          <Route path="/giveFeedback" element={<GiveFeedback />} />
          <Route path="/viewFeedbacks" element={<ViewFeedback />} />
          <Route path="/userfeed" element={<UserFeed />} />
          {/* <Route path="/notifications" element={<NotificationsBar />} /> */}

          {/* Protected Routes */}
          <Route
            path="/hr-dashboard"
            element={
              <ProtectedRoute allowedRoles={["HR"]}>
                <Apps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Manager"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Employee"]}>
                <EmpDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <CEOComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-employee"
            element={
              <ProtectedRoute >
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-employee/:empId?"
            element={
              <ProtectedRoute >
                <EmployeeUForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewall-employees"
            element={
              <ProtectedRoute >
                <ActiveEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/geofence"
            element={
              <ProtectedRoute >
                <PunchSystem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parse-resume"
            element={
              <ProtectedRoute >
                <ResumeParser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-request"
            element={
              <ProtectedRoute >
                <LeaveRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-approval"
            element={
              <ProtectedRoute >
                <LeaveApprovalForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-project"
            element={
              <ProtectedRoute >
                <ProjectManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-management"
            element={
              <ProtectedRoute >
                <LeaveManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Employee-request-form"
            element={
              <ProtectedRoute >
                <EmployeeRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wfh-request-form"
            element={
              <ProtectedRoute >
                <EmployeeRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-employee/:emp_id"
            element={
              <ProtectedRoute >
                <ViewEmployee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending"
            element={
              <ProtectedRoute >
                <PendingLeaveRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payslipedit"
            element={
              <ProtectedRoute >
                <PayslipEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/managepay"
            element={
              <ProtectedRoute >
                <ManagePayslip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/slip"
            element={
              <ProtectedRoute >
                <Payslipdown />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute >
                <Histroy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute >
                <EmployeeAttendanceCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/active-employees"
            element={
              <ProtectedRoute >
                <ActiveEmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["Employee", "Manager", "HR", "Admin"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/duration-adjustment/:attendance_id"
            element={
              <ProtectedRoute >
                <DurationAdjustment />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/todo"
            element={
              <ProtectedRoute allowedRoles={["Employee", "Manager", "HR", "Admin"]}>
                <Todo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tree"
            element={
              <ProtectedRoute allowedRoles={["Manager", "HR", "Admin"]}>
                <ProjectTree />
              </ProtectedRoute>
            }
          />

          <Route
            path="/logout"
            element={
              <Navigate
                to="/login"
                replace
                state={{ fromLogout: true }}
              />
            }
          />

          <Route
            path="/interviewProcess"
            element={
              <ProtectedRoute allowedRoles={["Manager", "HR", "Admin"]}>
                <InterviewProcess />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export default App;



// import React, { createContext, useContext, useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { Snackbar, Alert } from "@mui/material";

// import LoginPage from "./components/loginpage.jsx";
// import ForgotPassword from "./components/forgotpass.jsx";
// import MailOtp from "./components/Mailotp.jsx";
// import ResetPassword from "./components/Resetpassword.jsx";
// import Apps from "./components/Bind.jsx";
// // import AttendanceComponent from './components/Attendence';
// // import LeaveDashboard from './components/leaves.jsx';
// // import PayrollComponent from './components/payroll.jsx';
// // import CandidateDetailsForm from './components/onboard.jsx';
// import SignupPage from "./components/Signup.jsx";
// import Resetmaill from "./components/userfirstreset.jsx";
// import ManagerDashboard from "./components/manager.jsx";
// import CEOComponent from "./components/Admin.jsx";
// import EmpDashboard from "./components/Emp.jsx";
// import PunchSystem from "./components/geo.jsx";
// import EmployeeForm from "./components/Addemployee.jsx";
// import ActiveEmployees from "./components/Activeemployees.jsx";
// // import ViewEmployee from './components/ViewEmployee.jsx';
// import EmployeeUForm from "./components/Updateemployee.jsx";
// // import Payslip from './components/Payslip.jsx';
// import ResumeParser from "./components/ResumeParser.jsx";
// import OTPPage from "./components/otp.jsx";
// import FirstUserReset from "./components/userfirstreset.jsx";
// import Resetmail from "./components/Firstreset.jsx";
// import FirstUserMail from "./components/FirstUserMail.jsx";
// import LeaveApplication from "./components/leaveRequestForm.jsx";
// import LeaveApp from "./components/leaveRequestForm.jsx";
// import LeaveRequestForm from "./components/leaveRequestForm.jsx";
// import LeaveApprovalForm from "./components/LeaveApprovalForm.jsx";
// import CreateProject from "./components/createProject.jsx";
// import ProjectManagement from "./components/createProject.jsx";
// import ChatApp from "./components/Chatting.jsx";
// import LeaveManagementPage from "./components/allpage.jsx";
// import EmployeeRequestForm from "./components/icons/employeeRequestForm.jsx";
// import ViewEmployee from "./components/Viewemployee.jsx";
// import PendingLeaveRequests from "./components/icons/pending.jsx";
// import PayslipEdit from "./components/ViewAndEditPay.jsx";
// import ManagePayslip from "./components/ManagePayslip.jsx";
// import Payslipdown from "./components/slip.jsx";
// import Histroy from "./components/histroy.jsx";
// import EmployeeAttendanceCalendar from "./components/Calendar.jsx";
// import ActiveEmployeesPage from "./components/ActiveEmployeesPage.jsx";
// import ProfilePage from "./components/ProfilePage.jsx";
// import Chatting from "./components/Chatting.jsx";
// import NChatting from "./components/Chatting.jsx";
// import DurationAdjustment from "./components/DurationAdjustment.jsx";
// import WorkingHoursChart from "./components/Progress.jsx";
// // import Chaticon from './components/icon.jsx';

// // Create Snackbar context
// const SnackbarContext = createContext();

// export const useSnackbar = () => useContext(SnackbarContext);

// function App() {
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [snackbarSeverity, setSnackbarSeverity] = useState("success");

//   // Function to show Snackbar
//   const showSnackbar = (message, severity = "success") => {
//     setSnackbarMessage(message);
//     setSnackbarSeverity(severity);
//     setSnackbarOpen(true);
//   };

//   // Handle Snackbar close
//   const handleSnackbarClose = (event, reason) => {
//     if (reason === "clickaway") {
//       return;
//     }
//     setSnackbarOpen(false);
//   };

//   return (
//     <SnackbarContext.Provider value={{ showSnackbar }}>
//       <Router>
//         <Routes>
//           <Route path="/" element={<LoginPage />} />
//           <Route path="/loginpage" element={<LoginPage />} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/mailotp" element={<MailOtp />} />
//           <Route path="/otp" element={<OTPPage />} />
//           <Route path="/resetpassword" element={<ResetPassword />} />
//           <Route path="/dashboard" element={<Apps />} />
//           <Route path="/hr-dashboard" element={<Apps />} />
//           <Route path="/Bind-dashboard" element={<Apps />} />
//           {/* <Route path="/attendance" element={<AttendanceComponent />} /> */}
//           {/* <Route path="/leaves" element={<LeaveDashboard />} /> */}
//           {/* <Route path="/onboard" element={<CandidateDetailsForm />} /> */}
//           <Route path="/signup" element={<SignupPage />} />
//           <Route path="/resetmail" element={<Resetmaill />} />
//           <Route path="/manager-dashboard" element={<ManagerDashboard />} />
//           <Route path="/ceo-dashboard" element={<CEOComponent />} />
//           <Route path="/employee-dashboard" element={<EmpDashboard />} />
//           <Route path="/add-employee" element={<EmployeeForm />} />
//           <Route path="/edit-employee/:empId?" element={<EmployeeUForm />} />
//           <Route path="/viewall-employees" element={<ActiveEmployees />} />
//           <Route path="/geofence" element={<PunchSystem />} />
//           {/* <Route path="/view-employee/:emp_id" element={<ViewEmployee />} /> */}
//           <Route path="/parse-resume" element={<ResumeParser />} />
//           <Route path="/first-mail" element={<FirstUserMail />} />
//           <Route path="/leave-request" element={<LeaveRequestForm />} />
//           <Route path="/leave-approval" element={<LeaveApprovalForm />} />
//           <Route path="/create-project" element={<ProjectManagement />} />
//           <Route path="/chat" element={<NChatting />} />
//           <Route path="/leave-management" element={<LeaveManagementPage />} />
//           <Route
//             path="/Employee-request-form"
//             element={<EmployeeRequestForm />}
//           />
//           <Route path="/view-employee/:emp_id" element={<ViewEmployee />} />
//           <Route path="/pending" element={<PendingLeaveRequests />} />
//           <Route path="/payslipedit" element={<PayslipEdit />} />
//           <Route path="/managepay" element={<ManagePayslip />} />
//           <Route path="/slip" element={<Payslipdown />} />
//           <Route path="/history" element={<Histroy />} />
//           <Route path="/calendar" element={<EmployeeAttendanceCalendar />} />
//           {/* <Route path="/icon" element={<Chaticon />} /> */}
//           <Route path="/active-employees" element={<ActiveEmployeesPage />} />
//           <Route path="/profile" element={<ProfilePage />} />
//           <Route path="/today-progress" element={<WorkingHoursChart />} />

//           <Route
//             path="/duration-adjustment/:attendance_id"
//             element={<DurationAdjustment />}
//           />
//           <Route path="/wfh-request-form" element={<EmployeeRequestForm />} />
//         </Routes>
//       </Router>
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={6000}
//         onClose={handleSnackbarClose}
//         anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
//       >
//         <Alert
//           onClose={handleSnackbarClose}
//           severity={snackbarSeverity}
//           sx={{ width: "100%" }}
//         >
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </SnackbarContext.Provider>
//   );
// }

// export default App;
