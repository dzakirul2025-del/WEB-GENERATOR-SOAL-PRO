import React, { useState } from 'react';
import {
  Server,
  Database,
  Code2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { madrasahStore } from '../../lib/storage';

export const DeploymentGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleEnv = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=https://min1paser-assessment.vercel.app`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetData = () => {
    if (confirm('Kembalikan seluruh data ke setelan awal pabrik (factory defaults)? Semua data tes dan pengerjaan siswa akan direset ke kondisi awal resmi MIN 1 Paser.')) {
      madrasahStore.resetToFactoryDefaults();
      alert('Data sistem telah berhasil direset ke standar resmi.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Panduan Deployment & Arsitektur Supabase
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Instruksi penyebaran production, konfigurasi database PostgreSQL Supabase, skrip migrasi, dan pengamanan lingkungan server.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data ke Standar Pabrik</span>
        </button>
      </div>

      {/* Deployment Steps Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-700" />
            <span>Tahapan Penyebaran ke Produksi (Vercel / Supabase)</span>
          </h3>

          <ol className="space-y-3 text-xs text-gray-700">
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong>Inisialisasi Proyek Supabase:</strong>
                <p className="text-gray-500 mt-0.5">Buat project baru di konsol Supabase (region Singapore / Southeast Asia) untuk latensi terbaik di Kalimantan Timur.</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong>Jalankan SQL Migration:</strong>
                <p className="text-gray-500 mt-0.5">Eksekusi skrip <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">supabase/migrations/01_initial_schema.sql</code> di SQL Editor untuk membentuk 24 tabel relasional, constraint, dan policy RLS.</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong>Seeding Data Master:</strong>
                <p className="text-gray-500 mt-0.5">Jalankan <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">supabase/seed.sql</code> untuk memuat data awal kurikulum, rombel, dan akun kepala madrasah.</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <strong>Pengaturan Environment Variables Vercel:</strong>
                <p className="text-gray-500 mt-0.5">Tambahkan <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> pada Vercel Settings &gt; Environment Variables.</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">5</span>
              <div>
                <strong>Uji Coba CBT & Buku Nilai:</strong>
                <p className="text-gray-500 mt-0.5">Pastikan alur pengesahan nilai berjalan dengan baik dan siswa dapat masuk menggunakan token ujian.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Environment Sample Box */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-emerald-700" />
              <span>Konfigurasi .env.example</span>
            </h3>
            <button
              onClick={handleCopyEnv}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center space-x-1"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <pre className="p-3 bg-gray-900 text-emerald-300 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto">
            {sampleEnv}
          </pre>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Peringatan Keamanan Kunci Server (Bagian 2 & 24):</span>
            </div>
            <p className="text-[11px] text-gray-700">
              <code className="font-mono">GEMINI_API_KEY</code> dan <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> tidak boleh dipanggil di kode client browser. Seluruh pemanggilan AI dijalankan melalui rute proxy server <code className="font-mono">/api/ai/*</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
