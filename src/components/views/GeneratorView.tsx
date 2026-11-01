import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Save,
  Layers,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';
import {
  AssessmentType,
  LearningPhase,
  QuestionItem,
  QuestionType,
  CognitiveLevel,
  DifficultyLevel,
} from '../../types';
import { STANDARD_SUBJECTS } from '../../lib/constants';

// 5 Mata Pelajaran Pilihan Utama MIN 1 Paser - Fase C (Kelas 6-C)
export const SUBJECT_PRESETS = [
  {
    id: 'sub-mtk',
    name: 'Matematika',
    category: 'Umum',
    chapter: 'Bab 1: Operasi Hitung Campuran Bilangan Bulat & Pecahan',
    topic: 'Aturan Urutan Operasi Hitung dan Masalah Kontekstual',
    indicators: 'Peserta didik mampu menyelesaikan operasi hitung campuran bilangan bulat dan menyelesaikan masalah kontekstual belanja perlengkapan madrasah.',
    sourceText: 'Koperasi MIN 1 Paser membeli 120 buku tulis dan 80 pensil 2B untuk persiapan asesmen siswa kelas 6-C. Sebanyak 2/3 dari buku tersebut dibagikan kepada siswa berprestasi, dan sisanya dibagikan sama rata ke 8 kelompok belajar.',
    tpId: 'TP-MTK-6.1',
  },
  {
    id: 'sub-ipas',
    name: 'IPAS',
    category: 'Umum',
    chapter: 'Bab 1: Menjelajah Tata Surya & Ruang Angkasa',
    topic: 'Karakteristik Planet dan Peristiwa Gerhana',
    indicators: 'Peserta didik mampu menganalisis karakteristik planet dalam tata surya serta menjelaskan posisi benda langit saat gerhana matahari dan gerhana bulan.',
    sourceText: 'Sistem tata surya kita berpusat pada Matahari. Planet terestrial (Merkurius, Venus, Bumi, Mars) berukuran lebih kecil dengan batuan padat, sedangkan planet jovian (Yupiter, Saturnus, Uranus, Neptunus) berukuran raksasa gas. Fenomena gerhana terjadi saat posisi matahari, bumi, dan bulan berada dalam satu garis lurus.',
    tpId: 'TP-IPAS-6.1',
  },
  {
    id: 'sub-bindo',
    name: 'Bahasa Indonesia',
    category: 'Umum',
    chapter: 'Bab 1: Teks Eksplanasi Ilmiah',
    topic: 'Struktur Teks Eksplanasi & Ide Pokok Paragraf',
    indicators: 'Peserta didik mampu mengidentifikasi pernyataan umum, deretan penjelas sebab-akibat, dan kesimpulan interpretasi dalam teks eksplanasi ilmiah.',
    sourceText: 'Pembangkit Listrik Tenaga Surya (PLTS) bekerja dengan mengubah energi cahaya matahari menjadi energi listrik menggunakan sel fotovoltaik. Listrik yang dihasilkan kemudian disimpan dalam baterai atau dialirkan melalui inverter untuk memenuhi kebutuhan penerangan gedung kelas 6-C MIN 1 Paser secara ramah lingkungan.',
    tpId: 'TP-BIN-6.1',
  },
  {
    id: 'sub-ppkn',
    name: 'Pendidikan Pancasila',
    category: 'Umum',
    chapter: 'Bab 1: Nilai Juang Perumus Dasar Negara',
    topic: 'Keteladanan Tokoh Bangsa & Musyawarah Mufakat',
    indicators: 'Peserta didik mampu menganalisis nilai rela berkorban, persatuan, dan musyawarah mufakat dalam kehidupan sehari-hari di kelas 6-C.',
    sourceText: 'Ketika kelas 6-C MIN 1 Paser mengadakan pemilihan ketua regu kebersihan dan tema dekorasi kelas, Ahmad dan Dzakir mengusulkan ide yang berbeda. Seluruh siswa kemudian bermusyawarah secara tertib dan saling menghormati pendapat hingga mencapai kata mufakat demi persatuan kelas.',
    tpId: 'TP-PKN-6.1',
  },
  {
    id: 'sub-sbdp',
    name: 'SBDP (Seni Budaya & Prakarya)',
    category: 'Umum',
    chapter: 'Bab 1: Reklame dan Poster Edukatif',
    topic: 'Unsur Desain Poster Persuasif & Pola Lantai Tari Daerah',
    indicators: 'Peserta didik mampu menganalisis kriteria poster persuasif hemat energi serta mengidentifikasi pola lantai vertikal dan melingkar pada tari kreasi daerah Paser.',
    sourceText: 'Siswa kelas 6-C MIN 1 Paser merancang poster kampanye Adiwiyata dengan slogan hemat listrik dan air di madrasah. Selain itu, mereka mempelajari pola lantai garis lurus dan lingkaran pada pementasan tari Ronggeng Paser untuk acara pelepasan siswa kelas 6.',
    tpId: 'TP-SBDP-6.1',
  },
];

