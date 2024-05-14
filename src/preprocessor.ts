import { normalizePath, openFileOrDie } from "./utils";

import { TemplateParser } from "./templateParser";
import { exit } from "node:process";
import { promises as fs } from "node:fs";
import path from "node:path";

var pretty = require("pretty");

const args = process.argv;
if (args.length !== 4) {
  console.error(
    "The preprocessor expects exactly two arguments - the path to the html file that should be preprocessed and the resulting html file name or path"
  );
  exit(-1);
}

const suppliedPath = args[2];
const fileNameOrPath = args[3];

if (!suppliedPath) {
  console.error("Empty path to target file");
  exit(-1);
}

if (!fileNameOrPath) {
  console.error("Empty path to output file");
  exit(-1);
}

const fileContent = await openFileOrDie(suppliedPath);

const baseDir = path.dirname(path.resolve(suppliedPath));
const templateParser = new TemplateParser(baseDir);

await fs.writeFile(
  normalizePath(fileNameOrPath!, baseDir),
  pretty(await templateParser.parseTemplate(fileContent))
);
