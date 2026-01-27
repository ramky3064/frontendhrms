import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const ProjectManagement = ({ setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen, onProjectCreated }) => {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName) {
      setSnackbarMessage('Project name is required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setLoading(true);
    try {
      const empId = sessionStorage.getItem("empId");
      const token = localStorage.getItem(`token_${empId}`);
      const headers = token ? { Authorization: token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

      const response = await fetch(`${API_URL}/create_project/${encodeURIComponent(projectName)}`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Create Project Response:', data);
      if (data.status === 'success') {
        setSnackbarMessage(data.message);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setProjectName('');
        if (onProjectCreated) {
          onProjectCreated();
        }
      } else {
        setSnackbarMessage(data.message || 'Failed to create project');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setSnackbarMessage(
        err.message === 'Failed to fetch'
          ? 'Unable to create project: Backend server may be down or CORS is not enabled.'
          : `Error creating project: ${err.message}`
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        bgcolor: 'white',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
        width: '100%',
        p: 3,
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h2" color="primary" gutterBottom>
          Create New Project
        </Typography>
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <TextField
            label="Enter project name"
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
            sx={{ bgcolor: 'white' }}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ alignSelf: 'flex-start', borderRadius: 1 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectManagement;
