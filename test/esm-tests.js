const path = require("path");
const { assert } = require("chai");
const { transform } = require("./utils");

const featuresPath = path.resolve(__dirname, "./fixtures/features");

describe("esm import transformations", function () {
  const esmTransform = transform({
    featuresPath,
  });

  it("should resolve member imports from barrel file", function () {
    const code = esmTransform('import {Abc} from "../../login"');
    assert.equal(code, `import { Abc } from "${featuresPath}/login/bazz";`);
  });

  it("should resolve multiple member imports from barrel file", function () {
    const code = esmTransform('import { Wildcard, Unique } from "../../login"');

    assert.equal(
      code,
      [
        `import { Wildcard } from "${featuresPath}/login/wildcard";`,
        `import { Unique } from "${featuresPath}/login/wildcard";`,
      ].join("\n")
    );
  });
});
