import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  User, 
  FileText, 
  FlaskConical, 
  ImageIcon, 
  Sparkles, 
  Download, 
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers
} from 'lucide-react';

const DoctorPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/doctors/patients/${id}`);
        setPatientData(res.data);
      } catch (err) {
        console.error("Failed to load patient detail:", err);
        setError("Could not retrieve patient record.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDownloadReport = async (recordId) => {
    try {
      const response = await api.get(`/reports/${recordId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Patient_Report_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Download failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="card empty-state">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
        <h4>{error || 'Patient Not Found'}</h4>
        <button onClick={() => navigate('/doctor/patients')} className="btn-secondary mt-4">
          Return to Patients Directory
        </button>
      </div>
    );
  }

  const patient = patientData.patient;
  const history = patientData.analysisHistory || [];

  return (
    <div className="doctor-patient-detail space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/doctor/patients')}
        className="btn-secondary text-xs flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Patients List
      </button>

      {/* Patient Profile Header */}
      <div className="card bg-slate-900 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-teal-600 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-sm text-slate-300">
              Email: {patient.email} | Phone: {patient.phone || 'N/A'} | DOB: {patient.dob || 'N/A'} | Gender: {patient.gender || 'N/A'}
            </p>
          </div>
        </div>

        {patient.profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-3 border-t border-slate-700">
            <div>
              <span className="font-semibold text-teal-400">Emergency Contact:</span> {patient.profile.emergencyContact || 'None provided'}
            </div>
            <div>
              <span className="font-semibold text-teal-400">Known Clinical History / Allergies:</span> {patient.profile.medicalHistory || 'None specified'}
            </div>
          </div>
        )}
      </div>

      {/* Analysis History & XAI Details */}
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-sky-600" />
        <span>Patient Analysis History & XAI Breakdowns ({history.length})</span>
      </h2>

      {history.map((record, idx) => {
        const cons = record.consolidated || {};
        const textResult = record.textResult;
        const textXAI = record.textXAI;
        const imageResult = record.imageResult;
        const imageXAI = record.imageXAI;
        const labResult = record.laboratoryResult;

        return (
          <div key={record.id || idx} className="card space-y-4 border-l-4 border-l-teal-600">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg">Analysis Record - {new Date(record.createdAt).toLocaleString()}</h3>
              </div>
              <button
                onClick={() => handleDownloadReport(record.id)}
                className="btn-primary text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Report
              </button>
            </div>

            {/* Consolidated Summary */}
            <div className="p-3 bg-sky-50 rounded border border-sky-200">
              <span className="text-xs font-bold text-sky-800 uppercase">Primary Overall Finding:</span>
              <p className="text-lg font-bold text-sky-950">{cons.primaryFinding} (Confidence: {Math.round((cons.overallConfidence || 0) * 100)}%)</p>
              <p className="text-xs text-slate-700 mt-1">{cons.consolidatedSummary}</p>
            </div>

            {/* Text XAI */}
            {textResult && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h4 className="font-semibold text-xs text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-teal-600" /> Clinical Text Model:
                </h4>
                <p className="text-sm font-bold text-slate-800">Prediction: {textResult.predictedClass} ({Math.round(textResult.confidence * 100)}%)</p>
                {textXAI?.importantTextFeatures && (
                  <div className="text-xs text-slate-600 mt-1">
                    Key Terms: {textXAI.importantTextFeatures.map(f => f.feature).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Image ViT Heatmap XAI */}
            {imageResult && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h4 className="font-semibold text-xs text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-teal-600" /> Vision Transformer (ViT) Image XAI:
                </h4>
                <p className="text-sm font-bold text-slate-800">Chest X-Ray Finding: {imageResult.predictedCondition}</p>
                {imageXAI?.heatmapBase64 && (
                  <div className="mt-2">
                    <img src={imageXAI.heatmapBase64} alt="ViT Spatial Heatmap" className="max-h-48 rounded border mx-auto" />
                    <p className="text-xs text-center text-slate-500 mt-1">{imageXAI.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Lab Analysis */}
            {labResult && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h4 className="font-semibold text-xs text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <FlaskConical className="w-4 h-4 text-teal-600" /> Laboratory Record Status:
                </h4>
                <p className="text-sm font-bold text-slate-800">{labResult.summary}</p>
              </div>
            )}
          </div>
        );
      })}

      {history.length === 0 && (
        <div className="card empty-state">
          <h4>No analysis records for this patient yet</h4>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientDetail;
