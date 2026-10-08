import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FlaskConical, 
  ImageIcon, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  User, 
  Activity,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [dataStatus, setDataStatus] = useState(null);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatusAndLatest = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/patients/me'),
          api.get('/analysis/history')
        ]);
        setDataStatus(profileRes.data.medicalStatus);
        
        if (historyRes.data.history && historyRes.data.history.length > 0) {
          setLatestRecord(historyRes.data.history[0]);
        }
      } catch (err) {
        console.error("Failed to load medical data status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatusAndLatest();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasData = dataStatus?.hasAnalysisHistory || latestRecord !== null;
  const consolidated = latestRecord?.consolidated || {};
  const textResult = latestRecord?.textResult;
  const imageResult = latestRecord?.imageResult;

  // Extract top 5 predictions from available models
  const top5List = textResult?.topPredictions || imageResult?.topPredictions || [];

  return (
    <div className="dashboard-page space-y-6">
      {/* Welcome Header */}
      <div className="welcome-card">
        <div>
          <h1 className="welcome-title">{getGreeting()}, {user?.name || 'Patient'}</h1>
          <p className="welcome-subtitle">Welcome to your explainable healthcare support dashboard.</p>
        </div>
        <Link to="/patient/upload" className="btn-primary flex items-center gap-2">
          <UploadCloud className="w-5 h-5" />
          <span>Upload Medical Data</span>
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="dashboard-grid">
        {/* Patient Profile Card */}
        <div className="card profile-card">
          <div className="card-header">
            <User className="w-5 h-5 text-teal-600" />
            <h3>Patient Profile</h3>
          </div>
          <div className="profile-details">
            <div className="profile-row">
              <span className="label">Full Name:</span>
              <span className="value font-semibold">{user?.name}</span>
            </div>
            <div className="profile-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="profile-row">
              <span className="label">Gender:</span>
              <span className="value">{user?.gender || 'Not specified'}</span>
            </div>
            <div className="profile-row">
              <span className="label">Date of Birth:</span>
              <span className="value">{user?.dob || 'Not specified'}</span>
            </div>
            <div className="profile-row">
              <span className="label">Contact Phone:</span>
              <span className="value">{user?.phone || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Medical Data Status Cards */}
        <div className="card status-overview-card">
          <div className="card-header">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3>Medical Data Status</h3>
          </div>
          <div className="status-cards-grid">
            <div className={`status-card ${dataStatus?.clinicalNotesUploaded ? 'status-active' : 'status-inactive'}`}>
              <div className="status-icon">
                <FileText className="w-6 h-6" />
              </div>
              <div className="status-info">
                <h4>Clinical Notes</h4>
                <p className="status-badge">
                  {dataStatus?.clinicalNotesUploaded ? (
                    <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Uploaded</span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1"><XCircle className="w-4 h-4"/> Not Uploaded</span>
                  )}
                </p>
              </div>
            </div>

            <div className={`status-card ${dataStatus?.laboratoryRecordsUploaded ? 'status-active' : 'status-inactive'}`}>
              <div className="status-icon">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div className="status-info">
                <h4>Laboratory Records</h4>
                <p className="status-badge">
                  {dataStatus?.laboratoryRecordsUploaded ? (
                    <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Uploaded</span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1"><XCircle className="w-4 h-4"/> Not Uploaded</span>
                  )}
                </p>
              </div>
            </div>

            <div className={`status-card ${dataStatus?.medicalImageUploaded ? 'status-active' : 'status-inactive'}`}>
              <div className="status-icon">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="status-info">
                <h4>Chest X-Ray Image</h4>
                <p className="status-badge">
                  {dataStatus?.medicalImageUploaded ? (
                    <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Uploaded</span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1"><XCircle className="w-4 h-4"/> Not Uploaded</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Analysis & Top 5 Confidence Scores */}
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <h3>Latest ML Model Predictions & Confidence Breakdown</h3>
          </div>
          {hasData && (
            <Link to="/patient/analysis" className="text-sky-600 text-sm font-semibold hover:underline flex items-center gap-1">
              <span>View XAI Heatmaps & Explainability</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {hasData ? (
          <div className="space-y-6">
            {/* Metrics Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="metric-box bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="metric-label">Primary ML Finding</span>
                <span className="text-xl font-extrabold text-teal-800 mt-1 block">
                  {consolidated.primaryFinding || textResult?.predictedClass || imageResult?.predictedCondition || 'Normal'}
                </span>
              </div>
              <div className="metric-box bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="metric-label">Top Model Confidence</span>
                <span className="text-xl font-extrabold text-sky-700 mt-1 block">
                  {Math.round((consolidated.overallConfidence || textResult?.confidence || imageResult?.confidence || 0) * 100)}%
                </span>
              </div>
              <div className="metric-box bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="metric-label">Analysis Date</span>
                <span className="text-sm font-semibold text-slate-700 mt-1 block">
                  {latestRecord?.createdAt ? new Date(latestRecord.createdAt).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>

            {/* TOP 5 PREDICTIONS WITH CONFIDENCE SCORES */}
            {top5List.length > 0 && (
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-teal-700" />
                  <h4 className="font-bold text-teal-900 text-base">
                    Top 5 Predicted Conditions & Confidence Scores (ML Model Output)
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {top5List.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {item.condition || item.class}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center gap-3 max-w-md">
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-500 ${idx === 0 ? 'bg-teal-600' : 'bg-sky-500'}`}
                            style={{ width: `${Math.max(5, item.confidencePercent || Math.round((item.confidence || 0) * 100))}%` }}
                          ></div>
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 w-16 text-right font-mono">
                          {item.confidencePercent || Math.round((item.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => navigate('/patient/analysis', { state: { recordId: latestRecord?.id } })} 
                className="btn-primary flex items-center gap-2"
              >
                <span>Inspect Full Model Explainability (XAI)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
            <h4>No medical data has been uploaded yet</h4>
            <p>Upload clinical notes, laboratory values, or a chest X-ray image to view top 5 predictions and confidence scores from your trained ML models.</p>
            <Link to="/patient/upload" className="btn-primary mt-4">
              Upload Medical Data Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
