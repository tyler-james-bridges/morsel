import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db, { getDb } from "@/lib/db";
import { subscriptions, creators } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  await getDb();

  let body: { creatorAddress?: string; email?: string; walletAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { creatorAddress, email, walletAddress } = body;

  if (!creatorAddress) {
    return NextResponse.json(
      { error: "creatorAddress is required" },
      { status: 400 },
    );
  }

  if (!email && !walletAddress) {
    return NextResponse.json(
      { error: "At least one of email or walletAddress is required" },
      { status: 400 },
    );
  }

  // Verify creator exists
  const creator = (
    await db
      .select()
      .from(creators)
      .where(eq(creators.address, creatorAddress))
      .limit(1)
  )[0];

  if (!creator) {
    return NextResponse.json(
      { error: "Creator not found" },
      { status: 404 },
    );
  }

  // Duplicate detection: same email+creator or same wallet+creator
  if (email) {
    const existingEmail = (
      await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.creatorAddress, creatorAddress),
            eq(subscriptions.email, email),
          ),
        )
        .limit(1)
    )[0];

    if (existingEmail) {
      return NextResponse.json(
        { error: "Already subscribed with this email" },
        { status: 409 },
      );
    }
  }

  if (walletAddress) {
    const existingWallet = (
      await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.creatorAddress, creatorAddress),
            eq(subscriptions.walletAddress, walletAddress),
          ),
        )
        .limit(1)
    )[0];

    if (existingWallet) {
      return NextResponse.json(
        { error: "Already subscribed with this wallet" },
        { status: 409 },
      );
    }
  }

  const id = uuidv4();
  await db.insert(subscriptions).values({
    id,
    creatorAddress,
    email: email || null,
    walletAddress: walletAddress || null,
  });

  return NextResponse.json(
    { id, creatorAddress, email: email || null, walletAddress: walletAddress || null },
    { status: 201 },
  );
}
