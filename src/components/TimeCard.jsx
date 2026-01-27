import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip } from '@mui/material';
import { Card, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const TimeCard = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const displayHour = time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <Container className="py-3">
      <Card
        style={{
          background: 'linear-gradient(90deg, #00C4B4 0%, #0288D1 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.3s ease-in-out',
          overflow: 'hidden',
        }}
        className="m-0 p-0 border-0"
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            color: 'white',
            position: 'relative',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={8}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '10px', sm: '12px' },
                  fontWeight: '500',
                  opacity: 0.9,
                }}
              >
                {formattedDate}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '8px', sm: '10px' },
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                }}
              >
                CURRENT TIME
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    mr: 0.5,
                    fontSize: { xs: '20px', sm: '24px' },
                    fontWeight: 'bold',
                  }}
                >
                  {displayHour}:{minutes}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mr: 0.5,
                    fontSize: { xs: '12px', sm: '16px' },
                    fontWeight: '500',
                  }}
                >
                  :{seconds}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '10px', sm: '14px' },
                    fontWeight: '400',
                  }}
                >
                  {ampm}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Box sx={{ mt: { xs: 2, sm: 1 } }}>
                <Chip
                  label="Work From Office"
                  sx={{
                    bgcolor: 'white',
                    color: '#0288D1',
                    fontSize: { xs: '8px', sm: '10px' },
                    height: { xs: '20px', sm: '24px' },
                    fontWeight: '600',
                    borderRadius: '12px',
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      bgcolor: '#f0f0f0',
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Container>
  );
};

export default TimeCard;