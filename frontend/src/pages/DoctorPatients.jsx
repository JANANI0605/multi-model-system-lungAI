import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye, AlertTriangle } from 'lucide-react';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/doctors/patients');
        setPatients(res.data.patients || []);
      } catch (err) {
        console.error("Failed to load patients list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="flex-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="doctor-patients-page space-y-6">
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-8 h-8 text-teal-600" />
            <span>Authorized Patient Roster</span>
          </h1>
          <p className="page-subtitle">Inspect patient medical files, past predictions, and downloadable reports.</p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by patient name or email..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Modalities</th>
                  <th className="p-3">Latest Finding</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.email}</td>
                    <td className="p-3 text-slate-600">{p.phone || 'N/A'}</td>
                    <td className="p-3 text-xs text-slate-600">{p.modalities?.join(', ') || 'None'}</td>
                    <td className="p-3 font-bold text-teal-800">{p.latestFinding}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${p.id}`)}
                        className="btn-primary text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users className="w-12 h-12 text-slate-400 mb-2" />
            <h4>No patients matching search</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;
