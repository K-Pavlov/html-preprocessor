import { exit } from "node:process";
import { promises as fs } from "node:fs";
import path from "node:path";

export function normalizePath(suppliedPath: string, baseDir: string) {
  if (!path.isAbsolute(suppliedPath)) {
    suppliedPath = path.join(baseDir, suppliedPath);
  }

  return suppliedPath;
}

export async function openFileOrDie(path: string): Promise<string> {
  let res: string;
  try {
    return await fs.readFile(path, "utf8");
  } catch (e) {
    console.error(`Error opening file ${path}: ${e!.toString()}`);
    exit(-1);
  }
}

export function replaceBetween(
  origin: string,
  startIndex: number,
  endIndex: number,
  insertion: string
) {
  return (
    origin.substring(0, startIndex) + insertion + origin.substring(endIndex)
  );
}

export async function doSimpleMatch(
  pattern: RegExp,
  template: string,
  onMatch: (newT: string, match: RegExpExecArray) => Promise<string>
) {
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    template = await onMatch(template, match);
  }

  return template;
}

export function getObjectValueByPath(
  obj: any | undefined,
  path: string | string[],
  def: any = undefined
) {
  obj = obj ?? {};
  path = stringToPath(path);

  // Cache the current object
  let current = obj;
  for (let i = 0; i < path.length; i++) {
    const pathPart = path[i]!;
    if (!current[pathPart]) return def;

    current = current[pathPart];
  }

  return current;
}

function stringToPath(path: string | string[]) {
  if (typeof path !== "string") return path;

  const output: string[] = [];
  // Split to an array with dot notation
  path.split(".").forEach(function (item, index) {
    // Split to an array with bracket notation
    item.split(/\[([^}]+)\]/g).forEach(function (key) {
      // Push to the new array
      if (key.length > 0) {
        output.push(key);
      }
    });
  });

  return output;
}
