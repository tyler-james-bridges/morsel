import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Unlocks are recorded by the x402-protected recipe content endpoint after payment verification.",
    },
    { status: 410 },
  );
}
