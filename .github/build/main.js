const { promisify } = require("util");
const ghPages = require("gh-pages");
const build = require("./build");
const Deployment = require("./Deployment");
const {
  buildId,
  GITHUB_REPOSITORY_NAME,
  GITHUB_TOKEN,
  GITHUB_REPOSITORY_OWNER,
  environment,
  REF,
  deployUrl,
} = require("./context");

const publish = promisify(ghPages.publish);

const deploy = () => {
  console.log("Deploying to dist/builds/" + buildId);
  const publishOptions = {
    dest: "builds/" + buildId,
    user: {
      name: "github-actions-bot",
      email: "support+actions@github.com",
    },
    branch: "dist",
    repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + GITHUB_REPOSITORY_NAME + ".git",
  };
  return publish("dist", publishOptions).then(() => console.log("Deployed"));
};

const main = () => {
  console.log("Starting build");
  const deployment = new Deployment(GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY_NAME, environment, REF);
  return deployment
    .create(GITHUB_TOKEN)
    .then(() => build())
    .then(() => deployment.setState("in_progress"))
    .then(() => deploy())
    .then(() => deployment.setState("success", deployUrl))
    .catch((err) => {
      console.log("Build failed");
      console.error(err);
      deployment
        .setState(err.name == "FileProcessingError" ? "failure" : "error")
        .catch(() => {})
        .then(() => Promise.reject(err));
    })
    .then(() => {
      console.log("Build succeeded");
    });
};

module.exports = main;
