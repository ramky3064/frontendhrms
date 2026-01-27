import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppNavbar from './Hrmnav';
import Footer from './Footer';
import DynamicSidebar from './Sidebar';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const EmployeeForm = () => {
  const initialState = {
    emp_id: '', first_name: '', last_name: '', nick_name: '', email: '',
    photo: null, department: '', designation: '', user_role: '', employment_type: '',
    employee_status: '', source_of_hire: '', date_of_joining: '', current_experience: '', total_experience: '',
    reporting_manager: '', date_of_birth: '', age: '', gender: '', marital_status: '',
    phone: '', extension: '', work_from: '', office_location: '', personal_mobile: '',
    personal_email: '', onboarding_status: '', present_address: '', permanent_address: '',
    aadhaar: '', pan: '', uan: '', esic_ip_number: '', pf_number: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredButton, setHoveredButton] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const aadhaarRegex = /^\d{12}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const esicIpNumberRegex = /^\d{10}$/;
    const pfNumberRegex = /^[A-Z]{2}[0-9]{5}[0-9]{7}$/;

    // Check required fields
    const requiredFields = [
      'emp_id', 'first_name', 'last_name', 'email', 'department', 'user_role',
      'reporting_manager', 'designation', 'work_from', 'personal_email',
      'date_of_birth', 'date_of_joining', 'phone', 'permanent_address', 'aadhaar', 'pan'
    ];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${field.replace(/_/g, ' ').replace(/\b\w/g, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (!emailRegex.test(formData.email)) {
      setError('Invalid official email format');
      return false;
    }
    if (!emailRegex.test(formData.personal_email)) {
      setError('Invalid personal email format');
      return false;
    }
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone must be 10 digits');
      return false;
    }
    if (formData.personal_mobile && !phoneRegex.test(formData.personal_mobile)) {
      setError('Personal mobile must be 10 digits');
      return false;
    }
    if (!aadhaarRegex.test(formData.aadhaar)) {
      setError('Aadhaar must be a 12-digit number');
      return false;
    }
    if (!panRegex.test(formData.pan.toUpperCase())) {
      setError('PAN format must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)');
      return false;
    }
    if (formData.esic_ip_number && !esicIpNumberRegex.test(formData.esic_ip_number)) {
      setError('ESIC IP Number must be a 10-digit number');
      return false;
    }
    if (formData.pf_number && !pfNumberRegex.test(formData.pf_number)) {
      setError('PF Number format must be 2 letters followed by 5 digits and 7 digits (e.g., AB123456789012)');
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    // Restrict specific fields
    if (
      ['phone', 'personal_mobile', 'aadhaar', 'uan', 'current_experience', 'total_experience', 'age', 'esic_ip_number'].includes(name)
    ) {
      if (!/^\d*$/.test(value)) return;
      if ((name === 'phone' || name === 'personal_mobile') && value.length > 10) return;
      if (name === 'esic_ip_number' && value.length > 10) return;
    }

    if (['first_name', 'last_name', 'nick_name'].includes(name)) {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    if (name === 'pf_number') {
      if (!/^[A-Z0-9]*$/.test(value)) return;
      if (value.length > 14) return;
    }

    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const empId = sessionStorage.getItem('empId');
    if (!empId) {
      setError('Employee ID not found. Please log in again.');
      navigate('/login');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem(`token_${empId}`);
    if (!token) {
      setError('Authorization token not found. Please log in again.');
      navigate('/login');
      setLoading(false);
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }

    // Log FormData contents for debugging
    for (let [key, value] of data.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    try {
      const response = await axios.post(`${API_URL}/add_employee`, data, {
        headers: {
          Authorization: token,
        }
      });

      setSuccess(response.data.message || 'Employee added successfully.');
      setFormData(initialState);
    } catch (err) {
      console.error('Error adding employee:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to add employee. Please try again.');
      }
    } finally {
      setLoading(false);
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
    } else if (currentPage === totalPages - 1) {
      document.querySelector('form').requestSubmit();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const dropdownOptions = {
    employment_type: ['Full-time', 'Part-time', 'Intern', 'Contract'],
    employee_status: ['Active', 'Inactive'],
    gender: ['Male', 'Female'],
    marital_status: ['Married', 'Unmarried'],
    extension: ['+91', '+1', '+44', '+61', '+81'],
    work_from: ['Office', 'Home'],
    onboarding_status: ['Completed', 'Pending', 'In-progress'],
    user_role: ['Admin', 'HR', 'Manager', 'Employee']
  };

  const requiredFields = [
    'emp_id', 'first_name', 'last_name', 'email', 'department', 'user_role',
    'reporting_manager', 'designation', 'work_from', 'personal_email',
    'date_of_birth', 'date_of_joining', 'phone', 'permanent_address', 'aadhaar', 'pan'
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppNavbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <DynamicSidebar />
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 20px'
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxWidth: '700px',
              width: '100%'
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>Employee Information Form</h2>
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
            {success && <p style={{ color: 'green', textAlign: 'center', marginBottom: '15px' }}>{success}</p>}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {fieldChunks[currentPage].map((key) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: '500', marginBottom: '6px', color: '#333' }}>
                    {key === 'reporting_manager' ? 'Reporting Manager (Emp ID)' : key.replace(/_/g, ' ').replace(/\b\w/g, str => str.toUpperCase())}
                    {requiredFields.includes(key) && <span style={{ color: 'red' }}> *</span>}
                  </label>
                  {dropdownOptions[key] ? (
                    <select
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required={requiredFields.includes(key)}
                      style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    >
                      <option value="">Select {key.replace(/_/g, ' ')}</option>
                      {dropdownOptions[key].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={key.toLowerCase().includes('date') ? 'date' : key === 'photo' ? 'file' : 'text'}
                      name={key}
                      value={key === 'photo' ? undefined : formData[key]}
                      onChange={handleChange}
                      required={requiredFields.includes(key)}
                      accept={key === 'photo' ? 'image/jpeg,image/jpg' : undefined}
                      style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={prevPage}
                onMouseEnter={() => setHoveredButton('prev')}
                onMouseLeave={() => setHoveredButton('')}
                disabled={currentPage === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: currentPage === 0
                    ? '#ccc'
                    : hoveredButton === 'prev'
                      ? '#5a4ff3'
                      : '#eee',
                  color: currentPage === 0
                    ? '#666'
                    : hoveredButton === 'prev'
                      ? '#fff'
                      : '#000',
                  border: '1px solid #999',
                  borderRadius: '6px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s ease, color 0.3s ease'
                }}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={nextPage}
                onMouseEnter={() => setHoveredButton('next')}
                onMouseLeave={() => setHoveredButton('')}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: hoveredButton === 'next' ? '#5a4ff3' : '#eee',
                  color: hoveredButton === 'next' ? '#fff' : '#000',
                  border: '1px solid #999',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading && (
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ccc',
                      borderTop: '2px solid #333',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }}
                  />
                )}
                {currentPage === totalPages - 1 ? 'Submit' : 'Next'}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
              Page {currentPage + 1} of {totalPages}
            </div>
          </form>
        </div>
      </div>
      {/* <Footer /> */}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EmployeeForm;