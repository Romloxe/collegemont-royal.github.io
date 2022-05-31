const { Octokit } = require("octokit");

class Deployment {
  constructor(owner, repo, environment, ref) {
    this.owner = owner;
    this.repo = repo;
    this.environment = environment;
    this.ref = ref;
  }

  create(token) {
    this.octokit = new Octokit({ auth: token });
    return this.octokit.rest.repos
      .createDeployment({
        owner: this.owner,
        repo: this.repo,
        environment: this.environment,
        ref: this.ref,
      })
      .then((response) => {
        this.deployment = response.data;
        return this.deployment;
      });
  }

  setState(state, url) {
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
