import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaThLarge,
  FaClipboardList,
  FaChartBar,
  FaNewspaper,
  FaCog,
  FaUser,
  FaUserPlus,
  FaUsers,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaComment,
  FaComments,
  FaClock, // Added for Duration Approvals
} from "react-icons/fa";
import { DisabledByDefault } from "@mui/icons-material";
import GiveFeedback from "./GiveFeedback";

const DynamicSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false); // State for feedback dialog
  const sidebarRef = useRef(null);
  const dropdownWrapperRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const role = (
    sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole") ||
    "Employee"
  ).trim();

  // Define color palette based on user role
  const colors =
    role.toLowerCase() === "employee"
      ? {
          dark: {
            sidebarBg: "#2b3e52",
            textAndIcon: "#D8C9AE",
            menuItemHoverBg: "#D8C9AE",
            menuItemHoverText: "#2b3e52",
            scrollbarTrack: "#D8C9AE",
            scrollbarThumb: "linear-gradient(180deg, #2b3e52 0%, #2b3e52 100%)",
            dropdownBg: "#2b3e52",
            dropdownText: "#D8C9AE",
            dropdownHoverBg: "#D8C9AE",
            dropdownHoverText: "#2b3e52",
            dropdownBorder: "#ddd",
          },
          light: {
            sidebarBg: "#D8C9AE",
            textAndIcon: "#2b3e52",
            menuItemHoverBg: "#2b3e52",
            menuItemHoverText: "#D8C9AE",
            scrollbarTrack: "#2a4b43",
            scrollbarThumb: "linear-gradient(180deg, #467a6d 0%, #e6f0eb 100%)",
            dropdownBg: "#D8C9AE",
            dropdownText: "#2b3e52",
            dropdownHoverBg: "#2b3e52",
            dropdownHoverText: "#D8C9AE",
            dropdownBorder: "#ddd",
          },
        }
      : {
          dark: {
            sidebarBg: "#2772a0",
            textAndIcon: "#ffffff",
            menuItemHoverBg: "#a0c3e8",
            menuItemHoverText: "#2772a0",
            scrollbarTrack: "#a0c3e8",
            scrollbarThumb: "linear-gradient(180deg, #2772a0 0%, #2772a0 100%)",
            dropdownBg: "#2772a0",
            dropdownText: "#ffffff",
            dropdownHoverBg: "#a0c3e8",
            dropdownHoverText: "#2772a0",
            dropdownBorder: "#ddd",
          },
          light: {
            sidebarBg: "#a0c3e8",
            textAndIcon: "#ffffff",
            menuItemHoverBg: "#2772a0",
            menuItemHoverText: "#a0c3e8",
            scrollbarTrack: "#2772a0",
            scrollbarThumb: "linear-gradient(180deg, #a0c3e8 0%, #a0c3e8 100%)",
            dropdownBg: "#a0c3e8",
            dropdownText: "#ffffff",
            dropdownHoverBg: "#2772a0",
            dropdownHoverText: "#a0c3e8",
            dropdownBorder: "#ddd",
          },
        };

  const currentColors = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    const calculateNavbarHeight = () => {
      const navbar = document.querySelector(".navbar");
      const height = navbar ? navbar.offsetHeight : 14;
      setNavbarHeight(height);
    };
    calculateNavbarHeight();
    window.addEventListener("resize", calculateNavbarHeight);
    return () => window.removeEventListener("resize", calculateNavbarHeight);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isOpen ? "200px" : "60px"
    );
  }, [isOpen]);

  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.style.height = `calc(100vh - ${navbarHeight}px)`;
    }
  }, [navbarHeight]);

  useEffect(() => () => clearTimeout(hoverTimeoutRef.current), []);

  const handleHomeClick = () => {
    switch (role.toLowerCase()) {
      case "hr":
        navigate("/hr-dashboard");
        break;
      case "manager":
        navigate("/manager-dashboard");
        break;
      case "employee":
        navigate("/employee-dashboard");
        break;
      case "admin":
        navigate("/ceo-dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const handleMouseEnter = (e) => {
    if (e?.target?.closest(".dark-mode-toggle")) return;
    clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = (e) => {
    if (e?.target?.closest(".dark-mode-toggle")) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredItem(null);
    }, 200);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleOpenFeedbackDialog = () => {
    setFeedbackDialogOpen(true);
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialogOpen(false);
  };

  const baseMenuItems = [
  { name: "Home", icon: <FaThLarge />, to: "#", hasDropdown: false },
  {
    name: "Attendance",
    icon: <FaCalendarAlt />,
    hasDropdown: true,
    dropdownItems: [
      { name: "Employees Attendance History", to: "/history" },
    ],
  },
  {
    name: "ToDo",
    icon: <FaClipboardList />,
    to: "/todo",
    hasDropdown: false,
  },
  {
    name: "Project Hierarchy",
    icon: <FaChartBar />,
    to: "/tree",
    hasDropdown: false,
  },
  {
    name: "Onboarding",
    icon: <FaUserPlus />,
    to: "/parse-resume",
    hasDropdown: false,
  },
  {
    name: "Edit Employee",
    icon: <FaCog />,
    to: "/viewall-employees",
    hasDropdown: false,
  },
  {
    name: "All Employees",
    icon: <FaUsers />,
    to: "/viewall-employees",
    hasDropdown: false,
  },
  {
    name: "Add Employee",
    icon: <FaUserPlus />,
    to: "/add-employee",
    hasDropdown: false,
  },
  {
    name: "Payslip",
    icon: <FaMoneyBillWave />,
    to: "/slip",
    hasDropdown: false,
  },
  {
    name: "Payroll",
    icon: <FaMoneyBillWave />,
    hasDropdown: true,
    dropdownItems: [
      { name: "Add Payroll", to: "/managepay" },
      { name: "Edit Payroll", to: "/payslipedit" },
    ],
  },
  {
    name: "Leaves",
    icon: <FaSignOutAlt />,
    to: "/leave-management",
    hasDropdown: false,
  },
  {
    name: "Timeline",
    icon: <FaNewspaper />,
    to: "/userfeed",
    hasDropdown: false,
  },
  {
    name: "Feedback",
    icon: role.toLowerCase() === "admin" ? <FaComments /> : <FaComment />,
    to: role.toLowerCase() === "admin" ? "/viewFeedbacks" : null,
    hasDropdown: false,
  },
  {
    name: "Duration Approvals",
    icon: <FaClock />,
    to: "/reg-approvals",
    hasDropdown: false,
  },
];

  // Modified menuItems logic
  // Modified menuItems logic
let menuItems = [];
if (role.toLowerCase() === "admin" || role.toLowerCase() === "hr") {
  menuItems = baseMenuItems; // Admin and HR get all menu items
} else if (role.toLowerCase() === "manager") {
  menuItems = baseMenuItems.filter((item) =>
    [
      "Home",
      "Attendance",
      "ToDo",
      "Project Hierarchy",
      "Payslip",
      "Leaves",
      "All Employees",
      "Timeline",
      "Feedback",
    ].includes(item.name)
  );
} else if (role.toLowerCase() === "employee") {
  menuItems = baseMenuItems
    .filter((item) =>
      ["Home", "Attendance", "ToDo", "Payslip", "Leaves", "Timeline", "Feedback"].includes(item.name)
    )
    .map((item) => {
      if (item.name === "Attendance") {
        return {
          ...item,
          dropdownItems: [],
          hasDropdown: false,
        };
      }
      return item;
    });
}

  const sidebarStyles = {
    container: {
      position: "sticky",
      left: 0,
      top: `${navbarHeight}px`,
      height: `calc(100vh - ${navbarHeight}px)`,
      backgroundColor: currentColors.sidebarBg,
      color: currentColors.textAndIcon,
      width: isOpen ? "200px" : "60px",
      minWidth: isOpen ? "200px" : "60px",
      transition: "all 0.3s ease-in-out",
      overflowY: "auto",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      scrollbarWidth: isOpen ? "thin" : "none",
      scrollbarColor: `${currentColors.scrollbarThumb} ${currentColors.scrollbarTrack}`,
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      padding: "0.75rem 1rem",
      gap: "20px",
      color: currentColors.textAndIcon,
      backgroundColor: "transparent",
      cursor: "pointer",
      transition:
        "all 0.2s ease-in-out, background-color 0.3s ease-in-out, color 0.3s ease-in-out",
      textDecoration: "none",
      position: "relative",
      flexDirection: "column",
      alignItems: isOpen ? "flex-start" : "center",
    },
    menuItemHover: {
      backgroundColor: currentColors.menuItemHoverBg,
      color: currentColors.menuItemHoverText,
    },
    icon: {
      fontSize: "1.5rem",
      color: currentColors.textAndIcon,
      transition: "color 0.3s ease-in-out",
    },
    text: {
      fontSize: "1rem",
      whiteSpace: "nowrap",
      opacity: isOpen ? 1 : 0,
      transition: "opacity 0.3s ease-in-out, color 0.3s ease-in-out",
      color: currentColors.textAndIcon,
    },
    darkModeButton: {
      padding: "10px",
      background: "transparent",
      color: currentColors.textAndIcon,
      border: "none",
      cursor: "pointer",
      fontSize: "1.2rem",
      textAlign: "center",
      width: "100%",
      marginBottom: "10px",
    },
    dropdownItem: {
      padding: "10px 15px",
      color: currentColors.dropdownText,
      textDecoration: "none",
      transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
    },
    dropdownItemHover: {
      backgroundColor: currentColors.dropdownHoverBg,
      color: currentColors.dropdownHoverText,
    },
  };

  return (
    <>
      <div
        ref={sidebarRef}
        style={sidebarStyles.container}
        className={`dynamic-sidebar ${darkMode ? "dark" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ flex: 1 }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                ...sidebarStyles.menuItem,
                ...(hoveredItem === item.name
                  ? {
                      ...sidebarStyles.menuItemHover,
                      color: currentColors.menuItemHoverText,
                    }
                  : {}),
              }}
              onMouseOver={() => setHoveredItem(item.name)}
              onMouseOut={() => !item.hasDropdown && setHoveredItem(null)}
              onClick={() => {
                if (!item.hasDropdown) {
                  if (item.name === "Home") handleHomeClick();
                  else if (item.name === "Feedback" && role.toLowerCase() !== "admin") {
                    handleOpenFeedbackDialog();
                  } else if (item.to) {
                    navigate(item.to);
                  }
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isOpen ? "12px" : "0",
                  width: "100%",
                  justifyContent: isOpen ? "flex-start" : "center",
                  transition: "gap 0.3s ease",
                }}
              >
                <span
                  style={{
                    ...sidebarStyles.icon,
                    color:
                      hoveredItem === item.name
                        ? currentColors.menuItemHoverText
                        : currentColors.textAndIcon,
                  }}
                >
                  {item.icon}
                </span>
                {isOpen && (
                  <span
                    style={{
                      ...sidebarStyles.text,
                      color:
                        hoveredItem === item.name
                          ? currentColors.menuItemHoverText
                          : currentColors.textAndIcon,
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="dark-mode-toggle"
          onMouseEnter={(e) => clearTimeout(hoverTimeoutRef.current)}
          onMouseLeave={(e) => e.stopPropagation()}
        >
          <button
            disabled={true}
            onClick={(e) => {
              toggleDarkMode();
              e.stopPropagation();
            }}
            style={sidebarStyles.darkModeButton}
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div
        ref={dropdownWrapperRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1002,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            position: "absolute",
            left: isOpen ? "200px" : "60px",
            top: `${navbarHeight}px`,
            pointerEvents: "auto",
          }}
        >
          {menuItems.map((item, index) =>
            isOpen && item.hasDropdown && hoveredItem === item.name ? (
              <div
                key={`dropdown-${index}`}
                className="dropdown-animated"
                style={{
                  backgroundColor: currentColors.dropdownBg,
                  color: currentColors.dropdownText,
                  border: `1px solid ${currentColors.dropdownBorder}`,
                  borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  width: "200px",
                  display: "flex",
                  flexDirection: "column",
                  position: "absolute",
                  left: 0,
                  top: `${index * 48}px`,
                  transition: "all 0.3s ease",
                  opacity: 1,
                }}
              >
                {item.dropdownItems.map((di, idx) => (
                  <Link
                    key={idx}
                    to={di.to}
                    style={sidebarStyles.dropdownItem}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor =
                        sidebarStyles.dropdownItemHover.backgroundColor;
                      e.currentTarget.style.color =
                        sidebarStyles.dropdownItemHover.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = currentColors.dropdownText;
                    }}
                  >
                    {di.name}
                  </Link>
                ))}
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Render GiveFeedback dialog for non-admin roles */}
      {role.toLowerCase() !== "admin" && (
        <GiveFeedback
          open={feedbackDialogOpen}
          onClose={handleCloseFeedbackDialog}
        />
      )}

      <style>
        {`
          .dynamic-sidebar::-webkit-scrollbar {
            width: ${isOpen ? "8px" : "0"};
          }
          .dynamic-sidebar::-webkit-scrollbar-track {
            background: ${currentColors.scrollbarTrack};
            border-radius: 4px;
          }
          .dynamic-sidebar::-webkit-scrollbar-thumb {
            background: ${currentColors.scrollbarThumb};
            border-radius: 4px;
          }

          .dynamic-sidebar.dark::-webkit-scrollbar-track {
            background: ${currentColors.scrollbarTrack};
          }
          .dynamic-sidebar.dark::-webkit-scrollbar-thumb {
            background: ${currentColors.scrollbarThumb};
          }

          .dropdown-animated {
            animation: dropdownFade 0.3s ease-out;
          }

          @keyframes dropdownFade {
            0% {
              transform: translateY(-10px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default DynamicSidebar;