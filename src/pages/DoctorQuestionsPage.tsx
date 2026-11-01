import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  Printer,
  Edit2,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { usePlanStore } from '@/stores/usePlanStore';
import { questionsApi } from '@/api/questions';

export const DoctorQuestionsPage: React.FC = () => {
  const { plan, addDoctorQuestion, toggleDoctorQuestionAnswered } = usePlanStore();
  const [tabView, setTabView] = useState<'generated' | 'general'>('generated');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [remoteQuestions, setRemoteQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (plan.id) {
      questionsApi
        .getByPlan(plan.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setRemoteQuestions(data);
          }
        })
        .catch(() => {});
    }
  }, [plan.id]);

  // Determine whether real questions exist from remote API or local plan store
  const hasRemoteQuestions = remoteQuestions.length > 0;
  const hasPlanQuestions = (plan.doctorQuestions || []).length > 0;
  const hasRealQuestions = hasRemoteQuestions || hasPlanQuestions;

  const realQuestions = hasRemoteQuestions
    ? remoteQuestions.map((q) => ({
        id: q.id,
        text: q.questionText || q.text,
        answered: q.isResolved ?? q.answered ?? false,
        sourceType: q.sourceType,
      }))
    : (plan.doctorQuestions || []).map((q) => ({
        id: q.id,
        text: q.question,
        answered: q.isAnswered,
        sourceType: q.category,
      }));

  const fallbackQuestions = [
    {
      id: 'default-q-1',
      text: 'Is it safe to resume light core/abdominal exercise after 2 weeks?',
      answered: false,
      sourceType: 'UNCLEAR_FIELD',
    },
    {
      id: 'default-q-2',
      text: 'When should I discontinue the prescribed pain analgesia if pain is below 3/10?',
      answered: false,
      sourceType: 'MEDICATION_REVIEW',
    },
  ];

  // If real clinical questions exist, do NOT append static dummy fallback questions
  const combinedQuestions = hasRealQuestions ? realQuestions : fallbackQuestions;

  // Deduplicate strictly by normalized question text
  const uniqueQuestions = Array.from(
    new Map(combinedQuestions.map((item) => [item.text.trim().toLowerCase(), item])).values(),
  );

  const [questionList, setQuestionList] = useState(uniqueQuestions);

  useEffect(() => {
    setQuestionList(uniqueQuestions);
  }, [remoteQuestions, plan.doctorQuestions]);

  const toggleAnswered = async (id: string) => {
    setQuestionList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answered: !q.answered } : q)),
    );
    await toggleDoctorQuestionAnswered(id);
  };

  const markAllAnswered = () => {
    setQuestionList((prev) => prev.map((q) => ({ ...q, answered: true })));
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    await addDoctorQuestion(newQuestionText.trim(), 'Patient recorded during recovery');
    setQuestionList((prev) => [
      {
        id: `q-${Date.now()}`,
        text: newQuestionText.trim(),
        answered: false,
        sourceType: 'PATIENT_INQUIRY',
      },
      ...prev,
    ]);
    setNewQuestionText('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Questions to Ask Your Doctor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compiled questions based on unclear items, conflicting instructions, and pending recovery milestones.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setTabView('generated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tabView === 'generated' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Generated from your plan
          </button>
          <button
            onClick={() => setTabView('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tabView === 'general' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            General suggestions
          </button>
        </div>
      </div>

      {/* Add New Question Input */}
      <form onSubmit={handleAddQuestion} className="flex gap-2">
        <input
          type="text"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="Add a question to discuss with your surgeon at your next visit..."
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </form>

      {/* Questions Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <div className="space-y-3">
          {questionList.map((q) => (
            <div
              key={q.id}
              onClick={() => toggleAnswered(q.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                q.answered
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={q.answered}
                  onChange={() => toggleAnswered(q.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-rose-700 focus:ring-rose-600 shrink-0"
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    q.answered ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {q.text}
                </span>
              </div>

              {q.sourceType && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  {q.sourceType.replace('_', ' ')}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions: Print / Export & Mark All Answered */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
          <button
            onClick={handlePrint}
            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export Questions</span>
          </button>

          <button
            onClick={markAllAnswered}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition"
          >
            Mark All Answered
          </button>
        </div>
      </div>
    </div>
  );
};
