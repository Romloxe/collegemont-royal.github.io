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
  GITHUB_REPOSITORY,
} = require("./context");

const publish = promisify(ghPages.publish);

const deploy = () => {
  console.log("Deploying to dist/builds/" + buildId);
  const publishOptions = {
    dest: "builds/" + buildId,
    user: {
      name: "github-actions",
      email: "support+actions@github.com",
    },
    branch: "dist",
    repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + GITHUB_REPOSITORY + ".git",
  };
  return publish("dist", publishOptions).then(() => console.log("Deployed"));
};

const publishDeployments = () => {
  console.log("Publishing deployments to dist/deployments");
  const publishOptions = {
    dest: "deployments",
    user: {
      name: "github-actions",
      email: "support+actions@github.com",
    },
    branch: "dist",
    repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + GITHUB_REPOSITORY + ".git",
    add: true,
  };
  return publish("deployments", publishOptions).then(() => console.log("Published deployments"));
};

const main = () => {
  console.log("Starting build");
  const deployment = new Deployment(GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY_NAME, environment, REF, deployUrl);
  return (
    deployment
      .create(GITHUB_TOKEN)
      .then(() => build())
      .then(() => deployment.setState("in_progress"))
      .then(() => deploy())
      .then(() => publishDeployments())
      // .then(() => deployment.setState("success"))
      .catch((err) => {
        console.log("Build failed");
        console.error(err);
        return deployment
          .setState(err.name == "FileProcessingError" ? "failure" : "error")
          .catch(() => {})
          .then(() => Promise.reject(err));
      })
      .then(() => {
        console.log("Build succeeded");
      })
  );
};

module.exports = main;
