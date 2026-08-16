export type ClubCatalogItem = {
  nameVi: string;
  nameEn: string;
  code: string | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export const CLUBS_CATALOG: ClubCatalogItem[] = [
  {
    nameVi: "Câu lạc bộ Hàng không USTH",
    nameEn: "USTH Aviation Society",
    code: "UAS",
  },
  { nameVi: "CLB nhảy USTH", nameEn: "FrancDanc", code: "FRD" },
  {
    nameVi: "Câu lạc bộ AI USTH",
    nameEn: "USTH Artificial Intelligence",
    code: "UAI",
  },
  { nameVi: "Câu lạc bộ Môi trường", nameEn: "Eco Club", code: "Eco Club" },
  {
    nameVi: "Đội Thanh Niên Xung Kích USTH",
    nameEn: "USTH Youth Pioneer Team",
    code: "UYP",
  },
  { nameVi: "Câu lạc bộ Cờ vua USTH", nameEn: "USTH Chess Hub", code: "UCH" },
  { nameVi: "CLB Vật Lý Thiên Văn", nameEn: "Astrophysics Club", code: "VLTV" },
  { nameVi: "Câu lạc bộ Tâm lý USTH", nameEn: "La Lisière", code: null },
  {
    nameVi: "CLB Sách và Hành động Trường Đại học Khoa học và Công nghệ Hà Nội - USTH",
    nameEn: "Book and Action USTH",
    code: "BnA USTH",
  },
  {
    nameVi: "CLB Bóng Rổ trường USTH",
    nameEn: "USTH Basketball Club",
    code: "UBC",
  },
  {
    nameVi: "CLB Ngoại Ngữ",
    nameEn: "USTH Global Language Club",
    code: "GLC",
  },
  { nameVi: "FabLab USTH", nameEn: "FabLab USTH", code: "FabLab" },
  {
    nameVi: "Câu lạc bộ cầu lông USTH",
    nameEn: "USTH Badminton Club",
    code: "UBC",
  },
  {
    nameVi: "Câu Lạc Bộ Hỗ Trợ Học Tập",
    nameEn: "Learning Support",
    code: "LS",
  },
  {
    nameVi: "CLB An ninh mạng",
    nameEn: "USTH Cyber Security",
    code: "UCS",
  },
  {
    nameVi: "CLB Bóng Chuyền",
    nameEn: "USTH VOLLEYBALL",
    code: "USTH VOLLEYBALL",
  },
  { nameVi: "Câu lạc bộ Khởi nghiệp USTH", nameEn: "UStart USTH", code: "US" },
  {
    nameVi: "Câu Lạc Bộ thể thao Điện tử Trường Đại học Khoa học và Công nghệ Hà Nội",
    nameEn: "Vietnam France Esport Club",
    code: "VFEC",
  },
  { nameVi: "CLB tình nguyện USTH", nameEn: "Youth Ranger", code: "YR" },
  {
    nameVi: "CLB marketing USTH",
    nameEn: "USTH Marketing Club",
    code: "MAC",
  },
];

export function catalogSlug(item: ClubCatalogItem) {
  return slugify(item.nameEn) || `club-${item.code ?? "item"}`;
}
