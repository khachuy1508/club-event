import { SignJWT, jwtVerify } from "jose";

function getQrSecret() {
  const secret = process.env.QR_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("QR_SECRET or AUTH_SECRET must be set");
  }
  return new TextEncoder().encode(secret);
}

export type StudentQrPayload = {
  sub: string;
  studentId: string;
  name: string;
};

export async function createStudentQrToken(payload: StudentQrPayload) {
  return new SignJWT({
    studentId: payload.studentId,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("18h")
    .sign(getQrSecret());
}

export async function verifyStudentQrToken(token: string) {
  const { payload } = await jwtVerify(token, getQrSecret());
  if (!payload.sub || typeof payload.studentId !== "string") {
    throw new Error("Invalid QR token");
  }
  return {
    userId: payload.sub,
    studentId: payload.studentId,
    name: typeof payload.name === "string" ? payload.name : "",
  };
}