interface GeneratorViewProps {
  onNavigate: (view: string) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({ onNavigate }) => {
  const classes = madrasahStore.getClasses();
  const subjects = madrasahStore.getSubjects();
  const objectives = madrasahStore.getObjectives();
  const assessments = madrasahStore.getAssessments();

  // Form State initialized to Kelas 6-C Matematika (Priority 1)
  const defaultPreset = SUBJECT_PRESETS[0];
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('sumatif_semester');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-6c');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultPreset.id);
  const [chapter, setChapter] = useState(defaultPreset.chapter);
  const [topic, setTopic] = useState(defaultPreset.topic);
  const [indicators, setIndicators] = useState(defaultPreset.indicators);
  const [sourceText, setSourceText] = useState(defaultPreset.sourceText);
  const [selectedTpId, setSelectedTpId] = useState(defaultPreset.tpId);

  // 3 Checkboxes & Counts
  const [includePg, setIncludePg] = useState<boolean>(true);
  const [countPg, setCountPg] = useState<number>(5);

  const [includeIsian, setIncludeIsian] = useState<boolean>(true);
  const [countIsian, setCountIsian] = useState<number>(3);

  const [includeEssay, setIncludeEssay] = useState<boolean>(true);
  const [countEssay, setCountEssay] = useState<number>(2);

  // Cognitive distribution (must equal 100%)
  const [lots, setLots] = useState<number>(30); // C1-C2
  const [mots, setMots] = useState<number>(40); // C3
  const [hots, setHots] = useState<number>(30); // C4-C6

  // Difficulty distribution (must equal 100%)
  const [diffMudah, setDiffMudah] = useState<number>(30);
  const [diffSedang, setDiffSedang] = useState<number>(50);
  const [diffSulit, setDiffSulit] = useState<number>(20);

  // Characteristics
  const [characteristics, setCharacteristics] = useState({
    kontekstual: true,
    hots: true,
    literasi: true,
    numerasi: true,
    stimulus: true,
    dailyLife: true,
  });

  // Batch Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [targetAssessmentId, setTargetAssessmentId] = useState<string>(
    assessments[0]?.id || 'asm-sas-mtk-6c'
  );
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const totalRequested = (includePg ? countPg : 0) + (includeIsian ? countIsian : 0) + (includeEssay ? countEssay : 0);

  const handleCognitiveBalance = (type: 'lots' | 'mots' | 'hots', val: number) => {
    if (type === 'lots') {
      setLots(val);
      const rem = 100 - val;
      setMots(Math.floor(rem / 2));
      setHots(rem - Math.floor(rem / 2));
    } else if (type === 'mots') {
      setMots(val);
      const rem = 100 - val;
      setLots(Math.floor(rem / 2));
      setHots(rem - Math.floor(rem / 2));
    } else {
      setHots(val);
      const rem = 100 - val;
      setLots(Math.floor(rem / 2));
      setMots(rem - Math.floor(rem / 2));
    }
  };

