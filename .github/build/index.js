const main = require("./main");

console.log("Starting build");
main()
  .then(() => {
    console.log("Build succeeded");
  })
  .catch((err) => {
    console.log("Build failed");
    console.error(err);
    process.exit(1);
  });