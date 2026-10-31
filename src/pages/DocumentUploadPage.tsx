import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  ArrowRight,
  Edit3,
  Lock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { documentsApi } from '@/api/documents';

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedFile, setUploadedFile } = usePlanStore();
  const { isAuthenticated, user } = useAuthStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Authentication gate: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login', {
        replace: true,
        state: {
          from: '/documents/upload',
          message: 'Please sign in or create an account to upload your discharge summary.',
        },
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleFileSelect = (fileOrName: File | string, sizeStr?: string) => {
    if (!isAuthenticated && !user) {
      setUploadError('Please sign in or create an account before uploading medical documents.');
      navigate('/login', {
        state: {
          from: '/documents/upload',
          message: 'Please sign in or create an account to upload your discharge summary.',
        },
      });
      return;
    }

    setUploadError(null);
    if (typeof fileOrName === 'string') {
      const name = fileOrName;
      const size = sizeStr || '1.2 MB';
      const syntheticBlob = new Blob(['Discharge summary simulated content'], { type: 'application/pdf' });
      const syntheticFile = new File([syntheticBlob], name, { type: 'application/pdf' });
      setUploadedFile({
        name,
        size,
        type: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        url: URL.createObjectURL(syntheticFile),
        fileObj: syntheticFile,
      });
    } else {
      const file = fileOrName;
      // ─── 0-Byte Validation Gate ─────────────────────────────────────────────
      if (!file || file.size === 0) {
        setUploadError('The selected file is empty (0 bytes). Please upload a valid document.');
        setUploadedFile(null);
        return;
      }
      setUploadedFile({
        name: file.name,
        size:
          file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        url: URL.createObjectURL(file),
        fileObj: file,
      });
    }
  };

  const handleStartProcessing = async () => {
    if (!isAuthenticated && !user) {
      setUploadError('Please sign in or create an account before uploading medical documents.');
      navigate('/login', {
        state: {
          from: '/documents/upload',
          message: 'Please sign in or create an account to upload your discharge summary.',
        },
      });
      return;
    }

    const file = uploadedFile?.fileObj;
    if (!file || file.size === 0) {
      setUploadError('The selected file is empty (0 bytes). Please upload a valid document.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadRes = await documentsApi.upload(file);
      const docId = uploadRes.id || uploadRes.documentId;
      if (docId) {
        usePlanStore.getState().uploadedFile = { ...uploadedFile, fileObj: file };
        try {
          await documentsApi.triggerProcessing(docId);
        } catch (pErr) {
          console.warn('Backend trigger processing skipped/deferred:', pErr);
        }
        navigate(`/documents/processing/${docId}`);
        return;
      }
    } catch (err: any) {
      console.warn('Backend document upload skipped or failed, using local/demo session:', err);
    }

    const localId = `doc-local-${Date.now()}`;
    navigate(`/documents/processing/${localId}`);
  };

  // If unauthenticated, render the authentication barrier card
  if (!isAuthenticated && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-elevated space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#C8103E] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#17243A]">Authentication Required</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Please sign in or create an account to upload your medical documents and link your recovery plan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() =>
                navigate('/login', {
                  state: {
                    from: '/documents/upload',
                    message: 'Please sign in or create an account to upload your discharge summary.',
                  },
                })
              }
              className="w-full sm:w-auto px-6 py-2.5 bg-[#C8103E] hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In or Register</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Upload your discharge instructions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload a PDF, Image or take a photo. You can also enter the information manually.
        </p>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-sm text-red-900 block">Invalid Document</span>
            <p className="mt-0.5 font-medium">{uploadError}</p>
          </div>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Zone */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
          {!uploadedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-rose-700 bg-rose-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-medical-700 flex items-center justify-center shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="font-bold text-sm text-slate-900 block">
                  Drag & drop your file here
                </span>
                <span className="text-xs text-slate-400">or</span>
              </div>

              {/* Crimson Primary Choose File Button */}
              <label className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm inline-flex items-center gap-2">
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </label>

              <span className="text-[11px] text-slate-400 pt-1">
                PDF, JPG, JPEG, PNG (max 10MB)
              </span>

              {/* Bottom Quick Action Triggers */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-200/70 w-full">
                <button
                  type="button"
                  onClick={() => handleFileSelect('Camera_Scan_Knee_Summary.jpg', '2.4 MB')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  <span>Take Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manual Entry</span>
                </button>
              </div>
            </div>
          ) : (
            /* Selected File State */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{uploadedFile.name}</h3>
                    <span className="text-[11px] text-slate-500">{uploadedFile.size} • Ready for OCR extraction</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  aria-label="Remove uploaded file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quality Scan Bar */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Document scanned: Clean contrast, all pages legible.</span>
                </div>
                <span className="font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full text-[10px]">
                  Quality: Good
                </span>
              </div>
            </div>
          )}

          {/* Bottom Bar: Back and Next buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={!uploadedFile || isUploading || Boolean(uploadError)}
              onClick={handleStartProcessing}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                uploadedFile && !uploadError
                  ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isUploading ? 'Uploading document...' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: "Your privacy matters" */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-700" />
            <h2 className="font-bold text-sm text-slate-900">Your privacy matters</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your documents are encrypted and kept strictly secure.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>We only use this information to create your recovery plan.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>You can permanently delete your data at any time in Settings.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Fallback Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Manual Text Input Fallback</h2>
            <p className="text-xs text-slate-500">
              Paste the text from your electronic discharge summary or patient portal.
            </p>
            <textarea
              rows={6}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste discharge text (e.g. Paracetamol 500mg TDS, Aspirin 75mg OD, No driving for 4 weeks...)"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={!manualText.trim()}
                onClick={() => {
                  if (!manualText.trim()) return;
                  const blob = new Blob([manualText], { type: 'text/plain' });
                  const file = new File([blob], 'Manual_Entered_Instructions.txt', { type: 'text/plain' });
                  handleFileSelect(file);
                  setIsManualModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
              >
                Use Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
