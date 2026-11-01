import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';

interface RemedialViewProps {
  onNavigate: (view: string) => void;
}

export const RemedialView: React.FC<RemedialViewProps> = ({ onNavigate }) => {
  const remedials = madrasahStore.getRemedials();
  const students = madrasahStore.getStudents();
  const assessments = madrasahStore.getAssessments();

  const [activeTab, setActiveTab] = useState<'remedial' | 'pengayaan'>('remedial');
  const [editingRemId, setEditingRemId] = useState<string | null>(null);
  const [remedialInputScore, setRemedialInputScore] = useState<number>(75);
  const [notesInput, setNotesInput] = useState<string>('');

  const handleSaveRemedial = (remId: string) => {
    madrasahStore.saveRemedialScore(remId, remedialInputScore, notesInput);
    setEditingRemId(null);
    alert('Nilai remedial berhasil disimpan!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Remedial & Pengayaan Terpadu
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Program tindak lanjut hasil asesmen: pendampingan bagi siswa belum tuntas (remedial) dan pengayaan kompetensi bagi siswa berprestasi.
          </p>
        </div>

        <button
          onClick={() => onNavigate('gradebook')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center space-x-1.5 shadow-2xs"
        >
          <span>Kembali ke Buku Nilai</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('remedial')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === 'remedial' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Program Remedial ({remedials.length} Siswa Teridentifikasi)
        </button>
        <button
          onClick={() => setActiveTab('pengayaan')}
          className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === 'pengayaan' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Program Pengayaan (Prestasi Tinggi)
        </button>
      </div>

      {/* Tab: Remedial List */}
      {activeTab === 'remedial' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Siswa dengan nilai di bawah KKTP (&lt;75) otomatis terdata untuk mendapatkan perbaikan pembelajaran pada TP yang belum dikuasai. Nilai akhir remedial dibatasi maksimal setara KKTP (75).
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remedials.map((rem) => {
              const std = students.find((s) => s.id === rem.studentId);
              const asm = assessments.find((a) => a.id === rem.assessmentId);
              const isEditing = editingRemId === rem.id;

              return (
                <div key={rem.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{std?.name || 'Siswa'}</h4>
                      <p className="text-[10px] text-gray-500">NISN: {std?.nisn} • {asm?.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rem.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {rem.status === 'completed' ? 'Tuntas Remedial' : 'Menunggu Tes Ulang'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Nilai Awal:</span>
                      <strong className="text-red-600 font-black">{rem.initialScore}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Hasil Tes Ulang:</span>
                      <strong className="text-gray-900 font-bold">{rem.remedialScore ?? '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Nilai Akhir:</span>
                      <strong className="text-emerald-700 font-black">{rem.finalRemedialScore ?? '-'}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-gray-700 space-y-1">
                    <div><strong>TP Belum Dikuasai:</strong> {rem.unmasteredTpCodes.join(', ') || 'TP-AA-4.1'}</div>
                    <div><strong>Bentuk Tindak Lanjut:</strong> {rem.actionTaken}</div>
                    {rem.notes && <div className="text-[11px] text-gray-500 italic">Catatan: {rem.notes}</div>}
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    {isEditing ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <label className="font-semibold text-gray-700">Nilai Tes Remedial:</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={remedialInputScore}
                            onChange={(e) => setRemedialInputScore(Number(e.target.value))}
                            className="w-16 border border-gray-300 rounded p-1 font-bold text-center"
                          />
                        </div>
                        <input
                          type="text"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="Catatan perkembangan siswa..."
                          className="w-full border border-gray-300 rounded p-1.5 text-xs"
                        />
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingRemId(null)}
                            className="px-2.5 py-1 text-gray-500 text-xs"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveRemedial(rem.id)}
                            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-bold"
                          >
                            Simpan Hasil
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingRemId(rem.id);
                          setRemedialInputScore(rem.remedialScore || 75);
                          setNotesInput(rem.notes || '');
                        }}
                        className="text-xs text-emerald-800 font-bold hover:underline"
                      >
                        {rem.status === 'completed' ? 'Ubah Nilai Remedial' : 'Input Hasil Tes Remedial'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Pengayaan */}
      {activeTab === 'pengayaan' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Program Pengayaan Siswa Berprestasi</h3>
            <p className="text-xs text-gray-500 mt-1">
              Diberikan kepada peserta didik yang telah mencapai nilai &gt; 85 untuk memperdalam pemahaman konsep dan literasi madrasah.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-start justify-between text-xs">
              <div>
                <h4 className="font-bold text-emerald-950">Ahmad Faiz Pratama (Nilai SAS: 95)</h4>
                <p className="text-gray-600 mt-0.5">Kegiatan: Penulisan esai reflektif "Keteladanan Asmaul Husna dalam Menjaga Kelestarian Lingkungan Paser".</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                Selesai (Portofolio Tersimpan)
              </span>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-start justify-between text-xs">
              <div>
                <h4 className="font-bold text-emerald-950">Nabila Syakira Puteri (Nilai SAS: 96)</h4>
                <p className="text-gray-600 mt-0.5">Kegiatan: Tutor sebaya pendampingan tajwid Al-Qur'an Hadis untuk kelompok belajar kelas 4A.</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                Aktif Bertugas
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
