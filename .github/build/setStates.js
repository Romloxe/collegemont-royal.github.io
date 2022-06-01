const fs = require("fs");
const child_process = require("child_process");
const { promisify } = require("util");
const { Octokit } = require("octokit");

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const exec = promisify(child_process.exec);

const { GITHUB_TOKEN, GITHUB_REPOSITORY, WORKFLOW_RUN_CONCLUSION } = process.env;

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const state = WORKFLOW_RUN_CONCLUSION == "success" ? "success" : "error";

const removeDeployment = (deploymentId) => exec(`git rm -f deployments/${deploymentId}`);
const setDeploymentState = async (deploymentId) => {
  const environment_url = await readFile("deployments/" + deploymentId, "utf8");
  await octokit.rest.repos.createDeploymentStatus({
    owner,
    repo,
    deployment_id: +deploymentId,
    environment_url,
    state,
  });
};

const handleDeployment = (deploymentId) => setDeploymentState(deploymentId).then(() => removeDeployment(deploymentId));

readdir("deployments")
  .then((deployments) => Promise.all(deployments.map(handleDeployment)))
  .then(() => exec("git config user.name github-actions"))
  .then(() => exec("git config user.email support+actions@github.com"))
  .then(() => exec("git commit -m Updates"))
  .then(() => exec(`git remote set-url origin https://git:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git`))
  .then(() => exec("git push"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
