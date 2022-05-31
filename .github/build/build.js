const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const config = require("./config");
const fileProcessingFunctions = require("./fileProcessingFunctions");
const { createSitemap } = require("./sitemap");

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const isDirectory = (path) => stat(path).then((stats) => stats.isDirectory());
const pathNormalize = (path) => path.replace(/\/$/, "");

const copyExcluded = config.files.exclude.map(pathNormalize);
const transformExcluded = config.files.noTransform.map(pathNormalize);
const isCopyExcluded = (path) => copyExcluded.includes(path);
const isTransformExcluded = (path) => transformExcluded.includes(path);

const processFile = (srcPath, dstPath, noTransform = false) => {
  const extension = path.extname(srcPath);
  const fileProcessor = (!noTransform && fileProcessingFunctions[extension]) || fileProcessingFunctions.default;
  return fileProcessor(srcPath, dstPath);
};

const build = (baseUrl, siteName) => {
  const fileProcessors = [];

  const processDir = async (dirPath = ".", noTransform = false) => {
    await mkdir(path.join("dist", siteName, dirPath), { recursive: true });

    const contents = await readdir(dirPath);
    for (let item of contents) {
      const itemPath = path.join(dirPath, item);

      if (isCopyExcluded(itemPath)) continue;

      const itemIsTransformExcluded = noTransform || isTransformExcluded(itemPath);
      if (await isDirectory(itemPath)) {
        await processDir(itemPath, itemIsTransformExcluded);
      } else {
        fileProcessors.push(processFile(itemPath, path.join("dist", siteName, itemPath), itemIsTransformExcluded));
      }
    }
  };

  return (
    processDir()
      .then(() => createSitemap(baseUrl, "files/cells.json"))
      .then((sitemap) => writeFile(path.join("dist", siteName, "sitemap.xml"), sitemap, "utf8"))
      .then(() => Promise.all(fileProcessors))
  );
};

module.exports = build;
