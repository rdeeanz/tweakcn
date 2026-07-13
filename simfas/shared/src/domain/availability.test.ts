/**
 * Unit test manual untuk formula availability (jalankan via node/tsx).
 * Validasi terhadap angka template Lap. Cabang:
 * Dermaga A: (100+98+90+97+100)/5 = 97
 * Jetty B: (100+90+90+100+100+100)/6 = 96.666...
 * Avail Dermaga = (97 + 96.666...)/2 = 96.8333...
 */

import {
  calcObjectAvailability,
  calcFacilityAvailability,
  calcCategoryAvailability,
  calcBranchOrRegionAvailability,
} from "./availability";

function assertClose(actual: number | null, expected: number, label: string) {
  if (actual == null) throw new Error(`${label}: got null`);
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${label} = ${actual}`);
}

// Objek
assertClose(calcObjectAvailability(3750, 3750), 100, "Pelat Lantai");
assertClose(calcObjectAvailability(24.5, 25), 98, "Fender");
assertClose(calcObjectAvailability(9, 10), 90, "Bolder");
assertClose(calcObjectAvailability(242.5, 250), 97, "Kanstin");
assertClose(calcObjectAvailability(450, 450), 100, "Rel Crane");

// Fasilitas Dermaga A
const dermagaA = calcFacilityAvailability([100, 98, 90, 97, 100]);
assertClose(dermagaA, 97, "Dermaga A");

// Jetty B
const jettyB = calcFacilityAvailability([100, 90, 90, 100, 100, 100]);
assertClose(jettyB, 96.66666666666667, "Jetty B");

// Kategori Dermaga
const dermagaCat = calcCategoryAvailability([dermagaA, jettyB]);
assertClose(dermagaCat, 96.83333333333334, "Availability Dermaga");

// Lapangan
const lapA = calcFacilityAvailability([99.5, 100, 91.66666666666666, 100]);
const lapB = calcFacilityAvailability([100]);
const lapCat = calcCategoryAvailability([lapA, lapB]);
assertClose(lapCat, 98.89583333333333, "Availability Lapangan");

// Gudang
const gudang = calcFacilityAvailability([100, 100, 100, 91.25]);
assertClose(gudang, 97.8125, "Gudang A / Availability Gudang");

// Terminal
const term = calcFacilityAvailability([100, 100, 100, 100]);
assertClose(term, 100, "Terminal");

// Overall cabang
const overall = calcBranchOrRegionAvailability([
  dermagaCat,
  lapCat,
  gudang,
  term,
]);
assertClose(overall, 98.38541666666667, "Availability Cabang/Regional");

console.log("\nAll availability formula tests passed against template Excel.");
