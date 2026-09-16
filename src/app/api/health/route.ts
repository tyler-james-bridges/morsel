import { NextResponse } from "next/server";

function envConfigured(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "morsel",
      timestamp: new Date().toISOString(),
      checks: {
        databaseUrl: envConfigured("DATABASE_URL"),
        walletConnectProjectId: envConfigured("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"),
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
