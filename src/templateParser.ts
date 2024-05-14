import { Graph, Node } from "./graph";
import {
  doSimpleMatch,
  getObjectValueByPath,
  normalizePath,
  openFileOrDie,
  replaceBetween,
} from "./utils";

import { exit } from "node:process";

export class TemplateParser {
  private importGraph = new Graph<string>();

  constructor(private baseDir: string) {}

  async parseTemplate(template: string) {
    return this.executeImports(template);
  }

  async executeImports(template: string): Promise<string> {
    return this.executeImportsInternal(template);
  }

  private async executeImportsInternal(
    template: string,
    variables: any = undefined,
    parentNode: Node<string> | null = null
  ): Promise<string> {
    template = await this.replaceVariables(template, variables);
    template = await this.executeExpression(template, variables, parentNode);

    const pattern = /##import\(([^)]+)\)/g;
    return await doSimpleMatch(
      pattern,
      template,
      (template: string, match: RegExpExecArray) =>
        this.onImportMatch(template, match, parentNode)
    );
  }

  private async onImportMatch(
    template: string,
    match: RegExpExecArray,
    parentNode: Node<string> | null
  ) {
    const matched = match[1];
    const importContentRes = this.parseImportContent(matched!);

    let variablesObject: any;
    if (importContentRes.variables) {
      variablesObject = JSON.parse(importContentRes.variables);
    }

    const child = await this.importFile(
      importContentRes.path,
      variablesObject,
      parentNode
    );
    return replaceBetween(
      template,
      match.index,
      match.index + match[0].length,
      child
    );
  }

  private async importFile(
    path: string,
    variablesObject: any | undefined,
    parentNode: Node<string> | null
  ) {
    let suppliedPath = normalizePath(path, this.baseDir);

    const fileContent = await openFileOrDie(suppliedPath);

    const node = this.addToGraph(suppliedPath, parentNode);
    this.detectImportCycle();

    // render templates from the bottom most child up;
    return await this.executeImportsInternal(
      fileContent,
      variablesObject,
      node
    );
  }

  private addToGraph(path: string, parent: Node<string> | null): Node<string> {
    const node = this.importGraph.addNode(path);
    if (parent) {
      this.importGraph.addEdge(parent.data, node.data);
    }

    return node;
  }

  private detectImportCycle() {
    const cycleRes = this.importGraph.hasAnyCycle();
    if (!cycleRes) return;

    let cycle = "";
    for (const iterator of cycleRes) {
      cycle += `${iterator} -> `;
    }

    cycle += cycleRes[0] + " ...";

    console.error(`Cyclic import detected ${cycle}`);

    exit(-1);
  }

  private async replaceVariables(
    template: string,
    variables: any | undefined
  ): Promise<string> {
    const pattern = /@:(.*?)\:@/g;
    return doSimpleMatch(pattern, template, async (newT, match) => {
      const variable = match[1]!.trim();
      const value = getObjectValueByPath(variables, variable, "");
      return replaceBetween(
        newT,
        match.index,
        match.index + match[0].length,
        value
      );
    });
  }

  private async executeExpression(
    template: string,
    variables: any | undefined,
    parentNode: Node<string> | null
  ): Promise<string> {
    const pattern = /@=(.*?)\=@/gs;
    return doSimpleMatch(pattern, template, async (newT, match) => {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const expressions = match[1]!.trim();

      const scopedEval = (scope: any, script: string) =>
        new AsyncFunction(script).bind(scope)();
      const scope = this.createScope(variables, parentNode);
      const evalRes = await scopedEval(scope, expressions);

      return replaceBetween(
        newT,
        match.index,
        match.index + match[0].length,
        evalRes
      );
    });
  }

  private createScope(
    variables: any | undefined,
    parentNode: Node<string> | null
  ) {
    return {
      variables: variables || {},
      import: async (path: string, variables: any | undefined) => {
        return await this.importFile(path, variables, parentNode);
      },
    };
  }

  private parseImportContent(importContent: string): {
    path: string;
    variables?: string | undefined;
  } {
    if (!importContent) return { path: importContent };

    if (!importContent.startsWith('"')) {
      console.error('Import content must start with "');
      exit(-1);
    }

    let index = 1;
    let curChar = importContent[index];
    let path: string = "";
    while (curChar != '"') {
      path += curChar;
      index++;
      if (index === importContent.length) {
        console.error('Unclosed opening string (") in import');
        exit(-1);
      }

      curChar = importContent[index];
    }

    let variables = importContent.split(",").slice(1).join(",");

    return { path, variables };
  }
}
