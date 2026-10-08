import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';

const MESSAGES = [
  "Analyzing clinical information...",
  "Running scikit-learn text inference pipeline...",
  "Analyzing medical image with Vision Transformer (ViT)...",
  "Evaluating laboratory parameters against reference ranges...",
  "Generating XAI feature attributions & ViT spatial heatmaps...",
  "Preparing consolidated multimodal report..."
];

const LoadingSpinner = ({ currentStepMessage }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analysis-loading-overlay">
      <div className="analysis-loading-card">
        <div className="icon-pulse-container">
          <BrainCircuit className="w-12 h-12 text-teal-600 animate-spin" />
        </div>
        <h3 className="loading-title">Multimodal ML Processing</h3>
        <p className="loading-message">
          {currentStepMessage || MESSAGES[msgIdx]}
        </p>
        <div className="progress-bar-container">
          <div className="progress-bar-fill animate-progress"></div>
        </div>
        <span className="loading-subtext">Please wait while explainable models compute predictions</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
