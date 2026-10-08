import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileCheck, Download, FileText, Calendar } from 'lucide-react';

const PatientReports = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/analysis/history');
        setHistory(res.data.history || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownload = async (recordId) => {
    try {
      const response = await api.get(`/reports/${recordId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Multimodal_Healthcare_Report_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF report.");
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
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileCheck className="w-8 h-8 text-teal-600" />
          <span>Downloadable Healthcare Reports</span>
        </h1>
        <p className="page-subtitle">Access dynamically generated PDF healthcare analysis reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {history.map((record) => {
          const cons = record.consolidated || {};
          return (
            <div key={record.id} className="card flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-sky-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Official PDF Report
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Finding: {cons.primaryFinding || 'Analysis Record'}
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Modalities: {cons.availableModalities?.join(', ')}
                </p>
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  {cons.consolidatedSummary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDownload(record.id)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="card col-span-2 empty-state">
            <FileCheck className="w-12 h-12 text-slate-400 mb-2" />
            <h4>No generated reports found</h4>
            <p>Upload medical data to generate downloadable healthcare analysis reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReports;
