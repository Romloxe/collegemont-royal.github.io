const fs = require("fs");
const { promisify } = require("util");
const path = require("path");
const ghPages = require("gh-pages");

const build = require("./build");
const Deployment = require("./Deployment");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const [REPO_OWNER, REPO_NAME] = REPO.split("/");
const REF = process.env.GITHUB_REF;
const [REF_TYPE, REF_NAME] = REF.split("/").slice(1, 3);

const publish = promisify(ghPages.publish);

let environment, siteName;
if (REF_TYPE == "pulls") {
  environment = "#" + REF_NAME;
  siteName = "PR" + REF_NAME;
} else if (REF_NAME == "main") {
  environment = "production";
  siteName = "";
} else {
  environment = REF_NAME;
  siteName = REF_NAME;
}

let deployUrl = "https://";
if (fs.existsSync("CNAME")) {
  deployUrl += fs.readFileSync("CNAME");
} else if (REPO_NAME == REPO_OWNER + ".github.io") {
  deployUrl += REPO_NAME;
} else {
  deployUrl += REPO_OWNER + ".github.io/" + REPO_NAME;
}
if (siteName) {
  deployUrl += "/" + siteName;
}

const deploy = () =>
  publish(path.join("dist", siteName), {
    dest: siteName,
    user: {
      name: "github-actions",
      email: "support+actions@github.com",
    },
    repo: "https://Romloxe:" + GITHUB_TOKEN + "@github.com/" + REPO + ".git",
  });

const main = () => {
  const deployment = new Deployment(REPO_OWNER, REPO_NAME, environment, REF);
  return deployment
    .create(GITHUB_TOKEN)
    .then(() => build(deployUrl, siteName))
    .then(() => deployment.setState("in_progress"))
    .then(() => deploy())
    .then(() => deployment.setState("success", deployUrl))
    .catch((err) =>
      deployment
        .setState(err.name == "FileProcessingError" ? "failure" : "error")
        .catch()
        .then(() => {
          throw err;
        })
    );
};

module.exports = main;
