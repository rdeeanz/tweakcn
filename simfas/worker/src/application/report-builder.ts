/**
 * Use-case: bangun baris laporan Lap. Cabang & Rekap Regional.
 * Availability dihitung dari shared domain (bukan hardcode).
 */

import {
  calcObjectAvailability,
  calcFacilityAvailability,
  calcCategoryAvailability,
  calcBranchOrRegionAvailability,
  type ReportRow,
  type RegionalRecapRow,
} from "@simfas/shared";

/** Baris mentah dari query join master + object_records. */
export interface RawRecordRow {
  categoryId: string;
  categoryName: string;
  categorySort: number;
  facilityId: string;
  facilityName: string;
  facilityOperator: string | null;
  facilityConstruction: string | null;
  objectId: string;
  objectName: string;
  length: number | null;
  width: number | null;
  area: number | null;
  quantity: number | null;
  constructionType: string | null;
  availableQty: number;
  minorDamage: number;
  moderateDamage: number;
  severeDamage: number;
  readyQty: number;
  operator: string | null;
  notes: string | null;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * Bangun tabel Lap. Cabang (kolom 1–18) mirip Excel template.
 * Struktur: header kategori → baris fasilitas + objek → subtotal availability kategori → total.
 */
export function buildBranchReportRows(raw: RawRecordRow[]): {
  rows: ReportRow[];
  categoryAvails: Array<{ name: string; pct: number | null }>;
  overall: number | null;
} {
  // Group by category → facility → objects
  const categories = new Map<
    string,
    {
      id: string;
      name: string;
      sort: number;
      facilities: Map<
        string,
        {
          id: string;
          name: string;
          operator: string | null;
          construction: string | null;
          objects: RawRecordRow[];
        }
      >;
    }
  >();

  for (const r of raw) {
    let cat = categories.get(r.categoryId);
    if (!cat) {
      cat = {
        id: r.categoryId,
        name: r.categoryName,
        sort: r.categorySort,
        facilities: new Map(),
      };
      categories.set(r.categoryId, cat);
    }
    let fac = cat.facilities.get(r.facilityId);
    if (!fac) {
      fac = {
        id: r.facilityId,
        name: r.facilityName,
        operator: r.facilityOperator,
        construction: r.facilityConstruction,
        objects: [],
      };
      cat.facilities.set(r.facilityId, fac);
    }
    fac.objects.push(r);
  }

  const sortedCats = [...categories.values()].sort((a, b) => a.sort - b.sort);
  const rows: ReportRow[] = [];
  const categoryAvails: Array<{ name: string; pct: number | null }> = [];

  sortedCats.forEach((cat, catIdx) => {
    // Header kategori (I, II, III, ...)
    rows.push({
      no: ROMAN[catIdx] ?? String(catIdx + 1),
      facilityCategory: cat.name,
      facilityName: null,
      facilityObject: null,
      length: null,
      width: null,
      area: null,
      quantity: null,
      construction: null,
      availableQty: null,
      minorDamage: null,
      moderateDamage: null,
      severeDamage: null,
      readyQty: null,
      objectAvailabilityPct: null,
      facilityAvailabilityPct: null,
      operator: null,
      notes: null,
      rowType: "header",
    });

    const facilityPcts: Array<number | null> = [];
    let facNo = 0;

    for (const fac of cat.facilities.values()) {
      facNo += 1;
      // Hitung availability tiap objek lalu rata-rata fasilitas
      const objectPcts = fac.objects.map((o) =>
        calcObjectAvailability(o.readyQty, o.availableQty)
      );
      const facilityPct = calcFacilityAvailability(objectPcts);
      facilityPcts.push(facilityPct);

      // Baris fasilitas (kolom No, Fasilitas, Nama, Konstruksi, Avail Fasilitas, Operator)
      rows.push({
        no: facNo,
        facilityCategory: cat.name,
        facilityName: fac.name,
        facilityObject: null,
        length: null,
        width: null,
        area: null,
        quantity: null,
        construction: fac.construction,
        availableQty: null,
        minorDamage: null,
        moderateDamage: null,
        severeDamage: null,
        readyQty: null,
        objectAvailabilityPct: null,
        facilityAvailabilityPct: facilityPct,
        operator: fac.operator,
        notes: null,
        rowType: "facility",
      });

      // Baris objek di bawah fasilitas
      for (const o of fac.objects) {
        const objPct = calcObjectAvailability(o.readyQty, o.availableQty);
        rows.push({
          no: null,
          facilityCategory: null,
          facilityName: null,
          facilityObject: o.objectName,
          length: o.length,
          width: o.width,
          area: o.area,
          quantity: o.quantity,
          construction: o.constructionType,
          availableQty: o.availableQty,
          minorDamage: o.minorDamage,
          moderateDamage: o.moderateDamage,
          severeDamage: o.severeDamage,
          readyQty: o.readyQty,
          objectAvailabilityPct: objPct,
          facilityAvailabilityPct: null,
          operator: o.operator,
          notes: o.notes,
          rowType: "object",
        });
      }
    }

    const catPct = calcCategoryAvailability(facilityPcts);
    categoryAvails.push({ name: cat.name, pct: catPct });

    // Subtotal "Availability {Kategori}"
    rows.push({
      no: null,
      facilityCategory: `Availability ${titleCaseCategory(cat.name)}`,
      facilityName: null,
      facilityObject: null,
      length: null,
      width: null,
      area: null,
      quantity: null,
      construction: null,
      availableQty: null,
      minorDamage: null,
      moderateDamage: null,
      severeDamage: null,
      readyQty: null,
      objectAvailabilityPct: null,
      facilityAvailabilityPct: catPct,
      operator: null,
      notes: null,
      rowType: "subtotal",
    });
  });

  const overall = calcBranchOrRegionAvailability(categoryAvails.map((c) => c.pct));

  rows.push({
    no: null,
    facilityCategory: "Availability Fasilitas Pelabuhan",
    facilityName: null,
    facilityObject: null,
    length: null,
    width: null,
    area: null,
    quantity: null,
    construction: null,
    availableQty: null,
    minorDamage: null,
    moderateDamage: null,
    severeDamage: null,
    readyQty: null,
    objectAvailabilityPct: null,
    facilityAvailabilityPct: overall,
    operator: null,
    notes: null,
    rowType: "total",
  });

  return { rows, categoryAvails, overall };
}

function titleCaseCategory(name: string): string {
  // Tampilkan label subtotal mirip Excel
  return name
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Bangun rekap regional: daftar fasilitas per kategori + lokasi cabang + avg kategori + overall.
 */
export function buildRegionalRecapRows(
  items: Array<{
    categoryName: string;
    categorySort: number;
    facilityName: string;
    branchName: string;
    facilityAvailabilityPct: number | null;
  }>
): { rows: RegionalRecapRow[]; overall: number | null } {
  const byCat = new Map<
    string,
    {
      sort: number;
      items: Array<{ facilityName: string; location: string; pct: number | null }>;
    }
  >();

  for (const it of items) {
    let g = byCat.get(it.categoryName);
    if (!g) {
      g = { sort: it.categorySort, items: [] };
      byCat.set(it.categoryName, g);
    }
    g.items.push({
      facilityName: it.facilityName,
      location: it.branchName,
      pct: it.facilityAvailabilityPct,
    });
  }

  const sorted = [...byCat.entries()].sort((a, b) => a[1].sort - b[1].sort);
  const rows: RegionalRecapRow[] = [];
  const catPcts: Array<number | null> = [];

  sorted.forEach(([catName, g], idx) => {
    rows.push({
      no: ROMAN[idx] ?? String(idx + 1),
      facilityName: catName,
      location: null,
      availabilityPct: null,
      rowType: "category",
    });

    let n = 0;
    const facPcts: Array<number | null> = [];
    for (const item of g.items) {
      n += 1;
      facPcts.push(item.pct);
      rows.push({
        no: n,
        facilityName: item.facilityName,
        location: item.location,
        availabilityPct: item.pct,
        rowType: "item",
      });
    }

    const catPct = calcCategoryAvailability(facPcts);
    catPcts.push(catPct);
    rows.push({
      no: null,
      facilityName: `Availability ${titleCaseCategory(catName)}`,
      location: null,
      availabilityPct: catPct,
      rowType: "subtotal",
    });
  });

  const overall = calcBranchOrRegionAvailability(catPcts);
  rows.push({
    no: null,
    facilityName: "Availability Fasilitas Pelabuhan Regional",
    location: null,
    availabilityPct: overall,
    rowType: "total",
  });

  return { rows, overall };
}
