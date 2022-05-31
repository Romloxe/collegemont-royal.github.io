const main = require("./main");

console.log("Starting action");
main()
  .then(() => {
    console.log("Action succeeded");
  })
  .catch((err) => {
    console.log("Action failed");
    console.error(err);
    process.exit(1);
  });
