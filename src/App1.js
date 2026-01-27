import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// import { store, persistor } from './redux/store';

// Component Imports
import LoginPage from './components/loginpage.jsx';
import ForgotPassword from './components/forgotpass.jsx';
import MailOtp from './components/Mailotp.jsx';
import ResetPassword from './components/Resetpassword.jsx';
import Apps from './components/Bind.jsx';
import SignupPage from './components/Signup.jsx';
import Resetmaill from './components/userfirstreset.jsx';
import ManagerDashboard from './components/manager.jsx';
import CEOComponent from './components/Admin.jsx';
import EmpDashboard from './components/Emp.jsx';
import PunchSystem from './components/geo.jsx';
import EmployeeForm from './components/Addemployee.jsx';
import ActiveEmployees from './components/Activeemployees.jsx';
import EmployeeUForm from './components/Updateemployee.jsx';
import ResumeParser from './components/ResumeParser.jsx';
import OTPPage from './components/otp.jsx';
import Resetmail from './components/Firstreset.jsx';
import FirstUserMail from './components/FirstUserMail.jsx';
import LeaveRequestForm from './components/leaveRequestForm.jsx';
import LeaveApprovalForm from './components/LeaveApprovalForm.jsx';
import ProjectManagement from './components/createProject.jsx';
import ChatApp from './components/Chatting.jsx';
import LeaveManagementPage from './components/allpage.jsx';
import EmployeeRequestForm from './components/employeeRequestForm.jsx';
import ViewEmployee from './components/Viewemployee.jsx';
import PendingLeaveRequests from './components/pending.jsx';
import { persistor, store } from './components/store.js';
import ActiveEmployeesPage from './components/ActiveEmployeesPage.jsx';

// Snackbar Context
const SnackbarContext = createContext();
export const useSnackbar = () => useContext(SnackbarContext);

function App() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SnackbarContext.Provider value={{ showSnackbar }}>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/loginpage" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/mailotp" element={<MailOtp />} />
              <Route path="/otp" element={<OTPPage />} />
              <Route path="/resetpassword" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Apps />} />
              <Route path="/hr-dashboard" element={<Apps />} />
              <Route path="/Bind-dashboard" element={<Apps />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/resetmail" element={<Resetmaill />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/ceo-dashboard" element={<CEOComponent />} />
              <Route path="/employee-dashboard" element={<EmpDashboard />} />
              <Route path="/add-employee" element={<EmployeeForm />} />
              <Route path="/edit-employee/:empId?" element={<EmployeeUForm />} />
              <Route path="/viewall-employees" element={<ActiveEmployees />} />
              <Route path="/geofence" element={<PunchSystem />} />
              <Route path="/parse-resume" element={<ResumeParser />} />
              <Route path="/first-mail" element={<FirstUserMail />} />
              <Route path="/leave-request" element={<LeaveRequestForm />} />
              <Route path="/leave-approval" element={<LeaveApprovalForm />} />
              <Route path="/create-project" element={<ProjectManagement />} />
              <Route path="/chat" element={<ChatApp />} />
              <Route path="/leave-management" element={<LeaveManagementPage />} />
              <Route path="/Employee-request-form" element={<EmployeeRequestForm />} />
              <Route path="/view-employee/:emp_id" element={<ViewEmployee />} />
              <Route path="/pending" element={<PendingLeaveRequests />} />
              <Route path="/active-employees" element={<ActiveEmployeesPage />} />

            </Routes>
          </Router>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </SnackbarContext.Provider>
      </PersistGate>
    </Provider>
  );
}

export default App;
