import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, ShieldCheck, Mail, Phone, Award } from 'lucide-react';

const DoctorProfile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-page max-w-3xl">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Stethoscope className="w-8 h-8 text-teal-600" />
          <span>Doctor Profile & Credentials</span>
        </h1>
        <p className="page-subtitle">Verified clinical practitioner profile information.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-200">
          <div className="p-4 bg-teal-100 rounded-full text-teal-700">
            <Stethoscope className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-sm text-teal-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Verified Medical Doctor
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-slate-50 rounded">
            <span className="text-slate-500 font-medium">Email Address:</span>
            <span className="font-semibold text-slate-800">{user?.email}</span>
          </div>

          <div className="flex justify-between p-3 bg-slate-50 rounded">
            <span className="text-slate-500 font-medium">Specialization:</span>
            <span className="font-semibold text-slate-800">{user?.profile?.specialization || 'Pulmonology / Internal Medicine'}</span>
          </div>

          <div className="flex justify-between p-3 bg-slate-50 rounded">
            <span className="text-slate-500 font-medium">Medical License / Registration No:</span>
            <span className="font-semibold text-slate-800">{user?.profile?.licenseNumber || 'MD-876543'}</span>
          </div>

          <div className="flex justify-between p-3 bg-slate-50 rounded">
            <span className="text-slate-500 font-medium">Contact Phone:</span>
            <span className="font-semibold text-slate-800">{user?.phone || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
