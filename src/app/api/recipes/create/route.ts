import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { recipes, creators } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  await getDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = [
    "creatorAddress",
    "creatorName",
    "title",
    "description",
    "imageUrl",
    "price",
    "cuisine",
    "mealType",
    "prepTime",
    "cookTime",
    "servings",
    "ingredients",
    "steps",
  ];

  const missing = required.filter((field) => !body[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const creatorAddress = body.creatorAddress as string;
  const creatorName = body.creatorName as string;

  // Auto-create creator if they don't exist
  const existingCreator = (
    await db
      .select()
      .from(creators)
      .where(eq(creators.address, creatorAddress))
      .limit(1)
  )[0];

  if (!existingCreator) {
    const creatorSlug = creatorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await db.insert(creators).values({
      address: creatorAddress,
      name: creatorName,
      slug: creatorSlug,
      bio: (body.creatorBio as string) ?? "",
      avatarUrl: (body.creatorAvatarUrl as string) ?? "",
    });
  }

  const id = uuid();

  const titleStr = body.title as string;
  const slug =
    (body.slug as string) ||
    titleStr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  await db.insert(recipes).values({
    id,
    creatorAddress,
    title: titleStr,
    slug,
    introContent: (body.introContent as string) ?? "",
    isFree: body.isFree ? 1 : 0,
    publishedAt: new Date(),
    description: body.description as string,
    imageUrl: body.imageUrl as string,
    price:
      typeof body.price === "string"
        ? parseFloat((body.price as string).replace("$", ""))
        : (body.price as number),
    cuisine: body.cuisine as string,
    mealType: body.mealType as string,
    dietaryTags: Array.isArray(body.dietaryTags)
      ? JSON.stringify(body.dietaryTags)
      : ((body.dietaryTags as string) ?? "[]"),
    prepTime: body.prepTime as number,
    cookTime: body.cookTime as number,
    servings: body.servings as number,
    difficulty: (body.difficulty as string) ?? "medium",
    ingredients: Array.isArray(body.ingredients)
      ? JSON.stringify(body.ingredients)
      : (body.ingredients as string),
    steps: Array.isArray(body.steps)
      ? JSON.stringify(body.steps)
      : (body.steps as string),
    notes: (body.notes as string) ?? "",
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
