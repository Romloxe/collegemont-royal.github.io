const { promisify } = require("util");
const ghPages = require("gh-pages");
const { Octokit } = require("octokit");

const {
  buildId,
  GITHUB_REPOSITORY_NAME,
  GITHUB_TOKEN,
  GITHUB_REPOSITORY_OWNER,
  environment,
  GITHUB_REPOSITORY,
} = require("./context");

const publish = promisify(ghPages.publish);

const deleteEnvironment = async () => {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  await octokit.rest.repos.deleteAnEnvironment({
    owner: GITHUB_REPOSITORY_OWNER,
    repo: GITHUB_REPOSITORY_NAME,
    environment_name: environment,
  });

  const publishOptions = {
    dest: "builds",
    user: {
      name: "github-actions",
      email: "support+actions@github.com",
    },
    branch: "dist",
    repo: "https://git:" + GITHUB_TOKEN + "@github.com/" + GITHUB_REPOSITORY + ".git",
    remove: buildId,
  };
  await publish("builds", publishOptions);
};

deleteEnvironment().catch((err) => {
  console.error(err);
  process.exit(1);
});
