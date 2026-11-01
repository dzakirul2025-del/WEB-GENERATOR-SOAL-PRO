import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { LearningPhase, LearningObjective } from '../../types';

export const CurriculumView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<LearningPhase>('Fase C');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-mtk');

  const outcomes = madrasahStore.getOutcomes();
  const objectives = madrasahStore.getObjectives();
  const subjects = madrasahStore.getSubjects();

  // Add TP Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTp, setNewTp] = useState({
    code: '',
    description: '',
    chapter: '',
    topic: '',
    indicators: '',
    grade: 6,
  });

  const filteredOutcomes = outcomes.filter(
    (o) => o.phase === selectedPhase && o.subjectId === selectedSubjectId
  );

  const filteredObjectives = objectives.filter(
    (tp) => tp.phase === selectedPhase
  );

  const handleAddTpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTp.code || !newTp.description) {
      alert('Kode dan deskripsi TP wajib diisi.');
      return;
    }

    madrasahStore.addObjective({
      outcomeId: filteredOutcomes[0]?.id || 'cp-aa-b1',
      code: newTp.code,
      description: newTp.description,
      phase: selectedPhase,
      grade: newTp.grade,
      chapter: newTp.chapter || 'Bab 1',
      topic: newTp.topic || 'Materi Pokok',
      indicators: newTp.indicators ? newTp.indicators.split('\n').filter((x) => x.trim().length > 0) : ['Indikator umum'],
    });

    setShowAddModal(false);
    setNewTp({ code: '', description: '', chapter: '', topic: '', indicators: '', grade: 4 });
    alert('Tujuan Pembelajaran berhasil ditambahkan!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Modul Kurikulum Merdeka Madrasah
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Hierarki resmi: Kurikulum → Fase (A, B, C) → Elemen → Capaian Pembelajaran (CP) → Tujuan Pembelajaran (TP) → ATP → Indikator Asesmen.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tujuan Pembelajaran (TP)</span>
        </button>
      </div>

      {/* Filter Phase & Subject */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['Fase A', 'Fase B', 'Fase C'] as LearningPhase[]).map((phase) => (
              <button
                key={phase}
                onClick={() => setSelectedPhase(phase)}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors ${
                  selectedPhase === phase ? 'bg-emerald-700 text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {phase} {phase === 'Fase A' ? '(Kls 1-2)' : phase === 'Fase B' ? '(Kls 3-4)' : '(Kls 5-6)'}
              </button>
            ))}
          </div>

          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 p-2 font-medium bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Standar Kemenag RI • SK Dirjen Pendis No. 3211
        </div>
      </div>

      {/* Capaian Pembelajaran (CP) Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded">
            Capaian Pembelajaran (CP) Resmi
          </span>
          <span className="text-xs text-gray-500">{selectedPhase}</span>
        </div>

        {filteredOutcomes.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Belum ada CP terdaftar untuk kombinasi fase dan mapel ini.</p>
        ) : (
          filteredOutcomes.map((cp) => (
            <div key={cp.id} className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs text-emerald-800">{cp.code}</span>
                <span className="font-bold text-xs text-gray-900">• Elemen: {cp.element}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-serif bg-gray-50 p-3 rounded-lg border border-gray-100">
                "{cp.description}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* Tujuan Pembelajaran (TP) List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">
          Daftar Tujuan Pembelajaran (TP) & Indikator Soal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredObjectives.map((tp) => (
            <div key={tp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    {tp.code}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">Kelas {tp.grade}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{tp.phase}</span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-gray-900">{tp.description}</h4>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  {tp.chapter} • {tp.topic}
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[11px] space-y-1">
                <strong className="text-gray-700 block">Indikator Asesmen Terkait:</strong>
                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                  {tp.indicators.map((ind, i) => (
                    <li key={i}>{ind}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add TP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddTpSubmit} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Tambah Tujuan Pembelajaran (TP)</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kode TP</label>
                  <input
                    type="text"
                    required
                    value={newTp.code}
                    onChange={(e) => setNewTp({ ...newTp, code: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono"
                    placeholder="Contoh: TP-AA-4.3"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={newTp.grade}
                    onChange={(e) => setNewTp({ ...newTp, grade: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>Kelas {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Deskripsi Tujuan Pembelajaran</label>
                <textarea
                  rows={2}
                  required
                  value={newTp.description}
                  onChange={(e) => setNewTp({ ...newTp, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Rumuskan tujuan pembelajaran..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bab / Lingkup Materi</label>
                  <input
                    type="text"
                    value={newTp.chapter}
                    onChange={(e) => setNewTp({ ...newTp, chapter: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="Bab 2: Akhlak Terpuji"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Topik Pembelajaran</label>
                  <input
                    type="text"
                    value={newTp.topic}
                    onChange={(e) => setNewTp({ ...newTp, topic: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="Adab Bertutur Kata"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Indikator Soal (1 per baris)</label>
                <textarea
                  rows={3}
                  value={newTp.indicators}
                  onChange={(e) => setNewTp({ ...newTp, indicators: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Menyebutkan contoh perilaku santun...&#10;Menganalisis dampak berkata dusta..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Simpan TP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
