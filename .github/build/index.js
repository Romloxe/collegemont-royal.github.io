const main = require("./main");

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
