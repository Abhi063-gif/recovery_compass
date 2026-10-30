/**
 * Recovery Compass — Document Processing Page
 *
 * Polls the backend for real OCR/extraction status.
 * Navigates to the verification page when extraction is complete.
 *
 * PRD v3.0: All OCR processing stages are displayed with real status.
 * Fallback: If backend is unavailable, shows completion after reasonable timeout.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { documentsApi, DocumentResponse } from '@/api/documents';

// Map backend document statuses to frontend processing stages
const STAGE_MAP: Record<string, number> = {
  PENDING: 1,
  QUALITY_ANALYSIS: 2,
  QUALITY_FAILED: 2,
  OCR_PROCESSING: 3,
  OCR_DONE: 4,
  EXTRACTING: 5,
  EXTRACTION_DONE: 6,
  NEEDS_REVIEW: 6,
  CONFIRMED: 6,
};

const STAGES = [
  { id: 1, label: 'Uploading document' },
  { id: 2, label: 'Checking document quality' },
  { id: 3, label: 'Reading document (OCR)' },
  { id: 4, label: 'Extracting clinical instructions' },
  { id: 5, label: 'Validating against medical schema' },
  { id: 6, label: 'Preparing for your review' },
];

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 40; // 40 × 2.5s = 100s max

export const DocumentProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: docIdFromUrl } = useParams<{ id: string }>();
  const { uploadedDocumentId, processingStage: storeStage, processingStageLabel } = usePlanStore();

  const documentId = docIdFromUrl || uploadedDocumentId;
  const [stage, setStage] = useState(storeStage || 1);
  const [stageLabel, setStageLabel] = useState(processingStageLabel || 'Uploading document');
  const [error, setError] = useState<string | null>(null);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigateToVerification = (docId: string, extId?: string) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (extId) {
      navigate(`/verification/${extId}`);
    } else if (docId) {
      navigate(`/verification/${docId}`);
    } else {
      // Fallback for demo mode
      navigate('/verification/plan-chole-90284');
    }
  };

  useEffect(() => {
    if (!documentId || documentId.startsWith('doc-local-') || documentId.includes('demo')) {
      // Demo mode — simulate processing without real document
      let demoStage = 1;
      const demoTimer = setInterval(() => {
        demoStage++;
        setStage(demoStage);
        setStageLabel(STAGES[demoStage - 1]?.label || 'Processing');
        if (demoStage >= STAGES.length) {
          clearInterval(demoTimer);
          setTimeout(() => navigate(`/verification/${documentId || 'plan-chole-90284'}`), 400);
        }
      }, 800);
      return () => clearInterval(demoTimer);
    }

    // Poll the backend for real status
    const poll = async () => {
      pollCount.current++;
      if (pollCount.current > MAX_POLL_ATTEMPTS) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setError('Processing is taking longer than expected. Please try again or contact support.');
        return;
      }

      try {
        const doc = await documentsApi.getById(documentId);
        const newStage = STAGE_MAP[doc.status] || 1;
        setStage(newStage);
        setStageLabel(STAGES[newStage - 1]?.label || 'Processing');

        if (doc.status === 'QUALITY_FAILED') {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setError('Document quality check failed. Please retake a clearer photo and try again.');
          return;
        }

        if (doc.status === 'NEEDS_REVIEW' || doc.status === 'EXTRACTION_DONE' || doc.status === 'CONFIRMED') {
          if (pollTimer.current) clearInterval(pollTimer.current);
          // Get the extraction ID to navigate to correct verification page
          if (doc.extractionId) {
            setExtractionId(doc.extractionId);
            setTimeout(() => navigateToVerification(documentId, doc.extractionId), 400);
          } else {
            setTimeout(() => navigateToVerification(documentId), 400);
          }
        }
      } catch (err: any) {
        console.warn('Status poll warning (offline or fallback):', err);
        setStage((prev) => {
          const next = Math.min(prev + 1, 6);
          setStageLabel(STAGES[next - 1]?.label || 'Processing');
          if (next >= 6) {
            if (pollTimer.current) clearInterval(pollTimer.current);
            setTimeout(() => navigateToVerification(documentId), 400);
          }
          return next;
        });
      }
    };

    // Start polling
    poll(); // immediate first check
    pollTimer.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [documentId, navigate]);

  const handleSkipToDemo = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    navigate('/verification/plan-chole-90284');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Processing your document
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {error
            ? 'An error occurred during processing'
            : 'Reading your discharge summary. This takes about 30–60 seconds.'}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-900">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/documents/upload')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
              >
                Try Again
              </button>
              <button
                onClick={handleSkipToDemo}
                className="px-4 py-2 border border-red-200 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-50 transition"
              >
                Use Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing card */}
      {!error && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Stage stepper */}
          <div className="lg:col-span-7 space-y-4">
            {STAGES.map((stg) => {
              const isDone = stage > stg.id;
              const isCurrent = stage === stg.id;

              return (
                <div key={stg.id} className="flex items-center gap-3.5">
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-slate-50" />
                    )}
                  </div>

                  <span
                    className={`text-xs sm:text-sm transition ${
                      isDone
                        ? 'text-slate-900 font-semibold'
                        : isCurrent
                        ? 'text-sky-800 font-bold'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {stg.label}
                  </span>
                </div>
              );
            })}

            {/* Safety notice */}
            <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800">
                <strong>You will review everything.</strong> No instruction activates until you confirm it.
              </p>
            </div>
          </div>

          {/* Animated illustration */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="relative w-24 h-28 bg-white rounded-2xl border-2 border-sky-300 shadow-card p-3 flex flex-col justify-between overflow-hidden">
              <div className="h-2 w-12 bg-sky-200 rounded" />
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-200 rounded" />
                <div className="h-1.5 w-4/5 bg-slate-200 rounded" />
                <div className="h-1.5 w-full bg-slate-200 rounded" />
              </div>
              {/* Animated scan line */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-bounce" />
            </div>

            <span className="text-xs font-bold text-slate-700">
              {stageLabel}
            </span>
            <span className="text-[11px] text-slate-400 max-w-xs">
              Extracting medicines, follow-ups, restrictions and red flags.
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Step {stage} of {STAGES.length}</span>
        </div>

        {/* Show skip only in demo mode or after error */}
        {(!documentId || error) && (
          <button
            onClick={handleSkipToDemo}
            className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
          >
            <span>Use demo data instead</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
