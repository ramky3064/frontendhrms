import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AirlineSeatIndividualSuiteIcon from '@mui/icons-material/AirlineSeatIndividualSuite';
import {
  Home,
  PersonAdd,
  Assignment,
  Build,
  People,
  CalendarToday,
  MonetizationOn,
  KeyboardArrowDown,
  KeyboardArrowUp,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const HrSidebar = () => {
  const navigate = useNavigate();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);

  // Get role from localStorage
  const role = localStorage.getItem('userRole');

  const handleHomeClick = () => {
    switch (role) {
      case 'HR':
        navigate('/hr-dashboard');
        break;
      case 'Manager':
        navigate('/manager-dashboard');
        break;
      case 'Employee':
        navigate('/employee-dashboard');
        break;
      case 'Admin':
        navigate('/ceo-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  // Base menu items
  const baseMenuItems = [
    { name: 'Home', icon: <Home fontSize="small" />, to: '#' },
    {
      name: 'Attendance',
      icon: <Assignment fontSize="small" />,
      to: '/attendance',
      hasDropdown: true,
      dropdownItems: [
        { name: 'My attendance', to: '/calendar' },
        { name: 'Employees Attendance History', to: '/history' },
      ],
    },
    { name: 'Onboarding', icon: <PersonAdd fontSize="small" />, to: '/parse-resume' },
    { name: 'Edit Employee', icon: <Build fontSize="small" />, to: '/viewall-employees' },
    { name: 'All Employees', icon: <People fontSize="small" />, to: '/viewall-employees' },
    { name: 'Add Employee', icon: <CalendarToday fontSize="small" />, to: '/add-employee' },
    { name: 'Payslip', icon: <MonetizationOn fontSize="small" />, to: '/slip' },
    {
      name: 'Payroll Management',
      icon: <MonetizationOn fontSize="small" />,
      to: '/',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Add Payroll', to: '/managepay' },
        { name: 'Edit Payroll', to: '/payslipedit' },
      ],
    },
    { name: 'Leave Management', icon: <AirlineSeatIndividualSuiteIcon fontSize="small" />, to: '/leave-management' },
    { name: 'Manage Tasks', icon: <AssignmentTurnedIn fontSize="small" />, to: '/manage-tasks' },
  ];

  // Role-based menu filtering
  let menuItems = [];
  if (role === 'HR' || role === 'Admin') {
    menuItems = baseMenuItems; // HR and Admin get all menu items
  } else if (role === 'Employee') {
    menuItems = baseMenuItems.filter(item => 
      item.name === 'Home' ||
      (item.name === 'Attendance' && item.dropdownItems ? 
        { ...item, dropdownItems: item.dropdownItems.filter(di => di.name === 'My attendance') } : 
        false
      ) ||
      item.name === 'Payslip' ||
      item.name === 'Leave Management' ||
      item.name === 'All Employees'
    );
  } else if (role === 'Manager') {
    menuItems = baseMenuItems.filter(item => 
      item.name === 'Home' ||
      (item.name === 'Attendance' && item.dropdownItems ? 
        { ...item, dropdownItems: item.dropdownItems.filter(di => di.name === 'My attendance') } : 
        false
      ) ||
      item.name === 'Payslip' ||
      item.name === 'Leave Management' ||
      item.name === 'All Employees' ||
      item.name === 'Manage Tasks'
    );
  }

  return (
    <div
      className="text-white d-flex flex-column p-3"
      style={{
        width: '260px',
        height: '100vh',
        background: 'linear-gradient(135deg, #2c3e50, #3498db)',
        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
        borderRadius: '10px 0 0 10px',
        overflowY: 'auto',
        position: 'sticky',
        top: '0',
        zIndex: '1000',
      }}
    >
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .sidebar-item {
            background-color: transparent !important;
            color: white !important;
            border: none !important;
            transition: background 0.3s, transform 0.2s;
            display: flex;
            align-items: center;
            padding: 15px 10px;
            text-decoration: none;
            cursor: pointer;
            border-radius: 5px;
          }
          .sidebar-item:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            transform: translateX(5px);
          }
          .sidebar-item-icon {
            margin-right: 12px;
            color: #fff;
          }
          .sidebar-item-text {
            display: inline;
            white-space: nowrap;
            font-size: 14px;
            flex-grow: 1;
          }
          .dropdown-icon {
            color: #fff;
            margin-left: auto;
          }
          h4 {
            font-size: 18px;
            margin-bottom: 20px;
            text-align: center;
            display: block;
          }
          .dropdown-item {
            color: white !important;
            padding: 10px 10px 10px 35px;
            font-size: 13px;
            display: block;
            text-decoration: none;
            transition: background 0.3s;
          }
          .dropdown-itemTES:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
          }
          .dropdown-container {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
        `}
      </style>

      <h4 className="mb-4 text-center">HRMS</h4>

      <div className="d-flex flex-column gap-2 flex-grow-1">
        <ListGroup variant="flush" className="w-100">
          {menuItems.map((item, index) => (
            item.name === 'Home' ? (
              <div
                className="sidebar-item"
                key={index}
                onClick={handleHomeClick}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-text">{item.name}</span>
              </div>
            ) : item.hasDropdown ? (
              <div key={index}>
                <div
                  className="sidebar-item"
                  onClick={() =>
                    item.name === 'Attendance'
                      ? setIsAttendanceOpen(!isAttendanceOpen)
                      : setIsPayrollOpen(!isPayrollOpen)
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-text">{item.name}</span>
                  <span className="dropdown-icon">
                    {item.name === 'Attendance'
                      ? isAttendanceOpen
                        ? <KeyboardArrowUp fontSize="small" />
                        : <KeyboardArrowDown fontSize="small" />
                      : isPayrollOpen
                        ? <KeyboardArrowUp fontSize="small" />
                        : <KeyboardArrowDown fontSize="small" />}
                  </span>
                </div>
                <div
                  className="dropdown-container"
                  style={{
                    maxHeight:
                      (item.name === 'Attendance' && isAttendanceOpen) ||
                      (item.name === 'Payroll Management' && isPayrollOpen)
                        ? '100px'
                        : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-out',
                  }}
                >
                  {item.dropdownItems.map((dropdownItem, idx) => (
                    <Link
                      to={dropdownItem.to}
                      className="dropdown-item"
                      key={idx}
                    >
                      {dropdownItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link to={item.to} className="sidebar-item" key={index}>
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-text">{item.name}</span>
              </Link>
            )
          ))}
        </ListGroup>
      </div>
    </div>
  );
};

export default HrSidebar;