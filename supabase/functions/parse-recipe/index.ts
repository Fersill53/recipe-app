// Supabase Edge Function: fetches a recipe web page server-side and extracts
// its structured recipe data (schema.org/Recipe JSON-LD), which almost all
// recipe sites embed for Google's rich-results feature.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  image_url?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ordm: "º", deg: "°", hellip: "…", mdash: "—", ndash: "–",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", frac12: "½",
  frac14: "¼", frac34: "¾",
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(\w+);/g, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function textOf(value: unknown): string | undefined {
  if (typeof value === "string") return decodeHtmlEntities(value.trim());
  if (Array.isArray(value)) return textOf(value[0]);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj["name"] === "string") return decodeHtmlEntities(obj["name"]);
    if (typeof obj["text"] === "string") return decodeHtmlEntities(obj["text"]);
    if (typeof obj["url"] === "string") return obj["url"];
  }
  return undefined;
}

function parseIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => textOf(item)).filter((s): s is string => !!s);
}

function flattenInstructionSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return decodeHtmlEntities(value).split(/\n+/).map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => flattenInstructionSteps(item));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj["@type"] === "HowToSection" && Array.isArray(obj["itemListElement"])) {
      return flattenInstructionSteps(obj["itemListElement"]);
    }
    if (typeof obj["text"] === "string") return [decodeHtmlEntities(obj["text"].trim())];
    if (typeof obj["name"] === "string") return [decodeHtmlEntities(obj["name"].trim())];
  }
  return [];
}

function parseImage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return parseImage(value[0]);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj["url"] === "string") return obj["url"];
  }
  return undefined;
}

function parseServings(value: unknown): number | undefined {
  const text = textOf(value) ?? (typeof value === "number" ? String(value) : undefined);
  if (!text) return undefined;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

function parseDurationMinutes(value: unknown): number | undefined {
  const text = textOf(value);
  if (!text) return undefined;
  const match = text.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return undefined;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

function isRecipeNode(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object") return false;
  const type = (node as Record<string, unknown>)["@type"];
  if (typeof type === "string") return type === "Recipe";
  if (Array.isArray(type)) return type.includes("Recipe");
  return false;
}

function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    if (isRecipeNode(node)) return node as Record<string, unknown>;
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) return findRecipeNode(obj["@graph"]);
  }
  return null;
}

function extractRecipe(html: string): ParsedRecipe | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch {
      continue;
    }

    const recipe = findRecipeNode(parsed);
    if (!recipe) continue;

    const title = textOf(recipe["name"]);
    if (!title) continue;

    return {
      title,
      description: textOf(recipe["description"]),
      ingredients: parseIngredients(recipe["recipeIngredient"] ?? recipe["ingredients"]),
      instructions: flattenInstructionSteps(recipe["recipeInstructions"]).join("\n"),
      image_url: parseImage(recipe["image"]),
      servings: parseServings(recipe["recipeYield"]),
      prep_time_minutes: parseDurationMinutes(recipe["prepTime"]),
      cook_time_minutes: parseDurationMinutes(recipe["cookTime"]),
    };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: "Please provide a valid http(s) URL." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RecipeAppBot/1.0; +https://github.com)",
        "Accept": "text/html",
      },
    });

    if (!pageResponse.ok) {
      return new Response(JSON.stringify({ error: `Could not fetch that page (status ${pageResponse.status}).` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageResponse.text();
    const recipe = extractRecipe(html);

    if (!recipe) {
      return new Response(JSON.stringify({ error: "Could not find recipe data on that page." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
