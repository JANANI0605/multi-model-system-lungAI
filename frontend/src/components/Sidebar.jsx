import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  History, 
  FileCheck, 
  User, 
  Users, 
  LogOut,
  Stethoscope,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDoctor = user?.role === 'doctor';

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patient/upload', label: 'Upload Data', icon: UploadCloud },
    { to: '/patient/analysis', label: 'Latest Analysis', icon: Activity },
    { to: '/patient/history', label: 'Analysis History', icon: History },
    { to: '/patient/reports', label: 'Reports', icon: FileCheck },
    { to: '/patient/profile', label: 'Profile', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/patients', label: 'Patients Directory', icon: Users },
    { to: '/doctor/profile', label: 'Doctor Profile', icon: Stethoscope },
  ];

  const links = isDoctor ? doctorLinks : patientLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-role">
          {isDoctor ? 'Doctor Workspace' : 'Patient Workspace'}
        </span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 nav-icon" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
