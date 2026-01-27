import React from "react";
import { Box, Typography, Avatar, Paper, Stack, Chip } from "@mui/material";

const ProfileCard = ({
  employeeDetails = {},
  photoBase64 = "",
  loading = false,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 320,
        width: 230,
        borderRadius: "12px",
        overflow: "hidden",
        textAlign: "center",
        border: "1px solid #2C3E50",
        position: "relative",
        fontFamily: '"Inter", sans-serif',
        mx: "auto",
        mt: 4,
        bgcolor: "#F5E8D3",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: "#2C3E50",
          height: 100,
          borderBottomLeftRadius: "50%",
          borderBottomRightRadius: "50%",
        }}
      ></Box>

      <Avatar
        alt={`${employeeDetails.first_name || "User"} ${
          employeeDetails.last_name || ""
        }`}
        src={photoBase64 || ""}
        sx={{
          width: 100,
          height: 100,
          border: "4px solid #F7E7CE",
          mx: "auto",
          mt: -50,
          bgcolor: photoBase64 ? "transparent" : "#FFA500",
        }}
      >
        {!photoBase64 && (
          <Typography variant="h6">
            {`${employeeDetails.first_name?.charAt(0) || ""}${
              employeeDetails.last_name?.charAt(0) || ""
            }`}
          </Typography>
        )}
      </Avatar>

      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#2C3E50", mt: 1 }}
        >
          {`${employeeDetails.first_name || "N/A"} ${
            employeeDetails.last_name || ""
          }`.trim()}
        </Typography>

        <Chip
          label={employeeDetails.designation || "N/A"}
          sx={{
            backgroundColor: "#F7E7CE",
            color: "#2C3E50",
            fontWeight: 500,
            mt: 1,
            mb: 2,
          }}
        />

        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="body2" sx={{ color: "#2C3E50" }}>
            <strong>ID No:</strong> {employeeDetails.emp_id || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#2C3E50" }}>
            <strong>E-mail:</strong> {employeeDetails.email || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#2C3E50" }}>
            <strong>Role:</strong> {employeeDetails.designation || "N/A"}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ProfileCard;
