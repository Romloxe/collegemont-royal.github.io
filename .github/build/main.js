const fs = require("fs");
const { promisify } = require("util");
const path = require("path");
const ghPages = require("gh-pages");

const build = require("./build");
const Deployment = require("./Deployment");
const context = require("./context");

const publish = promisify(ghPages.publish);

const main = () => {
  const evaluatedContext = context();
  const { GITHUB_TOKEN, REPO, REPO_OWNER, REPO_NAME, REF, environment, siteName, deployUrl } = evaluatedContext;
  console.log("Running with context:", evaluatedContext);

  const deploy = () => {
    const distPath = path.join("dist", siteName);
    console.log("Deploying " + distPath + " to gh-pages/" + siteName);
    const publishOptions = {
      dest: siteName,
      user: {
        name: "github-actions",
        email: "support+actions@github.com",
      },
      repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + REPO + ".git",
    };
    return publish(distPath, publishOptions).then(() => console.log("Deployed"));
  };

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
        .catch(() => {})
        .then(() => Promise.reject(err))
    );
};

module.exports = main;
