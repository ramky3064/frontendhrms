import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Row, Col, ListGroup, Form, Button, InputGroup, Alert, Modal } from 'react-bootstrap';
import { Box, Typography, Avatar, IconButton, TextField, CircularProgress, Tabs, Tab, Badge } from '@mui/material';
import { Send, AttachFile, GroupAdd, People, EmojiEmotions, Download, LightMode, DarkMode, Delete } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap/dist/css/bootstrap.min.css';
import pLimit from 'p-limit';
import Checkbox from '@mui/material/Checkbox';
import { useNavigate } from 'react-router-dom';
import HomeIcon from "@mui/icons-material/Home";
import { Link as MuiLink } from "@mui/material";


// API and Socket.IO configuration
const SOCKET_URL = 'http://127.0.0.1:5000';
const API_BASE_URL = `${SOCKET_URL}/api`;
const ROUTES = {
  initialize: `${API_BASE_URL}/initialize`,
  messages: (target_id) => `${API_BASE_URL}/messages/${target_id}`,
  markRead: (target_id, isGroup = false) => 
    isGroup 
      ? `${API_BASE_URL}/groups/${target_id}/mark_read` 
      : `${API_BASE_URL}/messages/${target_id}/mark_read`,
  sendMessage: `${API_BASE_URL}/messages`,
  fileUpload: `${API_BASE_URL}/messages/fileupload`,
  fileDownload: (message_id) => `${API_BASE_URL}/messages/file/${message_id}`,
  createGroup: `${API_BASE_URL}/create/groups`,
  groupMembers: (group_id) => `${API_BASE_URL}/groups/${group_id}/members`,
  deleteGroup: (group_id) => `${API_BASE_URL}/delete/groups/${group_id}`,
  groupMessages: (group_id) => `${API_BASE_URL}/group_messages/${group_id}`,
  unreadCounts: `${API_BASE_URL}/unread_counts`,
  groupFileUpload: (group_id) => `${API_BASE_URL}/groups/${group_id}/fileupload`,
  groupFileDownload: (message_id) => `${API_BASE_URL}/groups/file/${message_id}`,
  groupSendMessage: (group_id) => `${API_BASE_URL}/groups/${group_id}/send_message`,
};

// Regular expression for message input validation
const MESSAGE_REGEX = /^[\p{L}\p{N}\p{P}\p{S}\s]*$/u;

// Limit concurrent requests
const limit = pLimit(2);

// CSS for reusable styles
const styles = `
  .chat-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  }
  .sidebar-item:hover {
    background-color: #f0f2f5 !important;
    transition: background-color 0.2s ease;
  }
  .dark .sidebar-item:hover {
    background-color: #2a2a3e !important;
  }
  .chat-bubble {
    transition: all 0.2s ease;
  }
  .modal-content {
    border-radius: 12px;
  }
  .input-group textarea {
    resize: none;
    border-radius: 20px;
    padding: 0.75rem 1rem;
  }
`;

const Chatting = () => {
  // State hooks
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState({});
  const [groupMessages, setGroupMessages] = useState({});
  const [messageInput, setMessageTextInput] = useState('');
  const [unreadCounts, setUnreadCounts] = useState(() => {
    const saved = localStorage.getItem(`unreadCounts_${sessionStorage.getItem('empId')}`);
    return saved ? JSON.parse(saved) : { direct: {}, groups: {} };
  });
  const [latestMessages, setLatestMessages] = useState({ direct: {}, groups: {} });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupName, setGroupFormName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberAction, setMemberAction] = useState('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [membersSearchQuery, setMembersSearchQuery] = useState('');
  const [pendingMessages, setPendingMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [tabValue, setTabValue] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [shouldFetchInitialize, setShouldFetchInitialize] = useState(true);
  const hasMounted = useRef(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const autoscrollRef = useRef(true);

  // Token and emp_id handling
  let empId = sessionStorage.getItem('empId');
  let token = empId ? localStorage.getItem(`token_${empId}`) : localStorage.getItem('token');

  // Initialize Socket.IO clients
  const socket = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      auth: { token },
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
  }, [token]);

  const groupSocket = useMemo(() => {
    if (!token) return null;
    return io(`${SOCKET_URL}/group`, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      auth: { token },
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
  }, [token]);

  // Auto-connect sockets
  useEffect(() => {
    if (token && socket && !socket.connected) socket.connect();
    if (token && groupSocket && !groupSocket.connected) groupSocket.connect();

    return () => {
      if (socket) socket.disconnect();
      if (groupSocket) groupSocket.disconnect();
    };
  }, [token, socket, groupSocket]);

  // Simplified fetchWithRetry
  const fetchWithRetry = useCallback(
    async (url, options) => {
      return limit(async () => {
        try {
          const response = await axios({
            url,
            ...options,
            headers: { ...options.headers, Authorization: `${token}` },
            withCredentials: true,
          });
          return response;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 422) {
            console.error('Authentication failed');
            setError('Authentication failed. Please log in again.');
            localStorage.removeItem(`token_${empId}`);
            sessionStorage.removeItem('empId');
            setTimeout(() => (window.location.href = '/login'), 2000);
          }
          throw err;
        }
      });
    },
    [token] // Removed empId from deps as it's stable per render
  );

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!token || !empId) return;
    const tempId = crypto?.randomUUID?.() || Date.now().toString();
    try {
      setPendingMessages((prev) => [...prev, { tempId, action: 'fetch_unread_counts' }]);
      const response = await fetchWithRetry(ROUTES.unreadCounts, { method: 'GET', params: { tempId } });
      const counts = response.data.unread_counts || { direct: {}, groups: {} };
      setUnreadCounts((prev) => {
        let newUnreadCounts = {
          direct: {
            ...prev.direct,
            ...Object.fromEntries(
              users.map((u) => [
                String(u.emp_id),
                {
                  name: u.full_name || 'Unknown User',
                  unread_count: Number(counts.direct?.[String(u.emp_id)]?.unread_count) || prev.direct[String(u.emp_id)]?.unread_count || 0,
                },
              ])
            ),
          },
          groups: {
            ...prev.groups,
            ...Object.fromEntries(
              groups.map((g) => [
                String(g.id),
                {
                  name: g.name || 'Unnamed Group',
                  unread_count: Number(counts.groups?.[String(g.id)]?.unread_count) || prev.groups[String(g.id)]?.unread_count || 0,
                },
              ])
            ),
          },
        };
        if (selectedChat) {
          const chatTypeKey = selectedChat.type === 'group' ? 'groups' : 'direct';
          const chatId = selectedChat.type === 'broadcast' ? 'broadcast' : String(selectedChat.id);
          if (newUnreadCounts[chatTypeKey][chatId]) {
            newUnreadCounts[chatTypeKey][chatId] = {
              ...newUnreadCounts[chatTypeKey][chatId],
              unread_count: 0,
            };
          }
        }
        return newUnreadCounts;
      });
    } catch (err) {
      console.error('Failed to fetch unread counts');
      setError(err.response?.data?.error || 'Failed to fetch unread counts');
      setTimeout(() => setError(''), 5000);
    } finally {
      setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    }
  }, [token, users, groups, selectedChat, fetchWithRetry]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (chatType, chatId) => {
      if (!token || !chatId || !selectedChat || selectedChat.id !== chatId || selectedChat.type !== chatType) {
        return false;
      }
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      try {
        setPendingMessages((prev) => [...prev, { tempId, action: 'mark_read' }]);
        await fetchWithRetry(ROUTES.markRead(chatId, chatType === 'group'), { method: 'POST', data: { tempId } });
        setUnreadCounts((prev) => {
          const newCounts = {
            ...prev,
            [chatType === 'group' ? 'groups' : 'direct']: {
              ...prev[chatType === 'group' ? 'groups' : 'direct'],
              [String(chatId)]: {
                ...prev[chatType === 'group' ? 'groups' : 'direct'][String(chatId)] || { name: selectedChat?.name || 'Unknown' },
                unread_count: 0,
              },
            },
          };
          return newCounts;
        });
        fetchUnreadCounts(); // Refresh unread counts after marking as read
        return true;
      } catch (err) {
        console.error('Failed to mark messages as read');
        setError(err.response?.data?.error || 'Failed to mark messages as read');
        setTimeout(() => setError(''), 5000);
        return false;
      } finally {
        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      }
    },
    [token, selectedChat, fetchWithRetry, fetchUnreadCounts]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Check if scrolled to bottom
  const isScrolledToBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10; // Tolerance for floating point
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !token || !selectedChat.id || !selectedChat.type) return;
    const tempId = crypto?.randomUUID?.() || Date.now().toString();
    try {
      setPendingMessages((prev) => [...prev, { tempId, action: 'fetch_messages' }]);
      const url =
        selectedChat.type === 'group'
          ? ROUTES.groupMessages(selectedChat.id)
          : selectedChat.type === 'broadcast'
          ? ROUTES.messages('broadcast')
          : ROUTES.messages(selectedChat.id);
      const wasAtBottom = isScrolledToBottom();
      autoscrollRef.current = wasAtBottom;
      const response = await fetchWithRetry(url, { method: 'GET', params: { tempId } });
      const messages = Array.isArray(response.data.messages) ? response.data.messages : [];
      const formattedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
        rawTimestamp: msg.timestamp || new Date().toISOString(),
        sender_name: msg.sender_name || 'Unknown User',
        receiver_name: msg.receiver_name || (selectedChat.type === 'broadcast' ? 'Broadcast' : null),
        file_name: msg.file_name || null,
        file_type: msg.file_type || null,
      })).sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));
      const key = selectedChat.type === 'group' ? `group:${selectedChat.id}` : `direct:${selectedChat.id}`;
      if (selectedChat.type === 'group') {
        setGroupMessages((prev) => ({ ...prev, [key]: formattedMessages }));
      } else {
        setDirectMessages((prev) => ({ ...prev, [key]: formattedMessages }));
      }
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to fetch messages');
      setError(err.response?.data?.error || 'Failed to fetch messages');
      setMessages([]);
      setTimeout(() => setError(''), 5000);
    } finally {
      setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    }
  }, [selectedChat, token, fetchWithRetry, isScrolledToBottom]);

  // Fetch group members
  const fetchGroupMembers = useCallback(async (groupId) => {
    if (!token || !groupId) return;
    const tempId = crypto?.randomUUID?.() || Date.now().toString();
    setPendingMessages((prev) => [...prev, { tempId, action: 'fetch_group_members' }]);
    try {
      const response = await fetchWithRetry(ROUTES.groupMembers(groupId), { method: 'GET', params: { tempId } });
      setGroupMembers(
        Array.isArray(response.data.members)
          ? response.data.members.map((m) => ({
              ...m,
              full_name: m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown User',
              emp_id: m.emp_id || m.id,
            }))
          : []
      );
    } catch (err) {
      console.error('Failed to fetch group members');
      setError(err.response?.data?.error || 'Failed to fetch group members');
      setGroupMembers([]);
      setTimeout(() => setError(''), 5000);
    } finally {
      setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    }
  }, [token, fetchWithRetry]);

  // Fetch initialization data
  const fetchInitialize = useCallback(async () => {
    if (!token || !empId) return;
    try {
      setPendingMessages((prev) => [...prev, { tempId: crypto?.randomUUID?.() || Date.now().toString(), action: 'fetch_initialize' }]);
      const response = await fetchWithRetry(ROUTES.initialize, { method: 'GET' });
      const { current_user, users, groups, unread_counts, latest_messages } = response.data;
      setUser(current_user || null);
      const formattedUsers = Array.isArray(users)
        ? users.map((u) => ({
            ...u,
            emp_id: String(u.emp_id || u.id),
            full_name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
            designation: u.designation || 'No designation',
          }))
        : [];
      setUsers(formattedUsers);
      const formattedGroups = Array.isArray(groups)
        ? groups.map((g) => ({
            ...g,
            id: String(g.id),
            name: g.name || 'Unnamed Group',
            latest_message: g.latest_message || '',
            latest_timestamp: g.latest_timestamp || '',
          }))
        : [];
      setGroups(formattedGroups);
      setUnreadCounts((prev) => ({
        direct: {
          ...prev.direct,
          ...Object.fromEntries(
            formattedUsers.map((u) => [
              String(u.emp_id),
              {
                name: u.full_name || 'Unknown User',
                unread_count: Number(unread_counts.direct?.[String(u.emp_id)]?.unread_count) || prev.direct[String(u.emp_id)]?.unread_count || 0,
              },
            ])
          ),
        },
        groups: {
          ...prev.groups,
          ...Object.fromEntries(
            formattedGroups.map((g) => [
              String(g.id),
              {
                name: g.name || 'Unnamed Group',
                unread_count: Number(unread_counts.groups?.[String(g.id)]?.unread_count) || prev.groups[String(g.id)]?.unread_count || 0,
              },
            ])
          ),
        },
      }));
      setLatestMessages(
        Object.fromEntries(
          Object.entries(latest_messages || { direct: {}, groups: {} }).map(([type, messages]) => [
            type,
            Object.fromEntries(
              Object.entries(messages).map(([id, msg]) => [
                id,
                {
                  ...msg,
                  rawTimestamp: msg.timestamp || new Date().toISOString(),
                  timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
                },
              ])
            ),
          ])
        )
      );
    } catch (err) {
      console.error('Failed to fetch initialization data');
      setError(err.response?.data?.error || 'Failed to fetch user data');
      setUsers([]);
      setGroups([]);
      setUnreadCounts((prev) => ({ ...prev, direct: {}, groups: {} }));
      setLatestMessages({ direct: {}, groups: {} });
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoadingInitial(false);
      setShouldFetchInitialize(false);
      setPendingMessages((prev) => prev.filter((msg) => msg.action !== 'fetch_initialize'));
    }
  }, [token, fetchWithRetry]);

  const totalUnreadCount = useMemo(() => {
    const groupCount = Object.values(unreadCounts.groups || {}).reduce(
      (sum, { unread_count }) => sum + (Number(unread_count) || 0),
      0
    );
    const directCount = Object.values(unreadCounts.direct || {}).reduce(
      (sum, { unread_count }) => sum + (Number(unread_count) || 0),
      0
    );
    const total = groupCount + directCount;
    return total;
  }, [unreadCounts]);

