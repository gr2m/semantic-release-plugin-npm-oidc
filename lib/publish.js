const path = require("path");
const execa = require("execa");
const getRegistry = require("./get-registry");
const getChannel = require("./get-channel");
const getReleaseInfo = require("./get-release-info");

module.exports = async (npmrc, { npmPublish, pkgRoot }, pkg, context) => {
  const {
    cwd,
    env,
    stdout,
    stderr,
    nextRelease: { version, channel },
    logger,
  } = context;

  if (npmPublish !== false && pkg.private !== true) {
    const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
    const registry = getRegistry(pkg, context);
    const distTag = getChannel(channel);

    logger.log(`Running "npm" with cwd: ${cwd}`);
    const resultDebug = execa("which", ["npm"], { cwd });
    resultDebug.stdout.pipe(stdout, { end: false });
    resultDebug.stderr.pipe(stderr, { end: false });
    await resultDebug;

    logger.log(`Publishing version ${version} to npm registry on dist-tag ${distTag}`);
    const result = execa(
      // "npm",
      // hacky workaround to use system npm binary
      "/opt/hostedtoolcache/node/16.18.1/x64/bin/npm",
      ["publish", basePath, "--userconfig", npmrc, "--tag", distTag, "--registry", registry, "--provenance"],
      { cwd, env, preferLocal: true }
    );
    result.stdout.pipe(stdout, { end: false });
    result.stderr.pipe(stderr, { end: false });
    await result;

    logger.log(`Published ${pkg.name}@${version} to dist-tag @${distTag} on ${registry}`);

    return getReleaseInfo(pkg, context, distTag, registry);
  }

  logger.log(
    `Skip publishing to npm registry as ${npmPublish === false ? "npmPublish" : "package.json's private property"} is ${
      npmPublish !== false
    }`
  );

  return false;
};
