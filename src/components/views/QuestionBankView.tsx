import React, { useState } from 'react';
import { Database, Search, Filter, Copy, Plus, FileText, CheckCircle2, Tag } from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { QuestionType, CognitiveLevel, DifficultyLevel } from '../../types';

interface QuestionBankViewProps {
  onNavigate: (view: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onNavigate }) => {
  const allQuestions = madrasahStore.getQuestions();
  const subjects = madrasahStore.getSubjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filtered = allQuestions.filter((q) => {
    const matchSearch =
      q.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || q.type === typeFilter;
    const matchLevel = levelFilter === 'all' || q.cognitiveLevel === levelFilter;
    return matchSearch && matchType && matchLevel;
  });

  const handleDuplicateToBank = (qId: string) => {
    const target = allQuestions.find((q) => q.id === qId);
    if (!target) return;
    const duplicated = {
      ...target,
      id: `q-bank-${Date.now()}`,
      number: allQuestions.length + 1,
      version: (target.version || 1) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    madrasahStore.saveQuestion(duplicated);
    alert('Soal berhasil diduplikasi sebagai versi baru di Bank Soal!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Bank Soal Digital
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Repositori butir soal terverifikasi MIN 1 Paser dilengkapi pelacak riwayat versi, taksonomi Bloom, dan penggunaan historis.
          </p>
        </div>

        <button
          onClick={() => onNavigate('generator')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Soal Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Bentuk Soal</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              <option value="all">Semua Bentuk ({allQuestions.length})</option>
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="isian">Isian Singkat</option>
              <option value="essay">Essay / Uraian</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Level Kognitif</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              <option value="all">Semua Level</option>
              <option value="C1">C1 - Mengingat</option>
              <option value="C2">C2 - Memahami</option>
              <option value="C3">C3 - Mengaplikasikan</option>
              <option value="C4">C4 - Menganalisis</option>
              <option value="C5">C5 - Mengevaluasi</option>
              <option value="C6">C6 - Mencipta</option>
            </select>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Pencarian Bank Soal</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, teks, atau indikator..."
              className="w-full text-xs rounded-lg border border-gray-300 pl-8 pr-3 py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((q) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    ID: {q.id.slice(0, 10)}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 uppercase">
                    {q.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500">Versi {q.version || 1}.0</span>
              </div>

              {q.stimulus && (
                <div className="p-2 bg-blue-50/60 rounded text-[11px] italic text-blue-900 line-clamp-2">
                  {q.stimulus}
                </div>
              )}

              <p className="font-bold text-gray-900 text-xs line-clamp-3">{q.stem}</p>

              <div className="text-[11px] text-gray-500">
                <span>Topik: <strong>{q.topic || 'Materi Pembelajaran'}</strong></span> • <span>Level: <strong>{q.cognitiveLevel}</strong></span> • <span>Bobot: <strong>{q.weight} Poin</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-[200px]">
                Kunci: {q.correctAnswerKey || '(Rubrik Penskoran)'}
              </span>

              <button
                onClick={() => handleDuplicateToBank(q.id)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center space-x-1"
                title="Duplikasi sebagai versi baru"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplikasi</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
