// src/EmployeeForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 


const EmployeeForm = ({ token, setToken, empId, setEmpId }) => {
  const initialState = {
    emp_id: '',
    first_name: '',
    last_name: '',
    nick_name: '',
    email: '',
    photo: null,
    department: '',
    designation: '',
    user_role: '',
    employment_type: '',
    employee_status: '',
    source_of_hire: '',
    date_of_joining: '',
    current_experience: '',
    total_experience: '',
    reporting_manager: '',
    date_of_birth: '',
    age: '',
    gender: '',
    marital_status: '',
    phone: '',
    extension: '',
    work_from: '',
    office_location: '',
    tags: '',
    personal_mobile: '',
    personal_email: '',
    date_of_exit: '',
    onboarding_status: '',
    present_address: '',
    permanent_address: '',
    aadhaar: '',
    pan: '',
    uan: '',
  };

  const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

  const [formData, setFormData] = useState(initialState);
  const [currentPage, setCurrentPage] = useState(0);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeIdToFetch, setEmployeeIdToFetch] = useState('');
  const [decodedEmpId, setDecodedEmpId] = useState(null);
  const navigate = useNavigate();

  // Validate token on mount
  useEffect(() => {
    if (!empId) {
      console.error('No empId provided');
      setMessage('Please provide an Employee ID.');
      navigate('login', { replace: true });
      return;
    }

    const token = localStorage.getItem(`token_${empId}`);
    if (!token) {
      console.error('No token found for empId:', empId);
      setMessage('Please log in to add an employee.');
      navigate('login', { replace: true });
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
      const tokenEmpId = decoded.emp_id || decoded.sub || decoded.user_id;
      if (!tokenEmpId) {
        console.error('No emp_id in token');
        setMessage('Invalid token. Please log in again.');
        navigate('login', { replace: true });
        return;
      }
      if (tokenEmpId !== empId) {
        console.error('Token empId mismatch:', tokenEmpId, 'vs', empId);
        setMessage('Token mismatch. Please log in with the correct Employee ID.');
        navigate('login', { replace: true });
        return;
      }
      setDecodedEmpId(tokenEmpId);
      setToken(token);
    } catch (err) {
      console.error('Token decode failed:', err);
      setMessage('Invalid token. Please log in again.');
      navigate('login', { replace: true });
    }
  }, [empId, navigate, setToken]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value,
    });
    setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['first_name', 'last_name', 'email', 'user_role', 'phone'];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });
    if (formData.age && isNaN(formData.age)) {
      newErrors.age = 'Age must be a number';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please fill in all required fields correctly.');
      return;
    }

    if (!token || !decodedEmpId) {
      console.error('No valid token or empId for request');
      setMessage('Please log in to add an employee.');
      localStorage.removeItem(`token_${empId}`);
      setToken(null);
      setEmpId(null);
      navigate('login', { replace: true });
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      console.log('Sending /add_employee request with token:', token, 'for empId:', decodedEmpId);
      const response = await axios.post(`${API_URL}/add_employee`, formDataToSend, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Add Employee Response:', response.data);
      setMessage('Employee added successfully!');
      setFormData(initialState);
      setCurrentPage(0);
    } catch (error) {
      console.error('Add Employee Error:', error.response || error);
      const errorMsg = error.response?.data?.message || 'Failed to add employee.';
      if (error.response?.status === 401) {
        console.error('401 Unauthorized - Token issue:', errorMsg);
        setMessage(errorMsg.includes('login') ? errorMsg : 'Please log in to add an employee.');
        localStorage.removeItem(`token_${empId}`);
        setToken(null);
        setEmpId(null);
        navigate('login', { replace: true });
      } else {
        setMessage(errorMsg);
      }
    }
  };

  const fetchEmployeePhoto = async () => {
    if (!employeeIdToFetch) {
      setMessage('Please enter an employee ID.');
      return;
    }

    if (!token || !decodedEmpId) {
      console.error('No valid token or empId for fetch request');
      setMessage('Please log in to fetch employee data.');
      localStorage.removeItem(`token_${empId}`);
      setToken(null);
      setEmpId(null);
      navigate('login', { replace: true });
      return;
    }

    try {
      console.log('Sending /get_employee_photo request with token:', token, 'for empId:', decodedEmpId);
      const response = await axios.get(`${API_URL}/get_employee_photo/${employeeIdToFetch}`, {
        headers: { Authorization: token },
      });
      console.log('Fetch Employee Response:', response.data);
      setEmployeeData(response.data);
      setMessage('');
    } catch (error) {
      console.error('Fetch Employee Error:', error.response || error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch employee data.';
      if (error.response?.status === 401) {
        console.error('401 Unauthorized - Token issue:', errorMsg);
        setMessage(errorMsg.includes('login') ? errorMsg : 'Please log in to fetch employee data.');
        localStorage.removeItem(`token_${empId}`);
        setToken(null);
        setEmpId(null);
        navigate('login', { replace: true });
      } else {
        setMessage(errorMsg);
      }
      setEmployeeData(null);
    }
  };

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    if (result.length > 6) {
      const lastChunk = result.pop();
      result[result.length - 1] = [...result[result.length - 1], ...lastChunk];
    }
    return result;
  };

  const keys = Object.keys(initialState);
  const fieldChunks = chunkArray(keys, 6);
  const totalPages = fieldChunks.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`token_${empId}`);
    setToken(null);
    setEmpId(null);
    navigate('login', { replace: true });
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '25px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#dc3545',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
      <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#003366' }}>
        Employee Registration
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          padding: '25px',
          background: '#d6e6fb',
          boxShadow: '0 4px 15px rgba(0, 123, 255, 0.2)',
          borderRadius: '16px',
          marginBottom: '40px',
        }}
      >
        {message && (
          <div
            style={{
              padding: '10px',
              marginBottom: '20px',
              background: message.includes('successfully') ? '#d4edda' : '#f8d7da',
              color: message.includes('successfully') ? '#155724' : '#721c24',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}

        <div className="form-page" style={{ display: 'block', marginBottom: '1.8rem' }}>
          {fieldChunks[currentPage].map((key) => (
            <div
              key={key}
              style={{
                marginBottom: '1.2rem',
                backgroundColor: '#eaf3ff',
                padding: '12px 15px',
                borderRadius: '12px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#004080',
                }}
              >
                {key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                {['first_name', 'last_name', 'email', 'user_role', 'phone'].includes(key) && (
                  <span style={{ color: '#dc3545' }}> *</span>
                )}
                :
              </label>
              {key === 'photo' ? (
                <input
                  type="file"
                  name={key}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #a8c1f7',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                />
              ) : key === 'user_role' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #a8c1f7',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    color: '#00264d',
                  }}
                >
                  <option value="">Select Role</option>
                  {['Admin', 'HR', 'Manager', 'Employee'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : key === 'work_from' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #a8c1f7',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    color: '#00264d',
                  }}
                >
                  <option value="">Select Work Location</option>
                  <option value="office">Office</option>
                  <option value="home">Home</option>
                </select>
              ) : (
                <input
                  type={
                    key.includes('date') ? 'date' :
                    key === 'age' ? 'number' :
                    key.includes('email') ? 'email' :
                    key === 'phone' || key === 'personal_mobile' ? 'tel' : 'text'
                  }
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #a8c1f7',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    color: '#00264d',
                  }}
                />
              )}
              {errors[key] && (
                <span style={{ color: '#dc3545', fontSize: '0.9rem' }}>
                  {errors[key]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={prevPage}
            disabled={currentPage === 0}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: currentPage === 0 ? '#a1c4fd' : '#0056b3',
              color: '#fff',
              borderRadius: '8px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease',
            }}
          >
            Previous
          </button>
          {currentPage === totalPages - 1 ? (
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#107c10',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={nextPage}
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#0056b3',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              Next
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: '14px',
            textAlign: 'center',
            color: '#003366',
            fontWeight: '600',
          }}
        >
          Page {currentPage + 1} of {totalPages}
        </div>
      </form>

      <div
        style={{
          width: '100%',
          padding: '25px',
          background: '#d6e6fb',
          boxShadow: '0 4px 15px rgba(0, 123, 255, 0.2)',
          borderRadius: '16px',
        }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#003366' }}>
          View Employee Photo
        </h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeIdToFetch}
            onChange={(e) => setEmployeeIdToFetch(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #a8c1f7',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}
          />
          <button
            onClick={fetchEmployeePhoto}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: '#0056b3',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Fetch
          </button>
        </div>
        {employeeData && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '600', color: '#003366' }}>
              {employeeData.first_name} {employeeData.last_name}
            </p>
            {employeeData.photo_base64 ? (
              <div>
                <img
                  src={`data:image/*;base64,${employeeData.photo_base64}`}
                  alt={`${employeeData.first_name} ${employeeData.last_name}`}
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    marginTop: '10px',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const downloadLink = document.createElement('a');
                    downloadLink.href = `data:application/octet-stream;base64,${employeeData.photo_base64}`;
                    downloadLink.download = `employee_${employeeIdToFetch}_photo`;
                    downloadLink.textContent = 'Download Non-Image File';
                    downloadLink.style.color = '#0056b3';
                    e.target.parentNode.appendChild(downloadLink);
                  }}
                />
              </div>
            ) : (
              <p style={{ color: '#6c757d' }}>No photo available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeForm;
