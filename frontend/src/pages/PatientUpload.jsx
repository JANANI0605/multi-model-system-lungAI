import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  FlaskConical, 
  ImageIcon, 
  UploadCloud, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  FileCheck,
  FileType
} from 'lucide-react';

const DEFAULT_LAB_PRESETS = [
  { name: 'WBC', value: '12.5', unit: '10^9/L', referenceRange: '4.0 - 11.0' },
  { name: 'Glucose', value: '145', unit: 'mg/dL', referenceRange: '70 - 100' },
  { name: 'Hemoglobin', value: '11.2', unit: 'g/dL', referenceRange: '12.0 - 17.5' }
];

const PatientUpload = () => {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Laboratory Record states: document file (PDF or Image) OR structured table
  const [includeLab, setIncludeLab] = useState(false);
  const [labMode, setLabMode] = useState('file'); // 'file' or 'manual'
  const [labFile, setLabFile] = useState(null);
  const [labFileName, setLabFileName] = useState('');
  const [labFileType, setLabFileType] = useState('');
  const [labFilePreview, setLabFilePreview] = useState(null);
  const [labTests, setLabTests] = useState(DEFAULT_LAB_PRESETS);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPG, JPEG, PNG) are permitted for X-Ray images.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size exceeds limit (10MB).');
        return;
      }
      setError('');
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLabFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';
      const isImg = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg'].includes(ext);

      if (!isPdf && !isImg) {
        setError('Laboratory report file must be a PDF document (.pdf) or image (.png, .jpg, .jpeg).');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('Lab record file size exceeds limit (15MB).');
        return;
      }

      setError('');
      setLabFile(file);
      setLabFileName(file.name);
      setLabFileType(isPdf ? 'pdf' : 'image');

      if (isImg) {
        setLabFilePreview(URL.createObjectURL(file));
      } else {
        setLabFilePreview(null);
      }
    }
  };

  const handleAddLabRow = () => {
    setLabTests([...labTests, { name: '', value: '', unit: '', referenceRange: '' }]);
  };

  const handleRemoveLabRow = (index) => {
    setLabTests(labTests.filter((_, idx) => idx !== index));
  };

  const handleLabChange = (index, field, value) => {
    const updated = [...labTests];
    updated[index][field] = value;
    setLabTests(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hasText = clinicalNotes.trim().length > 0;
    const hasImage = imageFile !== null;
    const hasLabFile = includeLab && labMode === 'file' && labFile !== null;
    const hasLabManual = includeLab && labMode === 'manual' && labTests.some(t => t.name.trim() !== '' && t.value !== '');
    const hasLab = hasLabFile || hasLabManual;

    if (!hasText && !hasImage && !hasLab) {
      setError('Please provide at least one modality (Clinical Notes, Chest X-Ray Image, or Laboratory Records).');
      return;
    }

    setLoading(true);

    try {
      let textResultData = null;
      let textXAIData = null;

      let imageResultData = null;
      let imageXAIData = null;
      let imageFileNameData = null;

      let labResultData = null;
      let labXAIData = null;

      // 1. Text Inference
      if (hasText) {
        setLoadingMsg('Analyzing clinical notes with scikit-learn text model...');
        const textRes = await api.post('/analysis/text', { clinicalNotes });
        textResultData = textRes.data.textResult;
        textXAIData = textRes.data.textXAI;
      }

      // 2. Image Inference
      if (hasImage) {
        setLoadingMsg('Analyzing Chest X-Ray image with Vision Transformer (ViT)...');
        const formData = new FormData();
        formData.append('file', imageFile);

        const imgRes = await api.post('/analysis/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageResultData = imgRes.data.imageResult;
        imageXAIData = imgRes.data.imageXAI;
        imageFileNameData = imgRes.data.imageFileName;
      }

      // 3. Laboratory Analysis (File Upload or Manual Entry)
      if (hasLabFile) {
        setLoadingMsg('Analyzing uploaded laboratory report file (PDF / Image)...');
        const labFormData = new FormData();
        labFormData.append('file', labFile);

        const labFileRes = await api.post('/analysis/laboratory-file', labFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        labResultData = labFileRes.data.laboratoryResult;
        labXAIData = labFileRes.data.labXAI;
      } else if (hasLabManual) {
        setLoadingMsg('Evaluating laboratory record reference ranges...');
        const validTests = labTests
          .filter(t => t.name.trim() !== '' && t.value !== '')
          .map(t => ({
            name: t.name.trim(),
            value: parseFloat(t.value),
            unit: t.unit || '',
            referenceRange: t.referenceRange || ''
          }));

        const labRes = await api.post('/analysis/laboratory', { tests: validTests });
        labResultData = labRes.data.laboratoryResult;
        labXAIData = labRes.data.labXAI;
      }

      // 4. Multimodal Fusion & Storage
      setLoadingMsg('Generating multimodal consolidated findings & storing record...');
      const payload = {
        clinicalNotes: hasText ? clinicalNotes : null,
        textResult: textResultData,
        textXAI: textXAIData,
        imageFileName: imageFileNameData,
        imageResult: imageResultData,
        imageXAI: imageXAIData,
        laboratoryResult: labResultData,
        labXAI: labXAIData
      };

      const finalRes = await api.post('/analysis/consolidate', payload);
      const recordId = finalRes.data.recordId;

      navigate('/patient/analysis', { state: { recordId } });
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.response?.data?.detail || 'Analysis execution failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      {loading && <LoadingSpinner currentStepMessage={loadingMsg} />}

      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <UploadCloud className="w-8 h-8 text-teal-600" />
          <span>Upload Medical Data</span>
        </h1>
        <p className="page-subtitle">
          Submit any available medical information. System dynamically adapts to text, image, or lab entries.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modality 1: Clinical Text Input */}
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3>1. Clinical Notes / Symptoms</h3>
            </div>
            <span className="text-xs font-semibold uppercase px-2 py-1 bg-slate-100 rounded text-slate-600">
              Optional Modality
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Enter clinical symptoms, medical history, or doctor notes.
          </p>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 min-h-[120px]"
            placeholder="Example: Patient presents with persistent productive cough, high fever (102°F), chest discomfort on deep breath, and shortness of breath for 4 days."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
          ></textarea>
        </div>

        {/* Modality 2: Medical Image Upload */}
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              <h3>2. Medical Image (Chest X-Ray)</h3>
            </div>
            <span className="text-xs font-semibold uppercase px-2 py-1 bg-slate-100 rounded text-slate-600">
              Optional Modality
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Upload a Chest X-Ray radiograph image (Supported: JPG, JPEG, PNG).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="upload-dropzone">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                id="img-upload"
                className="hidden"
                onChange={handleImageChange}
              />
              <label htmlFor="img-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-teal-500 mb-2" />
                <span className="font-semibold text-slate-700">Click to Select X-Ray Image</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</span>
              </label>
            </div>

            {imagePreview && (
              <div className="image-preview-card">
                <span className="text-xs font-semibold text-slate-500 mb-1 block">Selected Image:</span>
                <img src={imagePreview} alt="Preview" className="max-h-40 rounded border shadow-sm object-contain mx-auto" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="btn-danger text-xs mt-2"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modality 3: Laboratory Record Input (PDF or Image Upload) */}
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              <h3>3. Laboratory Record Analysis</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLab}
                onChange={(e) => setIncludeLab(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-sm font-semibold text-teal-800">Include Laboratory Record</span>
            </label>
          </div>

          {includeLab && (
            <div className="mt-4 space-y-4">
              {/* Mode Selection Tabs */}
              <div className="flex border-b border-slate-200 gap-4 mb-3">
                <button
                  type="button"
                  onClick={() => setLabMode('file')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    labMode === 'file'
                      ? 'border-teal-600 text-teal-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload Lab Report (PDF / Image)
                </button>
                <button
                  type="button"
                  onClick={() => setLabMode('manual')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    labMode === 'manual'
                      ? 'border-teal-600 text-teal-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Enter Manual Lab Parameters
                </button>
              </div>

              {/* Lab File Upload Mode */}
              {labMode === 'file' && (
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload your laboratory test record as a <strong>PDF document</strong> or <strong>image scan (PNG, JPG, JPEG)</strong>.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="upload-dropzone">
                      <input
                        type="file"
                        accept=".pdf, image/png, image/jpeg, image/jpg"
                        id="lab-file-upload"
                        className="hidden"
                        onChange={handleLabFileChange}
                      />
                      <label htmlFor="lab-file-upload" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="w-10 h-10 text-teal-500 mb-2" />
                        <span className="font-semibold text-slate-700">Select Lab Report File</span>
                        <span className="text-xs text-slate-500 mt-1">PDF document or Image (PNG, JPG) up to 15MB</span>
                      </label>
                    </div>

                    {labFile && (
                      <div className="image-preview-card flex flex-col items-center justify-center p-4 border rounded-lg bg-teal-50/50">
                        {labFileType === 'pdf' ? (
                          <div className="flex flex-col items-center gap-1">
                            <FileCheck className="w-12 h-12 text-teal-600" />
                            <span className="font-semibold text-sm text-slate-800 break-all text-center">{labFileName}</span>
                            <span className="text-xs px-2 py-0.5 bg-teal-200 text-teal-800 rounded font-semibold">PDF Document</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <img src={labFilePreview} alt="Lab Preview" className="max-h-36 rounded border shadow-sm object-contain" />
                            <span className="font-semibold text-xs text-slate-800 break-all">{labFileName}</span>
                            <span className="text-xs px-2 py-0.5 bg-teal-200 text-teal-800 rounded font-semibold">Lab Image</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setLabFile(null);
                            setLabFileName('');
                            setLabFilePreview(null);
                          }}
                          className="btn-danger text-xs mt-3"
                        >
                          Remove File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lab Manual Entry Mode */}
              {labMode === 'manual' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Enter individual laboratory test parameters and reference ranges manually.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="lab-input-table w-full text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                          <th className="p-2">Test Name</th>
                          <th className="p-2">Value</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Reference Range</th>
                          <th className="p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.map((test, index) => (
                          <tr key={index} className="border-b border-slate-200">
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="e.g. WBC"
                                className="input-sm w-full"
                                value={test.name}
                                onChange={(e) => handleLabChange(index, 'name', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                placeholder="12.5"
                                className="input-sm w-full"
                                value={test.value}
                                onChange={(e) => handleLabChange(index, 'value', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="10^9/L"
                                className="input-sm w-full"
                                value={test.unit}
                                onChange={(e) => handleLabChange(index, 'unit', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="4.0 - 11.0"
                                className="input-sm w-full"
                                value={test.referenceRange}
                                onChange={(e) => handleLabChange(index, 'referenceRange', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveLabRow(index)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove parameter"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLabRow}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Parameter Row
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Run Explainable Multimodal Analysis</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientUpload;
