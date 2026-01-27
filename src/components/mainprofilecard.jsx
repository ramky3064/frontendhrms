import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Skeleton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { Link } from "react-router-dom";

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const ProfileCard = ({ employeeDetails, photoBase64, loading }) => {
  const AVATAR_COLORS = ["#FFA500", "#FFC800", "#FFA450", "#1E90FF", "#20B2AA"];

  return (
    <Card
      sx={{
        maxWidth: 320,
        width: "100%",
        bgcolor: "white",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        p: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        animation: `${slideIn} 0.5s ease-out`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#1E2A3B",
              fontWeight: 600,
              fontSize: "1.125rem",
              lineHeight: "1.5rem",
            }}
          >
            Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#1E2A3B",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            component={Link}
            to="/profile"
          >
            View
          </Typography>
        </Box>
        {loading ? (
          <Skeleton
            variant="rectangular"
            width={160}
            height={160}
            sx={{ borderRadius: "12px", mx: "auto", mb: 3 }}
          />
        ) : (
          <Avatar
            alt={`${employeeDetails.first_name} ${employeeDetails.last_name}`}
            src={photoBase64 || null}
            sx={{
              width: 160,
              height: 160,
              borderRadius: "12px",
              objectFit: "cover",
              mx: "auto",
              mb: 3,
              bgcolor: !photoBase64
                ? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
                : "transparent",
              fontSize: "2rem",
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            imgProps={{
              loading: "lazy",
              onError: (e) => {
                e.target.src = null;
              },
            }}
          >
            {!photoBase64 &&
              `${employeeDetails.first_name?.charAt(0) || ""}${
                employeeDetails.last_name?.charAt(0) || ""
              }`}
          </Avatar>
        )}
        <Typography
          variant="h6"
          sx={{
            color: "#1E2A3B",
            fontWeight: 600,
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
            textAlign: "center",
            mb: 0.5,
          }}
        >
          {`${employeeDetails.first_name} ${
            employeeDetails.last_name || ""
          }`.trim()}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#9CA3AF",
            fontWeight: 400,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            textAlign: "center",
            mb: 1.5,
          }}
        >
          {employeeDetails.designation || "N/A"}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#1E2A3B",
            fontWeight: 400,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            textAlign: "center",
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {employeeDetails.email || "N/A"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;