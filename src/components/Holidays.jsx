import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const emojiMap = {
  Diwali: "🪔",
  Christmas: "🎄",
  "New Year": "🎉",
  Holi: "🌈",
  Eid: "🕌",
  Pongal: "🌾",
  Independence: "\u{1F1EE}\u{1F1F3}",
  Republic: "\u{1F1EE}\u{1F1F3}",
  Raksha: "🎁",
};

const getEmoji = (name) => {
  const key = Object.keys(emojiMap).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? emojiMap[key] : "🎊";
};

const renderIND = () => (
  <div
    style={{
      display: "flex",
      gap: "1px",
      fontSize: "100px",
      fontWeight: "bold",
    }}
  >
    <span style={{ color: "#FF9933" }}>I</span>
    <span style={{ color: "#FFFFFF", textShadow: "0 0 3px #000" }}>N</span>
    <span style={{ color: "#138808" }}>D</span>
  </div>
);

const HolidaySlider = () => {
  const [holidays, setHolidays] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const empId = sessionStorage.getItem("empId");
        const token = localStorage.getItem(`token_${empId}`);
        if (!token) throw new Error("Token not found");

        const response = await axios.get(
          `${API_URL}/get_holidays`,
          {
            headers: { Authorization: token },
          }
        );

        if (response.data?.holidays) {
          const today = new Date();
          const allHolidays = response.data.holidays
            .map((h) => ({
              date: formatDate(h.holiday_date),
              rawDate: h.holiday_date,
              name: h.holiday_name,
            }))
            .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

          setHolidays(allHolidays);

          const upcomingIndex = allHolidays.findIndex(
            (h) => new Date(h.rawDate) >= today
          );
          setCurrentIndex(upcomingIndex !== -1 ? upcomingIndex : 0);
        }
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };

    fetchHolidays();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date
      .toLocaleString("en-US", { month: "short" })
      .slice(0, 3)
      .toUpperCase();
    const dayOfWeek = date
      .toLocaleString("en-US", { weekday: "short" })
      .slice(0, 3)
      .toUpperCase();
    return (
      <>
        <strong>{month}</strong>&nbsp;<strong>{day}</strong>&nbsp;
        <strong>{dayOfWeek}</strong>
      </>
    );
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % holidays.length);
  };

  const handleDropdownClick = (index) => {
    setCurrentIndex(index);
    setShowDropdown(false);
  };

  if (holidays.length === 0) {
    return <div style={styles.loading}>Loading holidays...</div>;
  }

  const currentEmoji = getEmoji(holidays[currentIndex].name);

  return (
    <div style={styles.outerWrapper}>
      <div style={styles.container}>
        {/* Watermark Emojis */}
        <div style={watermarkStyles.container}>
          {["independence", "republic"].some((keyword) =>
            holidays[currentIndex].name.toLowerCase().includes(keyword)
          ) ? (
            <>
              <div style={watermarkStyles.topLeft}>{renderIND()}</div>
              <div style={watermarkStyles.topRight}>{renderIND()}</div>
              <div style={watermarkStyles.bottomLeft}>{renderIND()}</div>
              <div style={watermarkStyles.bottomRight}>{renderIND()}</div>
              <div style={watermarkStyles.center}>{renderIND()}</div>
            </>
          ) : (
            <>
              <div style={watermarkStyles.topLeft}>{currentEmoji}</div>
              <div style={watermarkStyles.topRight}>{currentEmoji}</div>
              <div style={watermarkStyles.bottomLeft}>{currentEmoji}</div>
              <div style={watermarkStyles.bottomRight}>{currentEmoji}</div>
              <div style={watermarkStyles.center}>{currentEmoji}</div>
            </>
          )}
        </div>

        <h2 style={styles.header}>UPCOMING HOLIDAYS</h2>

        <div style={styles.sliderWrapper}>
          <motion.div
            onClick={goToPrevious}
            style={{
              ...styles.iconArrow,
              ...(currentIndex === 0 && styles.disabledIcon),
            }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft sx={styles.iconSize} />
          </motion.div>

          <div style={styles.slider}>
            <div style={styles.dateBox}>{holidays[currentIndex].date}</div>
            <div style={styles.nameBox}>
              <strong
                style={{
                  fontSize:
                    holidays[currentIndex].name.length > 28 ? "10px" : "16px",
                  fontWeight: "bold",
                }}
              >
                {holidays[currentIndex].name}
              </strong>
            </div>
          </div>

          <motion.div
            onClick={goToNext}
            style={styles.iconArrow}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight sx={styles.iconSize} />
          </motion.div>
        </div>

        <div style={styles.dropdownButtonContainer}>
          <motion.div
            ref={buttonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            style={styles.iconArrow}
            whileTap={{ scale: 0.9 }}
          >
            {showDropdown ? (
              <ExpandLess sx={styles.iconSize} />
            ) : (
              <ExpandMore sx={styles.iconSize} />
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={styles.dropdownAbsolute}
          >
            {holidays.map((holiday, index) => (
              <div
                key={index}
                style={{
                  ...styles.dropdownItem,
                  backgroundColor:
                    hoveredIndex === index ? "#F0F4F8" : "#FFFFFF",
                }}
                onClick={() => handleDropdownClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div style={styles.dateBox}>{holiday.date}</div>
                <div style={styles.nameBox}>
                  <strong
                    style={{
                      fontSize: holiday.name.length > 28 ? "10px" : "14px",
                    }}
                  >
                    {holiday.name}
                  </strong>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const watermarkStyles = {
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 0,
  },
  topLeft: {
    position: "absolute",
    top: "-40px",
    left: "-40px",
    transform: "rotate(-25deg)",
    fontSize: "100px",
    opacity: 0.2,
  },
  topRight: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    transform: "rotate(25deg)",
    fontSize: "100px",
    opacity: 0.1,
  },
  bottomLeft: {
    position: "absolute",
    bottom: "-40px",
    left: "-40px",
    transform: "rotate(15deg)",
    fontSize: "100px",
    opacity: 0.15,
  },
  bottomRight: {
    position: "absolute",
    bottom: "-40px",
    right: "-40px",
    transform: "rotate(-15deg)",
    fontSize: "100px",
    opacity: 0.2,
  },
  center: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(10deg)",
    fontSize: "120px",
    opacity: 0.2,
  },
};

const styles = {
  outerWrapper: {
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  container: {
    backgroundColor: "#F5E8D3",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    width: "100%",
    height: "160px",
    fontFamily: "'Roboto', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    margin: "0 0 10px 0",
    fontSize: "19px",
    fontWeight: "600",
    color: "#34495E",
    textAlign: "center",
    zIndex: 1,
  },
  sliderWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "10px",
    zIndex: 1,
  },
  iconArrow: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
  },
  iconSize: {
    fontSize: "52px",
    color: "#34495E",
  },
  disabledIcon: {
    opacity: 0.3,
    pointerEvents: "none",
  },
  slider: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: "6px",
    padding: "6px 10px",
    gap: "10px",
    width: "calc(100% - 100px)",
    minHeight: "50px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    zIndex: 1,
  },
  dateBox: {
    backgroundColor: "#E3F2FD",
    padding: "6px 10px",
    width: "80px",
    height: "36px",
    borderRadius: "4px",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
  },
  nameBox: {
    backgroundColor: "#FFFFFF",
    padding: "6px 12px",
    height: "36px",
    borderRadius: "4px",
    fontWeight: "500",
    fontSize: "14px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    display: "flex",
    alignItems: "center",
    color: "#34495E",
    flexGrow: 1,
  },
  dropdownButtonContainer: {
    marginTop: "5px",
    zIndex: 2,
  },
  dropdownAbsolute: {
    position: "absolute",
    top: "100px",
    left: "0",
    right: "0",
    margin: "0 auto",
    width: "356px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E8ECEF",
    borderRadius: "6px",
    maxHeight: "180px",
    overflowY: "auto",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    zIndex: 10,
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "8px 12px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#34495E",
    borderRadius: "6px",
    marginLeft: "auto",
    marginRight: "auto",
    transition: "background 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  loading: {
    textAlign: "center",
    color: "#34495E",
    padding: "15px",
    fontSize: "13px",
  },
};

export default HolidaySlider;
