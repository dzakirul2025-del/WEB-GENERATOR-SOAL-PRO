import React, { useState } from 'react';
import { ScrollText, ShieldCheck, Search, Filter, RefreshCw, Lock } from 'lucide-react';
import { madrasahStore } from '../../lib/storage';

export const AuditLogsView: React.FC = () => {
  const auditLogs = madrasahStore.getAuditLogs();
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Audit Trail & Log Keamanan Sistem
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pencatatan jejak audit aktivitas pengguna, modifikasi nilai resmi, eksekusi generator, dan kepatuhan Row Level Security (RLS).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Immutability Enforced</span>
          </span>
        </div>
      </div>

      {/* Security Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Row Level Security (RLS)</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Aktif pada PostgreSQL</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Proteksi Kunci Rahasia</div>
            <div className="text-[11px] text-blue-700 font-semibold">Server-Side Only (No Browser Leak)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Total Peristiwa Tercatat</div>
            <div className="text-[11px] text-purple-700 font-semibold">{auditLogs.length} Log Disimpan</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aksi, nama pengguna, atau rincian..."
            className="w-full text-xs rounded-lg border border-gray-300 pl-8 pr-3 py-1.5"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Waktu (WITA)</th>
                <th className="py-3 px-3">Pengguna & Peran</th>
                <th className="py-3 px-3">Tindakan (Action)</th>
                <th className="py-3 px-3">Entitas</th>
                <th className="py-3 px-3">Rincian Peristiwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-gray-900 block">{log.userName}</span>
                    <span className="text-[10px] text-gray-500 uppercase">{log.userRole}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-gray-700">{log.entityType}</td>
                  <td className="py-2.5 px-3 text-gray-600 leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
