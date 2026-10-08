import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, UserCheck, Stethoscope, Mail, Lock, User, Calendar, Phone, AlertCircle } from 'lucide-react';

import logoImg from '../assets/logo.png';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: 'Male',
    specialization: '',
    licenseNumber: '',
    emergencyContact: '',
    medicalHistory: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const payload = { ...formData, role };
      const user = await register(payload);
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check form input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container py-8">
      <div className="login-card max-w-2xl">
        <div className="login-header text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img src={logoImg} alt="LungAI Logo" className="app-logo-auth shrink-0" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0 leading-none">LungAI</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Create Account • Register as Patient or Doctor
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form space-y-4">
          <div className="form-group">
            <label>Select Account Role:</label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Janani S"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Doctor specific fields */}
          {role === 'doctor' && (
            <div className="section-box border-teal-200 bg-teal-50/40 p-4 rounded-lg">
              <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Doctor Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="specialization">Medical Specialization</label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    placeholder="Pulmonology / Radiology / Internal Medicine"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="licenseNumber">Medical License / Registration Number</label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="MD-987654"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Patient specific fields */}
          {role === 'patient' && (
            <div className="section-box border-sky-200 bg-sky-50/40 p-4 rounded-lg">
              <h4 className="font-semibold text-sky-800 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Emergency & Medical Profile
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="emergencyContact">Emergency Contact</label>
                  <input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="text"
                    placeholder="Relative Name & Phone"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="medicalHistory">Known Medical Allergies / History</label>
                  <input
                    id="medicalHistory"
                    name="medicalHistory"
                    type="text"
                    placeholder="e.g. Asthma, Penicillin allergy"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>

          <div className="auth-footer">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-link">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