  const handleDifficultyBalance = (type: 'mudah' | 'sedang' | 'sulit', val: number) => {
    if (type === 'mudah') {
      setDiffMudah(val);
      const rem = 100 - val;
      setDiffSedang(Math.floor(rem / 2));
      setDiffSulit(rem - Math.floor(rem / 2));
    } else if (type === 'sedang') {
      setDiffSedang(val);
      const rem = 100 - val;
      setDiffMudah(Math.floor(rem / 2));
      setDiffSulit(rem - Math.floor(rem / 2));
    } else {
      setDiffSulit(val);
      const rem = 100 - val;
      setDiffMudah(Math.floor(rem / 2));
      setDiffSedang(rem - Math.floor(rem / 2));
    }
  };

  // Run Bulk Adaptive Batch Generation Engine
  const handleStartGeneration = async () => {
    if (totalRequested <= 0) {
      alert('Pilih minimal satu jenis soal dan jumlah soal lebih dari 0.');
      return;
    }

    setIsGenerating(true);
    setProgress(5);
    setErrorLog(null);
    setStatusMessage('Menyiapkan parameter adaptif & koneksi ke Gemini 3.8 Flash...');

    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
    const selectedClass = classes.find((c) => c.id === selectedClassId);

    // Build batch queue
    const tasks: { type: QuestionType; count: number; cognitive: CognitiveLevel; difficulty: DifficultyLevel }[] = [];

    // Helper to calculate batch sizes (maximum 5 questions per Gemini call for prompt safety & detail)
    const BATCH_SIZE = 5;

    if (includePg) {
      let remaining = countPg;
      while (remaining > 0) {
        const batchCount = Math.min(remaining, BATCH_SIZE);
        tasks.push({
          type: 'pilihan_ganda',
          count: batchCount,
          cognitive: hots > 40 ? 'C4' : mots > 40 ? 'C3' : 'C2',
          difficulty: diffSulit > 40 ? 'sulit' : diffSedang > 40 ? 'sedang' : 'mudah',
        });
        remaining -= batchCount;
      }
    }

    if (includeIsian) {
      let remaining = countIsian;
      while (remaining > 0) {
        const batchCount = Math.min(remaining, BATCH_SIZE);
        tasks.push({
          type: 'isian',
          count: batchCount,
          cognitive: 'C2',
          difficulty: 'sedang',
        });
        remaining -= batchCount;
      }
    }

    if (includeEssay) {
      let remaining = countEssay;
      while (remaining > 0) {
        const batchCount = Math.min(remaining, 3); // Essays have rubrics, keep batch size small
        tasks.push({
          type: 'essay',
          count: batchCount,
          cognitive: 'C4',
          difficulty: 'sedang',
        });
        remaining -= batchCount;
      }
    }

    const allGenerated: QuestionItem[] = [];
    let currentNumber = 1;

    try {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const stepPct = Math.round(((i + 1) / tasks.length) * 90);
        setProgress(stepPct);
        setStatusMessage(
          `Memproses Batch ${i + 1}/${tasks.length}: ${task.count} butir ${task.type.replace('_', ' ').toUpperCase()}...`
        );

        const response = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionType: task.type,
            count: task.count,
            phase: selectedClass?.phase || 'Fase B',
            grade: selectedClass?.grade || 4,
            subjectName: selectedSubject?.name || 'Akidah Akhlak',
            chapter,
            topic,
            indicators,
            cognitiveLevel: task.cognitive,
            difficulty: task.difficulty,
            characteristics,
            sourceText,
            startingNumber: currentNumber,
          }),
        });

        const rawText = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          if (!response.ok) {
            throw new Error(`Server sedang memproses antrean (${response.status}). Silakan ulangi generate.`);
          }
          throw new Error('Respon server tidak dalam format JSON yang valid.');
        }

        if (!response.ok || !data.success) {
          throw new Error(data?.error || `Batch ${i + 1} gagal diproses oleh server (${response.status})`);
        }

        if (data.questions && Array.isArray(data.questions)) {
          const processedBatch = data.questions.map((q: QuestionItem, qIdx: number) => ({
            ...q,
            number: currentNumber + qIdx,
            assessmentId: targetAssessmentId,
            topic: topic || q.topic,
            learningObjectiveId: selectedTpId || 'tp-mtk-6.1',
          }));
          currentNumber += processedBatch.length;
          allGenerated.push(...processedBatch);
          setGeneratedQuestions([...allGenerated]);
        }
      }

      setProgress(100);
      setStatusMessage(`Selesai! ${allGenerated.length} butir soal Kurikulum Merdeka Fase C Kelas 6 berhasil digenerate dan tersimpan sebagai draft.`);
    } catch (err: any) {
      console.error('Generation Error:', err);
      setErrorLog(err.message || 'Terjadi kesalahan saat memproses batch ke Gemini AI.');
      setStatusMessage('Proses dihentikan karena kendala batch.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = (preset: typeof SUBJECT_PRESETS[0]) => {
    setSelectedSubjectId(preset.id);
    setChapter(preset.chapter);
    setTopic(preset.topic);
    setIndicators(preset.indicators);
    setSourceText(preset.sourceText);
    setSelectedTpId(preset.tpId);
  };

  const handleSaveToStore = (directToValidation: boolean = true) => {
    if (generatedQuestions.length === 0) return;
    madrasahStore.saveBatchQuestions(generatedQuestions, targetAssessmentId);
    if (directToValidation) {
      onNavigate('validation');
    } else {
      onNavigate('editor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              AI Assessment Generator Pro
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Mesin generator massal berstandar Kurikulum Merdeka Madrasah: Pilihan Ganda, Isian Singkat, dan Essay dalam satu kali proses terintegrasi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('editor')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Buka Editor Soal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Comprehensive Generator Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Konfigurasi Akademik */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-extrabold">1</span>
              <span>Identitas & Kurikulum Asesmen</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Asesmen</label>
                <select
                  value={targetAssessmentId}
                  onChange={(e) => setTargetAssessmentId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas & Fase</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mata Pelajaran</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5 Mapel Prioritas Pilihan MIN 1 Paser Quick Presets */}
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5 Mapel Pilihan Kurikulum Merdeka (Klik untuk Preset Otomatis):</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Fase C • Kelas 6-C
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {SUBJECT_PRESETS.map((preset) => {
                  const isSelected = selectedSubjectId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500/40'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <span className="truncate">{preset.name}</span>
                      <span className={`text-[9px] font-normal truncate mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-gray-500'}`}>
                        {preset.chapter.split(':')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bab / Lingkup Materi</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 p-2"
                  placeholder="Contoh: Bab 1: Asmaul Husna"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topik Pembelajaran</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 p-2"
                  placeholder="Contoh: Meneladani Sifat Al-Malik & Al-Quddus"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Indikator Ketercapaian Soal</label>
              <textarea
                rows={2}
                value={indicators}
                onChange={(e) => setIndicators(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2"
                placeholder="Rumuskan indikator asesmen yang terukur..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Sumber Stimulus / Teks Materi
                </label>
                <span className="text-[11px] text-emerald-700">Wajib kontekstual & akurat</span>
              </div>
              <textarea
                rows={3}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2 font-mono text-gray-700 bg-gray-50/50"
                placeholder="Masukkan kutipan buku materi, teks bacaan, atau studi kasus..."
              />
            </div>
          </div>

          {/* 2. Tiga Jenis Soal Sekaligus (Bagian 8.B) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-extrabold">2</span>
                <span>Tiga Jenis Soal Sekaligus (Simultaneous Multi-Type)</span>
              </h3>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Total Target: {totalRequested} Butir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Box 1: Pilihan Ganda */}
              <div className={`p-4 rounded-xl border transition-all ${includePg ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePg}
                      onChange={(e) => setIncludePg(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-bold text-xs text-gray-900">Pilihan Ganda</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700">Opsi A-D</span>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-gray-600 mb-1 font-medium">Jumlah Butir</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={countPg}
                    disabled={!includePg}
                    onChange={(e) => setCountPg(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 font-bold text-center bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Bobot: 2 poin/soal • Kunci & pembahasan</p>
                </div>
              </div>

              {/* Box 2: Isian Singkat */}
              <div className={`p-4 rounded-xl border transition-all ${includeIsian ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeIsian}
                      onChange={(e) => setIncludeIsian(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-bold text-xs text-gray-900">Isian Singkat</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700">Fuzzy Key</span>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-gray-600 mb-1 font-medium">Jumlah Butir</label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={countIsian}
                    disabled={!includeIsian}
                    onChange={(e) => setCountIsian(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 font-bold text-center bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Bobot: 3 poin/soal • Variasi jawaban</p>
                </div>
              </div>

              {/* Box 3: Essay / Uraian */}
              <div className={`p-4 rounded-xl border transition-all ${includeEssay ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEssay}
                      onChange={(e) => setIncludeEssay(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-bold text-xs text-gray-900">Essay / Uraian</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700">Rubrik 1-5</span>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-gray-600 mb-1 font-medium">Jumlah Butir</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={countEssay}
                    disabled={!includeEssay}
                    onChange={(e) => setCountEssay(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 p-2 font-bold text-center bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Bobot: 5 poin/soal • Rubrik analitik</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Distribusi Kognitif & Tingkat Kesulitan */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-extrabold">3</span>
              <span>Distribusi Taksonomi Bloom & Tingkat Kesukaran</span>
            </h3>

            {/* Cognitive Balance Sliders */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-800">Distribusi Level Kognitif (Total: {lots + mots + hots}%)</span>
                <span className="text-gray-500 text-[11px]">LOTS: {lots}% • MOTS: {mots}% • HOTS: {hots}%</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-gray-600">LOTS (C1-C2): {lots}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={lots}
                    onChange={(e) => handleCognitiveBalance('lots', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-600">MOTS (C3): {mots}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mots}
                    onChange={(e) => handleCognitiveBalance('mots', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-600">HOTS (C4-C6): {hots}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hots}
                    onChange={(e) => handleCognitiveBalance('hots', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Balance Sliders */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-800">Tingkat Kesukaran Soal (Total: {diffMudah + diffSedang + diffSulit}%)</span>
                <span className="text-gray-500 text-[11px]">Mudah: {diffMudah}% • Sedang: {diffSedang}% • Sulit: {diffSulit}%</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-gray-600">Mudah: {diffMudah}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={diffMudah}
                    onChange={(e) => handleDifficultyBalance('mudah', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-600">Sedang: {diffSedang}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={diffSedang}
                    onChange={(e) => handleDifficultyBalance('sedang', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-600">Sulit: {diffSulit}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={diffSulit}
                    onChange={(e) => handleDifficultyBalance('sulit', Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Karakter Soal Checkboxes */}
            <div className="pt-2 border-t border-gray-100">
              <span className="block text-xs font-semibold text-gray-800 mb-2">Karakteristik Khusus Soal:</span>
              <div className="flex flex-wrap gap-3 text-xs">
                {Object.entries(characteristics).map(([key, val]) => (
                  <label key={key} className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setCharacteristics({ ...characteristics, [key]: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Adaptive Batch Monitor & Execution Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Bulk Batch Processing Engine</h3>
            <p className="text-xs text-gray-500">
              Sistem membagi permintaan besar secara adaptif ke dalam batch kecil (maksimal 5 soal/batch) untuk mencegah batas token dan timeout.
            </p>

            {/* Batch Stats Estimation */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Total Butir Diminta:</span>
                <strong className="text-gray-900">{totalRequested} Soal</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimasi Jumlah Batch:</span>
                <strong className="text-gray-900">{Math.ceil(totalRequested / 5)} Batch</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimasi Token Pemrosesan:</span>
                <strong className="text-gray-900">~{totalRequested * 350} Token</strong>
              </div>
              <div className="flex justify-between">
                <span>Model AI:</span>
                <strong className="text-emerald-700">Gemini 3.8 Flash</strong>
              </div>
            </div>

            {/* Progress Display */}
            {isGenerating && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    <span>{statusMessage}</span>
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {errorLog && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Kendala Pemrosesan:</div>
                  <div>{errorLog}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                disabled={isGenerating || totalRequested === 0}
                onClick={handleStartGeneration}
                className="w-full bg-[#006837] hover:bg-[#00522c] disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>{isGenerating ? 'Sedang Memproses Batch...' : 'Generate Soal Otomatis'}</span>
              </button>

              {generatedQuestions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    <div className="font-bold flex items-center space-x-1 text-amber-800 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Tahap Wajib Selanjutnya: Validasi Soal</span>
                    </div>
                    Soal baru masih berstatus <strong>Draft</strong>. Wajib ditelaah 4 pilar kualitas di menu Validasi sebelum dapat digunakan pada CBT.
                  </div>

                  <button
                    onClick={() => handleSaveToStore(true)}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Simpan & Masuk ke Validasi Soal (Wajib)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleSaveToStore(false)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-gray-500" />
                    <span>Simpan ke Editor Butir Soal</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/80 p-4 text-xs text-emerald-950 space-y-2">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Standar Mutu Soal MIN 1 Paser</span>
            </div>
            <p className="text-gray-700 text-[11px] leading-relaxed">
              Setiap butir soal wajib melalui <strong>Fitur Validasi Soal</strong> untuk memverifikasi 4 aspek pokok: <strong>Materi</strong> (kesesuaian CP/TP), <strong>Konstruksi</strong> (pokok soal tegas, pilihan homogen), <strong>Bahasa</strong> (kaidah EYD bahasa Indonesia yang baik), dan <strong>Bebas Duplikasi</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Questions Live Preview */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900 text-sm">
                  Preview Hasil Generate ({generatedQuestions.length} Butir Soal)
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Draft • Menunggu Validasi</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Soal dapat ditelaah dan diverifikasi sebelum digunakan pada CBT</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSaveToStore(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Simpan & Buka Validasi Soal (Wajib)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {generatedQuestions.map((q) => (
              <div key={q.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      No. {q.number}
                    </span>
                    <span className="font-semibold text-gray-700 uppercase">{q.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gray-500">• {q.cognitiveLevel} • {q.difficulty} • Bobot: {q.weight}</span>
                  </div>
                </div>

                {q.stimulus && (
                  <div className="p-2.5 bg-blue-50/60 rounded border border-blue-200/60 text-blue-950 text-[11px] italic">
                    <strong>Stimulus:</strong> {q.stimulus}
                  </div>
                )}

                <p className="font-bold text-gray-900 text-sm">{q.stem}</p>

                {q.type === 'pilihan_ganda' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded border text-xs flex items-center space-x-2 ${
                          opt.key === q.correctAnswerKey
                            ? 'bg-emerald-50 border-emerald-400 font-semibold text-emerald-900'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="font-bold w-5">{opt.key}.</span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'isian' && (
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900">
                    <strong>Kunci Jawaban:</strong> {q.correctAnswerKey}{' '}
                    {q.answerVariations && q.answerVariations.length > 0 && (
                      <span className="text-gray-600 text-[11px]">
                        (Variasi toleransi: {q.answerVariations.join(', ')})
                      </span>
                    )}
                  </div>
                )}

                {q.type === 'essay' && q.essayRubric && (
                  <div className="p-2.5 bg-purple-50 rounded border border-purple-200 text-xs text-purple-950 space-y-1">
                    <div className="font-bold">Rubrik Penilaian Essay (Skor Maksimal: {q.essayRubric.maxScore}):</div>
                    <div className="text-[11px] text-gray-700">Kriteria: {q.essayRubric.criteria}</div>
                  </div>
                )}

                <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                  <strong>Pembahasan:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
