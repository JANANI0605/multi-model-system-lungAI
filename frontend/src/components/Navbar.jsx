import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import logoImg from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-brand flex items-center gap-2">
        <img src={logoImg} alt="LungAI Logo" className="app-logo-small shrink-0" />
        <span className="brand-title text-xl font-extrabold text-slate-900 tracking-tight leading-none">LungAI</span>
        <span className="badge badge-accent">Multimodal XAI</span>
      </div>

      <div className="nav-actions">
        {user && (
          <div className="user-pill">
            <span className="role-tag">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              {user.role === 'doctor' ? 'Dr. Physician' : 'Patient'}
            </span>
            <span className="user-name">{user.name}</span>
            <button onClick={handleLogout} className="btn-logout" title="Log Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
