import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  IconButton,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Modal,
  createTheme,
  ThemeProvider,
  CircularProgress,
  InputAdornment,
  ListItemButton,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DynamicSidebar from './Sidebar';
import AppNavbar from './Hrmnav';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, '');

// API setup
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(
  (config) => {
    const empId = sessionStorage.getItem('empId');
    const token = localStorage.getItem(`token_${empId}`);
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 422) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/loginpage';
      return Promise.reject(new Error('Invalid or expired token. Redirecting to login...'));
    }
    return Promise.reject(error);
  }
);

// Utility functions
const getInitials = (name) => {
  if (!name || typeof name !== 'string' || name.trim() === '') return '';
  return name.trim()[0]?.toUpperCase() || '';
};

const hexToImageUrl = (hex) => {
  if (!hex) return null;
  try {
    const binary = new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const blob = new Blob([binary], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error converting hex to image:', err);
    return null;
  }
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'second') {
      const value = Math.floor(diffInSeconds / seconds);
      return rtf.format(-value, unit);
    }
  }
  return 'Just now';
};

// Updated MUI theme with scrollbar and animation styles
const theme = createTheme({
  palette: {
    primary: { main: '#2B3E52' },
    secondary: { main: '#D8C9AE' },
    background: {
      default: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      paper: '#ffffff',
    },
    text: { primary: '#2B3E52' },
    danger: { main: '#dc3545' },
    warning: { main: '#ffc107' },
    success: { main: '#28a745' },
    error: { main: '#dc3545' },
    custom: {
      darkBg: '#2B3E52',
      orange: '#F15A24',
      darkGray: '#2B3E52',
      lightGray: '#D8C9AE',
      textDark: '#2B3E52',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: '#2B3E52' },
    h6: { fontWeight: 600, color: '#2B3E52' },
    body1: { fontSize: '1rem', color: '#333' },
    body2: { fontSize: '0.875rem', color: '#555' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          },
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          animation: 'fadeIn 0.5s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 24px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#fff',
            '&:hover fieldset': {
              borderColor: '#2B3E52',
            },
          },
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBox-root': {
            borderRadius: '16px',
            animation: 'fadeIn 0.3s ease-in-out',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9f9fb 100%)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 48,
          height: 48,
          fontSize: '1.2rem',
          backgroundColor: '#f0f2f4',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          '.feed-container': {
            scrollbarWidth: 'thin',
            scrollbarColor: '#2B3E52 #f5f7fa',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f5f7fa',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#2B3E52',
              borderRadius: '4px',
            },
          },
        },
      },
    },
  },
});

