import { NextResponse } from "next/server";
import { morselManifest } from "@/lib/tool-manifest";

export async function GET() {
  return NextResponse.json(morselManifest, {
    headers: { "Cache-Control": "public, max-age=3600" }
  });
}
