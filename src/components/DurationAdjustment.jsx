// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "tailwindcss/tailwind.css";

// const API_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "");

// const DurationAdjustment = () => {
//   const { attendance_id } = useParams();
//   const navigate = useNavigate();
//   const [requestDetails, setRequestDetails] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchRequestDetails = async () => {
//       try {
//         const token = localStorage.getItem("jwt_token");
//         const response = await axios.get(
//           `${API_URL}/attendance/duration_adjustment_request/${attendance_id}/action`,
//           {
//             headers: { Authorization: token },
//           }
//         );
//         setRequestDetails(response.data);
//         setLoading(false);
//       } catch (err) {
//         setError(
//           err.response?.data?.message || "Failed to fetch request details"
//         );
//         setLoading(false);
//         toast.error(
//           err.response?.data?.message || "Failed to fetch request details"
//         );
//       }
//     };

//     fetchRequestDetails();
//   }, [attendance_id]);

//   const handleAction = async (action) => {
//     try {
//       const token = localStorage.getItem("jwt_token");
//       const response = await axios.post(
//         `${API_URL}/attendance/duration_adjustment_request/${attendance_id}/action`,
//         { action },
//         {
//           headers: { Authorization: token },
//         }
//       );
//       toast.success(response.data.message);
//       setTimeout(() => navigate("/dashboard"), 2000);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Action failed");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-red-500 text-xl">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6">
//       <ToastContainer />
//       <h1 className="text-3xl font-bold mb-6 text-center">
//         Manage Duration Adjustment Request
//       </h1>
//       {requestDetails && (
//         <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
//           <h2 className="text-xl font-semibold mb-4">Request Details</h2>
//           <p className="mb-2">
//             <strong>Employee ID:</strong> {requestDetails.employee_id}
//           </p>
//           <p className="mb-2">
//             <strong>Date:</strong> {requestDetails.punch_date}
//           </p>
//           <div className="flex justify-between mt-6">
//             <button
//               onClick={() => handleAction("approve")}
//               className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
//             >
//               Approve
//             </button>
//             <button
//               onClick={() => handleAction("reject")}
//               className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
//             >
//               Reject
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DurationAdjustment;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";

const API_URL =
  process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, "");

const DurationAdjustment = () => {
  const { attendance_id } = useParams();
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!attendance_id) {
        setError("Invalid attendance ID");
        setLoading(false);
        toast.error("Invalid attendance ID");
        setTimeout(() => navigate("/dashboard"), 2000);
        return;
      }

      try {
        const empId = sessionStorage.getItem("empId");
        if (!empId) {
          throw new Error("Employee ID not found. Please log in again.");
        }
        const token = localStorage.getItem(`token_${empId}`);
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }
        const response = await axios.get(
          `${API_URL}/attendance/adjustment_request/${attendance_id}/action`,
          {
            headers: { Authorization: token },
          }
        );
        setRequestDetails(response.data);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch request details";
        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage);
        if (
          errorMessage.includes("token") ||
          errorMessage.includes("Employee ID")
        ) {
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    };

    fetchRequestDetails();
  }, [attendance_id, navigate]);

  const handleAction = async (action) => {
    if (!attendance_id) {
      toast.error("Invalid attendance ID");
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }

    try {
      const empId = sessionStorage.getItem("empId");
      if (!empId) {
        throw new Error("Employee ID not found. Please log in again.");
      }
      const token = localStorage.getItem(`token_${empId}`);
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      const response = await axios.post(
        `${API_URL}/attendance/adjustment_request/${attendance_id}/action`,
        { action },
        {
          headers: { Authorization: token },
        }
      );
      toast.success(response.data.message || "Action completed successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Action failed";
      toast.error(errorMessage);
      if (
        errorMessage.includes("token") ||
        errorMessage.includes("Employee ID")
      ) {
        setTimeout(() => navigate("/login"), 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6 text-center">
        Manage Duration Adjustment Request
      </h1>
      {requestDetails && (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-xl font-semibold mb-4">Request Details</h2>
          <p className="mb-2">
            <strong>Attendance ID:</strong> {attendance_id}
          </p>
          <p className="mb-2">
            <strong>Employee ID:</strong> {requestDetails.employee_id || "N/A"}
          </p>
          <p className="mb-2">
            <strong>Date:</strong> {requestDetails.punch_date || "N/A"}
          </p>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => handleAction("approve")}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction("reject")}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DurationAdjustment;
