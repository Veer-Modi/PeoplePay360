import { getServerSession } from "next-auth/next";
import { authOptions } from "@/modules/auth/authOptions";
import { NextResponse } from "next/server";

export type AuthResult =
  | { error: string; status: number; session?: never }
  | { session: any; status: number; error?: never };

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }
  return { session, status: 200 };
}

export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const session = auth.session;
  
  if (!session?.user?.roleName || !allowedRoles.includes(session.user.roleName)) {
    return { error: "Forbidden", status: 403 };
  }
  
  return { session, status: 200 };
}

export function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
