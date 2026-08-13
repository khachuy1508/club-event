export const ADMIN_TABS = [
  { id: "best", label: "Best Club" },
  { id: "clubs", label: "Clubs" },
  { id: "staff", label: "Tạo staff" },
  { id: "students", label: "Sinh viên" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function parseAdminTab(value: string | undefined): AdminTabId {
  if (value === "clubs" || value === "staff" || value === "students" || value === "best") {
    return value;
  }
  return "best";
}
