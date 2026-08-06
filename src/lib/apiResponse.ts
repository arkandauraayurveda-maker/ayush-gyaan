import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  remainingTokens?: number;
  reply?: string;
}

export function apiSuccess<T>(data?: T, extraProps?: Record<string, any>, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined ? { data } : {}),
      ...(extraProps || {})
    },
    { status }
  );
}

export function apiError(message: string, status: number = 400, extraProps?: Record<string, any>) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(extraProps || {})
    },
    { status }
  );
}

export function apiUnauthorized(message: string = "Unauthorized Access") {
  return apiError(message, 401);
}

export function apiForbidden(message: string = "Access Forbidden") {
  return apiError(message, 403);
}

export function apiRateLimited(message: string = "Too Many Requests. Please wait.", retrySec?: number) {
  return apiError(message, 429, retrySec ? { retryAfterSeconds: retrySec } : undefined);
}
