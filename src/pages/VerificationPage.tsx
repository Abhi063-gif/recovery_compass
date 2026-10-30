import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit2,
  Save,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { ExtractionField } from '@/types';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { SYNTHETIC_DISCHARGE_TEXT } from '@/api/mocks/mockPlanData';
import { documentsApi } from '@/api/documents';
import { speakText } from '@/services/i18n';

export const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    plan,
    selectedExtractionId,
    setSelectedExtractionId,
    updateExtractionField,
    confirmAllExtractions,
  } = usePlanStore();

  const { planId } = useParams<{ planId: string }>();
  const [realDocumentText, setRealDocumentText] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<'extracted' | 'original'>('extracted');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'medication' | 'task' | 'follow_up' | 'restriction'>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [pageNumber, setPageNumber] = useState(1);

  React.useEffect(() => {
    if (planId && !planId.includes('demo') && !planId.includes('chole')) {
      documentsApi.getPages(planId).then((pages) => {
        if (Array.isArray(pages) && pages.length > 0) {
          const combined = pages.map((p: any) => p.text || p.content || '').join('\n\n--- PAGE BREAK ---\n\n');
          if (combined.trim()) setRealDocumentText(combined);
        }
      }).catch(() => {
        // Fallback
      });
    }
  }, [planId]);

  const extractions = plan.extractions;
  const selectedItem = extractions.find((e) => e.id === selectedExtractionId) || extractions[0];

  const filteredItems = extractions.filter((item) => {
    if (activeCategoryTab === 'all') return true;
    return item.category === activeCategoryTab;
  });

  const handleStartEdit = (item: ExtractionField) => {
    setEditingItemId(item.id);
    setEditValue(item.value);
  };

  const handleSaveEdit = (id: string) => {
    updateExtractionField(id, { value: editValue, status: 'confirmed' });
    setEditingItemId(null);
  };

  const handleConfirmItem = (id: string) => {
    updateExtractionField(id, { status: 'confirmed' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-200">
              Step 2 of 3 • Document Verification
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Verification & Confirm (Extracted vs Original)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-check extracted medications, tasks, and restrictions against the original hospital discharge note.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={confirmAllExtractions}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Confirm All ({extractions.length})
          </button>
          <button
            onClick={() => navigate('/confirm-plan')}
            className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Toggle */}
      <div className="flex md:hidden bg-slate-200 p-1 rounded-2xl">
        <button
          onClick={() => setMobileTab('extracted')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            mobileTab === 'extracted' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Extracted Information ({extractions.length})
        </button>
        <button
          onClick={() => setMobileTab('original')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            mobileTab === 'original' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Original Document
        </button>
      </div>

      {/* 2-Column Split Workspace (Matching Wireframe 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Original Document Viewer */}
        <div
          className={`lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4 ${
            mobileTab === 'original' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-700" />
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Original Document
              </span>
            </div>

            {/* Page Selector 1 / 2 */}
            <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 px-2 py-1 rounded-xl">
              <button
                disabled={pageNumber === 1}
                onClick={() => setPageNumber(1)}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{pageNumber} / 2</span>
              <button
                disabled={pageNumber === 2}
                onClick={() => setPageNumber(2)}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Highlight Banner */}
          {selectedItem && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <Eye className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-950 block">
                    Highlighted Region: {selectedItem.fieldName}
                  </span>
                  <p className="text-slate-700 text-[11px] mt-0.5 italic">
                    "{selectedItem.sourceText}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => speakText(`${selectedItem.fieldName}: ${selectedItem.value}`)}
                className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                title="Read instruction aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* High-Fidelity Hospital Paper View */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl font-mono text-[11px] leading-relaxed max-h-[580px] overflow-y-auto text-slate-800 shadow-inner select-none">
            <div className="font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3">
              {plan.patientProfile?.hospitalName || 'HOSPITAL DISCHARGE & TREATMENT INSTRUCTIONS'}
            </div>

            {(realDocumentText || SYNTHETIC_DISCHARGE_TEXT).trim()
              .split('\n')
              .map((line: string, idx: number) => {
                const isMatchingLine =
                  selectedItem &&
                  selectedItem.sourceText &&
                  line.trim().length > 0 &&
                  (selectedItem.sourceText.includes(line.trim()) ||
                    line.includes(selectedItem.sourceText.slice(0, 20)));

                return (
                  <div
                    key={idx}
                    className={`py-0.5 px-1.5 rounded transition-colors ${
                      isMatchingLine
                        ? 'bg-amber-200 text-amber-950 border-l-4 border-rose-700 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT COLUMN: Extracted Information Cards */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileTab === 'extracted' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Category Tabs (Medicines, Tasks, Follow-ups, Restrictions) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all' as const, label: 'All Items' },
              { id: 'medication' as const, label: 'Medicines' },
              { id: 'task' as const, label: 'Tasks' },
              { id: 'follow_up' as const, label: 'Follow-ups' },
              { id: 'restriction' as const, label: 'Restrictions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeCategoryTab === tab.id
                    ? 'bg-rose-700 text-white shadow-sm font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Extracted Item List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = selectedExtractionId === item.id;
              const isEditing = editingItemId === item.id;
              const isConfirmed = item.status === 'confirmed';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedExtractionId(item.id)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-rose-600 ring-2 ring-rose-100 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {item.category.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{item.fieldName}</h3>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {item.value}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isConfirmed ? 'Confirmed ✓' : 'Pending'}
                      </span>
                      <span className="text-[10px] text-slate-400">Page {item.page}</span>
                    </div>
                  </div>

                  {/* Confidence pill & Condition notice */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <ConfidenceBadge confidence={item.confidence} />
                    {item.condition && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold">
                        Conditional
                      </span>
                    )}
                  </div>

                  {/* Inline edit or confirm actions */}
                  {isEditing ? (
                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        rows={2}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3 py-1 bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(item);
                        }}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmItem(item.id);
                        }}
                        className={`px-3 py-1 rounded-xl font-bold text-xs transition ${
                          isConfirmed
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-rose-700 text-white hover:bg-rose-800'
                        }`}
                      >
                        {isConfirmed ? 'Re-confirm' : 'Confirm Item'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Back / Next */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              onClick={() => navigate('/documents/upload')}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => navigate('/confirm-plan')}
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
