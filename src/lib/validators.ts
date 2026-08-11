import { z } from "zod";

/** Common Vietnamese university student ID: letters/digits, 6–12 chars */
export const studentIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, "MSSV phải gồm 6–12 ký tự chữ/số");

export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu tối thiểu 6 ký tự");

export const registerSchema = z.object({
  studentId: studentIdSchema,
  name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(80),
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Nhập MSSV hoặc username"),
  password: z.string().min(1, "Nhập mật khẩu"),
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
