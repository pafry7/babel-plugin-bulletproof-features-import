const babel = require("@babel/core");

const transform = (options) => (code) => {
  return babel.transform(code, {
    presets: [["@babel/preset-env", { modules: false }]],
    plugins: [["./index", options]],
  }).code;
};

module.exports = {
  transform,
};
