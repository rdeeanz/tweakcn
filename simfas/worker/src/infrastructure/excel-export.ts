/**
 * Generator Excel (.xlsx) — layout mendekati template Lap. Cabang & Rekap Regional.
 * Dijalankan di Workers (nodejs_compat + exceljs). Batasi scope per cabang/bulan (Free Tier CPU).
 */

import ExcelJS from "exceljs";
import type { ReportRow, RegionalRecapRow } from "@simfas/shared";

const MONTHS_ID = [
  "",
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

/**
 * Ekspor laporan Lap. Cabang (kolom 1–18).
 */
export async function exportBranchReportXlsx(params: {
  regionName: string;
  branchName: string;
  year: number;
  month: number;
  rows: ReportRow[];
}): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIMFAS";
  const ws = wb.addWorksheet("Lap. Cabang", {
    views: [{ state: "frozen", ySplit: 10 }],
  });

  // Header perusahaan
  ws.mergeCells("B2:R2");
  ws.getCell("B2").value = "LAPORAN AVAILABILITY FASILITAS PELABUHAN";
  ws.getCell("B2").font = { bold: true, size: 14 };
  ws.getCell("B2").alignment = { horizontal: "center" };

  ws.mergeCells("B3:R3");
  ws.getCell("B3").value = `PT PELABUHAN INDONESIA (PERSERO) ${params.regionName.toUpperCase()}`;
  ws.getCell("B3").alignment = { horizontal: "center" };

  ws.getCell("B4").value = "PELABUHAN";
  ws.getCell("D4").value = `: ${params.branchName.toUpperCase()}`;
  ws.getCell("B5").value = "PERIODIK MONITORING";
  ws.getCell("D5").value = `: ${MONTHS_ID[params.month]}`;
  ws.getCell("B6").value = "TAHUN";
  ws.getCell("D6").value = `: ${params.year}`;

  // Header kolom (baris 8–10)
  const headers = [
    "No.",
    "Fasilitas",
    "Nama Fasilitas",
    "Objek Fasilitas",
    "Panjang",
    "Lebar",
    "Luas",
    "Jumlah",
    "Konstruksi",
    "Fasilitas Tersedia",
    "Rusak Ringan",
    "Rusak Sedang",
    "Rusak Berat",
    "Fasilitas Siap Pakai",
    "Availability Objek Fasilitas",
    "Availability Fasilitas",
    "Operator",
    "Keterangan",
  ];
  const units = [
    "",
    "",
    "",
    "",
    "(m)",
    "(m)",
    "(m2)",
    "(unit)",
    "",
    "(unit/m/m2)",
    "(unit/m/m2)",
    "(unit/m/m2)",
    "(unit/m/m2)",
    "(unit/m/m2)",
    "%",
    "%",
    "",
    "",
  ];

  const headerRow = ws.getRow(8);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E2F3" },
    };
    cell.border = thinBorder();
  });

  const unitRow = ws.getRow(9);
  units.forEach((u, i) => {
    const cell = unitRow.getCell(i + 2);
    cell.value = u;
    cell.font = { size: 8, italic: true };
    cell.alignment = { horizontal: "center" };
    cell.border = thinBorder();
  });

  const numRow = ws.getRow(10);
  for (let i = 1; i <= 18; i++) {
    const cell = numRow.getCell(i + 1);
    cell.value = i;
    cell.font = { bold: true, size: 8 };
    cell.alignment = { horizontal: "center" };
    cell.border = thinBorder();
  }

  // Data mulai baris 11
  let r = 11;
  for (const row of params.rows) {
    const excelRow = ws.getRow(r);
    const values = [
      row.no,
      row.facilityCategory,
      row.facilityName,
      row.facilityObject,
      row.length,
      row.width,
      row.area,
      row.quantity,
      row.construction,
      row.availableQty,
      row.minorDamage,
      row.moderateDamage,
      row.severeDamage,
      row.readyQty,
      row.objectAvailabilityPct,
      row.facilityAvailabilityPct,
      row.operator,
      row.notes,
    ];
    values.forEach((v, i) => {
      const cell = excelRow.getCell(i + 2);
      cell.value = v ?? null;
      cell.font = {
        size: 9,
        bold: row.rowType === "header" || row.rowType === "subtotal" || row.rowType === "total",
      };
      cell.border = thinBorder();
      if (typeof v === "number" && (i === 14 || i === 15)) {
        cell.numFmt = "0.00";
      }
      if (row.rowType === "subtotal" || row.rowType === "total") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF2CC" },
        };
      }
      if (row.rowType === "header") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2EFDA" },
        };
      }
    });
    r += 1;
  }

  // Lebar kolom setara template
  const widths = [4, 6, 18, 22, 16, 10, 10, 10, 10, 14, 12, 12, 12, 12, 14, 14, 14, 12, 16];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

/**
 * Ekspor Rekap Regional.
 */
export async function exportRegionalRecapXlsx(params: {
  regionName: string;
  year: number;
  month: number;
  rows: RegionalRecapRow[];
}): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Regional");

  ws.mergeCells("A2:D2");
  ws.getCell("A2").value = "REKAPITULASI LAPORAN AVAILABILITY";
  ws.getCell("A2").font = { bold: true, size: 14 };
  ws.getCell("A2").alignment = { horizontal: "center" };

  ws.mergeCells("A3:D3");
  ws.getCell("A3").value = `PT PELABUHAN INDONESIA (PERSERO) ${params.regionName.toUpperCase()}`;
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:D4");
  ws.getCell("A4").value = `PERIODE BULAN ${MONTHS_ID[params.month]} ${params.year}`;
  ws.getCell("A4").alignment = { horizontal: "center" };

  const headers = ["No.", "Fasilitas", "Lokasi", "Availability (%)"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(6).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = thinBorder();
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E2F3" },
    };
  });
  [1, 2, 3, 4].forEach((n, i) => {
    const cell = ws.getRow(8).getCell(i + 1);
    cell.value = n;
    cell.border = thinBorder();
    cell.alignment = { horizontal: "center" };
  });

  let r = 9;
  for (const row of params.rows) {
    const excelRow = ws.getRow(r);
    excelRow.getCell(1).value = row.no;
    excelRow.getCell(2).value = row.facilityName;
    excelRow.getCell(3).value = row.location;
    excelRow.getCell(4).value = row.availabilityPct;
    if (typeof row.availabilityPct === "number") {
      excelRow.getCell(4).numFmt = "0.00";
    }
    for (let c = 1; c <= 4; c++) {
      excelRow.getCell(c).border = thinBorder();
      excelRow.getCell(c).font = {
        bold: row.rowType !== "item",
        size: 10,
      };
    }
    if (row.rowType === "subtotal" || row.rowType === "total") {
      for (let c = 1; c <= 4; c++) {
        excelRow.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF2CC" },
        };
      }
    }
    r += 1;
  }

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 24;
  ws.getColumn(4).width = 18;

  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
  return { top: s, left: s, bottom: s, right: s };
}
