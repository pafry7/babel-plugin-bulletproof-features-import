const fs = require("fs");

const ts = require("typescript");

/**
 * Parses a ESM barrel (index) file, extracts all it's export
 * names and returns an object that maps
 * a import name to the path
 *
 * Note: It handle the following cases:
 * ```
 * import {A, B} from './foo';
 *
 * export {A,B}
 *
 * ```
 */
const collectEsmImports = (file) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true
  );

  const exports = {};
  sourceFile.forEachChild((child) => {
    if (ts.isImportDeclaration(child)) {
      const importName = child.moduleSpecifier.text;
      child.importClause.forEachChild((node) => {
        if (node.elements) {
          node.elements.forEach((element) => {
            const importedModule = element.name.escapedText;
            exports[importedModule] = importName;
          });
        }
      });
    }
  });

  return exports;
};

module.exports = { collectEsmImports };
