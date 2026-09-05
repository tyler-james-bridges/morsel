import type { Recipe } from "@/lib/types";

// Keep this draft independent of the database so reviewing it never publishes it.
export const blueberryMuffinsDraft = {
  title: "Blueberry Muffins",
  slug: "blueberry-muffins",
  description: "Fresh blueberries. Buttery cinnamon crumbs. Breakfast, sorted.",
  imageUrl: "/images/recipes/blueberry-muffins.png",
  cuisine: "american",
  mealType: "breakfast",
  dietaryTags: ["vegetarian"],
  prepTime: 15,
  cookTime: 20,
  servings: 8,
  difficulty: "easy",
  ingredients: [
    "1½ cups all-purpose flour",
    "¾ cup white sugar",
    "2 tsp baking powder",
    "½ tsp salt",
    "⅓ cup vegetable oil",
    "1 large egg",
    "⅓ cup milk, or more as needed",
    "1 cup fresh blueberries",
    "Topping: ½ cup white sugar",
    "Topping: ⅓ cup all-purpose flour",
    "Topping: ¼ cup butter, cubed",
    "Topping: 1½ tsp ground cinnamon",
  ],
  steps: [
    "Heat oven: 400°F (200°C). Grease or line eight muffin cups.",
    "Combine dry muffin ingredients.",
    "In a liquid measuring cup, add oil and egg. Add milk until the combined volume reaches 1 cup, then stir.",
    "Mix wet into dry gently; fold in blueberries.",
    "Fork-mix topping until crumbly.",
    "Fill cups completely; add topping.",
    "Bake 20–25 minutes, until toothpick-clean.",
  ],
  notes: "Makes 8 large muffins. Using a 12-cup pan? Put 1 tbsp water in each empty cup before baking.",
  source: {
    author: "Colleen",
    name: "Allrecipes",
    url: "https://www.allrecipes.com/recipe/6865/to-die-for-blueberry-muffins/",
  },
} satisfies Pick<
  Recipe,
  | "title"
  | "slug"
  | "description"
  | "imageUrl"
  | "cuisine"
  | "mealType"
  | "dietaryTags"
  | "prepTime"
  | "cookTime"
  | "servings"
  | "difficulty"
  | "ingredients"
  | "steps"
  | "notes"
> & { source: { author: string; name: string; url: string } };
