import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, UserCheck, Stethoscope, Lock, Mail, AlertCircle } from 'lucide-react';

import logoImg from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password, role);
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials and selected role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img src={logoImg} alt="LungAI Logo" className="app-logo-auth shrink-0" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0 leading-none">LungAI</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            One Patient • Three Modalities • Better Insights
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>I am signing in as:</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === 'patient' ? 'active' : ''}`}
                onClick={() => setRole('patient')}
              >
                <UserCheck className="w-5 h-5" />
                <span>Patient</span>
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
                onClick={() => setRole('doctor')}
              >
                <Stethoscope className="w-5 h-5" />
                <span>Doctor</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Authenticating...' : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}
          </button>

          <div className="auth-footer">
            <span>Don't have an account? </span>
            <Link to="/register" className="auth-link">Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
