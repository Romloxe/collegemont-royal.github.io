const fs = require("fs");
const { promisify } = require("util");
const { Octokit } = require("octokit");
const build = require("./build");
const path = require("path");
const ghPages = require("gh-pages");

const ROOT_PATH = process.cwd();

const REPO = process.env.GITHUB_REPOSITORY;
const [REPO_OWNER, REPO_NAME] = REPO.split("/");
const REF = process.env.GITHUB_REF;
const [REF_TYPE, REF_NAME] = REF.split("/").slice(1, 3);

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
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

const deploy = async (deploymentId) => {
  await octokit.rest.repos.createDeploymentStatus({
    deployment_id: deploymentId,
    owner: REPO_OWNER,
    repo: REPO,
    state: "in_progress",
  });

  await build(deployUrl, siteName);

  await publish(path.join("dist", siteName), {
    dest: siteName,
    user: {
      name: "github-actions",
      email: "support+actions@github.com",
    },
  });

  await octokit.rest.repos.createDeploymentStatus({
    deployment_id: deploymentId,
    owner: REPO_OWNER,
    repo: REPO,
    state: "success",
    environment_url: deployUrl,
  });
};

const main = () => {
  let deploymentId;
  return octokit.rest.repos
    .createDeployment({ environment, owner: REPO_OWNER, ref: REF, repo: REPO })
    .then((response) => (deploymentId = response.data.id))
    .then(deploy)
    .catch(async (err) => {
      await octokit.rest.repos.createDeploymentStatus({
        deployment_id: deploymentId,
        owner: REPO_OWNER,
        repo: REPO,
        state: "failure",
      });
      throw err;
    });
};

module.exports = main;
