import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Sparkles, 
  FileText, 
  ImageIcon, 
  FlaskConical, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Info,
  Award,
  BarChart3,
  FileCheck
} from 'lucide-react';

const PatientAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const recordIdFromState = location.state?.recordId;

  const [analysisRecord, setAnalysisRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        if (recordIdFromState) {
          const res = await api.get(`/analysis/${recordIdFromState}`);
          setAnalysisRecord(res.data);
        } else {
          // Fetch latest from history
          const res = await api.get('/analysis/history');
          if (res.data.history && res.data.history.length > 0) {
            setAnalysisRecord(res.data.history[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load analysis record:", err);
        setError("Unable to load analysis record.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [recordIdFromState]);

  const handleDownloadReport = async () => {
    if (!analysisRecord?.id) return;
    setDownloading(true);
    try {
      const response = await api.get(`/reports/${analysisRecord.id}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Healthcare_Analysis_Report_${analysisRecord.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Report download failed:", err);
      alert("Failed to download PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!analysisRecord) {
    return (
      <div className="empty-state card">
        <Info className="w-12 h-12 text-slate-400 mb-3" />
        <h3>No Analysis Record Available</h3>
        <p>Upload medical data to run multimodal machine learning inference.</p>
        <button onClick={() => navigate('/patient/upload')} className="btn-primary mt-4">
          Upload Medical Data
        </button>
      </div>
    );
  }

  const consolidated = analysisRecord.consolidated || {};
  const textResult = analysisRecord.textResult;
  const textXAI = analysisRecord.textXAI;
  
  const imageResult = analysisRecord.imageResult;
  const imageXAI = analysisRecord.imageXAI;

  const labResult = analysisRecord.laboratoryResult;
  const labXAI = analysisRecord.labXAI;

  return (
    <div className="analysis-detail-page space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-sky-600" />
            <span>Multimodal Consolidated Analysis</span>
          </h1>
          <p className="page-subtitle">
            Analysis Date: {new Date(analysisRecord.createdAt).toLocaleString()}
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-md"
        >
          <Download className="w-5 h-5" />
          <span>{downloading ? 'Generating PDF...' : 'Download PDF Analysis Report'}</span>
        </button>
      </div>

      {/* 1. Multimodal Synthesis Card */}
      <div className="card border-l-4 border-l-sky-500 bg-sky-50/20">
        <div className="card-header">
          <Layers className="w-6 h-6 text-sky-600" />
          <h3>Multimodal Consolidated Findings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="metric-box bg-white p-4 rounded-lg border border-sky-100 shadow-sm">
            <span className="metric-label">Primary Overall Finding</span>
            <span className="text-xl font-bold text-sky-900 block mt-1">
              {consolidated.primaryFinding}
            </span>
          </div>

          <div className="metric-box bg-white p-4 rounded-lg border border-sky-100 shadow-sm">
            <span className="metric-label">Prediction Confidence</span>
            <span className="text-xl font-bold text-teal-700 block mt-1">
              {Math.round((consolidated.overallConfidence || 0) * 100)}%
            </span>
          </div>

          <div className="metric-box bg-white p-4 rounded-lg border border-sky-100 shadow-sm">
            <span className="metric-label">Modalities Analyzed ({consolidated.modalityCount})</span>
            <span className="text-sm font-semibold text-slate-700 block mt-1">
              {consolidated.availableModalities?.join(", ")}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-sky-200">
          <h4 className="font-semibold text-slate-800 mb-2">Consolidated Clinical Summary:</h4>
          <p className="text-slate-700 leading-relaxed">
            {consolidated.consolidatedSummary}
          </p>
          <span className="text-xs text-slate-500 mt-2 block italic">
            Strategy: {consolidated.labelSpaceFusionStrategy}
          </span>
        </div>
      </div>

      {/* 2. Clinical Text Model & Top 5 Predictions */}
      {textResult && (
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3>Clinical Text Model (text_model.joblib)</h3>
            </div>
            <span className="badge badge-accent">LogisticRegression (768 Dim)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Submitted Clinical Notes:</h4>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-800 font-mono mb-4">
                "{analysisRecord.clinicalNotes}"
              </div>

              {/* Top 5 Predictions Widget for Text Model */}
              {textResult.topPredictions && (
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200">
                  <h4 className="font-bold text-teal-900 text-sm mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-700" /> Top 5 Predicted Disease Conditions & Confidence Scores
                  </h4>
                  <div className="space-y-2">
                    {textResult.topPredictions.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{item.condition || item.class}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-teal-600 h-full" style={{ width: `${item.confidencePercent || Math.round((item.confidence || 0) * 100)}%` }}></div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 text-xs w-10 text-right">
                            {item.confidencePercent || Math.round((item.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700">Clinical Text XAI (SHAP Attributions)</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">SHAP Analysis</span>
              </div>
              {textXAI?.importantTextFeatures?.length > 0 ? (
                <div className="space-y-2">
                  {textXAI.importantTextFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${feat.impact === 'Positive' ? 'bg-teal-500' : 'bg-rose-500'}`}></span>
                        <span className="font-semibold text-slate-800 text-sm">{feat.feature}</span>
                        <span className="text-[10px] text-slate-500 font-medium">({feat.impact})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${feat.impact === 'Positive' ? 'bg-teal-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, (feat.contribution || Math.abs(feat.shapValue || 0)) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-600 font-mono">
                          {feat.shapValue !== undefined ? (feat.shapValue > 0 ? `+${feat.shapValue}` : feat.shapValue) : feat.contribution}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">SHAP feature values computed across linear model log-odds space.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Chest X-Ray Image ViT Model & Top 5 Predictions */}
      {imageResult && (
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              <h3>Chest X-Ray ViT Model & Grad-CAM</h3>
            </div>
            <span className="badge badge-accent">ViT + Grad-CAM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Predicted Radiological Findings:</h4>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Primary ViT Finding</span>
                <p className="text-xl font-bold text-teal-800 mt-1">{imageResult.predictedCondition}</p>
                <span className="text-xs text-slate-600 font-semibold">
                  Confidence: {imageResult.confidencePercent || Math.round(imageResult.confidence * 100)}%
                </span>
              </div>

              {/* Top 5 Predictions Widget for Image Model */}
              {imageResult.topPredictions && (
                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200">
                  <h4 className="font-bold text-sky-900 text-sm mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-sky-700" /> Top 5 Predicted Radiological Conditions & Confidence Scores
                  </h4>
                  <div className="space-y-2">
                    {imageResult.topPredictions.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{item.condition}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-600 h-full" style={{ width: `${item.confidencePercent || Math.round((item.confidence || 0) * 100)}%` }}></div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 text-xs w-10 text-right">
                            {item.confidencePercent || Math.round((item.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700">Chest X-Ray Grad-CAM Saliency Heatmap</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">Grad-CAM XAI</span>
              </div>
              {imageXAI?.heatmapBase64 ? (
                <div className="heatmap-box border rounded p-2 bg-slate-900 text-center">
                  <img src={imageXAI.heatmapBase64} alt="ViT Grad-CAM Heatmap" className="max-h-64 mx-auto rounded" />
                  <p className="text-xs text-slate-300 mt-2 px-2">
                    {imageXAI.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Grad-CAM saliency map computed by backpropagating ViT class gradients.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Laboratory Analysis XAI */}
      {labResult && (
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              <h3>Laboratory Record Analyzer & Risk Breakdown</h3>
            </div>
            <span className={`badge ${labResult.overallStatus === 'Normal' ? 'badge-accent' : 'bg-amber-100 text-amber-800'}`}>
              {labResult.overallStatus}
            </span>
          </div>

          {labResult.fileName && (
            <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <div>
                  <span className="font-semibold text-slate-800 text-sm">Lab Document: {labResult.fileName}</span>
                  <span className="text-xs text-teal-700 block">Parsed Modality: {labResult.fileType || labResult.modality}</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-teal-600 text-white rounded">
                {labResult.fileType || 'Uploaded File'}
              </span>
            </div>
          )}

          <p className="text-sm text-slate-700 mb-4">{labResult.summary}</p>


          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Parameter Name</th>
                  <th className="p-3">Measured Value</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Reference Range</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(labResult.abnormalParameters || []).map((t, idx) => (
                  <tr key={idx} className="bg-red-50/50 border-b border-slate-200 font-semibold">
                    <td className="p-3 text-red-900">{t.name}</td>
                    <td className="p-3 text-red-900">{t.value}</td>
                    <td className="p-3 text-red-800">{t.unit}</td>
                    <td className="p-3 text-slate-600">{t.referenceRange}</td>
                    <td className="p-3 text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {t.status}
                    </td>
                  </tr>
                ))}
                {(labResult.normalParameters || []).map((t, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="p-3 text-slate-800">{t.name}</td>
                    <td className="p-3 text-slate-800">{t.value}</td>
                    <td className="p-3 text-slate-600">{t.unit}</td>
                    <td className="p-3 text-slate-500">{t.referenceRange}</td>
                    <td className="p-3 text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Normal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAnalysis;
