import type { Recipe } from "@/lib/types";

// Keep this draft independent of the database so reviewing it never publishes it.
export const blueberryMuffinsDraft = {
  title: "Blueberry Muffins",
  slug: "blueberry-muffins",
  description: "Big, tender muffins packed with blueberries and finished with buttery cinnamon crumbs. The kind of breakfast that deserves a second cup of coffee.",
  introContent: "The best part is the top: buttery cinnamon crumbs with a little crunch over a soft, blueberry-filled center. This is a straightforward batter, mixed by hand and portioned into eight generously filled cups. The muffins bake up big enough to make breakfast feel like a bakery run, especially while they are still warm and the coffee is ready.\n\nSource: [Colleen on Allrecipes](https://www.allrecipes.com/recipe/6865/to-die-for-blueberry-muffins/). AI-generated cover.",
  imageUrl: "/images/recipes/blueberry-muffins.png",
  cuisine: "american",
  mealType: "breakfast",
  dietaryTags: ["vegetarian"],
  prepTime: 15,
  cookTime: 20,
  servings: 8,
  difficulty: "easy",
  ingredients: [
    "1 1/2 cups all-purpose flour",
    "3/4 cup white sugar",
    "2 tsp baking powder",
    "1/2 tsp salt",
    "1/3 cup vegetable oil",
    "1 large egg",
    "1/3 cup milk, or more as needed",
    "1 cup fresh blueberries",
    "Crumb topping: 1/2 cup white sugar",
    "Crumb topping: 1/3 cup all-purpose flour",
    "Crumb topping: 1/4 cup butter, cubed",
    "Crumb topping: 1 1/2 tsp ground cinnamon",
  ],
  steps: [
    "Preheat oven to 400F (200C). Grease 8 muffin cups or line them with paper liners.",
    "Whisk the muffin flour, white sugar, baking powder, and salt together in a large bowl.",
    "Measure 1/3 cup oil into a liquid measuring cup. Add the egg, then enough milk to bring the combined volume to 1 cup. Stir together.",
    "Pour the wet ingredients into the flour mixture and stir just until combined. Do not overmix.",
    "Gently fold in the blueberries.",
    "Make the crumb topping: use a fork to work its white sugar, flour, cubed butter, and cinnamon together until crumbly.",
    "Divide the batter between the 8 muffin cups, filling to the top. Sprinkle the crumb topping evenly over the batter.",
    "Bake for 20-25 minutes, until a toothpick inserted into the center of a muffin comes out clean.",
  ],
  notes: "Makes 8 large muffins. If using a 12-cup pan, add 1 tbsp water to each of the 4 empty cups before baking.",
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
  | "introContent"
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
