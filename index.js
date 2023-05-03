const pathLib = require("path");
const types = require("@babel/types");
const fs = require("fs");

const { err, partition } = require("./src/misc");
const { collectEsmImports } = require("./src/collect-esm-imports");
const { resolveLogLevel, DEBUG, INFO } = require("./src/log");

const cachedResolvers = {};
const cachedModuleNames = {};
let cachedFeatures = null;

function getCachedImports({ logLevel, moduleName, barrelFilePath }) {
  if (cachedResolvers[moduleName]) {
    return cachedResolvers[moduleName];
  }

  cachedResolvers[moduleName] = collectEsmImports(barrelFilePath);

  logLevel >= INFO &&
    console.log(`[resolve-barrel-files] '${moduleName}' exports:`, imports);

  return cachedResolvers[moduleName];
}

function getFeatures(featuresDirectoryPath) {
  if (cachedFeatures) {
    return cachedFeatures;
  }

  cachedFeatures = new Set(fs.readdirSync(featuresDirectoryPath));

  return cachedFeatures;
}

function getFeatureName(moduleName) {
  if (cachedModuleNames[moduleName]) {
    return cachedModuleNames[moduleName];
  }

  const parsedModulePath = pathLib.parse(moduleName);
  const isBarrelFile = new RegExp(/^(\.\.\/*)+$/).test(parsedModulePath.dir); // taking only ../x, ../../x etc. feature imports
  const featureName = isBarrelFile ? parsedModulePath.base : null;

  cachedModuleNames[moduleName] = featureName;
  return cachedModuleNames[moduleName];
}

module.exports = function () {
  return {
    visitor: {
      ImportDeclaration: function (path, state) {
        try {
          const moduleName = path.node.source.value;
          const featuresPath = state.opts?.featuresPath;
          const logLevel = resolveLogLevel(state.opts?.logLevel);

          if (!featuresPath) {
            return;
          }

          const features = getFeatures(featuresPath);
          const featureName = getFeatureName(moduleName);

          if (!featureName || !features.has(featureName)) {
            return;
          }

          const featureFolderPath = pathLib.join(featuresPath, featureName);

          const indexFile = fs
            .readdirSync(featureFolderPath)
            .find((fileName) => /^(index\.(js|ts))$/i.test(fileName));

          const featureIndexFilePath = pathLib.join(
            featureFolderPath,
            indexFile
          );

          const transforms = [];

          const imports = getCachedImports({
            logLevel,
            moduleName,
            barrelFilePath: featureIndexFilePath,
          });

          const [fullImports, memberImports] = partition(
            (specifier) => specifier.type !== "ImportSpecifier",
            path.node.specifiers
          );

          if (fullImports.length) {
            err("Full imports are not supported");
          }

          for (const memberImport of memberImports) {
            const importName = memberImport.imported.name;
            const exportInfo = imports[importName];

            if (!imports[importName]) {
              logLevel >= DEBUG &&
                console.log(
                  `[${moduleName}] No export info found for ${importName}`
                );
              continue;
            }

            const importFrom = pathLib.join(featureFolderPath, exportInfo);

            logLevel >= DEBUG &&
              console.log(
                `[${moduleName}] Resolving '${importName}' to ${importFrom}`
              );

            transforms.push(
              types.importDeclaration(
                [memberImport],
                types.stringLiteral(importFrom)
              )
            );
          }

          if (transforms.length > 0) {
            path.replaceWithMultiple(transforms);
          }
        } catch (error) {
          console.error(error);
        }
      },
    },
  };
};
