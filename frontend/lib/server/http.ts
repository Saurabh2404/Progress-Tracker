import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  console.error(error);
  return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
}

export function validationError(message?: string) {
  return NextResponse.json({ message: message || "Invalid request" }, { status: 400 });
}
