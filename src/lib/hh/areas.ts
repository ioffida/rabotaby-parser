import type { HhArea } from "@/lib/hh/types";

const BELARUS_NAMES = new Set([
  "Беларусь",
  "Belarus",
  "Республика Беларусь",
]);

/**
 * DFS to find the Belarus root node in HH /areas tree.
 * Falls back to id "16" (Belarus) if naming changes.
 */
export function findBelarusRoot(roots: HhArea[]): HhArea | null {
  const stack = [...roots];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === "16") return node;
    if (BELARUS_NAMES.has(node.name)) return node;
    if (node.areas?.length) stack.push(...node.areas);
  }
  return null;
}

export type FlatArea = { id: string; name: string; depth: number };

/**
 * Flatten country + all descendant areas for a <select> (indented by depth).
 */
export function flattenAreas(root: HhArea, maxDepth = 2): FlatArea[] {
  const out: FlatArea[] = [{ id: root.id, name: root.name, depth: 0 }];

  const walk = (nodes: HhArea[] | undefined, depth: number) => {
    if (!nodes || depth > maxDepth) return;
    for (const a of nodes) {
      out.push({ id: a.id, name: a.name, depth });
      walk(a.areas, depth + 1);
    }
  };

  walk(root.areas, 1);
  return out;
}