const UserFeed = () => {
  const [items, setItems] = useState({ posts: [], polls: [], praise: [] });
  const [newPost, setNewPost] = useState({ content: '', photo: null, video: null });
  const [editPost, setEditPost] = useState({ id: null, content: '', photo: null, video: null });
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], duration: 10 });
  const [newPraise, setNewPraise] = useState({ content: '', recipient: '' });
  const [editPraise, setEditPraise] = useState({ id: null, content: '', recipient: '' });
  const [comments, setComments] = useState({});
  const [pollResponses, setPollResponses] = useState({});
  const [votedPolls, setVotedPolls] = useState(() => {
    const savedVotedPolls = localStorage.getItem('votedPolls');
    return savedVotedPolls ? JSON.parse(savedVotedPolls) : {};
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [empId, setEmpId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [mediaCache, setMediaCache] = useState({});
  const [photoCache, setPhotoCache] = useState({});
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [showEditPraiseModal, setShowEditPraiseModal] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [showAllLikers, setShowAllLikers] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({ open: false, itemId: null, commentId: null });
  const navigate = useNavigate();
  const { state } = useLocation();

  // Cache employee photos
  useEffect(() => {
    const cachePhotos = () => {
      const newCache = {};
      [...items.posts, ...items.polls, ...items.praise].forEach((item) => {
        if (item.employee_photo) {
          newCache[`emp_${item.emp_id}`] = hexToImageUrl(item.employee_photo);
        }
        if (item.type === 'praise' && item.recipient_photo) {
          newCache[`recipient_${item.recipient}`] = hexToImageUrl(item.recipient_photo);
        }
        if (item.comments) {
          Object.entries(item.comments).forEach(([_, comment]) => {
            if (comment.commenter_photo) {
              newCache[`commenter_${comment.commenter_id}`] = hexToImageUrl(comment.commenter_photo);
            }
          });
        }
      });
      setPhotoCache((prev) => ({ ...prev, ...newCache }));
    };
    cachePhotos();
  }, [items]);

  // Filter employees for recipient search
  useEffect(() => {
    setFilteredEmployees(
      employees.filter((emp) =>
        emp.full_name.toLowerCase().includes(recipientSearch.toLowerCase())
      )
    );
  }, [recipientSearch, employees]);

  useEffect(() => {
    localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
  }, [votedPolls]);

  const fetchItems = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    }
    try {
      const response = await api.get('/items');
      const data = {
        posts: Array.isArray(response.data.posts)
          ? response.data.posts.map((item) => ({ ...item, type: 'post' }))
          : [],
        polls: Array.isArray(response.data.polls)
          ? response.data.polls.map((item) => ({ ...item, type: 'poll' }))
          : [],
        praise: Array.isArray(response.data.praise)
          ? response.data.praise.map((item) => ({ ...item, type: 'praise' }))
          : [],
      };
      setItems(data);
      const mediaPromises = data.posts
        .filter((post) => post.has_photo || post.has_video)
        .flatMap((post) => [
          post.has_photo ? fetchMedia(`/post/${post.id}/photo`) : null,
          post.has_video ? fetchMedia(`/post/${post.id}/video`) : null,
        ])
        .filter((p) => p !== null);
      await Promise.all(mediaPromises);
    } catch (err) {
      console.error('Fetch items error:', err.message);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/feed/employees');
      setEmployees(response.data || []);
      setFilteredEmployees(response.data || []);
      const employeePhotoCache = {};
      response.data.forEach((emp) => {
        if (emp.photo) {
          employeePhotoCache[`emp_${emp.emp_id}`] = hexToImageUrl(emp.photo);
        }
      });
      setPhotoCache((prev) => ({ ...prev, ...employeePhotoCache }));
    } catch (err) {
      console.error('Fetch employees error:', err.message);
    }
  };

  const fetchMedia = async (url) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const mediaUrl = URL.createObjectURL(response.data);
      setMediaCache((prev) => ({ ...prev, [url]: mediaUrl }));
    } catch (err) {
      console.error(`Failed to fetch media from ${url}:`, err.message);
    }
  };

  const fetchComments = async (itemId) => {
    try {
      const response = await api.get(`/item/${itemId}/comment`);
      setItems((prevItems) => {
        const updatedItems = { ...prevItems };
        const itemType = Object.keys(updatedItems).find((type) =>
          updatedItems[type].some((item) => item.id === itemId)
        );
        if (itemType) {
          updatedItems[itemType] = updatedItems[itemType].map((item) =>
            item.id === itemId ? { ...item, comments: response.data } : item
          );
        }
        return updatedItems;
      });
    } catch (err) {
      console.error('Fetch comments error:', err.message);
    }
  };

  useEffect(() => {
    const storedEmpId = state?.empId || sessionStorage.getItem('empId');
    if (!storedEmpId) {
      navigate('/loginpage');
      return;
    }

    const token = localStorage.getItem(`token_${storedEmpId}`);
    const validateToken = () => {
      if (!token) {
        setTimeout(() => navigate('/loginpage'), 3000);
        return false;
      }
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          localStorage.removeItem(`token_${storedEmpId}`);
          sessionStorage.clear();
          setTimeout(() => navigate('/loginpage'), 3000);
          return false;
        }
        const empIdFromToken = decoded.sub || decoded.emp_id || decoded.user_id;
        if (!empIdFromToken || empIdFromToken !== storedEmpId) {
          localStorage.removeItem(`token_${storedEmpId}`);
          sessionStorage.clear();
          setTimeout(() => navigate('/loginpage'), 3000);
          return false;
        }
        setEmpId(empIdFromToken);
        sessionStorage.setItem('empId', empIdFromToken);
        return true;
      } catch (error) {
        localStorage.removeItem(`token_${storedEmpId}`);
        sessionStorage.clear();
        setTimeout(() => navigate('/loginpage'), 3000);
        return false;
      }
    };

    if (!validateToken()) return;

    fetchItems(true);
    fetchEmployees();
  }, [navigate]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, post: true }));
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      if (newPost.photo) formData.append('photo', newPost.photo);
      if (newPost.video) formData.append('video', newPost.video);
      await api.post('/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewPost({ content: '', photo: null, video: null });
      setPhotoPreview(null);
      setShowPostModal(false);
      fetchItems();
    } catch (err) {
      console.error('Post submit error:', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, post: false }));
    }
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, editPost: true }));
    try {
      const formData = new FormData();
      if (editPost.content) formData.append('content', editPost.content);
      if (editPost.photo) formData.append('photo', editPost.photo);
      if (editPost.video) formData.append('video', editPost.video);
      await api.put(`/post/${editPost.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditPost({ id: null, content: '', photo: null, video: null });
      setShowEditPostModal(false);
      fetchItems();
    } catch (err) {
      console.error('Edit post error:', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, editPost: false }));
    }
  };

  const handlePollSubmit = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, poll: true }));
    try {
      await api.post('/poll', {
        question: newPoll.question,
        options: newPoll.options.filter((opt) => opt.trim() !== ''),
        duration: newPoll.duration,
      });
      setNewPoll({ question: '', options: ['', ''], duration: 10 });
      setShowPollModal(false);
      fetchItems();
    } catch (err) {
      console.error('Poll submit error:', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, poll: false }));
    }
  };

  const handlePraiseSubmit = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, praise: true }));
    try {
      await api.post('/praise', {
        content: newPraise.content,
        recipient: newPraise.recipient,
      });
      setNewPraise({ content: '', recipient: '' });
      setRecipientSearch('');
      setShowPraiseModal(false);
      fetchItems();
    } catch (err) {
      console.error('Praise submit error:', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, praise: false }));
    }
  };

  const handleEditPraiseSubmit = async (e) => {
    e.preventDefault();
    setActionLoading((prev) => ({ ...prev, editPraise: true }));
    try {
      const data = {};
      if (editPraise.content) data.content = editPraise.content;
      if (editPraise.recipient) data.recipient = editPraise.recipient;
      await api.put(`/praise/${editPraise.id}`, data);
      setEditPraise({ id: null, content: '', recipient: '' });
      setRecipientSearch('');
      setShowEditPraiseModal(false);
      fetchItems();
    } catch (err) {
      console.error('Edit praise error:', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, editPraise: false }));
    }
  };

  const handleDeleteConfirmed = async () => {
    const { itemId, commentId } = showDeleteConfirm;
    if (commentId) {
      setDeleteLoading((prev) => ({ ...prev, [commentId]: true }));
      try {
        await api.delete(`/item/${itemId}/comment/${commentId}`);
        setItems((prevItems) => {
          const updatedItems = { ...prevItems };
          const itemType = Object.keys(updatedItems).find((type) =>
            updatedItems[type].some((item) => item.id === itemId)
          );
          if (itemType) {
            updatedItems[itemType] = updatedItems[itemType].map((item) =>
              item.id === itemId
                ? {
                  ...item,
                  comments: item.comments
                    ? Object.fromEntries(
                      Object.entries(item.comments).filter(([key]) => key !== commentId)
                    )
                    : item.comments,
                  comments_count: item.comments_count ? item.comments_count - 1 : 0,
                }
                : item
            );
          }
          return updatedItems;
        });
      } catch (err) {
        console.error('Delete comment error:', err.message);
      } finally {
        setDeleteLoading((prev) => ({ ...prev, [commentId]: false }));
        setShowDeleteConfirm({ open: false, itemId: null, commentId: null });
      }
    } else {
      setDeleteLoading((prev) => ({ ...prev, [itemId]: true }));
      try {
        await api.delete(`/item/${itemId}`);
        setItems((prevItems) => {
          const updatedItems = { ...prevItems };
          const itemType = Object.keys(updatedItems).find((type) =>
            updatedItems[type].some((item) => item.id === itemId)
          );
          if (itemType) {
            updatedItems[itemType] = updatedItems[itemType].filter((item) => item.id !== itemId);
          }
          return updatedItems;
        });
      } catch (err) {
        console.error('Delete item error:', err.message);
      } finally {
        setDeleteLoading((prev) => ({ ...prev, [itemId]: false }));
        setShowDeleteConfirm({ open: false, itemId: null, commentId: null });
      }
    }
  };

  const handleLike = async (itemId) => {
    try {
      const response = await api.post(`/item/${itemId}/like`);
      setItems((prevItems) => {
        const updatedItems = { ...prevItems };
        const itemType = Object.keys(updatedItems).find((type) =>
          updatedItems[type].some((item) => item.id === itemId)
        );
        if (itemType) {
          updatedItems[itemType] = updatedItems[itemType].map((item) =>
            item.id === itemId
              ? { ...item, likes_count: response.data.likes_count, likers: response.data.likers }
              : item
          );
        }
        return updatedItems;
      });
    } catch (err) {
      console.error('Like error:', err.message);
    }
  };

  const handleUnlike = async (itemId) => {
    try {
      const response = await api.post(`/item/${itemId}/unlike`);
      setItems((prevItems) => {
        const updatedItems = { ...prevItems };
        const itemType = Object.keys(updatedItems).find((type) =>
          updatedItems[type].some((item) => item.id === itemId)
        );
        if (itemType) {
          updatedItems[itemType] = updatedItems[itemType].map((item) =>
            item.id === itemId
              ? { ...item, likes_count: response.data.likes_count, likers: response.data.likers }
              : item
          );
        }
        return updatedItems;
      });
    } catch (err) {
      console.error('Unlike error:', err.message);
    }
  };

  const handleCommentSubmit = async (itemId, comment) => {
    if (!comment.trim()) {
      return;
    }
    setCommentLoading((prev) => ({ ...prev, [itemId]: true }));
    try {
      setItems((prevItems) => {
        const updatedItems = { ...prevItems };
        const itemType = Object.keys(updatedItems).find((type) =>
          updatedItems[type].some((item) => item.id === itemId)
        );
        if (itemType) {
          updatedItems[itemType] = updatedItems[itemType].map((item) =>
            item.id === itemId
              ? { ...item, comments_count: (item.comments_count || 0) + 1 }
              : item
          );
        }
        return updatedItems;
      });
      await api.post(`/item/${itemId}/comment`, { comment });
      setComments((prev) => ({ ...prev, [itemId]: '' }));
      setShowCommentBox((prev) => ({ ...prev, [itemId]: false }));
      await fetchComments(itemId);
    } catch (err) {
      setItems((prevItems) => {
        const updatedItems = { ...prevItems };
        const itemType = Object.keys(updatedItems).find((type) =>
          updatedItems[type].some((item) => item.id === itemId)
        );
        if (itemType) {
          updatedItems[itemType] = updatedItems[itemType].map((item) =>
            item.id === itemId
              ? { ...item, comments_count: (item.comments_count || 0) - 1 }
              : item
          );
        }
        return updatedItems;
      });
      console.error('Comment submit error:', err.message);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handlePollResponse = async (pollId, option) => {
    if (votedPolls[pollId]) {
      return;
    }
    try {
      await api.post(`/poll/${pollId}/respond`, { response: option });
      setPollResponses((prev) => ({ ...prev, [pollId]: option }));
      setVotedPolls((prev) => ({ ...prev, [pollId]: true }));
      fetchItems();
    } catch (err) {
      console.error('Poll response error:', err.message);
    }
  };

  const handleAddPollOption = () => {
    if (newPoll.options.length < 5) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    }
  };

  const handleDeletePollOption = (index) => {
    if (newPoll.options.length <= 2) {
      return;
    }
    const newOptions = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const handleShowComments = (itemId) => {
    setShowComments((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    setShowCommentBox((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    if (!showComments[itemId]) {
      fetchComments(itemId);
    }
  };

  const handleShowAllLikers = (itemId) => {
    setShowAllLikers((prev) => ({ ...prev, [itemId]: true }));
  };

  const handleEditPost = (post) => {
    setEditPost({ id: post.id, content: post.content, photo: null, video: null });
    setShowEditPostModal(true);
  };

  const handleEditPraise = (praise) => {
    setEditPraise({ id: praise.id, content: praise.content, recipient: praise.recipient });
    setRecipientSearch(getRecipientName(praise.recipient));
    setShowEditPraiseModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewPost({ ...newPost, photo: file });
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleConfirmDelete = (itemId, commentId = null) => {
    setShowDeleteConfirm({ open: true, itemId, commentId });
  };

  const allItems = [...items.posts, ...items.polls, ...items.praise].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const getRecipientName = (recipientId) => {
    const employee = employees.find((emp) => emp.emp_id === recipientId);
    return employee ? employee.full_name : recipientId;
  };

  const handleRecipientSelect = (emp, isEditModal = false) => {
    if (isEditModal) {
      setEditPraise({ ...editPraise, recipient: emp.emp_id });
      setRecipientSearch(emp.full_name);
    } else {
      setNewPraise({ ...newPraise, recipient: emp.emp_id });
      setRecipientSearch(emp.full_name);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <DynamicSidebar />
        <Box sx={{ flexGrow: 1, minHeight: '100vh', p: 2, bgcolor: 'background.default' }}>
          <AppNavbar sx={{ position: 'fixed', top: 0, width: '100%', zIndex: 1200 }} />
          <Box sx={{ height: '58px' }} />
          <Container maxWidth={false} sx={{ paddingLeft: 2, paddingRight: 2, maxWidth: '700px', mx: 'auto' }}>
            {initialLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress size={60} sx={{ color: 'primary.main' }} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    mb: 3,
                    flexWrap: 'wrap',
                    position: 'sticky',
                    top: '58px',
                    zIndex: 1100,
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'linear-gradient(145deg, #ffffff 0%, #f9f9fb 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowPostModal(true)}
                    sx={{
                      bgcolor: 'linear-gradient(45deg, #2B3E52 30%, #3b5673 90%)',
                      '&:hover': { bgcolor: 'linear-gradient(45deg, #3b5673 30%, #2B3E52 90%)' },
                      mb: 1,
                      fontWeight: 600,
                    }}
                    disabled={actionLoading.post}
                  >
                    {actionLoading.post ? <CircularProgress size={24} /> : 'Create Post'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setShowPollModal(true)}
                    sx={{
                      bgcolor: 'linear-gradient(45deg, #28a745 30%, #34c759 90%)',
                      '&:hover': { bgcolor: 'linear-gradient(45deg, #34c759 30%, #28a745 90%)' },
                      mb: 1,
                      fontWeight: 600,
                    }}
                    disabled={actionLoading.poll}
                  >
                    {actionLoading.poll ? <CircularProgress size={24} /> : 'Create Poll'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setShowPraiseModal(true)}
                    sx={{
                      bgcolor: 'linear-gradient(45deg, #17a2b8 30%, #1fc8e3 90%)',
                      '&:hover': { bgcolor: 'linear-gradient(45deg, #1fc8e3 30%, #17a2b8 90%)' },
                      mb: 1,
                      fontWeight: 600,
                    }}
                    disabled={actionLoading.praise}
                  >
                    {actionLoading.praise ? <CircularProgress size={24} /> : 'Send Praise'}
                  </Button>
                </Box>
                <Box
                  className="feed-container"
                  sx={{
                    height: 'calc(100vh - 58px - 120px)',
                    overflowY: 'auto',
                  }}
                >
                  {allItems.map((item) => (
                    <Card
                      key={`${item.type}-${item.id}`}
                      sx={{
                        mb: 3,
                        animation: 'fadeIn 0.5s ease-in-out',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={photoCache[`emp_${item.emp_id}`]}
                            sx={{ bgcolor: 'custom.lightGray', mr: 2, width: 48, height: 48, fontSize: '1.2rem' }}
                          >
                            {!photoCache[`emp_${item.emp_id}`] && getInitials(item.employee_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {item.employee_name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                              {formatRelativeTime(item.timestamp)}
                            </Typography>
                          </Box>
                          {item.emp_id === empId && (
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                              {(item.type === 'post' || item.type === 'praise') && (
                                <IconButton
                                  onClick={() => {
                                    if (item.type === 'post') handleEditPost(item);
                                    else if (item.type === 'praise') handleEditPraise(item);
                                  }}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                              <IconButton
                                onClick={() => handleConfirmDelete(item.id)}
                                disabled={deleteLoading[item.id]}
                                sx={{ color: 'error.main' }}
                              >
                                {deleteLoading[item.id] ? <CircularProgress size={24} /> : <DeleteIcon />}
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {item.type === 'post' && (
                          <>
                            <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6, mb: 2, fontSize: '1.1rem' }}>
                              {item.content}
                            </Typography>
                            {item.has_photo && mediaCache[`/post/${item.id}/photo`] && (
                              <Box
                                component="img"
                                src={mediaCache[`/post/${item.id}/photo`]}
                                alt="Post"
                                sx={{
                                  borderRadius: '12px',
                                  maxWidth: '100%',
                                  mt: 1.5,
                                  display: 'block',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                              />
                            )}
                            {item.has_video && mediaCache[`/post/${item.id}/video`] && (
                              <Box
                                component="video"
                                src={mediaCache[`/post/${item.id}/video`]}
                                controls
                                sx={{
                                  borderRadius: '12px',
                                  maxWidth: '100%',
                                  mt: 1.5,
                                  display: 'block',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }}
                              />
                            )}
                          </>
                        )}
                        {item.type === 'poll' && (
                          <Box
                            sx={{
                              p: 3,
                              bgcolor: '#f8f9fa',
                              borderRadius: '12px',
                              mt: 2,
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                            }}
                          >
                            <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 600 }}>
                              {item.content}
                            </Typography>
                            {item.options.map((option, index) => {
                              const totalVotes = item.total_votes || 1;
                              const optionVotes = item.votes[option] || 0;
                              const percentage = ((optionVotes / totalVotes) * 100).toFixed(2);
                              const isSelected = pollResponses[item.id] === option;
                              const hasVoted = votedPolls[item.id];
                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5,
                                    m: 0.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '8px',
                                    bgcolor: isSelected ? '#e6f3ff' : 'background.paper',
                                    cursor: hasVoted ? 'not-allowed' : 'pointer',
                                    opacity: hasVoted ? 0.6 : 1,
                                    '&:hover': hasVoted ? {} : { bgcolor: '#f1f1f1', transform: 'scale(1.02)' },
                                    transition: 'all 0.2s ease',
                                  }}
                                  onClick={() => !hasVoted && handlePollResponse(item.id, option)}
                                >
                                  <Typography sx={{ flexGrow: 1, fontSize: '1rem', color: 'text.primary' }}>
                                    {option}
                                  </Typography>
                                  <Box
                                    sx={{
                                      flexGrow: 1,
                                      height: '8px',
                                      bgcolor: 'divider',
                                      borderRadius: '4px',
                                      ml: 2,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        bgcolor: 'primary.main',
                                        transition: 'width 0.3s ease',
                                      }}
                                    />
                                  </Box>
                                  <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', ml: 2 }}>
                                    {percentage}% ({optionVotes} votes)
                                  </Typography>
                                </Box>
                              );
                            })}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
                              <Typography>Total Votes: {item.total_votes}</Typography>
                              {item.remaining_days !== undefined && (
                                <Typography>Ends in {item.remaining_days} Days</Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                        {item.type === 'praise' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={photoCache[`recipient_${item.recipient}`]}
                              sx={{ bgcolor: 'custom.lightGray', mr: 2, width: 40, height: 40, fontSize: '1rem' }}
                            >
                              {!photoCache[`recipient_${item.recipient}`] && getInitials(getRecipientName(item.recipient))}
                            </Avatar>
                            <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '1.1rem', fontStyle: 'italic' }}>
                              Praise for <strong>{getRecipientName(item.recipient)}</strong>: {item.content}
                            </Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 2, borderColor: 'divider' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.9rem' }}>
                          Liked by:{' '}
                          {item.likers.length > 0 ? (
                            showAllLikers[item.id] ? (
                              item.likers.map((liker) => liker.name).join(', ')
                            ) : (
                              <>
                                {item.likers.slice(0, 2).map((liker) => liker.name).join(', ')}
                                {item.likers.length > 2 && (
                                  <Button
                                    variant="text"
                                    sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.9rem', p: 0, ml: 1 }}
                                    onClick={() => handleShowAllLikers(item.id)}
                                  >
                                    +{item.likers.length - 2} more
                                  </Button>
                                )}
                              </>
                            )
                          ) : (
                            'No likes yet'
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <IconButton
                            onClick={() => item.likers.some((liker) => liker.emp_id === empId) ? handleUnlike(item.id) : handleLike(item.id)}
                            sx={{ color: item.likers.some((liker) => liker.emp_id === empId) ? '#A34054' : 'text.secondary' }}
                          >
                            <ThumbUpIcon />
                            <Typography sx={{ ml: 0.5, fontSize: '0.9rem' }}>{item.likers.length}</Typography>
                          </IconButton>
                          <IconButton onClick={() => handleShowComments(item.id)} sx={{ color: 'text.secondary' }}>
                            <CommentIcon />
                            <Typography sx={{ ml: 0.5, fontSize: '0.9rem' }}>{item.comments_count}</Typography>
                          </IconButton>
                        </Box>
                        {showComments[item.id] && item.comments && Object.keys(item.comments).length > 0 && (
                          <List sx={{ mt: 2 }}>
                            {Object.entries(item.comments)
                              .filter(([_, comment]) => comment)
                              .map(([commentId, comment]) => {
                                const timestamp = commentId.match(/comment_(.+?)_/)?.[1];
                                return (
                                  <ListItem
                                    key={commentId}
                                    sx={{ alignItems: 'flex-start', bgcolor: '#f9f9fb', borderRadius: '8px', mb: 1, p: 2 }}
                                  >
                                    <Avatar
                                      src={photoCache[`commenter_${comment.commenter_id}`]}
                                      sx={{ bgcolor: '#eceff3', mr: 2, width: 40, height: 40, fontSize: '1rem' }}
                                    >
                                      {!photoCache[`commenter_${comment.commenter_id}`] && getInitials(comment.commenter)}
                                    </Avatar>
                                    <ListItemText
                                      primary={
                                        <>
                                          <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                                            {comment.commenter}
                                          </Typography>
                                          <Typography sx={{ color: 'text.primary', fontSize: '0.95rem' }}>
                                            {comment.content}
                                          </Typography>
                                          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.5 }}>
                                            {formatRelativeTime(timestamp)}
                                          </Typography>
                                        </>
                                      }
                                    />
                                    {commentId.endsWith(`_${empId}`) && (
                                      <IconButton
                                        onClick={() => handleConfirmDelete(item.id, commentId)}
                                        disabled={deleteLoading[commentId]}
                                        sx={{ color: 'error.main' }}
                                      >
                                        {deleteLoading[commentId] ? <CircularProgress size={24} /> : <DeleteIcon />}
                                      </IconButton>
                                    )}
                                  </ListItem>
                                );
                              })}
                          </List>
                        )}
                        {showCommentBox[item.id] && (
                          <Box
                            component="form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCommentSubmit(item.id, comments[item.id] || '');
                            }}
                            sx={{ display: 'flex', gap: 1.5, mt: 2 }}
                          >
                            <TextField
                              label="Add a comment"
                              value={comments[item.id] || ''}
                              onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
                              fullWidth
                              variant="outlined"
                              sx={{ bgcolor: 'background.paper', borderRadius: '12px' }}
                            />
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={commentLoading[item.id]}
                              sx={{ borderRadius: '24px', fontWeight: 600 }}
                            >
                              {commentLoading[item.id] ? <CircularProgress size={24} /> : 'Comment'}
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                <Modal
                  open={showPostModal}
                  onClose={() => {
                    setShowPostModal(false);
                    setPhotoPreview(null);
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Create Post
                      </Typography>
                      <IconButton
                        onClick={() => {
                          setShowPostModal(false);
                          setPhotoPreview(null);
                        }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handlePostSubmit}>
                      <TextField
                        label="Post Content"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Upload Photo"
                        type="file"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ accept: 'image/*' }}
                        onChange={handlePhotoChange}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      {photoPreview && (
                        <Box
                          component="img"
                          src={photoPreview}
                          alt="Preview"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '12px',
                            mt: 1.5,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                      )}
                      <TextField
                        label="Upload Video"
                        type="file"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ accept: 'video/*' }}
                        onChange={(e) => setNewPost({ ...newPost, video: e.target.files[0] })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={actionLoading.post}
                        sx={{ borderRadius: '24px', fontWeight: 600 }}
                      >
                        {actionLoading.post ? <CircularProgress size={24} /> : 'Post'}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
                <Modal open={showEditPostModal} onClose={() => setShowEditPostModal(false)}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Edit Post
                      </Typography>
                      <IconButton
                        onClick={() => setShowEditPostModal(false)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleEditPostSubmit}>
                      <TextField
                        label="Post Content"
                        value={editPost.content}
                        onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Upload New Photo"
                        type="file"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ accept: 'image/*' }}
                        onChange={(e) => setEditPost({ ...editPost, photo: e.target.files[0] })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Upload New Video"
                        type="file"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ accept: 'video/*' }}
                        onChange={(e) => setEditPost({ ...editPost, video: e.target.files[0] })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={actionLoading.editPost}
                        sx={{ borderRadius: '24px', fontWeight: 600 }}
                      >
                        {actionLoading.editPost ? <CircularProgress size={24} /> : 'Update Post'}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
                <Modal open={showPollModal} onClose={() => setShowPollModal(false)}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Create Poll
                      </Typography>
                      <IconButton
                        onClick={() => setShowPollModal(false)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handlePollSubmit}>
                      <TextField
                        label="Poll Question"
                        value={newPoll.question}
                        onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      {newPoll.options.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <TextField
                            label={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newPoll.options];
                              newOptions[index] = e.target.value;
                              setNewPoll({ ...newPoll, options: newOptions });
                            }}
                            fullWidth
                            variant="outlined"
                          />
                          <IconButton
                            onClick={() => handleDeletePollOption(index)}
                            disabled={newPoll.options.length <= 2}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: '#17a2b8',
                          color: '#17a2b8',
                          '&:hover': { bgcolor: '#17a2b8', color: 'white' },
                          borderRadius: '24px',
                          mb: 2,
                          fontWeight: 500,
                        }}
                        onClick={handleAddPollOption}
                        disabled={newPoll.options.length >= 5}
                      >
                        Add Option
                      </Button>
                      <TextField
                        label="Duration (Days)"
                        type="number"
                        value={newPoll.duration}
                        onChange={(e) => setNewPoll({ ...newPoll, duration: parseInt(e.target.value) || 10 })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={actionLoading.poll}
                        sx={{ borderRadius: '24px', fontWeight: 600 }}
                      >
                        {actionLoading.poll ? <CircularProgress size={24} /> : 'Create Poll'}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
                <Modal open={showPraiseModal} onClose={() => {
                  setShowPraiseModal(false);
                  setRecipientSearch('');
                }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Send Praise
                      </Typography>
                      <IconButton
                        onClick={() => {
                          setShowPraiseModal(false);
                          setRecipientSearch('');
                        }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handlePraiseSubmit}>
                      <TextField
                        label="Praise Content"
                        value={newPraise.content}
                        onChange={(e) => setNewPraise({ ...newPraise, content: e.target.value })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Recipient"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setNewPraise({ ...newPraise, recipient: '' });
                        }}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      {recipientSearch && filteredEmployees.length > 0 && (
                        <Box
                          sx={{
                            maxHeight: 200,
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            mb: 2,
                          }}
                        >
                          <List>
                            {filteredEmployees.map((emp) => (
                              <ListItemButton
                                key={emp.emp_id}
                                onClick={() => handleRecipientSelect(emp)}
                                sx={{
                                  '&:hover': { bgcolor: '#f1f1f1' },
                                  py: 1,
                                }}
                              >
                                <Avatar
                                  src={photoCache[`emp_${emp.emp_id}`]}
                                  sx={{ width: 32, height: 32, mr: 2, fontSize: '1rem' }}
                                >
                                  {!photoCache[`emp_${emp.emp_id}`] && getInitials(emp.full_name)}
                                </Avatar>
                                <Typography sx={{ color: 'text.primary' }}>{emp.full_name}</Typography>
                              </ListItemButton>
                            ))}
                          </List>
                        </Box>
                      )}
                      {recipientSearch && filteredEmployees.length === 0 && (
                        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                          No matching employees found
                        </Typography>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          bgcolor: 'linear-gradient(45deg, #17a2b8 30%, #1fc8e3 90%)',
                          '&:hover': { bgcolor: 'linear-gradient(45deg, #1fc8e3 30%, #17a2b8 90%)' },
                          borderRadius: '24px',
                          fontWeight: 600,
                        }}
                        disabled={actionLoading.praise || !newPraise.recipient}
                      >
                        {actionLoading.praise ? <CircularProgress size={24} /> : 'Send Praise'}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
                <Modal open={showEditPraiseModal} onClose={() => {
                  setShowEditPraiseModal(false);
                  setRecipientSearch('');
                }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Edit Praise
                      </Typography>
                      <IconButton
                        onClick={() => {
                          setShowEditPraiseModal(false);
                          setRecipientSearch('');
                        }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <Box component="form" onSubmit={handleEditPraiseSubmit}>
                      <TextField
                        label="Praise Content"
                        value={editPraise.content}
                        onChange={(e) => setEditPraise({ ...editPraise, content: e.target.value })}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Recipient"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setEditPraise({ ...editPraise, recipient: '' });
                        }}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      {recipientSearch && filteredEmployees.length > 0 && (
                        <Box
                          sx={{
                            maxHeight: 200,
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            mb: 2,
                          }}
                        >
                          <List>
                            {filteredEmployees.map((emp) => (
                              <ListItemButton
                                key={emp.emp_id}
                                onClick={() => handleRecipientSelect(emp, true)}
                                sx={{
                                  '&:hover': { bgcolor: '#f1f1f1' },
                                  py: 1,
                                }}
                              >
                                <Avatar
                                  src={photoCache[`emp_${emp.emp_id}`]}
                                  sx={{ width: 32, height: 32, mr: 2, fontSize: '1rem' }}
                                >
                                  {!photoCache[`emp_${emp.emp_id}`] && getInitials(emp.full_name)}
                                </Avatar>
                                <Typography sx={{ color: 'text.primary' }}>{emp.full_name}</Typography>
                              </ListItemButton>
                            ))}
                          </List>
                        </Box>
                      )}
                      {recipientSearch && filteredEmployees.length === 0 && (
                        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                          No matching employees found
                        </Typography>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          bgcolor: 'linear-gradient(45deg, #17a2b8 30%, #1fc8e3 90%)',
                          '&:hover': { bgcolor: 'linear-gradient(45deg, #1fc8e3 30%, #17a2b8 90%)' },
                          borderRadius: '24px',
                          fontWeight: 600,
                        }}
                        disabled={actionLoading.editPraise || !editPraise.recipient}
                      >
                        {actionLoading.editPraise ? <CircularProgress size={24} /> : 'Update Praise'}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
                <Modal
                  open={showDeleteConfirm.open}
                  onClose={() => setShowDeleteConfirm({ open: false, itemId: null, commentId: null })}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '90%', sm: 450 },
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                      borderRadius: '16px',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      Confirm Deletion
                    </Typography>
                    <Typography sx={{ mb: 2, color: 'text.primary' }}>
                      Are you sure you want to delete this {showDeleteConfirm.commentId ? 'comment' : 'item'}? This action cannot be undone.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setShowDeleteConfirm({ open: false, itemId: null, commentId: null })}
                        sx={{ borderRadius: '24px', fontWeight: 500 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirmed}
                        disabled={
                          showDeleteConfirm.commentId
                            ? deleteLoading[showDeleteConfirm.commentId]
                            : deleteLoading[showDeleteConfirm.itemId]
                        }
                        sx={{ borderRadius: '24px', fontWeight: 600 }}
                      >
                        {(showDeleteConfirm.commentId && deleteLoading[showDeleteConfirm.commentId]) ||
                          (!showDeleteConfirm.commentId && deleteLoading[showDeleteConfirm.itemId]) ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Modal>
              </>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default UserFeed;