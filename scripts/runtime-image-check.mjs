// Executed inside the final image by docker-runtime-smoke.sh; never starts a server.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mode = process.argv[2];
assert.equal(process.platform, "linux");
assert.notEqual(process.getuid(), 0, "Runtime must use its non-root user");

if (mode === "tree") {
  for (const name of [
    "patch-package",
    "braces",
    "micromatch",
    "find-yarn-workspace-root",
    "tailwindcss",
    "vitest",
    "eslint",
  ]) {
    assert.equal(existsSync(`node_modules/${name}`), false, `${name} must be pruned`);
  }
  for (const name of ["prisma/build/index.js", "dotenv", "tsx", "@prisma/client", "deepmerge-ts"]) {
    assert.ok(require.resolve(name), `${name} must remain available`);
  }
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  for (const name of ["sharp", "source-map-js", "deepmerge-ts"]) {
    const installed = JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8"));
    assert.equal(installed.version, lock.packages[`node_modules/${name}`].version);
  }
  const production = readFileSync(
    "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
    "utf8",
  );
  assert.ok(
    production.includes(
      "? 0 === (executionContext & 2)\n        ? prepareFreshStack(root, 0)\n        : (workInProgressRootPingedLanes |= pingedLanes)",
    ),
    "Next production patch missing",
  );
  const development = readFileSync(
    "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
    "utf8",
  );
  assert.ok(
    development.includes(
      "? (executionContext & RenderContext) === NoContext\n            ? prepareFreshStack(root, 0)\n            : (workInProgressRootPingedLanes |= pingedLanes)",
    ),
    "Next development patch missing",
  );
  const { default: sharp } = await import("sharp");
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
    .png()
    .toBuffer();
  assert.equal((await sharp(png).metadata()).format, "png");
  const { PrismaClient } = await import("@prisma/client");
  assert.equal(typeof PrismaClient, "function");
  console.log(
    "PASS: pruned Linux dependency tree, both Next patch hunks, native Sharp and Prisma client",
  );
} else if (mode === "ready") {
  const response = await fetch("http://127.0.0.1:3000/api/readiness", {
    signal: AbortSignal.timeout(3000),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ready, true);
  assert.equal(body.draining, false);
  assert.equal(body.commit, process.env.COMMIT_SHA.slice(0, 7));
  for (const name of ["database", "schema", "shutdown"]) {
    assert.equal(body.checks.find((check) => check.name === name)?.ok, true, name);
  }
  console.log("PASS: readiness database/schema/shutdown checks and exact checkout revision");
} else if (mode === "database") {
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient();
  try {
    const expected = readdirSync("prisma/migrations", { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    assert.ok(expected.length > 0);
    const migrations =
      await client.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    assert.deepEqual(migrations.map((row) => row.migration_name).sort(), expected);
    assert.ok(migrations.every((row) => row.finished_at && !row.rolled_back_at));
    for (const model of ["plan", "skill", "industry"])
      assert.ok((await client[model].count()) > 0, model);
    assert.equal(await client.user.count(), 0, "No demo or bootstrap users may be seeded");
    console.log("PASS: every packaged migration applied; reference seed present; no demo users");
  } finally {
    await client.$disconnect();
  }
} else {
  throw new Error("Expected tree, ready or database check");
}
