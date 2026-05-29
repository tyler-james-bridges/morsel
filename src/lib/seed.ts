import db from "./db";
import { creators, recipes } from "./schema";
import { createHash } from "crypto";
import { usdToUsdcAtomic } from "./money";

// Deterministic ID from title so IDs stay consistent across cold starts
function stableId(title: string): string {
  const hash = createHash("sha256").update(title).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

const SAMPLE_CREATORS = [
  {
    address: "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495",
    name: "Tyler",
    bio: "Software engineer who treats cooking like code. Precise, tested, no shortcuts.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    slug: "tyler",
    bannerUrl: "",
    socialLinks: JSON.stringify({ twitter: "https://x.com/tmoney_145" }),
  },
];

const SAMPLE_RECIPES = [
  {
    creatorAddress: "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495",
    title: "Lemon Blueberry Cake",
    description: "A show-stopping layer cake with fresh blueberries, bright lemon zest, and tangy cream cheese frosting. The kind of cake that ends arguments at potlucks.",
    slug: "lemon-blueberry-cake",
    introContent: "I brought this cake to a family potluck where two aunts had been silently feuding for six months. By the time the second layer was gone, they were sharing the last slice and laughing. I am not saying this cake has healing powers, but I am not not saying that either.",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop",
    price: 0.75,
    cuisine: "american",
    mealType: "dessert",
    dietaryTags: JSON.stringify(["vegetarian"]),
    prepTime: 30,
    cookTime: 35,
    servings: 12,
    difficulty: "medium",
    ingredients: JSON.stringify([
      "3 1/8 cups cake flour",
      "1 3/4 cups granulated sugar",
      "2 tsp baking powder",
      "1/2 tsp baking soda",
      "1/2 tsp salt",
      "2 1/4 cups unsalted butter (total)",
      "4 large eggs",
      "3/4 cup buttermilk",
      "1/3 cup lemon juice",
      "2 1/2 tsp freshly squeezed lemon juice",
      "2 tbsp lemon zest",
      "2 tsp vanilla extract",
      "2 cups fresh blueberries",
      "20 oz brick style cream cheese",
      "7 1/2 cups powdered sugar",
      "2 tbsp whipping cream",
    ]),
    steps: JSON.stringify([
      "Preheat oven to 350F. Grease and flour two 9-inch round cake pans, line bottoms with parchment.",
      "Whisk together cake flour, granulated sugar, baking powder, baking soda, and salt.",
      "Cut in softened butter and mix until the mixture resembles coarse crumbs.",
      "Whisk eggs, buttermilk, lemon juice, lemon zest, and vanilla extract in a separate bowl.",
      "Pour wet into dry and fold until just combined. Do not overmix.",
      "Gently fold in blueberries. Divide batter evenly between pans.",
      "Bake 30-35 minutes until a toothpick comes out clean. Cool 10 minutes in pans, then turn out onto wire racks.",
      "Make frosting: Beat cream cheese and remaining softened butter until smooth and fluffy.",
      "Gradually add powdered sugar, one cup at a time, beating on low.",
      "Add whipping cream and beat on medium-high until light and spreadable.",
      "Place first layer on stand, frost generously, top with second layer.",
      "Frost top and sides. Garnish with blueberries and lemon zest curls.",
    ]),
    notes: "Toss blueberries in a tablespoon of flour before folding in to prevent sinking. Butter and cream cheese must be room temp for smooth frosting.",
  },
  {
    creatorAddress: "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495",
    title: "Perfect Chocolate Chip Cookies",
    description: "Crunchy outside, soft and chewy inside. Brown butter is the move. Makes 8 big cookies that hit different.",
    slug: "perfect-chocolate-chip-cookies",
    introContent: "This is the cookie recipe I keep coming back to when I want to impress someone but only have thirty minutes. Eight big cookies, brown butter, finishing salt. No mixer required, no overnight rest. Just a bowl, a pan, and the smell that makes everyone in the house wander into the kitchen.",
    isFree: 1,
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop",
    price: 0.25,
    cuisine: "american",
    mealType: "dessert",
    dietaryTags: JSON.stringify(["vegetarian"]),
    prepTime: 15,
    cookTime: 12,
    servings: 8,
    difficulty: "easy",
    ingredients: JSON.stringify([
      "8 tbsp high-quality butter",
      "1/2 cup white sugar",
      "1/2 cup dark brown sugar",
      "1 large egg",
      "1 tsp vanilla",
      "1/2 tsp kosher salt",
      "1/2 tsp baking soda",
      "1 1/3 cups all-purpose flour",
      "1 cup large chocolate chips",
      "Finishing salt for topping",
    ]),
    steps: JSON.stringify([
      "Melt butter in a light-colored pan over medium heat. Swirl constantly until golden with brown flecks and nutty aroma. Remove immediately.",
      "Combine white sugar, dark brown sugar, browned butter, egg, vanilla, salt, and baking soda in a large bowl.",
      "Mix until ribbon-like consistency - thick, smooth, slightly glossy.",
      "Add flour and mix until just combined.",
      "Fold in chocolate chips.",
      "Scoop into 8 large balls on parchment-lined baking sheet.",
      "Sprinkle each with finishing salt.",
      "Chill 10 minutes or bake immediately at 350F for 10-12 minutes.",
      "Edges should be set and golden, centers slightly underdone.",
      "Cool on sheet 5 minutes. Carryover heat finishes the centers.",
    ]),
    notes: "Brown butter is non-negotiable. Use a light-colored pan so you can see it browning. If dough feels loose, chill it longer.",
  },
  {
    creatorAddress: "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495",
    title: "White Chocolate Macadamia Nut Cookies",
    description: "Buttery, nutty, with pools of melted white chocolate. The cookie that proves white chocolate deserves respect.",
    slug: "white-chocolate-macadamia-nut-cookies",
    introContent: "White chocolate gets a bad reputation and honestly, most of the time it deserves it. But when you pair it with buttery macadamia nuts and use egg yolks only for extra richness, something clicks. This is the cookie that made a white chocolate skeptic out of me and turned me into an evangelist.",
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&h=600&fit=crop",
    price: 0.50,
    cuisine: "american",
    mealType: "dessert",
    dietaryTags: JSON.stringify(["vegetarian"]),
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    difficulty: "easy",
    ingredients: JSON.stringify([
      "1 3/4 cups all-purpose flour",
      "1/2 tsp baking powder",
      "1/2 tsp baking soda",
      "1/2 tsp salt",
      "3/4 cup unsalted butter, softened",
      "3/4 cup light brown sugar, packed",
      "1/4 cup granulated white sugar",
      "2 egg yolks",
      "1 tbsp vanilla",
      "1 heaping cup white chocolate chips",
      "1 cup macadamia nuts, roughly chopped",
      "Flaky sea salt for topping",
    ]),
    steps: JSON.stringify([
      "Preheat oven to 350F. Line baking sheets with parchment.",
      "Whisk flour, baking powder, baking soda, and salt. Set aside.",
      "Beat softened butter, brown sugar, and white sugar until light and fluffy, about 3 minutes.",
      "Add egg yolks and vanilla. Beat until smooth.",
      "Add flour mixture and mix on low until just combined.",
      "Fold in white chocolate chips and macadamia nuts by hand.",
      "Scoop rounded tablespoons onto sheets, 2 inches apart.",
      "Bake 10-12 minutes until edges are golden, centers still soft.",
      "Sprinkle with flaky sea salt immediately out of the oven.",
      "Cool on sheet 5 minutes before transferring to wire rack.",
    ]),
    notes: "Egg yolks only (no whites) makes these extra rich and chewy. Roughly chop the macadamias for a mix of chunks and pieces. Flaky salt on top is mandatory.",
  },
];

export async function seedDatabase(options: { freeOnly?: boolean } = {}) {
  // Check if already seeded
  const existing = await db.select().from(creators);
  if (existing.length > 0) {
    return { message: "Database already seeded", count: existing.length };
  }

  // Insert creators
  for (const creator of SAMPLE_CREATORS) {
    await db.insert(creators).values(creator);
  }

  // Insert recipes
  for (const recipe of SAMPLE_RECIPES) {
    await db.insert(recipes).values({
      id: stableId(recipe.title),
      ...recipe,
      priceUsdcAtomic: usdToUsdcAtomic(recipe.price),
      isFree: options.freeOnly ? 1 : (recipe.isFree ?? 0),
    });
  }

  return {
    message: "Database seeded",
    creators: SAMPLE_CREATORS.length,
    recipes: SAMPLE_RECIPES.length,
  };
}