const handleMessageReceived = useCallback(
  (msg, namespace = '/') => {
    if (!msg || !msg.id) {
      console.error('Received invalid message data');
      setError('Received invalid message data');
      setTimeout(() => setError(''), 5000);
      return;
    }
    const isGroupMessage = !!msg.group_id;
    const isBroadcastMessage = msg.receiver_id === 'broadcast' || msg.receiver_name === 'Broadcast';
    const formattedMessage = {
      ...msg,
      sender_name: msg.sender_name || 'Unknown User',
      receiver_name: msg.receiver_name || (isBroadcastMessage ? 'Broadcast' : null),
      timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
      rawTimestamp: msg.timestamp || new Date().toISOString(),
      file_name: msg.file_name || null,
      file_type: msg.file_type || null,
      tempId: msg.tempId,
    };

    if (msg.tempId) {
      setPendingMessages((prev) => prev.filter((m) => m.tempId !== msg.tempId));
    }

    const appendOrReplace = (messages, newMsg) => {
      let filtered = messages.filter((m) => m.tempId !== newMsg.tempId && m.id !== newMsg.id);
      return [...filtered, newMsg].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));
    };

    const isSender = msg.sender_id === empId;
    let chatId;
    let chatType;
    let key;
    if (isGroupMessage) {
      chatId = String(msg.group_id);
      chatType = 'group';
      key = `group:${chatId}`;
    } else if (isBroadcastMessage) {
      chatId = 'broadcast';
      chatType = 'broadcast';
      key = `direct:broadcast`;
    } else {
      chatId = isSender ? String(msg.receiver_id) : String(msg.sender_id);
      chatType = 'user';
      key = `direct:${chatId}`;
    }

    const wasAtBottom = isScrolledToBottom();
    autoscrollRef.current = isSender || wasAtBottom;

    if (
      selectedChat?.type === chatType &&
      String(selectedChat.id) === chatId
    ) {
      setMessages(appendOrReplace(messages, formattedMessage));
      if (chatType === 'group') {
        setGroupMessages((prev) => ({
          ...prev,
          [key]: appendOrReplace(prev[key] || [], formattedMessage),
        }));
      } else {
        setDirectMessages((prev) => ({
          ...prev,
          [key]: appendOrReplace(prev[key] || [], formattedMessage),
        }));
      }
      setLatestMessages((prev) => ({
        ...prev,
        [chatType === 'group' ? 'groups' : 'direct']: {
          ...prev[chatType === 'group' ? 'groups' : 'direct'],
          [chatType === 'group' ? key : chatId]: {
            message: msg.message || (msg.file_name ? `File: ${msg.file_name}` : ''),
            timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
            rawTimestamp: msg.timestamp || new Date().toISOString(),
          },
        },
      }));
      if (!isSender) {
        markMessagesAsRead(chatType, chatId);
      }
    } else if (!isSender) {
      const unreadType = isGroupMessage ? 'groups' : 'direct';
      const name = isGroupMessage
        ? groups.find((g) => String(g.id) === chatId)?.name || msg.group_name || 'Unnamed Group'
        : users.find((u) => String(u.emp_id) === chatId)?.full_name || msg.sender_name || 'Unknown User';
      setUnreadCounts((prev) => ({
        ...prev,
        [unreadType]: {
          ...prev[unreadType],
          [chatId]: {
            name,
            unread_count: (prev[unreadType][chatId]?.unread_count || 0) + 1,
          },
        },
      }));
      setLatestMessages((prev) => ({
        ...prev,
        [isGroupMessage ? 'groups' : 'direct']: {
          ...prev[isGroupMessage ? 'groups' : 'direct'],
          [isGroupMessage ? key : chatId]: {
            message: msg.message || (msg.file_name ? `File: ${msg.file_name}` : ''),
            timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
            rawTimestamp: msg.timestamp || new Date().toISOString(),
          },
        },
      }));
    }
  },
  [selectedChat, groups, users, markMessagesAsRead, messages, isScrolledToBottom]
);
  // Handle message history
  const handleMessageHistory = useCallback(
    (data) => {
      if (selectedChat?.type === 'group' && String(selectedChat.id) === String(data.group_id)) {
        const wasAtBottom = isScrolledToBottom();
        autoscrollRef.current = wasAtBottom;
        const formattedMessages = (data.messages || []).map((msg) => ({
          ...msg,
          timestamp: moment(msg.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
          rawTimestamp: msg.timestamp || new Date().toISOString(),
          sender_name: msg.sender_name || 'Unknown User',
          file_name: msg.file_name || null,
          file_type: msg.file_type || null,
        }));
        setGroupMessages((prev) => ({
          ...prev,
          [`group:${data.group_id}`]: formattedMessages.sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)),
        }));
        setMessages(formattedMessages.sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)));
      }
    },
    [selectedChat, isScrolledToBottom]
  );

  // Handle group created
  const handleGroupCreated = useCallback(
    (data) => {
      if (!data?.group_id || !data?.name) return;
      if (data.tempId) {
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== data.tempId));
      }
      setGroups((prev) => [
        ...prev,
        {
          id: String(data.group_id),
          name: data.name,
          created_by_id: data.created_by_id || empId,
          created_at: data.created_at || moment().toISOString(),
          latest_message: '',
          latest_timestamp: '',
        },
      ]);
      setUnreadCounts((prev) => ({
        ...prev,
        groups: {
          ...prev.groups,
          [String(data.group_id)]: { name: data.name, unread_count: 0 },
        },
      }));
      setLatestMessages((prev) => ({
        ...prev,
        groups: {
          ...prev.groups,
          [`group:${data.group_id}`]: { message: '', timestamp: '', rawTimestamp: '' },
        },
      }));
      setSuccess(`Group "${data.name}" created successfully`);
      console.log(`Group "${data.name}" created successfully`);
      setTimeout(() => setSuccess(''), 5000);
    },
    [] // Removed empId as it's stable
  );

  // Handle group updated
  const handleGroupUpdated = useCallback(
    (data) => {
      if (data.tempId) {
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== data.tempId));
      }
      if (data.action === 'member_added' || data.action === 'member_removed') {
        if (selectedChat?.type === 'group' && String(selectedChat.id) === String(data.group_id)) {
          fetchGroupMembers(data.group_id);
        }
      } else if (data.latest_message) {
        setGroups((prev) =>
          prev.map((g) =>
            String(g.id) === String(data.group_id)
              ? {
                  ...g,
                  latest_message: data.latest_message?.message || (data.latest_message?.file_name ? `File: ${data.latest_message.file_name}` : ''),
                  latest_timestamp: data.latest_message?.timestamp || new Date().toISOString(),
                }
              : g
          )
        );
        setLatestMessages((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            [`group:${data.group_id}`]: {
              message: data.latest_message?.message || (data.latest_message?.file_name ? `File: ${data.latest_message.file_name}` : ''),
              timestamp: moment(data.latest_message?.timestamp || new Date()).tz('Asia/Kolkata').format('h:mm A'),
              rawTimestamp: data.latest_message?.timestamp || new Date().toISOString(),
            },
          },
        }));
      }
    },
    [selectedChat, fetchGroupMembers]
  );

  // Handle group deleted
  const handleGroupDeleted = useCallback(
    ({ group_id, name, tempId }) => {
      if (tempId) {
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      }
      setGroups((prev) => prev.filter((g) => String(g.id) !== String(group_id)));
      setGroupMessages((prev) => {
        const updated = { ...prev };
        delete updated[`group:${group_id}`];
        return updated;
      });
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        delete updated.groups[group_id];
        return updated;
      });
      setLatestMessages((prev) => {
        const updated = { ...prev };
        delete updated.groups[`group:${group_id}`];
        return updated;
      });
      if (selectedChat?.type === 'group' && String(selectedChat.id) === String(group_id)) {
        setSelectedChat(null);
        setMessages([]);
        setPendingMessages([]);
      }
      setSuccess(`Group "${name}" was deleted`);
      console.log(`Group "${name}" was deleted`);
      setTimeout(() => setSuccess(''), 5000);
    },
    [selectedChat]
  );

  // Handle create group
  const handleCreateGroup = useCallback(
    async () => {
      if (!groupName.trim() || selectedUsers.length === 0) {
        setError('Group name and at least one member are required');
        console.error('Group name and at least one member are required');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      setPendingMessages((prev) => [...prev, { tempId, action: 'create_group', name: groupName }]);
      try {
        const response = await fetchWithRetry(ROUTES.createGroup, {
          method: 'POST',
          data: { name: groupName.trim(), members: selectedUsers, tempId },
        });
        const newGroup = {
          id: String(response.data.group_id),
          name: groupName.trim(),
          created_by_id: empId,
          created_at: moment().toISOString(),
          latest_message: '',
          latest_timestamp: '',
        };
        setGroups((prev) => [...prev, newGroup]);
        setUnreadCounts((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            [newGroup.id]: { name: newGroup.name, unread_count: 0 },
          },
        }));
        groupSocket.emit('group_created', {
          token,
          group_id: newGroup.id,
          name: newGroup.name,
          created_by_id: empId,
          created_at: newGroup.created_at,
          tempId,
        });
        setSuccess(`Group "${groupName}" created successfully`);
        console.log(`Group "${groupName}" created successfully`);
        setGroupFormName('');
        setSelectedUsers([]);
        setGroupSearchQuery('');
        setShowGroupModal(false);
      } catch (err) {
        console.error('Failed to create group');
        setError(err.response?.data?.error || 'Failed to create group');
        setTimeout(() => setError(''), 5000);
      } finally {
        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      }
    },
    [groupName, selectedUsers, groupSocket, fetchWithRetry, token]
  );

  // Handle manage members
