export const ADMIN_TABS = [
  { id: "best", label: "Best Club" },
  { id: "clubs", label: "Clubs" },
  { id: "hours", label: "Khung giờ" },
  { id: "staff", label: "Tạo staff" },
  { id: "students", label: "Sinh viên" },
  { id: "opinions", label: "Opinions" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function parseAdminTab(value: string | undefined): AdminTabId {
  if (
    value === "clubs" ||
    value === "hours" ||
    value === "staff" ||
    value === "students" ||
    value === "best" ||
    value === "opinions"
  ) {
    return value;
  }
  return "best";
}
