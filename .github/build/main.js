const { promisify } = require("util");
const ghPages = require("gh-pages");
const build = require("./build");
const Deployment = require("./Deployment");
const context = require("./context");

const publish = promisify(ghPages.publish);
const { GITHUB_TOKEN, REPO, REPO_OWNER, REPO_NAME, environment, siteName, deployUrl, deployRef } = context;

const deploy = () => {
  console.log("Deploying to dist/build/" + siteName);
  const publishOptions = {
    dest: "build/" + siteName,
    user: {
      name: "github-actions-bot",
      email: "support+actions@github.com",
    },
    branch: "dist",
    repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + REPO + ".git",
  };
  return publish("dist", publishOptions).then(() => console.log("Deployed"));
};

const main = () => {
  const deployment = new Deployment(REPO_OWNER, REPO_NAME, environment, deployRef);
  return deployment
    .create(GITHUB_TOKEN)
    .then(() => build())
    .then(() => deployment.setState("in_progress"))
    .then(() => deploy())
    .then(() => deployment.setState("success", deployUrl))
    .catch((err) =>
      deployment
        .setState(err.name == "FileProcessingError" ? "failure" : "error")
        .catch(() => {})
        .then(() => Promise.reject(err))
    );
};

module.exports = main;
