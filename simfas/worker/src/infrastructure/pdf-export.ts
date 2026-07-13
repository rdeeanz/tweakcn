/**
 * Generator PDF — form inspeksi (layout mirip template-output-inspeksi.pdf)
 * dan ringkasan laporan availability (landscape).
 * Menggunakan pdf-lib (ringan, cocok Workers).
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  inspectionConditionLabel,
  type InspectionConditionCode,
} from "@simfas/shared";

export interface InspectionPdfInput {
  branchName: string;
  facilityName: string;
  location: string | null;
  inspectionDate: string;
  previousInspectionDate: string | null;
  items: Array<{
    itemName: string;
    conditionCode: InspectionConditionCode;
    notes: string | null;
  }>;
  branchApproverName?: string | null;
  partnerApproverName?: string | null;
}

/**
 * Cetak Form Pemeriksaan Inspeksi Lapangan (pengganti form kertas).
 */
export async function exportInspectionPdf(
  data: InspectionPdfInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  let y = height - 40;

  const draw = (text: string, x: number, size = 10, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.05, 0.1, 0.2),
    });
  };

  // Kop PELINDO
  draw("PT PELABUHAN INDONESIA (PERSERO)", 50, 12, true);
  y -= 16;
  draw("FORM PEMERIKSAAN INSPEKSI LAPANGAN", 50, 14, true);
  y -= 14;
  draw("FASILITAS SIPIL PELABUHAN", 50, 11, true);
  y -= 24;

  draw(`Nama Pelabuhan / Cabang : ${data.branchName}`, 50, 10);
  y -= 14;
  draw(`Fasilitas               : ${data.facilityName}`, 50, 10);
  y -= 14;
  draw(`Lokasi / Area           : ${data.location ?? "—"}`, 50, 10);
  y -= 14;
  draw(`Tanggal Inspeksi        : ${data.inspectionDate}`, 50, 10);
  y -= 14;
  draw(
    `Tanggal Inspeksi Sebelumnya : ${data.previousInspectionDate ?? "—"}`,
    50,
    10
  );
  y -= 22;

  // Keterangan kode 1–4
  draw("Keterangan kondisi:", 50, 9, true);
  y -= 12;
  for (const code of [1, 2, 3, 4] as InspectionConditionCode[]) {
    draw(`${code}. ${inspectionConditionLabel(code)}`, 55, 8);
    y -= 11;
  }
  y -= 10;

  // Header tabel
  const colX = [50, 70, 220, 280, 320, 360, 400];
  page.drawRectangle({
    x: 45,
    y: y - 4,
    width: width - 90,
    height: 18,
    color: rgb(0.85, 0.9, 0.95),
  });
  draw("No", colX[0], 9, true);
  draw("Item / Objek Fasilitas", colX[1], 9, true);
  draw("1", colX[2], 9, true);
  draw("2", colX[3], 9, true);
  draw("3", colX[4], 9, true);
  draw("4", colX[5], 9, true);
  draw("Catatan", colX[6], 9, true);
  y -= 20;

  data.items.forEach((item, idx) => {
    if (y < 120) return; // batasi 1 halaman untuk Free Tier
    draw(String(idx + 1), colX[0], 9);
    draw(item.itemName.slice(0, 28), colX[1], 9);
    for (const c of [1, 2, 3, 4] as const) {
      const mark = item.conditionCode === c ? "X" : "";
      draw(mark, colX[c + 1], 9, true);
    }
    draw((item.notes ?? "").slice(0, 30), colX[6], 8);
    y -= 16;
    // Garis tipis
    page.drawLine({
      start: { x: 45, y: y + 10 },
      end: { x: width - 45, y: y + 10 },
      thickness: 0.3,
      color: rgb(0.7, 0.7, 0.7),
    });
  });

  y = Math.min(y, 140);
  y -= 20;
  draw("Persetujuan:", 50, 10, true);
  y -= 30;
  draw("Cabang", 80, 9, true);
  draw("Anak Usaha / Mitra", 320, 9, true);
  y -= 50;
  draw("________________", 60, 9);
  draw("________________", 300, 9);
  y -= 14;
  draw(data.branchApproverName ?? "(tanda tangan)", 70, 8);
  draw(data.partnerApproverName ?? "(tanda tangan)", 310, 8);
  y -= 20;
  draw("Dicetak otomatis oleh SIMFAS", 50, 7);

  return doc.save();
}

/**
 * PDF ringkas laporan availability (A4 landscape).
 */
export async function exportReportPdf(params: {
  title: string;
  subtitle: string;
  rows: Array<{
    no: string | number | null;
    col2: string | null;
    col3: string | null;
    col4: string | null;
    availability: number | null;
  }>;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 560;

  page.drawText(params.title, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
  });
  y -= 16;
  page.drawText(params.subtitle, { x: 40, y, size: 10, font });
  y -= 24;

  page.drawText("No", { x: 40, y, size: 9, font: fontBold });
  page.drawText("Fasilitas / Item", { x: 80, y, size: 9, font: fontBold });
  page.drawText("Lokasi / Detail", { x: 320, y, size: 9, font: fontBold });
  page.drawText("Availability %", { x: 560, y, size: 9, font: fontBold });
  y -= 14;

  for (const row of params.rows.slice(0, 40)) {
    if (y < 40) break;
    page.drawText(String(row.no ?? ""), { x: 40, y, size: 8, font });
    page.drawText((row.col2 ?? "").slice(0, 40), { x: 80, y, size: 8, font });
    page.drawText((row.col3 ?? row.col4 ?? "").slice(0, 40), {
      x: 320,
      y,
      size: 8,
      font,
    });
    page.drawText(
      row.availability != null ? row.availability.toFixed(2) : "—",
      { x: 560, y, size: 8, font }
    );
    y -= 12;
  }

  return doc.save();
}
