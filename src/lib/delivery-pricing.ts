// Pure delivery pricing rules (shared by server quote and tests).
export const LOCAL_MAX_FEE = 350; // cap inside the store's wilaya
export const INTER_MAX_FEE = 1800; // cap between wilayas
export const INTER_FULL_KM = 1500; // distance at which the inter-wilaya cap is reached

/** Approximate capital coordinates of the 58 wilayas, same order as WILAYAS. */
export const WILAYA_CENTERS: Record<string, [number, number]> = {
  Adrar: [27.874, -0.294], Chlef: [36.165, 1.334], Laghouat: [33.8, 2.865], "Oum El Bouaghi": [35.875, 7.114],
  Batna: [35.556, 6.174], "Béjaïa": [36.751, 5.056], Biskra: [34.851, 5.728], "Béchar": [31.617, -2.216],
  Blida: [36.47, 2.828], Bouira: [36.375, 3.902], Tamanrasset: [22.785, 5.523], "Tébessa": [35.404, 8.124],
  Tlemcen: [34.878, -1.315], Tiaret: [35.371, 1.317], "Tizi Ouzou": [36.712, 4.046], Alger: [36.753, 3.059],
  Djelfa: [34.673, 3.263], Jijel: [36.82, 5.766], "Sétif": [36.19, 5.414], "Saïda": [34.83, 0.152],
  Skikda: [36.876, 6.909], "Sidi Bel Abbès": [35.19, -0.631], Annaba: [36.9, 7.766], Guelma: [36.462, 7.426],
  Constantine: [36.365, 6.615], "Médéa": [36.264, 2.754], Mostaganem: [35.931, 0.089], "M'Sila": [35.705, 4.541],
  Mascara: [35.397, 0.14], Ouargla: [31.949, 5.325], Oran: [35.697, -0.633], "El Bayadh": [33.683, 1.02],
  Illizi: [26.483, 8.467], "Bordj Bou Arréridj": [36.073, 4.761], "Boumerdès": [36.766, 3.477], "El Tarf": [36.767, 8.314],
  Tindouf: [27.671, -8.147], Tissemsilt: [35.607, 1.811], "El Oued": [33.368, 6.867], Khenchela: [35.436, 7.143],
  "Souk Ahras": [36.286, 7.951], Tipaza: [36.589, 2.448], Mila: [36.45, 6.264], "Aïn Defla": [36.264, 1.968],
  "Naâma": [33.267, -0.317], "Aïn Témouchent": [35.297, -1.14], "Ghardaïa": [32.49, 3.674], Relizane: [35.737, 0.556],
  Timimoun: [29.258, 0.231], "Bordj Badji Mokhtar": [21.328, 0.955], "Ouled Djellal": [34.433, 5.067], "Béni Abbès": [30.131, -2.17],
  "In Salah": [27.197, 2.483], "In Guezzam": [19.567, 5.767], Touggourt: [33.105, 6.058], Djanet: [24.555, 9.485],
  "El M'Ghair": [33.95, 5.917], "El Meniaa": [30.583, 2.883],
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Inside the store's wilaya: grows with distance, never above 350 DA. */
export function localFee(km: number, minFee = 150, fullKm = 16) {
  const raw = minFee + (LOCAL_MAX_FEE - minFee) * (Math.max(0, km) / Math.max(1, fullKm));
  return Math.min(LOCAL_MAX_FEE, round10(raw));
}

/** Between wilayas: starts at 350 DA and grows with distance up to 1800 DA. */
export function interWilayaFee(km: number) {
  const ratio = Math.min(1, Math.max(0, km) / INTER_FULL_KM);
  return Math.min(INTER_MAX_FEE, round10(LOCAL_MAX_FEE + (INTER_MAX_FEE - LOCAL_MAX_FEE) * ratio));
}
