// Run after deploying the image and targeted import:
// vercel env run -e production -- node scripts/publish-blueberry-muffins.mjs
const origin = "https://morsel.0x402.sh";
const secret = process.env.MORSEL_SEED_ADMIN_SECRET;
if (!secret) throw new Error("MORSEL_SEED_ADMIN_SECRET is required");

const image = await fetch(`${origin}/images/recipes/blueberry-muffins.png`, { method: "HEAD" });
if (!image.ok || !image.headers.get("content-type")?.startsWith("image/")) {
  throw new Error("Deploy the muffin image before publishing the recipe");
}

const response = await fetch(`${origin}/api/seed?recipe=blueberry-muffins`, {
  method: "POST",
  headers: { "x-morsel-seed-secret": secret },
});
if (!response.ok) throw new Error(`Recipe import failed (${response.status})`);
const result = await response.json();
if (result.slug !== "blueberry-muffins" || !result.id) {
  throw new Error("Unexpected import response; verify the deployed route before retrying");
}
console.log(JSON.stringify({ ...result, url: `${origin}/tmoney145/blueberry-muffins` }));
