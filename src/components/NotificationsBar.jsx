import React from "react";
import { Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Color palette to match the CEOComponent
const COLORS = {
  primary: "#a0c3e8", // Light blue for backgrounds, buttons
  secondary: "#2772a0", // Deep blue for hover states, accents
  text: "#ffffff", // White for text and icons
};

const BannerNotification = ({ open, message, severity, onClose }) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1400, // Higher than app bars
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        py: 1,
      }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{
          width: "100%",
          maxWidth: "800px",
          bgcolor: COLORS.primary,
          color: COLORS.text,
          "& .MuiAlert-icon": { color: COLORS.text },
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: "8px",
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Box>
  );
};

export default BannerNotification;