const { Octokit } = require("octokit");

class Deployment {
  constructor(owner, repo, environment, ref) {
    this.environment = environment;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
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
      })
      .then((response) => {
        this.deployment = response.data;
        console.log("Deployment created:", this.deployment);
        return this.deployment;
      });
  }

  setState(state, url) {
    console.log("Setting deployment state to " + state + " with url " + url);
    if (!this.deployment) {
      throw new Error("deployment was not created");
    }

    return this.octokit.rest.repos.createDeploymentStatus({
      deployment_id: this.deployment.id,
      owner: this.owner,
      repo: this.repo,
      state,
      environment_url: url,
    });
  }
}

module.exports = Deployment;
