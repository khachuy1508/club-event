import { z } from "zod";
import { isUsthMajor } from "@/lib/majors";

/** Common Vietnamese university student ID: letters/digits, 6–12 chars */
export const studentIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, "MSSV phải gồm 6–12 ký tự chữ/số");

export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu tối thiểu 6 ký tự");

export const staffUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username tối thiểu 3 ký tự")
  .max(32, "Username tối đa 32 ký tự")
  .refine((value) => !/\s/.test(value), "Username không được chứa khoảng trắng")
  .regex(
    /^[a-z0-9._-]+$/,
    "Username chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang",
  );

export const registerSchema = z
  .object({
    studentId: studentIdSchema,
    name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(80),
    major: z.string().refine(isUsthMajor, "Chọn ngành học"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const opinionSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Nhập ý kiến")
    .max(300, "Tối đa 300 ký tự"),
});

export const MAX_LOGO_BYTES = 500 * 1024;
export const LOGO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Nhập MSSV hoặc username"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

export const createStaffSchema = z
  .object({
    clubId: z.string().min(1, "Chọn club"),
    username: staffUsernameSchema,
    name: z.string().trim().min(2, "Tên hiển thị tối thiểu 2 ký tự").max(80),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const resetStaffPasswordSchema = z
  .object({
    userId: z.string().min(1, "Chọn staff"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const MAX_CLUBS = 20;
export const MIN_CHECKINS_TO_VOTE = 3;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
