const fs = require("fs");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const REPO = process.env.GITHUB_REPOSITORY;
const [REPO_OWNER, REPO_NAME] = REPO.split("/");

const HEAD_REF = process.env.GITHUB_HEAD_REF;
const REF = process.env.GITHUB_REF;
const [REF_TYPE, REF_NAME] = REF.split("/").slice(1, 3);

const deployRef = REF_TYPE == "pull" ? HEAD_REF : REF;

let environment, siteName;
if (REF_TYPE == "pull") {
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

const context = {
  GITHUB_TOKEN,
  REPO,
  REPO_OWNER,
  REPO_NAME,
  REF,
  REF_TYPE,
  REF_NAME,
  environment,
  siteName,
  deployUrl,
  deployRef,
};

module.exports = context;
