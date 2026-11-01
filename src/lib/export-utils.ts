import * as XLSX from 'xlsx';
import { MADRASAH_INFO } from './constants';
import { QuestionItem, Assessment, GradebookEntry, Student, ItemAnalysisResult } from '../types';

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function generateKopSuratHtml(): string {
  return `
    <div style="border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; font-family: 'Times New Roman', serif; text-align: center;">
      <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #111;">
        ${MADRASAH_INFO.kop.baris1}
      </div>
      <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #111;">
        ${MADRASAH_INFO.kop.baris2}
      </div>
      <div style="font-size: 16pt; font-weight: 800; text-transform: uppercase; color: #006837; letter-spacing: 0.5px;">
        ${MADRASAH_INFO.kop.baris3}
      </div>
      <div style="font-size: 9pt; font-style: italic; color: #333; margin-top: 2px;">
        ${MADRASAH_INFO.kop.baris4}
      </div>
      <div style="font-size: 8.5pt; color: #444;">
        ${MADRASAH_INFO.kop.kontak}
      </div>
    </div>
  `;
}

export function generateTandaTanganHtml(
  guruName: string = MADRASAH_INFO.pengembang.name,
  guruNip: string = MADRASAH_INFO.pengembang.nip,
  locationDate: string = `Tanah Grogot, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
): string {
  return `
    <div style="margin-top: 40px; font-family: 'Times New Roman', serif; font-size: 11pt; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; text-align: center;">
        <div style="width: 45%;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold;">Kepala MIN 1 Paser</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${MADRASAH_INFO.kepalaMadrasah.name}</div>
          <div>NIP. ${MADRASAH_INFO.kepalaMadrasah.nip}</div>
        </div>
        <div style="width: 45%;">
          <div>${locationDate}</div>
          <div style="font-weight: bold;">Guru Mata Pelajaran,</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${guruName}</div>
          <div>NIP. ${guruNip}</div>
        </div>
      </div>
    </div>
  `;
}

export function printDocument(title: string, contentHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Harap izinkan popup untuk mencetak dokumen.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - MIN 1 PASER</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            line-height: 1.4;
            font-size: 11pt;
            background: #fff;
            margin: 0;
            padding: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .two-column {
            column-count: 2;
            column-gap: 20px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
