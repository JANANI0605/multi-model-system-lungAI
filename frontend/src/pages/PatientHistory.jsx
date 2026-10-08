import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { History, FileText, Download, Eye, Layers } from 'lucide-react';

const PatientHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/analysis/history');
        setHistory(res.data.history || []);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownload = async (recordId, e) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/reports/${recordId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Healthcare_Report_${recordId}.pdf`);
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

  return (
    <div className="history-page">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <History className="w-8 h-8 text-teal-600" />
          <span>Analysis History</span>
        </h1>
        <p className="page-subtitle">View all historical multimodal healthcare predictions and explainability logs.</p>
      </div>

      <div className="card">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Analysis Date</th>
                  <th className="p-3">Available Modalities</th>
                  <th className="p-3">Primary Finding</th>
                  <th className="p-3">Max Confidence</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const cons = record.consolidated || {};
                  return (
                    <tr 
                      key={record.id} 
                      className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate('/patient/analysis', { state: { recordId: record.id } })}
                    >
                      <td className="p-3 font-medium text-slate-800">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-600">
                        {cons.availableModalities?.join(', ') || 'Multimodal'}
                      </td>
                      <td className="p-3 font-semibold text-teal-700">
                        {cons.primaryFinding || 'Completed'}
                      </td>
                      <td className="p-3 font-bold text-sky-700">
                        {Math.round((cons.overallConfidence || 0) * 100)}%
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => navigate('/patient/analysis', { state: { recordId: record.id } })}
                          className="btn-secondary text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect XAI
                        </button>
                        <button
                          onClick={(e) => handleDownload(record.id, e)}
                          className="btn-primary text-xs inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <History className="w-12 h-12 text-slate-400 mb-2" />
            <h4>No analysis history found</h4>
            <p>Once you submit clinical notes, laboratory parameters, or images, your prediction history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
