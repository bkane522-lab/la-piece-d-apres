// Tests structurels sans dépendance — exécutés par `npm test`.
// Ne remplace pas `npm run typecheck` / `npm run build`, qui nécessitent
// un accès normal au registre npm et doivent être lancés séparément.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("..", import.meta.url).pathname;
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`✗ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const srcDir = join(root, "src");
const allSrcFiles = walk(srcDir);

// 1. Un seul root layout global avec <html>/<body>.
const layoutFiles = allSrcFiles.filter((f) => f.endsWith(join("app", "layout.tsx")) || f.match(/[\\/]layout\.tsx$/));
const rootLayout = join(srcDir, "app", "layout.tsx");
if (!existsSync(rootLayout)) {
  fail("src/app/layout.tsx est introuvable.");
} else {
  const content = readFileSync(rootLayout, "utf8");
  if (!content.includes("<html") || !content.includes("<body")) {
    fail("src/app/layout.tsx doit contenir <html> et <body>.");
  } else {
    pass("src/app/layout.tsx est bien le root layout (<html>/<body>).");
  }
}
const otherLayoutsWithHtml = layoutFiles.filter((f) => f !== rootLayout && readFileSync(f, "utf8").includes("<html"));
if (otherLayoutsWithHtml.length > 0) {
  fail(`Layout(s) imbriqué(s) contenant <html> en plus du root layout : ${otherLayoutsWithHtml.join(", ")}`);
} else {
  pass("Aucun layout imbriqué ne redéfinit <html>.");
}

// 2. Pas de conflit page.tsx / route.ts dans le même segment.
const byDir = new Map();
for (const f of allSrcFiles) {
  const base = f.replace(/[\\/](page|route)\.tsx?$/, "");
  if (base === f) continue;
  const kind = f.endsWith("page.tsx") || f.endsWith("page.ts") ? "page" : f.endsWith("route.ts") || f.endsWith("route.tsx") ? "route" : null;
  if (!kind) continue;
  if (!byDir.has(base)) byDir.set(base, new Set());
  byDir.get(base).add(kind);
}
let hasConflict = false;
for (const [dir, kinds] of byDir) {
  if (kinds.has("page") && kinds.has("route")) {
    fail(`Conflit page/route dans le même segment : ${dir}`);
    hasConflict = true;
  }
}
if (!hasConflict) pass("Aucun conflit page.tsx / route.ts dans un même segment.");

// 3. Pages et routes essentielles non vides.
const essentialFiles = allSrcFiles.filter((f) => /(page|route)\.tsx?$/.test(f));
const emptyEssentials = essentialFiles.filter((f) => readFileSync(f, "utf8").trim().length === 0);
if (emptyEssentials.length > 0) {
  fail(`Fichier(s) page/route vide(s) : ${emptyEssentials.map((f) => f.replace(root, "")).join(", ")}`);
} else {
  pass("Toutes les pages et routes ont un contenu.");
}

// 4. Aucune référence textuelle à l'ancienne marque dans le code applicatif.
const codeExts = new Set([".ts", ".tsx", ".css", ".json"]);
const codeFiles = [...allSrcFiles, join(root, "public", "manifest.webmanifest")].filter((f) => codeExts.has(extname(f)) && existsSync(f));
const leftover = [];
for (const f of codeFiles) {
  const content = readFileSync(f, "utf8").toLowerCase();
  if (content.includes("lemontree") || content.includes("lemon tree")) leftover.push(f);
}
if (leftover.length > 0) {
  fail(`Référence(s) à l'ancienne marque dans le code : ${leftover.join(", ")}`);
} else {
  pass("Aucune référence à l'ancienne marque dans le code applicatif.");
}

// 5. .env.example utilise exactement les 4 variables attendues, une seule convention.
const envPath = join(root, ".env.example");
if (!existsSync(envPath)) {
  fail(".env.example est introuvable.");
} else {
  const envContent = readFileSync(envPath, "utf8");
  const expected = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"];
  const missing = expected.filter((v) => !envContent.includes(v));
  const forbidden = ["SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE\n", "SUPABASE_SERVICE_ROLE="];
  const foundForbidden = forbidden.filter((v) => envContent.includes(v));
  if (missing.length > 0) fail(`.env.example : variable(s) manquante(s) : ${missing.join(", ")}`);
  else if (foundForbidden.length > 0) fail(`.env.example : variante(s) de nom interdite(s) trouvée(s) : ${foundForbidden.join(", ")}`);
  else pass(".env.example expose exactement la convention SUPABASE_SERVICE_ROLE_KEY attendue.");
}

// 6. La clé service_role n'est jamais référencée côté client ("use client").
const clientFiles = allSrcFiles.filter((f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && readFileSync(f, "utf8").startsWith('"use client"'));
const leaked = clientFiles.filter((f) => readFileSync(f, "utf8").includes("SERVICE_ROLE"));
if (leaked.length > 0) {
  fail(`Référence à la clé service_role dans un fichier client : ${leaked.join(", ")}`);
} else {
  pass("Aucune référence à la clé service_role dans les fichiers \"use client\".");
}

// 7. Un seul module centralisant les clients Supabase serveur.
const serverClientFiles = allSrcFiles.filter(
  (f) => readFileSync(f, "utf8").includes("SUPABASE_SERVICE_ROLE_KEY") && f.endsWith(".ts")
);
if (serverClientFiles.length !== 1) {
  fail(`La clé service_role doit être lue depuis un seul module serveur, trouvé dans : ${serverClientFiles.join(", ") || "aucun fichier"}`);
} else {
  pass("Un seul module lit SUPABASE_SERVICE_ROLE_KEY côté serveur.");
}

console.log("");
if (failures > 0) {
  console.error(`${failures} vérification(s) échouée(s).`);
  process.exit(1);
} else {
  console.log("Toutes les vérifications structurelles sont passées.");
  console.log("Rappel : npm run typecheck / npm run build restent nécessaires avant mise en production.");
}
