import React from 'react';

import Dashboard from './Dashboard.jsx';
import Footer from './Footer.jsx';
import AppNavbar from './Hrmnav.jsx';

import DynamicSidebar from './Sidebar.jsx';
// import CandidateDetailsForm from './onboard.jsx';

const Apps = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar on the left */}
      <DynamicSidebar />

      {/* Main content area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Navbar at the top */}
        <AppNavbar />
          
        {/* Dashboard content */}
        
        <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
          <Dashboard />
          
          {/* <CandidateDetailsForm /> */}
         
        </div>
            
        {/* Footer at the bottom */}
        <Footer />
      </div>
    </div>
   
  );
};

export default Apps;
