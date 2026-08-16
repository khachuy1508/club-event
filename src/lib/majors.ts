export const USTH_MAJORS = [
  "Information and Communication Technology",
  "Biotechnology",
  "Space",
  "Pharmacy",
  "Food Technology",
  "Aeronautics",
  "Chemistry",
  "Applied Mathematics",
  "Advanced Materials",
  "Cybersecurity",
  "Data Science",
  "Other",
] as const;

export type UsthMajor = (typeof USTH_MAJORS)[number];

export function isUsthMajor(value: string): value is UsthMajor {
  return (USTH_MAJORS as readonly string[]).includes(value);
}