const handleManageMembers = useCallback(async () => {
  if (!selectedChat?.id || !groupSocket || selectedUsers.length === 0) {
    setError('Invalid group or no users selected');
    console.error('Invalid group or no users selected');
    setTimeout(() => setError(''), 5000);
    return;
  }
  const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const action = memberAction;
  setPendingMessages((prev) => [...prev, { id: tempId, action: `${action}_members` }]);
  try {
    await fetchWithRetry(
      ROUTES.groupMembers(selectedChat.id),
      {
        method: action === 'add' ? 'POST' : 'DELETE',
        data: {
          member_ids: selectedUsers, // Ensure this is an array of strings
          tempId,
        },
      }
    );
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    setShowMembersModal(false);
    setSelectedUsers([]);
    setMembersSearchQuery('');
    fetchGroupMembers(selectedChat.id); // Refresh members list
    setSuccess(`${action === 'add' ? 'Added' : 'Removed'} members successfully`);
    console.log(`${action === 'add' ? 'Added' : 'Removed'} members successfully`);
    setTimeout(() => setSuccess(''), 5000);
  } catch (err) {
    console.error('Failed to manage members');
    setError(err.response?.data?.error || 'Failed to manage members');
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    setTimeout(() => setError(''), 5000);
  }
}, [selectedChat, groupSocket, selectedUsers, memberAction, fetchGroupMembers, fetchWithRetry]);

  // Handle delete group
  const handleDeleteGroup = useCallback(
    async () => {
      if (!selectedChat || selectedChat.type !== 'group' || !token) {
        setError('Invalid group or authentication token missing');
        console.error('Invalid group or authentication token missing');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      setPendingMessages((prev) => [...prev, { tempId, action: 'delete_group', group_id: selectedChat.id }]);
      try {
        await fetchWithRetry(ROUTES.deleteGroup(selectedChat.id), { method: 'DELETE', data: { tempId } });
        groupSocket.emit('group_deleted', { token, group_id: selectedChat.id, name: selectedChat.name, tempId });
        setSuccess('Group deleted successfully');
        console.log('Group deleted successfully');
        setGroups((prev) => prev.filter((g) => String(g.id) !== String(selectedChat.id)));
        setGroupMessages((prev) => {
          const updated = { ...prev };
          delete updated[`group:${selectedChat.id}`];
          return updated;
        });
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated.groups[selectedChat.id];
          return updated;
        });
        setLatestMessages((prev) => {
          const updated = { ...prev };
          delete updated.groups[`group:${selectedChat.id}`];
          return updated;
        });
        setSelectedChat(null);
        setMessages([]);
        setShowDeleteConfirm(false);
      } catch (err) {
        console.error('Failed to delete group');
        setError(err.response?.data?.error || 'Failed to delete group');
        setTimeout(() => setError(''), 5000);
      } finally {
        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      }
    },
    [token, selectedChat, groupSocket, fetchWithRetry]
  );

  // Confirm remove members
  const confirmRemoveMembers = useCallback(() => {
    handleManageMembers();
  }, [handleManageMembers]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSending) {
        setError('Please wait before sending another message');
        console.error('Please wait before sending another message');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const trimmedMessage = messageInput.trim();
      if (!trimmedMessage || trimmedMessage.length > 1000 || !MESSAGE_REGEX.test(trimmedMessage)) {
        setError(
          !trimmedMessage
            ? 'Message cannot be empty'
            : trimmedMessage.length > 1000
            ? 'Message is too long (max 1000 characters)'
            : 'Message contains invalid characters'
        );
        console.error(
          !trimmedMessage
            ? 'Message cannot be empty'
            : trimmedMessage.length > 1000
            ? 'Message is too long (max 1000 characters)'
            : 'Message contains invalid characters'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      if (!selectedChat || !selectedChat.id || !selectedChat.type || !token || !empId) {
        setError(!selectedChat ? 'No valid chat selected' : 'Authentication token missing');
        console.error(!selectedChat ? 'No valid chat selected' : 'Authentication token missing');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const isAdmin = user?.role?.toLowerCase() === 'admin' || false;
      if (selectedChat.type === 'broadcast' && !isAdmin) {
        setError('Only admins can send broadcast messages');
        console.error('Only admins can send broadcast messages');
        setTimeout(() => setError(''), 5000);
        return;
      }
      setIsSending(true);
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      const timestamp = moment().tz('Asia/Kolkata').toISOString();
      const pendingMessage = {
        id: tempId,
        tempId,
        message: trimmedMessage,
        file_name: null,
        file_type: null,
        sender_id: empId,
        sender_name: user?.full_name || 'Unknown',
        receiver_name: selectedChat.type === 'broadcast' ? 'Broadcast' : selectedChat.name,
        isPending: true,
        rawTimestamp: timestamp,
        timestamp: moment(timestamp).format('h:mm A'),
        group_id: selectedChat.type === 'group' ? selectedChat.id : null,
        receiver_id: selectedChat.type === 'user' || selectedChat.type === 'broadcast' ? selectedChat.id : null,
      };
      const key = selectedChat.type === 'group' ? `group:${selectedChat.id}` : `direct:${selectedChat.id}`;
      autoscrollRef.current = true; // Always scroll for sent messages
      setMessages((prev) => [...prev, pendingMessage].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)));
      if (selectedChat.type === 'group') {
        setGroupMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), pendingMessage].sort(
            (a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)
          ),
        }));
      } else {
        setDirectMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), pendingMessage].sort(
            (a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)
          ),
        }));
      }
      setPendingMessages((prev) => [...prev, pendingMessage]);
      setLatestMessages((prev) => ({
        ...prev,
        [selectedChat.type === 'group' ? 'groups' : 'direct']: {
          ...prev[selectedChat.type === 'group' ? 'groups' : 'direct'],
          [selectedChat.type === 'group' ? key : selectedChat.id]: {
            message: trimmedMessage,
            timestamp: moment(timestamp).format('h:mm A'),
            rawTimestamp: timestamp,
          },
        },
      }));
      setMessageTextInput('');
      setShowEmojiPicker(false);
      try {
        const socketInstance = selectedChat.type === 'group' ? groupSocket : socket;
        const url = selectedChat.type === 'group' ? ROUTES.groupSendMessage(selectedChat.id) : ROUTES.sendMessage;
        const httpData =
          selectedChat.type === 'group'
            ? { message: trimmedMessage, tempId }
            : { message: trimmedMessage, receiver_id: selectedChat.id, tempId };
        const response = await fetchWithRetry(url, { method: 'POST', data: httpData });
        const serverMessage = response.data || {};
        autoscrollRef.current = true; // Ensure scroll after update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? {
                  ...msg,
                  id: serverMessage.message_id || msg.id,
                  isPending: false,
                  sender_name: user?.full_name || 'Unknown',
                  receiver_name: selectedChat.name,
                }
              : msg
          )
        );
        if (selectedChat.type === 'group') {
          setGroupMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((msg) =>
              msg.tempId === tempId
                ? {
                    ...msg,
                    id: serverMessage.message_id || msg.id,
                    isPending: false,
                    sender_name: user?.full_name || 'Unknown',
                    receiver_name: selectedChat.name,
                  }
                : msg
            ),
          }));
        } else {
          setDirectMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((msg) =>
              msg.tempId === tempId
                ? {
                    ...msg,
                    id: serverMessage.message_id || msg.id,
                    isPending: false,
                    sender_name: user?.full_name || 'Unknown',
                    receiver_name: selectedChat.name,
                  }
                : msg
            ),
          }));
        }
        socketInstance.emit(
          'message',
          {
            token,
            message: trimmedMessage,
            tempId,
            [selectedChat.type === 'group' ? 'group_id' : 'receiver_id']: selectedChat.id,
          },
          (ack) => {
            if (ack?.error) {
              console.error('Failed to send message via socket');
              setError(`Failed to send message: ${ack.error}`);
              setTimeout(() => setError(''), 5000);
            }
          }
        );
      } catch (err) {
        console.error('Failed to send message');
        setError(err.response?.data?.error || `Failed to send message (ID: ${tempId})`);
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        if (selectedChat.type === 'group') {
          setGroupMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((m) => m.tempId !== tempId),
          }));
        } else {
          setDirectMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((m) => m.tempId !== tempId),
          }));
        }
        setTimeout(() => setError(''), 5000);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, token, user, selectedChat, messageInput, socket, groupSocket, fetchWithRetry]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !selectedChat || !token || !selectedChat.id || !selectedChat.type) {
        setError(
          !token
            ? 'Authentication token missing'
            : !selectedChat || !selectedChat.id || !selectedChat.type
            ? 'No valid chat selected'
            : 'No file selected'
        );
        console.error(
          !token
            ? 'Authentication token missing'
            : !selectedChat || !selectedChat.id || !selectedChat.type
            ? 'No valid chat selected'
            : 'No file selected'
        );
        setTimeout(() => setError(''), 5000);
        return;
      }
      const isAdmin = user?.role?.toLowerCase() === 'admin' || false;
      if (selectedChat.type === 'broadcast' && !isAdmin) {
        setError('Only admins can send broadcast messages');
        console.error('Only admins can send broadcast messages');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
      const maxFileSize = 10 * 1024 * 1024;
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Allowed: JPEG, PNG, PDF, TXT');
        console.error('Invalid file type. Allowed: JPEG, PNG, PDF, TXT');
        setTimeout(() => setError(''), 5000);
        return;
      }
      if (file.size > maxFileSize) {
        setError('File size exceeds maximum allowed (10MB)');
        console.error('File size exceeds maximum allowed (10MB)');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      const pendingMessage = {
        id: tempId,
        tempId,
        message: `File: ${file.name}`,
        file_name: file.name,
        file_type: file.type,
        sender_id: empId,
        sender_name: user?.full_name || 'Unknown',
        receiver_name: selectedChat.type === 'broadcast' ? 'Broadcast' : null,
        isPending: true,
        rawTimestamp: moment().toISOString(),
        timestamp: moment().tz('Asia/Kolkata').format('h:mm A'),
        group_id: selectedChat.type === 'group' ? selectedChat.id : null,
        receiver_id: selectedChat.type === 'user' || selectedChat.type === 'broadcast' ? selectedChat.id : null,
      };
      setPendingMessages((prev) => [...prev, pendingMessage]);
      const key = selectedChat.type === 'group' ? `group:${selectedChat.id}` : `direct:${selectedChat.id}`;
      autoscrollRef.current = true; // Always scroll for sent files
      setMessages((prev) => [...prev, pendingMessage].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)));
      if (selectedChat.type === 'group') {
        setGroupMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), pendingMessage].sort(
            (a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)
          ),
        }));
      } else {
        setDirectMessages((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), pendingMessage].sort(
            (a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp)
          ),
        }));
      }
      setLatestMessages((prev) => ({
        ...prev,
        [selectedChat.type === 'group' ? 'groups' : 'direct']: {
          ...prev[selectedChat.type === 'group' ? 'groups' : 'direct'],
          [selectedChat.type === 'group' ? key : selectedChat.id]: {
            message: `File: ${file.name}`,
            timestamp: moment().tz('Asia/Kolkata').format('h:mm A'),
            rawTimestamp: moment().toISOString(),
          },
        },
      }));
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tempId', tempId);
      if (selectedChat.type === 'user' || selectedChat.type === 'broadcast') {
        formData.append('receiver_id', selectedChat.id);
      }
      try {
        const url = selectedChat.type === 'group' ? ROUTES.groupFileUpload(selectedChat.id) : ROUTES.fileUpload;
        const response = await fetchWithRetry(url, { method: 'POST', data: formData });
        const serverMessage = response.data.message || {};
        autoscrollRef.current = true; // Ensure scroll after update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, id: serverMessage.id || msg.id, isPending: false }
              : msg
          )
        );
        if (selectedChat.type === 'group') {
          setGroupMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((msg) =>
              msg.tempId === tempId
                ? { ...msg, id: serverMessage.id || msg.id, isPending: false }
                : msg
            ),
          }));
        } else {
          setDirectMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).map((msg) =>
              msg.tempId === tempId
                ? { ...msg, id: serverMessage.id || msg.id, isPending: false }
                : msg
            ),
          }));
        }
        const socketInstance = selectedChat.type === 'group' ? groupSocket : socket;
        socketInstance.emit(
          'message',
          {
            token,
            message: `File: ${file.name}`,
            tempId,
            [selectedChat.type === 'group' ? 'group_id' : 'receiver_id']: selectedChat.id,
          },
          (ack) => {
            if (ack?.error) {
              console.error('Failed to send file via socket');
              setError(`Failed to send file: ${ack.error}`);
              setTimeout(() => setError(''), 5000);
            }
          }
        );
        setSuccess('File uploaded successfully');
        console.log('File uploaded successfully');
        fileInputRef.current.value = '';
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        console.error('Failed to upload file');
        setError(err.response?.data?.error || `Failed to upload file (ID: ${tempId})`);
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
        if (selectedChat.type === 'group') {
          setGroupMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((m) => m.tempId !== tempId),
          }));
        } else {
          setDirectMessages((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((m) => m.tempId !== tempId),
          }));
        }
        setTimeout(() => setError(''), 5000);
      }
    },
    [token, user, selectedChat, socket, groupSocket, fetchWithRetry]
  );

  // Handle download file
  const handleDownloadFile = useCallback(
    async (messageId, fileName, isGroupMessage = false) => {
      if (!token || !messageId) {
        setError('Authentication token or message ID missing');
        console.error('Authentication token or message ID missing');
        setTimeout(() => setError(''), 5000);
        return;
      }
      const tempId = crypto?.randomUUID?.() || Date.now().toString();
      setPendingMessages((prev) => [...prev, { tempId, action: 'download_file' }]);
      try {
        const url = isGroupMessage ? ROUTES.groupFileDownload(messageId) : ROUTES.fileDownload(messageId);
        const response = await fetchWithRetry(url, { method: 'GET', responseType: 'blob', params: { tempId } });
        const urlObj = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = urlObj;
        link.setAttribute('download', fileName || 'downloaded_file');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlObj);
      } catch (err) {
        console.error('Failed to download file');
        setError(err.response?.data?.error || `Failed to download file (ID: ${tempId})`);
        setTimeout(() => setError(''), 5000);
      } finally {
        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      }
    },
    [token, fetchWithRetry]
  );

  // Handle emoji click
  const handleEmojiClick = useCallback((emojiObject) => {
    setMessageTextInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  }, []);

  // Handle select chat
