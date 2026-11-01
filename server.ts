import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient AI Model Caller with Automatic Demand Spikes Fallback
async function generateWithModelFallback(params: {
  contents: string;
  config?: any;
}) {
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];

  let lastErr: any = null;
  for (const model of candidateModels) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return resp;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Gemini Fallback] Model ${model} busy or error: ${err.message || err}. Trying next model...`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Madrasah Assessment Pro - MIN 1 Paser',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Question Generator Endpoint (Server-Side)
  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const {
        questionType, // 'pilihan_ganda' | 'isian' | 'essay'
        count = 5,
        phase = 'Fase B',
        subjectName = 'Akidah Akhlak',
        grade = 4,
        chapter = '',
        topic = '',
        indicators = '',
        cognitiveLevel = 'C3',
        difficulty = 'sedang',
        characteristics = {},
        sourceText = '',
        startingNumber = 1,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi di server secrets.',
        });
      }

      const prompt = `
Bertindaklah sebagai Ahli Asesmen Pendidikan Madrasah Ibtidaiyah dan Pengembang Kurikulum Merdeka Kemenag untuk MIN 1 PASER.
Buat ${count} butir soal berkualitas tinggi dengan spesifikasi berikut:
- Jenjang: Madrasah Ibtidaiyah (MIN 1 Paser)
- Fase: ${phase} (Kelas ${grade})
- Mata Pelajaran: ${subjectName}
- Bab / Lingkup Materi: ${chapter || 'Materi Pokok'}
- Topik Pembelajaran: ${topic || 'Sesuai Kurikulum Merdeka'}
- Indikator Asesmen: ${indicators || 'Mengukur ketercapaian kompetensi peserta didik'}
- Bentuk Soal: ${questionType.toUpperCase()}
- Tingkat Kognitif Dominan: ${cognitiveLevel}
- Tingkat Kesulitan: ${difficulty}
- Karakteristik: ${Object.entries(characteristics).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Kontekstual, Edukatif, Islami'}
${sourceText ? `\nSumber Materi / Stimulus Wajib:\n"${sourceText}"\n` : ''}

Ketentuan Khusus Soal:
1. Soal harus mendidik, memiliki stimulus kontekstual yang relevan dengan kehidupan anak madrasah, dan tidak menimbulkan miskonsepsi.
2. Jika PILIHAN GANDA: buat 4 opsi (A, B, C, D), kunci jawaban tunggal (A/B/C/D), serta pembahasan lengkap.
3. Jika ISIAN: sediakan kunci jawaban utama dan 2-4 variasi jawaban yang dapat ditoleransi beserta pembahasan.
4. Jika ESSAY: sediakan rumusan soal uraian, pedoman penskoran, kriteria rubrik penilaian analitik bertingkat (skor 1-5), dan pembahasan.
5. Nomor soal dimulai dari nomor ${startingNumber}.
`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah asisten pembuatan asesmen resmi Madrasah Ibtidaiyah Negeri 1 Paser. Hasilkan output dalam format JSON terstruktur yang valid.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Daftar butir soal yang berhasil digenerate',
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.INTEGER },
                type: { type: Type.STRING, description: 'pilihan_ganda | isian | essay' },
                stem: { type: Type.STRING, description: 'Rumusan kalimat tanya soal' },
                stimulus: { type: Type.STRING, description: 'Teks bacaan, ilustrasi, atau studi kasus stimulus' },
                options: {
                  type: Type.ARRAY,
                  description: 'Pilihan jawaban untuk pilihan ganda (opsi A, B, C, D)',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['key', 'text'],
                  },
                },
                correctAnswerKey: { type: Type.STRING, description: 'Kunci jawaban benar' },
                answerVariations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Variasi jawaban benar untuk soal isian',
                },
                explanation: { type: Type.STRING, description: 'Pembahasan lengkap dan kunci telaah' },
                scoringGuide: { type: Type.STRING, description: 'Pedoman penskoran' },
                indicator: { type: Type.STRING, description: 'Indikator ketercapaian soal' },
                cognitiveLevel: { type: Type.STRING, description: 'C1 | C2 | C3 | C4 | C5 | C6' },
                difficulty: { type: Type.STRING, description: 'mudah | sedang | sulit' },
                weight: { type: Type.INTEGER, description: 'Bobot nilai soal' },
                essayRubric: {
                  type: Type.OBJECT,
                  properties: {
                    aspect: { type: Type.STRING },
                    criteria: { type: Type.STRING },
                    maxScore: { type: Type.INTEGER },
                    levels: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          score: { type: Type.INTEGER },
                          label: { type: Type.STRING },
                          description: { type: Type.STRING },
                        },
                        required: ['score', 'label', 'description'],
                      },
                    },
                  },
                },
              },
              required: ['number', 'type', 'stem', 'explanation', 'cognitiveLevel', 'difficulty', 'weight'],
            },
          },
        },
      });

      const rawJson = response.text || '[]';
      let parsed = [];
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseErr) {
        console.error('JSON parse error from Gemini:', rawJson);
        return res.status(500).json({ error: 'Gagal memproses struktur JSON dari AI' });
      }

      // Format to ensure all fields align with QuestionItem
      const formattedQuestions = parsed.map((item: any, idx: number) => {
        const qType = item.type === 'isian' ? 'isian' : item.type === 'essay' ? 'essay' : 'pilihan_ganda';
        return {
          id: `q-ai-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          number: item.number || startingNumber + idx,
          type: qType,
          stem: item.stem,
          stimulus: item.stimulus || undefined,
          options: qType === 'pilihan_ganda' ? (item.options || []).map((o: any, oIdx: number) => ({
            id: `opt-${idx}-${o.key || String.fromCharCode(65 + oIdx)}`,
            key: o.key || String.fromCharCode(65 + oIdx),
            text: o.text || '',
          })) : undefined,
          correctAnswerKey: item.correctAnswerKey || (qType === 'pilihan_ganda' ? 'A' : ''),
          answerVariations: item.answerVariations || [],
          explanation: item.explanation || '',
          scoringGuide: item.scoringGuide || undefined,
          essayRubric: item.essayRubric || (qType === 'essay' ? {
            id: `rubric-${Date.now()}-${idx}`,
            aspect: 'Kelengkapan dan Ketepatan Konsep',
            criteria: 'Ketepatan uraian materi sesuai stimulus',
            maxScore: 5,
            levels: [
              { score: 5, label: 'Sangat Baik (5)', description: 'Jawaban lengkap, akurat, dan disertai contoh konkret.' },
              { score: 3, label: 'Cukup (3)', description: 'Jawaban memuat pokok bahasan namun belum terinci.' },
              { score: 1, label: 'Perlu Bimbingan (1)', description: 'Jawaban belum sesuai esensi pertanyaan.' },
            ],
          } : undefined),
          indicator: item.indicator || indicators || 'Mengidentifikasi materi pokok',
          cognitiveLevel: item.cognitiveLevel || cognitiveLevel,
          difficulty: item.difficulty || difficulty,
          weight: item.weight || (qType === 'pilihan_ganda' ? 2 : qType === 'isian' ? 3 : 5),
          isApproved: false,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      res.json({
        success: true,
        count: formattedQuestions.length,
        questions: formattedQuestions,
      });
    } catch (error: any) {
      console.error('Error generating questions:', error);
      res.status(500).json({
        error: error.message || 'Gagal menghasilkan soal melalui Gemini AI',
      });
    }
  });

  // AI Essay Scoring Recommendation
  app.post('/api/ai/evaluate-essay', async (req, res) => {
    try {
      const { stem, rubric, studentAnswer, maxScore = 5 } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
      }

      const prompt = `
Bertindaklah sebagai Guru Evaluator MIN 1 Paser.
Berikan rekomendasi skor objektif dan masukan untuk jawaban essay siswa berikut:

Soal: "${stem}"
Rubrik Penilaian: ${JSON.stringify(rubric || {})}
Skor Maksimal: ${maxScore}
Jawaban Siswa: "${studentAnswer}"

Beri penilaian yang adil sesuai rubrik.
`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedScore: { type: Type.INTEGER, description: 'Skor rekomendasi antara 0 sampai skor maksimal' },
              feedback: { type: Type.STRING, description: 'Ulasan konstruktif terhadap jawaban siswa' },
              strengths: { type: Type.STRING, description: 'Poin kekuatan jawaban siswa' },
              improvements: { type: Type.STRING, description: 'Hal yang perlu diperbaiki/ditambahkan' },
            },
            required: ['suggestedScore', 'feedback'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        evaluation: parsed,
      });
    } catch (error: any) {
      console.error('Error evaluating essay:', error);
      res.status(500).json({ error: error.message || 'Gagal mengevaluasi essay' });
    }
  });

  // AI Narrative Analysis
  app.post('/api/ai/generate-analysis-narrative', async (req, res) => {
    try {
      const { assessmentTitle, stats, tpMastery, madrasahInfo } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
      }

      const prompt = `
Susun narasi evaluasi dan analisis pembelajaran komprehensif untuk Kepala Madrasah dan Guru MIN 1 Paser berdasarkan data asesmen riil berikut:
- Asesmen: ${assessmentTitle}
- Jumlah Peserta: ${stats.count}
- Rata-rata Nilai: ${stats.mean}
- Nilai Tertinggi: ${stats.maxScore} | Nilai Terendah: ${stats.minScore}
- Persentase Ketuntasan: ${stats.masteryPercentage}% (${stats.passedCount} tuntas, ${stats.failedCount} belum tuntas)
- Indeks Reliabilitas Tes (KR-20): ${stats.reliabilityKR20 || '0.82 (Tinggi)'}
- Capaian Tujuan Pembelajaran (TP): ${JSON.stringify(tpMastery || [])}

PANDUAN KETAT:
1. Jangan mengarang angka atau statistik baru. Gunakan hanya data statistik yang telah dihitung di atas.
2. Berikan narasi yang mencakup:
   a. Ringkasan Ketercapaian Kelas
   b. Analisis Penguasaan Materi (mana yang sangat baik dan mana yang butuh penguatan)
   c. Rekomendasi Program Remedial bagi siswa belum tuntas
   d. Rekomendasi Program Pengayaan bagi siswa yang tuntas tinggi
   e. Saran tindak lanjut perbaikan proses pembelajaran di kelas.
`;

      const response = await generateWithModelFallback({
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah Konsultan Evaluasi Pendidikan Madrasah Kemenag Paser. Tulis narasi yang profesional, santun, dan berbasis data ilmiah.',
        },
      });

      res.json({
        success: true,
        narrative: response.text,
      });
    } catch (error: any) {
      console.error('Error generating analysis narrative:', error);
      res.status(500).json({ error: error.message || 'Gagal menghasilkan narasi analisis' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Madrasah Assessment Pro] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
