import { NextResponse } from "next/server";
import { hasTypesafeKey } from "@/lib/jev";

export async function GET() {
  return NextResponse.json({
    hasTypesafe: hasTypesafeKey(),
    hasGroq: Boolean(process.env.GROQ_API_KEY),
  });
}
