import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ArrowRight,
  Printer,
  Trash2,
  BrainCircuit,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import { Assessment, AssessmentType, AssessmentStatus } from '../../types';
import { ASSESSMENT_TYPE_LABELS, ASSESSMENT_STATUS_LABELS } from '../../lib/constants';

interface AssessmentsViewProps {
  onNavigate: (view: string) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({ onNavigate }) => {
  const assessments = madrasahStore.getAssessments();
  const classes = madrasahStore.getClasses();
  const subjects = madrasahStore.getSubjects();

  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newAsm, setNewAsm] = useState({
    title: '',
    type: 'sumatif_semester' as AssessmentType,
    classId: classes[0]?.id || 'cls-6c',
    subjectId: 'sub-mtk',
    executionDate: new Date().toISOString().split('T')[0],
    durationMinutes: 60,
    token: 'PASER' + Math.floor(100 + Math.random() * 900),
    kktp: 70,
  });

  const filteredAssessments = assessments.filter(
    (a) => filterType === 'all' || a.type === filterType
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsm.title) {
      alert('Judul asesmen wajib diisi.');
      return;
    }

    const created: Assessment = {
      id: `asm-${Date.now()}`,
      title: newAsm.title,
      type: newAsm.type,
      academicYearId: 'ay-2024-2025',
      semesterId: 'sem-ganjil',
      classId: newAsm.classId,
      subjectId: newAsm.subjectId,
      authorId: 'user-dzakirul',
      executionDate: newAsm.executionDate,
      durationMinutes: newAsm.durationMinutes,
      token: newAsm.token,
      kktp: newAsm.kktp,
      status: 'draft',
      objectivesCovered: ['tp-aa-4.1'],
      questionsCount: { pg: 0, isian: 0, essay: 0, total: 0 },
      totalWeight: 0,
      instructions: '1. Berdoalah sebelum mulai pengerjaan.\n2. Kerjakan soal dengan teliti dan mandiri.',
      isRandomizedQuestions: false,
      isRandomizedOptions: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    madrasahStore.saveAssessment(created);
    setShowCreateModal(false);
    alert('Asesmen baru berhasil dibuat! Anda dapat menggunakan AI Generator untuk mengisi butir soal.');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus asesmen ini?')) {
      madrasahStore.deleteAssessment(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Manajemen Lima Kategori Asesmen
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Formatif, Sumatif Akhir Bab, SAS, SAT, dan Ujian Madrasah (UM) dengan alur status terstruktur dari Draft hingga Pengesahan Buku Nilai.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('validation')}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Pusat Validasi Soal</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Asesmen Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
            filterType === 'all' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Semua ({assessments.length})
        </button>
        {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              filterType === k ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssessments.map((asm) => {
          const cls = classes.find((c) => c.id === asm.classId);
          const sub = subjects.find((s) => s.id === asm.subjectId);
          const statusInfo = ASSESSMENT_STATUS_LABELS[asm.status] || {
            label: asm.status,
            color: 'bg-gray-100 text-gray-800 border-gray-300',
          };

          return (
            <div
              key={asm.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                    {ASSESSMENT_TYPE_LABELS[asm.type] || asm.type}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-sm mt-1.5">{asm.title}</h3>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {asm.isValidated ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                      <span>Tervalidasi</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                      <span>Perlu Validasi</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                <div>Kelas: <strong>{cls?.name || 'Kelas 4A'} ({cls?.phase || 'Fase B'})</strong></div>
                <div>Mapel: <strong>{sub?.name || 'Akidah Akhlak'}</strong></div>
                <div>Tanggal: <strong>{asm.executionDate}</strong></div>
                <div>Durasi CBT: <strong>{asm.durationMinutes} Menit</strong></div>
                <div>Token: <strong className="font-mono text-emerald-800 font-extrabold">{asm.token}</strong></div>
                <div>KKTP: <strong className="text-emerald-700">{asm.kktp}</strong></div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>
                  Total: <strong>{asm.questionsCount?.total || 0} Soal</strong> ({asm.questionsCount?.pg || 0} PG, {asm.questionsCount?.isian || 0} Isian, {asm.questionsCount?.essay || 0} Essay)
                </span>
                <span className="font-semibold text-gray-700">Bobot: {asm.totalWeight} Poin</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onNavigate('validation')}
                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-1 font-semibold"
                    title="Telaah & Validasi Kualitas Soal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Validasi</span>
                  </button>
                  <button
                    onClick={() => onNavigate('generator')}
                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex items-center space-x-1 font-semibold"
                    title="Generate Soal"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Generate AI</span>
                  </button>
                  <button
                    onClick={() => onNavigate('editor')}
                    className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Editor Soal</span>
                  </button>
                  <button
                    onClick={() => onNavigate('blueprints')}
                    className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1 font-semibold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Kisi-Kisi</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onNavigate('cbt')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center space-x-1"
                  >
                    <span>Mulai CBT</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(asm.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Buat Asesmen Baru</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Judul Asesmen</label>
                <input
                  type="text"
                  required
                  value={newAsm.title}
                  onChange={(e) => setNewAsm({ ...newAsm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Contoh: Sumatif Akhir Semester (SAS) Al-Qur'an Hadis"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Jenis Asesmen</label>
                  <select
                    value={newAsm.type}
                    onChange={(e) => setNewAsm({ ...newAsm, type: e.target.value as AssessmentType })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    <option value="formatif">Asesmen Formatif (AF)</option>
                    <option value="sumatif_bab">Sumatif Akhir Bab</option>
                    <option value="sumatif_semester">Sumatif Akhir Semester (SAS)</option>
                    <option value="sumatif_tahun">Sumatif Akhir Tahun (SAT)</option>
                    <option value="ujian_madrasah">Ujian Madrasah (UM)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={newAsm.executionDate}
                    onChange={(e) => setNewAsm({ ...newAsm, executionDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kelas Target</label>
                  <select
                    value={newAsm.classId}
                    onChange={(e) => setNewAsm({ ...newAsm, classId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={newAsm.subjectId}
                    onChange={(e) => setNewAsm({ ...newAsm, subjectId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={15}
                    value={newAsm.durationMinutes}
                    onChange={(e) => setNewAsm({ ...newAsm, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Token Akses CBT</label>
                  <input
                    type="text"
                    required
                    value={newAsm.token}
                    onChange={(e) => setNewAsm({ ...newAsm, token: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Standar KKTP</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newAsm.kktp}
                    onChange={(e) => setNewAsm({ ...newAsm, kktp: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 p-2 font-bold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Simpan & Lanjutkan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
