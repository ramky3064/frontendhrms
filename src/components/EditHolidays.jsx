import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  CalendarToday,
  Delete,
  Edit,
  CheckCircle,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  styled,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

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

// Custom styled components
const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  "& .MuiPickersDay-root": {
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      transform: "scale(1.1)",
      transition: "transform 0.2s ease",
    },
    "&.Mui-selected": {
      background: "linear-gradient(45deg, #FF9933 30%, #138808 90%)",
      color: "#fff",
      position: "relative",
      "&::after": {
        content: '"✨"',
        position: "absolute",
        top: "-5px",
        right: "-5px",
        fontSize: "12px",
      },
    },
  },
  "& .MuiPickersCalendarHeader-root": {
    backgroundColor: "#F5E8D3",
    color: "#34495E",
    borderRadius: "8px",
  },
}));

const EditHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHolidays, setNewHolidays] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [holidayName, setHolidayName] = useState("");
  const [description, setDescription] = useState("");
  const [showHolidayList, setShowHolidayList] = useState(true);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const modalRef = useRef(null);

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
        event.target.closest(".MuiPopper-root") ||
        event.target.closest(".MuiPickersPopper-root") ||
        event.target.closest(".MuiDialog-root")
      ) {
        return;
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        event.target !== document.querySelector(".add-holiday-btn")
      ) {
        setShowAddModal(false);
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

  const handleDateChange = (date) => {
    if (!date || !dayjs(date).isValid()) return;
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const addHolidayToList = () => {
    if (!holidayName || selectedDates.length === 0) {
      alert("Holiday name and at least one date are required.");
      return;
    }

    const newHolidayEntries = selectedDates.map((date) => ({
      holiday_date: date,
      holiday_name: holidayName,
      description: description || "",
      id: Math.random().toString(36).substr(2, 9),
    }));

    setNewHolidays([...newHolidays, ...newHolidayEntries]);
    setSelectedDates([]);
    setHolidayName("");
    setDescription("");
  };

  const deleteHoliday = (id) => {
    setNewHolidays(newHolidays.filter((h) => h.id !== id));
  };

  const editHoliday = (id) => {
    const holiday = newHolidays.find((h) => h.id === id);
    if (holiday) {
      setHolidayName(holiday.holiday_name);
      setDescription(holiday.description);
      setSelectedDates([holiday.holiday_date]);
      setNewHolidays(newHolidays.filter((h) => h.id !== id));
    }
  };

  const submitHolidays = async () => {
    try {
      const empId = sessionStorage.getItem("empId");
      const token = localStorage.getItem(`token_${empId}`);
      if (!token) throw new Error("Token not found");

      for (const holiday of newHolidays) {
        const response = await axios.post(
          `${API_URL}/add_holiday`,
          {
            holiday_date: holiday.holiday_date,
            holiday_name: holiday.holiday_name,
            description: holiday.description,
          },
          {
            headers: { Authorization: token },
          }
        );

        if (response.status !== 201) {
          throw new Error(response.data.error || "Failed to add holiday");
        }
      }

      alert("Holidays added successfully!");
      setNewHolidays([]);
      setShowAddModal(false);

      const response = await axios.get(
        `${API_URL}/get_holidays`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.data?.holidays) {
        const allHolidays = response.data.holidays
          .map((h) => ({
            date: formatDate(h.holiday_date),
            rawDate: h.holiday_date,
            name: h.holiday_name,
          }))
          .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

        setHolidays(allHolidays);
        const today = new Date();
        const upcomingIndex = allHolidays.findIndex(
          (h) => new Date(h.rawDate) >= today
        );
        setCurrentIndex(upcomingIndex !== -1 ? upcomingIndex : 0);
      }
    } catch (error) {
      console.error("Error adding holidays:", error);
      alert(
        error.response?.data?.error ||
          "Failed to add holidays. Please try again."
      );
    }
  };

  const handleDatePickerClick = (event) => {
    event.stopPropagation();
  };

  if (holidays.length === 0) {
    return <Box sx={styles.loading}>Loading holidays...</Box>;
  }

  const currentEmoji = getEmoji(holidays[currentIndex].name);

  return (
    <Box sx={styles.outerWrapper}>
      <Box sx={styles.container}>
        {/* Watermark Emojis */}
        <Box sx={watermarkStyles.container}>
          {["independence", "republic"].some((keyword) =>
            holidays[currentIndex].name.toLowerCase().includes(keyword)
          ) ? (
            <>
              <Box sx={watermarkStyles.topLeft}>{renderIND()}</Box>
              <Box sx={watermarkStyles.topRight}>{renderIND()}</Box>
              <Box sx={watermarkStyles.bottomLeft}>{renderIND()}</Box>
              <Box sx={watermarkStyles.bottomRight}>{renderIND()}</Box>
              <Box sx={watermarkStyles.center}>{renderIND()}</Box>
            </>
          ) : (
            <>
              <Box sx={watermarkStyles.topLeft}>{currentEmoji}</Box>
              <Box sx={watermarkStyles.topRight}>{currentEmoji}</Box>
              <Box sx={watermarkStyles.bottomLeft}>{currentEmoji}</Box>
              <Box sx={watermarkStyles.bottomRight}>{currentEmoji}</Box>
              <Box sx={watermarkStyles.center}>{currentEmoji}</Box>
            </>
          )}
        </Box>

        {/* Header Row with Add Holiday Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            mb: 1,
            zIndex: 1,
          }}
        >
          <Typography sx={styles.header}>UPCOMING HOLIDAYS</Typography>
          <motion.div
            className="add-holiday-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            sx={{
              backgroundColor: "#D8C9AE",
              borderRadius: "50%",
              padding: 0.5,
            }}
          >
            <IconButton onClick={() => setShowAddModal(true)} color="primary">
              <CalendarToday />
            </IconButton>
          </motion.div>
        </Box>

        <Box sx={styles.sliderWrapper}>
          <motion.div
            onClick={goToPrevious}
            sx={{
              ...styles.iconArrow,
              ...(currentIndex === 0 && styles.disabledIcon),
            }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft sx={styles.iconSize} />
          </motion.div>

          <Box sx={styles.slider}>
            <Box sx={styles.dateBox}>{holidays[currentIndex].date}</Box>
            <Box sx={styles.nameBox}>
              <Typography
                sx={{
                  fontSize:
                    holidays[currentIndex].name.length > 28 ? "10px" : "16px",
                  fontWeight: "bold",
                }}
              >
                {holidays[currentIndex].name}
              </Typography>
            </Box>
          </Box>

          <motion.div
            onClick={goToNext}
            sx={styles.iconArrow}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight sx={styles.iconSize} />
          </motion.div>
        </Box>

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
      </Box>

      {/* Add Holiday Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#F5E8D3",
            borderRadius: 2,
            width: "100%",
            maxWidth: 500,
          },
        }}
        ref={modalRef}
      >
        <DialogTitle
          sx={{ color: "#34495E", fontWeight: 600, fontSize: "19px" }}
        >
          Add New Holidays
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box onClick={handleDatePickerClick}>
              <StyledDatePicker
                label="Select Dates *"
                onChange={handleDateChange}
                sx={{ mb: 2, width: "100%" }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    helperText={
                      selectedDates.length > 0
                        ? `Selected: ${selectedDates
                            .map((d) => dayjs(d).format("MM/DD/YYYY"))
                            .join(", ")}`
                        : "Select one or more dates"
                    }
                  />
                )}
              />
            </Box>
          </LocalizationProvider>

          <TextField
            label="Holiday Name *"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            fullWidth
            margin="normal"
            required
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
            error={!holidayName && selectedDates.length > 0}
            helperText={
              !holidayName && selectedDates.length > 0
                ? "Holiday name is required"
                : ""
            }
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="normal"
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          />

          <Button
            onClick={addHolidayToList}
            variant="contained"
            sx={{
              backgroundColor: "#D8C9AE",
              color: "#34495E",
              mt: 2,
              "&:hover": { backgroundColor: "#C4B59B" },
              width: "100%",
            }}
            disabled={!holidayName || selectedDates.length === 0}
          >
            Add to List
          </Button>

          {newHolidays.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setShowHolidayList(!showHolidayList)}
              >
                <Typography
                  sx={{ color: "#34495E", fontSize: "16px", fontWeight: 500 }}
                >
                  Holidays to Add ({newHolidays.length})
                </Typography>
                {showHolidayList ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={showHolidayList}>
                <List sx={{ maxHeight: 180, overflowY: "auto" }}>
                  {newHolidays.map((holiday) => (
                    <React.Fragment key={holiday.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton
                              onClick={() => editHoliday(holiday.id)}
                              sx={{ color: "#34495E" }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => deleteHoliday(holiday.id)}
                              sx={{ color: "#D32F2F" }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={`${holiday.holiday_name} - ${dayjs(
                            holiday.holiday_date
                          ).format("MM/DD/YYYY")}`}
                          secondary={holiday.description || "No description"}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {newHolidays.length > 0 && (
            <Button
              onClick={submitHolidays}
              variant="contained"
              sx={{
                backgroundColor: "#138808",
                color: "#fff",
                "&:hover": { backgroundColor: "#0F6B06" },
              }}
              startIcon={<CheckCircle />}
            >
              Submit All Holidays
            </Button>
          )}
          <Button
            onClick={() => setShowAddModal(false)}
            sx={{ color: "#34495E" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
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
    top: "115px",
    left: "0",
    right: "0",
    margin: "0 auto",
    width: "300px",
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

export default EditHolidays;
