import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  UploadCloud, 
  AlertTriangle, 
  Search, 
  Eye, 
  Stethoscope,
  Filter
} from 'lucide-react';

const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, patientsRes] = await Promise.all([
          api.get('/doctors/stats'),
          api.get('/doctors/patients')
        ]);
        setStats(statsRes.data);
        setPatients(patientsRes.data.patients || []);
      } catch (err) {
        console.error("Failed to load doctor dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredPatients = patients.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.latestFinding?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="doctor-dashboard space-y-6">
      {/* Header */}
      <div className="welcome-card bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div>
          <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">Clinical Supervision</span>
          <h1 className="text-2xl font-bold mt-1">Doctor Decision Support Center</h1>
          <p className="text-sm text-slate-300">
            Monitor assigned patient records, inspect explainable AI diagnostic predictions, and review abnormal laboratory & radiological findings.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Total Assigned Patients</span>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats?.totalPatients || 0}</p>
            </div>
            <Users className="w-8 h-8 text-teal-600 opacity-80" />
          </div>
        </div>

        <div className="card border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Recent Patient Analyses</span>
              <p className="text-3xl font-extrabold text-sky-800 mt-1">{stats?.recentAnalyses || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-sky-600 opacity-80" />
          </div>
        </div>

        <div className="card border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Recent Uploads</span>
              <p className="text-3xl font-extrabold text-indigo-800 mt-1">{stats?.recentUploads || 0}</p>
            </div>
            <UploadCloud className="w-8 h-8 text-indigo-600 opacity-80" />
          </div>
        </div>

        <div className="card border-l-4 border-l-amber-500 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-amber-800">Requires Review</span>
              <p className="text-3xl font-extrabold text-amber-700 mt-1">{stats?.patientsRequiringAttention || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Patient Directory Section */}
      <div className="card">
        <div className="card-header justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h3>Patient Directory & Latest Multimodal Findings</h3>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patients by name, email, condition..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Gender / DOB</th>
                  <th className="p-3">Available Modalities</th>
                  <th className="p-3">Latest ML Finding</th>
                  <th className="p-3">Status Flag</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">
                      <div>{p.name}</div>
                      <div className="text-xs font-normal text-slate-500">{p.email}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.gender || 'N/A'} {p.dob ? `(${p.dob})` : ''}
                    </td>
                    <td className="p-3 text-slate-600 text-xs">
                      {p.modalities?.length > 0 ? p.modalities.join(', ') : 'No uploads'}
                    </td>
                    <td className="p-3 font-bold text-teal-800">
                      {p.latestFinding}
                    </td>
                    <td className="p-3">
                      {p.statusFlag === 'Needs Attention' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5" /> Needs Review
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full w-fit">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${p.id}`)}
                        className="btn-primary text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Patient XAI
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
            <h4>No patient records found</h4>
            <p>Patients who register will automatically appear in your supervision list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