const handleSelectChat = useCallback(
  (chat) => {
    if (!chat || !chat.id || !chat.type || !chat.name) {
      setError('Invalid chat selection');
      console.error('Invalid chat selection');
      setTimeout(() => setError(''), 5000);
      return;
    }
    const key = chat.type === 'group' ? `group:${chat.id}` : `direct:${chat.id}`;
    const storedMessages = chat.type === 'group' ? (groupMessages[key] || []) : (directMessages[key] || []);
    autoscrollRef.current = true; // Scroll to bottom on chat selection
    setMessages(storedMessages);
    setSelectedChat(chat);
    setPendingMessages([]);
    setError('');
    setSuccess('');
    setShowEmojiPicker(false);

    

    // Immediately reset the unread count for the selected chat
    setUnreadCounts((prev) => {
      const chatType = chat.type === 'group' ? 'groups' : 'direct';
      const chatId = String(chat.id);
      const updatedCounts = {
        ...prev,
        [chatType]: {
          ...prev[chatType],
          [chatId]: {
            ...prev[chatType][chatId],
            name: chat.name,
            unread_count: 0, // Reset badge to 0 for the selected chat
          },
        },
      };
      return updatedCounts;
    });

    setLatestMessages((prev) => {
      const updated = { ...prev };
      const latestKey = chat.type === 'group' ? key : chat.id;
      if (chat.type === 'group') {
        updated.groups = {
          ...prev.groups,
          [latestKey]: { ...prev.groups[latestKey], isLatest: false },
        };
      } else {
        updated.direct = {
          ...prev.direct,
          [latestKey]: { ...prev.direct[latestKey], isLatest: false },
        };
      }
      return updated;
    });
  },
  [groupMessages, directMessages]
);

  // Handle member toggle
  const handleMemberToggle = useCallback((empId) => {
    setSelectedUsers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  }, []);

  // Handle search changes
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleGroupSearchChange = useCallback((e) => {
    setGroupSearchQuery(e.target.value);
  }, []);

  const handleMembersSearchChange = useCallback((e) => {
    setMembersSearchQuery(e.target.value);
  }, []);

  // Filtered users with latest message detection
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    const chats = users
      .map((u) => {
        const latestMessage = latestMessages.direct?.[String(u.emp_id)];
        const unreadCount = unreadCounts.direct[String(u.emp_id)]?.unread_count || 0;
        const isLatest =
          latestMessage &&
          Object.values(latestMessages.direct || {}).every(
            (msg) => !msg.rawTimestamp || new Date(latestMessage.rawTimestamp) >= new Date(msg.rawTimestamp)
          ) &&
          unreadCount === 0 &&
          (!selectedChat || selectedChat.id !== String(u.emp_id) || selectedChat.type !== 'user');
        return {
          type: 'user',
          id: String(u.emp_id),
          name: u.full_name,
          designation: u.designation || 'No designation',
          latestMessage: latestMessage?.message || '',
          latestTimestamp: latestMessage?.rawTimestamp || '',
          isLatest,
        };
      })
      .filter((chat) => chat.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const isAdmin = user?.role?.toLowerCase() === 'admin' || false;
    if (isAdmin) {
      const latestBroadcast = latestMessages.direct?.['broadcast'];
      const unreadCount = unreadCounts.direct['broadcast']?.unread_count || 0;
      const isLatestBroadcast =
        latestBroadcast &&
        Object.values(latestMessages.direct || {}).every(
          (msg) => !msg.rawTimestamp || new Date(latestBroadcast.rawTimestamp) >= new Date(msg.rawTimestamp)
        ) &&
        unreadCount === 0 &&
        (!selectedChat || selectedChat.id !== 'broadcast' || selectedChat.type !== 'broadcast');
      chats.push({
        type: 'broadcast',
        id: 'broadcast',
        name: 'Broadcast',
        designation: 'All Users',
        latestMessage: latestBroadcast?.message || '',
        latestTimestamp: latestBroadcast?.rawTimestamp || '',
        isLatest: isLatestBroadcast,
      });
    }
    return chats.sort((a, b) => {
      const timeA = a.latestTimestamp ? new Date(a.latestTimestamp).getTime() : 0;
      const timeB = b.latestTimestamp ? new Date(b.latestTimestamp).getTime() : 0;
      return timeB - timeA || a.name?.localeCompare(b.name) || 0;
    });
  }, [users, searchQuery, latestMessages, user, unreadCounts, selectedChat]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (!groups || !Array.isArray(groups)) return [];
    const groupChats = groups
      .filter((g) => g && g.id != null)
      .map((g) => {
        const badgeCount = Number(unreadCounts.groups?.[String(g.id)]?.unread_count) || 0;
        const latestMessage = latestMessages.groups?.[`group:${g.id}`];
        const isLatest = latestMessage && Object.values(latestMessages.groups || {}).every(
          (msg) => !msg.rawTimestamp || new Date(latestMessage.rawTimestamp) >= new Date(msg.rawTimestamp)
        ) && !badgeCount;
        return {
          type: 'group',
          id: String(g.id),
          name: g.name || 'Unnamed Group',
          designation: 'Group',
          badgeCount,
          latestMessage: latestMessage?.message || g.latest_message || '',
          latestTimestamp: latestMessage?.rawTimestamp || g.latest_timestamp || '',
          isLatest,
        };
      })
      .filter((chat) => chat.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const timeA = a.latestTimestamp ? new Date(a.latestTimestamp).getTime() : 0;
        const timeB = b.latestTimestamp ? new Date(b.latestTimestamp).getTime() : 0;
        return timeB - timeA || a.name?.localeCompare(b.name) || 0;
      });
    return groupChats;
  }, [groups, searchQuery, unreadCounts, latestMessages]);

  const groupTabBadgeCount = useMemo(() => {
    const count = filteredGroups.reduce((sum, group) => sum + (group.badgeCount || 0), 0);
    return count;
  }, [filteredGroups]);

  const directTabBadgeCount = useMemo(() => {
    const count = filteredUsers.reduce((sum, chat) => sum + (unreadCounts.direct[chat.id]?.unread_count || 0), 0);
    return count;
  }, [filteredUsers, unreadCounts]);

  // Get date label
  const getDateLabel = useCallback((timestamp) => {
    if (!timestamp) return '';
    const messageDate = moment(timestamp).tz('Asia/Kolkata');
    const today = moment().tz('Asia/Kolkata').startOf('day');
    const yesterday = moment().tz('Asia/Kolkata').subtract(1, 'day').startOf('day');
    if (messageDate.isSame(today, 'day')) return 'Today';
    if (messageDate.isSame(yesterday, 'day')) return 'Yesterday';
    return messageDate.format('MMMM D, YYYY');
  }, []);

  // Get message background
  const getMessageBackground = useCallback(
    (messageLength, isSender) => {
      if (isSender) {
        return darkMode
          ? 'linear-gradient(135deg, #25D366, #28a745)'
          : 'linear-gradient(135deg, #0095f6, #00d4ff)';
      }
      return darkMode ? '#2d3748' : '#e5e7eb';
    },
    [darkMode]
  );

  // Check if admin or creator
  const isAdminOrCreator = useCallback(
    (groupId) => {
      const group = groups.find((g) => String(g.id) === String(groupId));
      const isAdmin = user?.role?.toLowerCase() === 'admin' || false;
      return group && (String(group.created_by_id) === String(empId) || isAdmin);
    },
    [groups, user]
  );

  // Token validation
  useEffect(() => {
    if (!token || !empId) {
      const fallbackToken = localStorage.getItem('token');
      if (fallbackToken) {
        try {
          const decoded = jwtDecode(fallbackToken);
          if (decoded.exp < Date.now() / 1000) throw new Error('Token expired');
          const newEmpId = String(decoded.sub);
          localStorage.setItem(`token_${newEmpId}`, fallbackToken);
          sessionStorage.setItem('empId', newEmpId);
          localStorage.removeItem('token');
          window.location.reload();
        } catch (error) {
          console.error('Invalid or expired token');
          setError('Invalid or expired token. Redirecting to login...');
          localStorage.removeItem('token');
          sessionStorage.removeItem('empId');
          setTimeout(() => (window.location.href = '/login'), 2000);
        }
      } else {
        console.error('No authentication token found');
        setError('No authentication token found. Redirecting to login...');
        setTimeout(() => (window.location.href = '/login'), 2000);
      }
    } else {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp < Date.now() / 1000) throw new Error('Token expired');
      } catch (error) {
        console.error('Invalid or expired token');
        setError('Invalid or expired token. Redirecting to login...');
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
        setTimeout(() => (window.location.href = '/login'), 2000);
      }
    }
  }, [token]);

  // Save unreadCounts to localStorage
  useEffect(() => {
    if (empId) {
      localStorage.setItem(`unreadCounts_${empId}`, JSON.stringify(unreadCounts));
    }
  }, [unreadCounts]);

  // Dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  // Emoji picker outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Periodic refresh for initialization data and unread counts
  useEffect(() => {
    if (!token || !empId) return;
    if (shouldFetchInitialize) fetchInitialize();
    const intervalId = setInterval(() => {
      setShouldFetchInitialize(true);
      fetchUnreadCounts();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [token, shouldFetchInitialize, fetchInitialize, fetchUnreadCounts]);

  // Periodic refresh for chat messages
  useEffect(() => {
    if (!selectedChat || !token || !empId) return;
    fetchMessages();
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [selectedChat, token, fetchMessages]);

  // Mark as read when selected chat changes
  useEffect(() => {
    if (!selectedChat || !token || !empId) return;
    markMessagesAsRead(selectedChat.type, selectedChat.id);
  }, [selectedChat, token, markMessagesAsRead]);

  // Auto-scroll effect when messages change
  useEffect(() => {
    if (autoscrollRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Consolidated Socket.IO event listeners
  useEffect(() => {
    if (!socket || !groupSocket || !token || !empId) return;

    const handleConnect = (namespace) => () => {
    };

    const handleConnectError = (namespace) => (err) => {
      console.error(`Connection error in ${namespace} namespace`);
      setError(
        err.message.includes('Token')
          ? 'Authentication failed. Please log in again.'
          : `Failed to connect to ${namespace === '/' ? 'chat' : 'group chat'} server`
      );
      if (err.message.includes('Token')) {
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
        setTimeout(() => (window.location.href = '/login'), 2000);
      }
      setTimeout(() => setError(''), 5000);
    };

    const handleError = (namespace) => ({ error, tempId }) => {
      let errorMsg = error;
      if (error.includes('Token missing') || error.includes('Invalid or expired token')) {
        errorMsg = 'Authentication failed. Please log in again.';
        localStorage.removeItem(`token_${empId}`);
        sessionStorage.removeItem('empId');
        setTimeout(() => (window.location.href = '/login'), 2000);
      } else if (tempId) {
        errorMsg = `Failed to ${pendingMessages.find((m) => m.tempId === tempId)?.action || 'perform action'}: ${error}`;
        setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      }
      setError(errorMsg);
      console.error(errorMsg);
      setTimeout(() => setError(''), 5000);
    };

    const handleUnreadCounts = (data) => {
      if (data.user_id === empId) {
        setUnreadCounts((prev) => {
          const newCounts = {
            direct: {
              ...prev.direct,
              ...Object.fromEntries(
                Object.entries(data.counts.direct || {}).map(([id, count]) => [
                  id,
                  {
                    name: users.find((u) => String(u.emp_id) === String(id))?.full_name || prev.direct[id]?.name || 'Unknown User',
                    unread_count: Number(count.unread_count) || prev.direct[id]?.unread_count || 0,
                  },
                ])
              ),
            },
            groups: {
              ...prev.groups,
              ...Object.fromEntries(
                Object.entries(data.counts.groups || {}).map(([id, count]) => [
                  id,
                  {
                    name: groups.find((g) => String(g.id) === String(id))?.name || prev.groups[id]?.name || 'Unnamed Group',
                    unread_count: Number(count.unread_count) || prev.groups[id]?.unread_count || 0,
                  },
                ])
              ),
            },
          };
          if (selectedChat) {
            const chatTypeKey = selectedChat.type === 'group' ? 'groups' : 'direct';
            const chatId = selectedChat.type === 'broadcast' ? 'broadcast' : String(selectedChat.id);
            if (newCounts[chatTypeKey][chatId]) {
              newCounts[chatTypeKey][chatId].unread_count = 0;
            }
          }
          return newCounts;
        });
      }
    };

    socket.on('connect', handleConnect('/'));
    groupSocket.on('connect', handleConnect('/group'));
    socket.on('connect_error', handleConnectError('/'));
    groupSocket.on('connect_error', handleConnectError('/group'));
    socket.on('reconnect', () => {
      socket.emit('join', { token });
      fetchUnreadCounts();
    });
    groupSocket.on('reconnect', () => {
      groupSocket.emit('join_group', { group_id: selectedChat?.type === 'group' ? selectedChat.id : null });
      fetchUnreadCounts();
    });
    socket.on('error', handleError('/'));
    groupSocket.on('error', handleError('/group'));
    socket.on('message', handleMessageReceived);
    groupSocket.on('group_message', (msg) => handleMessageReceived(msg, '/group'));
    socket.on('unread_counts', handleUnreadCounts);
    groupSocket.on('unread_counts', handleUnreadCounts);
    groupSocket.on('message_history', handleMessageHistory);
    groupSocket.on('group_created', handleGroupCreated);
    groupSocket.on('group_updated', handleGroupUpdated);
    groupSocket.on('group_deleted', handleGroupDeleted);

    return () => {
      socket.off('connect', handleConnect('/'));
      groupSocket.off('connect', handleConnect('/group'));
      socket.off('connect_error', handleConnectError('/'));
      groupSocket.off('connect_error', handleConnectError('/group'));
      socket.off('reconnect');
      groupSocket.off('reconnect');
      socket.off('error', handleError('/'));
      groupSocket.off('error', handleError('/group'));
      socket.off('message', handleMessageReceived);
      groupSocket.off('group_message');
      socket.off('unread_counts', handleUnreadCounts);
      groupSocket.off('unread_counts', handleUnreadCounts);
      groupSocket.off('message_history', handleMessageHistory);
      groupSocket.off('group_created', handleGroupCreated);
      groupSocket.off('group_updated', handleGroupUpdated);
      groupSocket.off('group_deleted', handleGroupDeleted);
    };
  }, [
    socket,
    groupSocket,
    token,
    selectedChat,
    handleMessageReceived,
    handleMessageHistory,
    handleGroupCreated,
    handleGroupUpdated,
    handleGroupDeleted,
    fetchUnreadCounts,
    groups,
    pendingMessages,
    users
  ]);

  // Join chat on selection
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!selectedChat || !selectedChat.id || !token) return;
    const tempId = crypto?.randomUUID?.() || Date.now().toString();
    if (selectedChat.type === 'user') {
      socket.emit('join', { receiver_id: selectedChat.id, tempId });
    } else if (selectedChat.type === 'group') {
      groupSocket.emit('join_group', { group_id: selectedChat.id, tempId });
    }
  }, [selectedChat, socket, groupSocket, token]);

  return (
    <>
      <style>{styles}</style>
      <Container fluid className="chat-container h-100" style={{ backgroundColor: darkMode ? '#121212' : '#ffffff', color: darkMode ? '#ffffff' : '#000000', minHeight: '100vh' }}>
        <Row className="h-100">
          {/* Sidebar with chats and groups */}
          <Col xs={12} md={4} lg={3} className="border-end" style={{ backgroundColor: darkMode ? '#1e1e1e' : '#fafafa', padding: '1rem', borderRight: darkMode ? '1px solid #2d3748' : '1px solid #e5e7eb' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <Typography variant="h5" style={{ fontWeight: 600, fontSize: '1.5rem' }}>HRMS Chat</Typography>
                {totalUnreadCount > 0 && (
                  <Badge
                    badgeContent={totalUnreadCount}
                    sx={{ ml: 2, '.MuiBadge-badge': { fontSize: '0.75rem', padding: '0 6px', backgroundColor: '#25D366', color: '#fff', fontWeight: 'bold', borderRadius: '10px' } }}
                    title="Total unread messages"
                  />
                )}
              </Box>
              <Box display="flex" alignItems="center">
              <MuiLink
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#2b3e52',
                  transition: 'transform 0.2s ease, opacity 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    opacity: 0.9,
                  },
                  cursor: 'pointer',
                  mr: 2, // Add margin-right to separate from the switch
                }}
                onClick={() => {
                  try {
                    navigate(-1);
                  } catch (err) {
                    setError('Failed to navigate to Dashboard. Please try again.');
                    console.error('Failed to navigate to Dashboard. Please try again.');
                    setTimeout(() => setError(''), 5000);
                  }
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: '20px', color: '#CA763A' }} />
                Dashboard
              </MuiLink>
                <IconButton
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  sx={{ ml: 1 }}
                >
                  {darkMode ? <LightMode sx={{ color: '#f7f7f7' }} /> : <DarkMode sx={{ color: '#000000' }} />}
                </IconButton>
              </Box>
            </Box>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                mb: 2,
                '& .MuiInputBase-root': {
                  borderRadius: '20px',
                  backgroundColor: darkMode ? '#2d3748' : '#ffffff',
                  borderColor: darkMode ? '#4a5568' : '#e5e7eb',
                },
                '& .MuiInputBase-input': {
                  color: darkMode ? '#ffffff' : '#000000',
                },
              }}
            />
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              centered
              sx={{ mb: 2 }}
            >
              <Tab
                label={
                  <Badge
                    badgeContent={directTabBadgeCount}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        padding: '0 6px',
                        backgroundColor: '#25D366',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                      },
                    }}
                  >
                    Direct
                  </Badge>
                }
                value={0}
              />
              <Tab
                label={
                  <Badge
                    badgeContent={groupTabBadgeCount}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        padding: '0 6px',
                        backgroundColor: '#25D366',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                      },
                    }}
                  >
                    Groups
                  </Badge>
                }
                value={1}
              />
            </Tabs>
            {tabValue === 1 && (
              <Button
                variant="contained"
                startIcon={<GroupAdd />}
                onClick={() => {
                  setShowGroupModal(true);
                  setGroupFormName('');
                  setSelectedUsers([]);
                  setGroupSearchQuery('');
                }}
                sx={{
                  mb: 2,
                  borderRadius: '20px',
                  backgroundColor: '#25D366',
                  '&:hover': { backgroundColor: '#1ebb56' },
                }}
                fullWidth
              >
                Create Group
              </Button>
            )}
            <ListGroup
              style={{
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                borderRadius: '12px',
              }}
            >
              {tabValue === 0 &&
  filteredUsers.map((chat) => (
    <ListGroup.Item
      key={chat.id}
      action
      onClick={() => handleSelectChat(chat)}
      className="sidebar-item"
      style={{
        backgroundColor:
          selectedChat?.id === chat.id && selectedChat?.type === chat.type
            ? darkMode
              ? '#2a2a3e'
              : '#e5e7eb'
            : 'transparent',
        border: 'none',
        borderRadius: '12px',
        marginBottom: '0.5rem',
        padding: '0.75rem',
        cursor: 'pointer',
      }}
    >
      <Box display="flex" alignItems="center">
        <Avatar
          sx={{
            bgcolor: '#25D366',
            mr: 2,
            width: 40,
            height: 40,
            fontSize: '1rem',
          }}
        >
          {chat.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box flexGrow={1}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}
          >
            {chat.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: darkMode ? '#a0aec0' : '#6b7280', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {chat.latestMessage || 'No messages yet'}
          </Typography>
        </Box>
        {unreadCounts.direct[chat.id]?.unread_count > 0 && !(selectedChat?.type === chat.type && selectedChat?.id === chat.id) && (
          <Badge
            badgeContent={unreadCounts.direct[chat.id].unread_count}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                padding: '0 6px',
                backgroundColor: '#25D366',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '10px',
              },
            }}
          />
        )}
      </Box>
    </ListGroup.Item>
  ))}{tabValue === 1 &&
                filteredGroups.map((group) => (
                  <ListGroup.Item
                    key={group.id}
                    action
                    onClick={() => handleSelectChat(group)}
                    className="sidebar-item"
                    style={{
                      backgroundColor:
                        selectedChat?.id === group.id && selectedChat?.type === group.type
                          ? darkMode
                            ? '#2a2a3e'
                            : '#e5e7eb'
                          : 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      marginBottom: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: '#25D366',
                          mr: 2,
                          width: 40,
                          height: 40,
                          fontSize: '1rem',
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}
                        >
                          {group.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: darkMode ? '#a0aec0' : '#6b7280', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {group.latestMessage || 'No messages yet'}
                        </Typography>
                      </Box>
                      {group.badgeCount > 0 && !(selectedChat?.type === 'group' && selectedChat?.id === group.id) && (
                        <Badge
                          badgeContent={group.badgeCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              padding: '0 6px',
                              backgroundColor: '#25D366',
                              color: '#fff',
                              fontWeight: 'bold',
                              borderRadius: '10px',
                            },
                          }}
                        />
                      )}
                    </Box>
                  </ListGroup.Item>
                ))}
            </ListGroup>
          </Col>
          {/* Chat Area */}
          <Col xs={12} md={8} lg={9} className="d-flex flex-column" style={{ padding: '1rem', position: 'relative' }}>
            {selectedChat ? (
              <>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  style={{
                    borderBottom: darkMode ? '1px solid #2d3748' : '1px solid #e5e7eb',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: '#25D366',
                        mr: 2,
                        width: 40,
                        height: 40,
                        fontSize: '1rem',
                      }}
                    >
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedChat.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkMode ? '#a0aec0' : '#6b7280' }}>
                        {selectedChat.designation}
                      </Typography>
                    </Box>
                  </Box>
                  {selectedChat.type === 'group' && (
                    <Box>
                      <IconButton
                        onClick={() => {
                          setShowMembersModal(true);
                          setMemberAction('view');
                          setSelectedUsers([]);
                          setMembersSearchQuery('');
                          fetchGroupMembers(selectedChat.id);
                        }}
                        title="View Members"
                      >
                        <People sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
                      </IconButton>
                      {isAdminOrCreator(selectedChat.id) && (
                        <IconButton
                          onClick={() => setShowDeleteConfirm(true)}
                          title="Delete Group"
                        >
                          <Delete sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
                <Box
                  flexGrow={1}
                  ref={chatContainerRef}
                  style={{
                    maxHeight: 'calc(100vh - 250px)',
                    overflowY: 'auto',
                    padding: '1rem',
                    backgroundColor: darkMode ? '#121212' : '#f7f7f7',
                    borderRadius: '12px',
                  }}
                >
                  {messages.length === 0 && !isLoadingInitial && (
                    <Typography variant="body2" align="center" sx={{ color: darkMode ? '#a0aec0' : '#6b7280' }}>
                      No messages yet. Start the conversation!
                    </Typography>
                  )}
                  {messages.reduce((acc, msg, index) => {
                    const currentDate = getDateLabel(msg.rawTimestamp);
                    const prevMsg = messages[index - 1];
                    const prevDate = prevMsg ? getDateLabel(prevMsg.rawTimestamp) : null;
                    if (currentDate !== prevDate) {
                      acc.push(
                        <Box key={`date-${msg.id || msg.tempId}`} my={2} textAlign="center">
                          <Typography
                            variant="caption"
                            sx={{
                              backgroundColor: darkMode ? '#2d3748' : '#e5e7eb',
                              borderRadius: '12px',
                              padding: '0.5rem 1rem',
                              display: 'inline-block',
                            }}
                          >
                            {currentDate}
                          </Typography>
                        </Box>
                      );
                    }
                    const isSender = String(msg.sender_id) === String(empId);
                    acc.push(
                      <Box
                        key={msg.id || msg.tempId}
                        className="chat-bubble"
                        my={1}
                        display="flex"
                        justifyContent={isSender ? 'flex-end' : 'flex-start'}
                      >
                        <Box
                          style={{
                            maxWidth: '70%',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: getMessageBackground(msg.message?.length || 0, isSender),
                            color: isSender ? '#ffffff' : darkMode ? '#ffffff' : '#000000',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {!isSender && selectedChat.type === 'group' && (
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              {msg.sender_name}
                            </Typography>
                          )}
                          {msg.file_name ? (
                            <Box display="flex" alignItems="center">
                              <Typography
                                variant="body2"
                                onClick={() => handleDownloadFile(msg.id, msg.file_name, selectedChat.type === 'group')}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {msg.file_name}
                              </Typography>
                              <IconButton
                                onClick={() => handleDownloadFile(msg.id, msg.file_name, selectedChat.type === 'group')}
                                size="small"
                              >
                                <Download sx={{ color: isSender ? '#ffffff' : darkMode ? '#ffffff' : '#000000' }} />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="body2">{msg.message}</Typography>
                          )}
                          <Box display="flex" justifyContent="flex-end" alignItems="center" mt={0.5}>
                            <Typography variant="caption" sx={{ color: isSender ? '#e0e0e0' : darkMode ? '#a0aec0' : '#6b7280' }}>
                              {msg.timestamp}
                            </Typography>
                            {msg.isPending && (
                              <CircularProgress size={12} sx={{ ml: 0.5, color: '#ffffff' }} />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                    return acc;
                  }, [])}
                  <div ref={messagesEndRef} />
                </Box>
                <Box mt={2}>
                  <Form onSubmit={handleSendMessage}>
                    <InputGroup>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={messageInput}
                        onChange={(e) => setMessageTextInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            borderRadius: '20px',
                            backgroundColor: darkMode ? '#2d3748' : '#ffffff',
                            borderColor: darkMode ? '#4a5568' : '#e5e7eb',
                          },
                          '& .MuiInputBase-input': {
                            color: darkMode ? '#ffffff' : '#000000',
                          },
                        }}
                      />
                      <Box display="flex" alignItems="center" ml={1}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                          accept="image/jpeg,image/png,application/pdf,text/plain"
                        />
                        <IconButton
                          onClick={() => fileInputRef.current.click()}
                          title="Attach File"
                          disabled={isSending}
                        >
                          <AttachFile sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
                        </IconButton>
                        <IconButton
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          title="Emoji Picker"
                          disabled={isSending}
                        >
                          <EmojiEmotions sx={{ color: darkMode ? '#ffffff' : '#000000' }} />
                        </IconButton>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSending}
                          sx={{
                            borderRadius: '20px',
                            backgroundColor: '#25D366',
                            '&:hover': { backgroundColor: '#1ebb56' },
                            ml: 1,
                          }}
                        >
                          <Send />
                        </Button>
                      </Box>
                    </InputGroup>
                    {showEmojiPicker && (
                      <Box ref={emojiPickerRef} style={{ position: 'absolute', bottom: '120px', right: '20px', zIndex: 1000 }}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </Box>
                    )}
                  </Form>
                </Box>
              </>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <Typography variant="h6" sx={{ color: darkMode ? '#a0aec0' : '#6b7280' }}>
                  Select a chat to start messaging
                </Typography>
              </Box>
            )}
          </Col>
        </Row>
        {/* Alerts */}
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError('')}
            dismissible
            style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            variant="success"
            onClose={() => setSuccess('')}
            dismissible
            style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
          >
            {success}
          </Alert>
        )}
        {/* Create Group Modal */}
        <Modal
          show={showGroupModal}
          onHide={() => setShowGroupModal(false)}
          centered
          dialogClassName="modal-content"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TextField
              fullWidth
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupFormName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Search Users"
              value={groupSearchQuery}
              onChange={handleGroupSearchChange}
              sx={{ mb: 2 }}
            />
            <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {users
                .filter((u) => u.full_name.toLowerCase().includes(groupSearchQuery.toLowerCase()) && String(u.emp_id) !== String(empId))
                .map((u) => (
                  <ListGroup.Item key={u.emp_id} style={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={selectedUsers.includes(u.emp_id)}
                      onChange={() => handleMemberToggle(u.emp_id)}
                    />
                    <Typography>{u.full_name}</Typography>
                  </ListGroup.Item>
                ))}
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateGroup}
              disabled={pendingMessages.some((msg) => msg.action === 'create_group')}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebb56' } }}
            >
              {pendingMessages.some((msg) => msg.action === 'create_group') ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                'Create'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Manage Members Modal */}
        <Modal
          show={showMembersModal}
          onHide={() => setShowMembersModal(false)}
          centered
          dialogClassName="modal-content"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {memberAction === 'view'
                ? `Members of ${selectedChat?.name}`
                : memberAction === 'add'
                  ? `Add Members to ${selectedChat?.name}`
                  : `Remove Members from ${selectedChat?.name}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Button
                variant={memberAction === 'view' ? 'contained' : 'outlined'}
                onClick={() => setMemberAction('view')}
                sx={{ mr: 1, backgroundColor: memberAction === 'view' ? '#25D366' : 'transparent', '&:hover': { backgroundColor: '#1ebb56' } }}
              >
                View Members
              </Button>
              <Button
                variant={memberAction === 'add' ? 'contained' : 'outlined'}
                onClick={() => {
                  setMemberAction('add');
                  setSelectedUsers([]);
                  setMembersSearchQuery('');
                }}
                sx={{ mr: 1, backgroundColor: memberAction === 'add' ? '#25D366' : 'transparent', '&:hover': { backgroundColor: '#1ebb56' } }}
              >
                Add Members
              </Button>
              <Button
                variant={memberAction === 'remove' ? 'contained' : 'outlined'}
                onClick={() => {
                  setMemberAction('remove');
                  setSelectedUsers([]);
                  setMembersSearchQuery('');
                }}
                sx={{ backgroundColor: memberAction === 'remove' ? '#25D366' : 'transparent', '&:hover': { backgroundColor: '#1ebb56' } }}
              >
                Remove Members
              </Button>
            </Box>
            {memberAction !== 'view' && (
              <TextField
                fullWidth
                label="Search Users"
                value={membersSearchQuery}
                onChange={handleMembersSearchChange}
                sx={{ mb: 2 }}
              />
            )}
            <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {(memberAction === 'view'
                ? groupMembers
                : memberAction === 'add'
                  ? users.filter(
                    (u) =>
                      u.full_name.toLowerCase().includes(membersSearchQuery.toLowerCase()) &&
                      !groupMembers.some((m) => String(m.emp_id) === String(u.emp_id)) &&
                      String(u.emp_id) !== String(empId)
                  )
                  : groupMembers.filter(
                    (m) =>
                      m.full_name.toLowerCase().includes(membersSearchQuery.toLowerCase()) &&
                      String(m.emp_id) !== String(empId)
                  )
              ).map((member) => (
                <ListGroup.Item key={member.emp_id} style={{ display: 'flex', alignItems: 'center' }}>
                  {memberAction !== 'view' && (
                    <Checkbox
                      checked={selectedUsers.includes(member.emp_id)}
                      onChange={() => handleMemberToggle(member.emp_id)}
                    />
                  )}
                  <Typography>{member.full_name}</Typography>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowMembersModal(false)}
            >
              Close
            </Button>
            {memberAction !== 'view' && (
              <Button
                variant="contained"
                onClick={() => (memberAction === 'add' ? handleManageMembers() : setShowRemoveConfirm(true))}
                disabled={selectedUsers.length === 0 || pendingMessages.some((msg) => msg.action === `${memberAction}_members`)}
                sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebb56' } }}
              >
                {pendingMessages.some((msg) => msg.action === `${memberAction}_members`) ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : memberAction === 'add' ? (
                  'Add Members'
                ) : (
                  'Remove Members'
                )}
              </Button>
            )}
          </Modal.Footer>
        </Modal>
        {/* Confirm Remove Members Modal */}
        <Modal
          show={showRemoveConfirm}
          onHide={() => setShowRemoveConfirm(false)}
          centered
          dialogClassName="modal-content"
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Remove Members</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography>
              Are you sure you want to remove {selectedUsers.length} member(s) from {selectedChat?.name}?
            </Typography>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRemoveConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={confirmRemoveMembers}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebb56' } }}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Delete Group Confirmation Modal */}
        <Modal
          show={showDeleteConfirm}
          onHide={() => setShowDeleteConfirm(false)}
          centered
          dialogClassName="modal-content"
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography>
              Are you sure you want to delete the group "{selectedChat?.name}"? This action cannot be undone.
            </Typography>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteGroup}
              disabled={pendingMessages.some((msg) => msg.action === 'delete_group')}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebb56' } }}
            >
              {pendingMessages.some((msg) => msg.action === 'delete_group') ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                'Delete'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default Chatting;