import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ProtectedLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">
          <div className="disclaimer-banner">
            ⚠️ <strong>Medical Disclaimer:</strong> This system provides machine-learning-based decision support and is not a substitute for professional medical diagnosis or treatment.
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
