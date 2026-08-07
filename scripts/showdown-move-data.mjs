import ts from "typescript";

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return null;
}

function unwrap(node) {
  let current = node;
  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function literalValue(input) {
  const node = unwrap(input);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node) && node.text === "undefined") return undefined;
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    if (node.operator === ts.SyntaxKind.MinusToken) return -value;
    if (node.operator === ts.SyntaxKind.PlusToken) return value;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) continue;
      const name = propertyName(property.name);
      if (!name) continue;
      value[name] = ts.isShorthandPropertyAssignment(property) ? undefined : literalValue(property.initializer);
    }
    return value;
  }
  return undefined;
}

export function parseShowdownTable(source, exportName = "Moves") {
  const file = ts.createSourceFile("showdown-data.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let table = null;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === exportName && node.initializer) {
      const initializer = unwrap(node.initializer);
      if (ts.isObjectLiteralExpression(initializer)) table = initializer;
    }
    if (!table) ts.forEachChild(node, visit);
  }
  visit(file);
  if (!table) throw new Error(`Could not find the exported ${exportName} table in Pokémon Showdown data.`);

  const result = new Map();
  for (const property of table.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const id = propertyName(property.name);
    const initializer = unwrap(property.initializer);
    if (!id || !ts.isObjectLiteralExpression(initializer)) continue;
    const entry = {};
    const explicitKeys = [];
    for (const field of initializer.properties) {
      if (!ts.isPropertyAssignment(field) && !ts.isShorthandPropertyAssignment(field) && !ts.isMethodDeclaration(field) && !ts.isGetAccessorDeclaration(field) && !ts.isSetAccessorDeclaration(field)) continue;
      const name = propertyName(field.name);
      if (!name) continue;
      explicitKeys.push(name);
      entry[name] = ts.isPropertyAssignment(field) ? literalValue(field.initializer) : undefined;
    }
    Object.defineProperty(entry, "_explicitKeys", { value: explicitKeys, enumerable: false });
    result.set(id, entry);
  }
  return result;
}

export const toShowdownId = (value) => String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");

const FLAG_NAMES = {
  bullet: "Ballistics",
  explode: "Explosion",
  nonsky: "Non Sky Battle",
};

const PUBLIC_FLAGS = new Set([
  "authentic", "bite", "bullet", "charge", "contact", "dance", "defrost", "distance", "explode", "gravity", "heal",
  "mental", "mirror", "nonsky", "powder", "protect", "pulse", "punch", "recharge", "reflectable", "slicing", "snatch", "sound", "wind",
]);

export function showdownFlags(flags) {
  if (!flags || typeof flags !== "object") return [];
  return Object.entries(flags)
    .filter(([flag, enabled]) => Boolean(enabled) && PUBLIC_FLAGS.has(flag))
    .map(([flag]) => FLAG_NAMES[flag] ?? flag.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase()))
    .sort((left, right) => left.localeCompare(right, "en"));
}

const TARGET_NAMES = {
  adjacentAlly: "Ally",
  adjacentAllyOrSelf: "Ally or self",
  adjacentFoe: "1 Foe",
  all: "All Pokémon",
  allAdjacent: "All adjacent",
  allAdjacentFoes: "All foes",
  allies: "All allies",
  allySide: "Ally side",
  any: "1 target",
  foeSide: "Opposing side",
  normal: "1 target",
  randomNormal: "Random foe",
  scripted: "Varies",
  self: "Self",
  userAndAllies: "User and allies",
};

export function showdownTarget(target) {
  return TARGET_NAMES[target] ?? "Varies";
}

export function championsPp(move) {
  const basePp = Math.min(Number(move.pp), 20);
  if (!Number.isFinite(basePp) || basePp <= 0) throw new Error(`Invalid Pokémon Showdown PP for ${move.name ?? "unknown move"}.`);
  const pp = move.noPPBoosts ? basePp : (basePp / 5 + 1) * 4;
  if (!Number.isInteger(pp)) throw new Error(`Unexpected Champions PP result for ${move.name ?? "unknown move"}: ${pp}.`);
  return pp;
}
