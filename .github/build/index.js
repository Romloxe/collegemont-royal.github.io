// const main = require("./main");
// const build = require("./build");
const Deployment = require("./Deployment");

// main();
// build("https://collegemont-royal.github.io", "");
new Deployment("Romloxe", "collegemont-royal.github.io", "test", "refs/heads/main")
  .create("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")
  .then(console.log)
  .catch(console.error);
