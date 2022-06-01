const fs = require("fs");
const path = require("path");
const { Octokit } = require("octokit");
const { promisify } = require("util");

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.mkdir);

class Deployment {
  constructor(owner, repo, environment, ref, url) {
    this.environment = environment;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
    this.url = url;
    console.log("Initialized deployment:", this);
  }

  create(token) {
    this.octokit = new Octokit({ auth: token });
    console.log("Creating deployment...");
    return this.octokit.rest.repos
      .createDeployment({
        owner: this.owner,
        repo: this.repo,
        environment: this.environment,
        ref: this.ref,
        required_contexts: [],
        auto_merge: false,
      })
      .then(async (response) => {
        console.log("Deployment created:", this.deployment);
        this.deployment = response.data;
        await mkdir("deployments", { recursive: true });
        await writeFile(path.join("deployments", this.deployment.id), this.url);
        return this.deployment;
      });
  }

  setState(state) {
    console.log("Setting deployment state to " + state);
    if (!this.deployment) {
      return Promise.reject("deployment was not created");
    }

    return this.octokit.rest.repos.createDeploymentStatus({
      deployment_id: this.deployment.id,
      owner: this.owner,
      repo: this.repo,
      state,
      environment_url: this.url,
    });
  }
}

module.exports = Deployment;
