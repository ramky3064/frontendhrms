import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Container, Row, Col, Card, Button as BSButton, Alert } from 'react-bootstrap';
import { Box, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

const InterviewFeedbackForm = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Retrieve token from localStorage as per OTPPage reference
  const storedEmpId = sessionStorage.getItem('empId');
  const token = localStorage.getItem(`token_${storedEmpId}`);

  const initialValues = {
    review_id: '',
    feedback: '',
    result: '',
    rating: '',
  };

  const validationSchema = Yup.object({
    review_id: Yup.number()
      .required('Review ID is required')
      .positive('Must be a positive number'),
    feedback: Yup.string()
      .required('Feedback is required')
      .max(65535, 'Feedback too long'),
    result: Yup.string()
      .required('Result is required')
      .oneOf(['selected', 'rejected', 'on_hold'], 'Invalid result'),
    rating: Yup.number()
      .min(0, 'Rating must be at least 0')
      .max(10, 'Rating must not exceed 10')
      .nullable(),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Authentication token missing. Please log in again.');
      navigate('/login');
      return;
    }

    const config = {
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 5000,
    };

    const formData = new URLSearchParams();
    formData.append('review_id', values.review_id);
    formData.append('feedback', values.feedback);
    formData.append('result', values.result);
    formData.append('rating', values.rating || null);

    try {
      const response = await axios.post(
        `${API_URL}/submit_interview_feedback`,
        formData,
        config
      );

      if (response.data.status === 'success') {
        setSuccessMessage(response.data.message);
        resetForm();
      } else {
        setErrorMessage(response.data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      setErrorMessage(
        error.response?.data?.message ||
          'An error occurred. Please check the server or try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid style={{ height: '100vh', display: 'flex', padding: 0 }}>
      <Row className="w-100 m-0">
        <Col md={12} className="d-flex align-items-center justify-content-center">
          <Card style={{ maxWidth: '500px', width: '100%', padding: '20px' }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h6" style={{ fontWeight: 'bold', color: '#f7971e' }}>
                Submit Interview Feedback
              </Typography>
            </Box>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="mb-3">
                    <label htmlFor="review_id" className="form-label">
                      Review ID
                    </label>
                    <Field type="number" name="review_id" className="form-control" />
                    <ErrorMessage name="review_id" component="div" className="text-danger" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="feedback" className="form-label">
                      Feedback
                    </label>
                    <Field as="textarea" name="feedback" className="form-control" />
                    <ErrorMessage name="feedback" component="div" className="text-danger" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="result" className="form-label">
                      Result
                    </label>
                    <Field as="select" name="result" className="form-control">
                      <option value="">Select Result</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="on_hold">On Hold</option>
                    </Field>
                    <ErrorMessage name="result" component="div" className="text-danger" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="rating" className="form-label">
                      Rating (0-10)
                    </label>
                    <Field type="number" name="rating" className="form-control" step="0.1" />
                    <ErrorMessage name="rating" component="div" className="text-danger" />
                  </div>
                  <BSButton
                    type="submit"
                    className="w-100 py-2"
                    style={{
                      backgroundColor: '#4fb9ed',
                      borderColor: '#4fb9ed',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                    disabled={isSubmitting}
                  >
                    Submit Feedback
                  </BSButton>
                  {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}
                  {errorMessage && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
                </Form>
              )}
            </Formik>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default InterviewFeedbackForm;