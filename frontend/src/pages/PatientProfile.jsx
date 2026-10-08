import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Phone, Calendar, Save, CheckCircle } from 'lucide-react';

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: user?.gender || 'Female',
    emergencyContact: user?.profile?.emergencyContact || '',
    medicalHistory: user?.profile?.medicalHistory || ''
  });

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await api.put('/patients/me', formData);
      updateUser({
        ...user,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        profile: {
          ...user.profile,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory
        }
      });
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page max-w-3xl">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <User className="w-8 h-8 text-teal-600" />
          <span>Patient Profile</span>
        </h1>
        <p className="page-subtitle">View and update your personal clinical profile information.</p>
      </div>

      {msg && (
        <div className="alert alert-success mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" disabled value={user?.name || ''} className="bg-slate-100 cursor-not-allowed" />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" disabled value={user?.email || ''} className="bg-slate-100 cursor-not-allowed" />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Known Medical Allergies / Clinical History</label>
            <textarea
              rows="3"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
