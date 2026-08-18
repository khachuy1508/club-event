export const USTH_MAJORS = [
  "ICT",
  "CS",
  "DS",
  "ATE",
  "MET",
  "EER",
  "AE",
  "EPE/SIC",
  "AMS",
  "BIT (PMAB)",
  "MST",
  "FST",
  "CHEM",
  "MAT",
  "AES",
  "SST/SA",
  "ICT DD",
  "BIT DD",
  "CH DD",
  "MAT (Master)",
  "WEO/AES (Master)",
  "ICT (Master)",
  "FSQA (Master)",
  "BIO (Master)",
  "SA (Master)",
  "AMSN (Master)",
  "EN (PHD)",
  "AMSN (PHD)",
  "SA (PHD)",
  "AES/WEO (PHD)",
  "CHEM (PHD)",
  "ICT (PHD)",
  "PMAB (PHD)",
] as const;

export type UsthMajor = (typeof USTH_MAJORS)[number];

export function isUsthMajor(value: string): value is UsthMajor {
  return (USTH_MAJORS as readonly string[]).includes(value);
}
