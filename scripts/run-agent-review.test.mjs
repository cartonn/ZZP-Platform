import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runReview } from "./run-agent-review.mjs";

const context = {
  repository: "cartonn/ZZP-Platform",
  pr: 1475,
  headSha: "a".repeat(40),
  baseSha: "b".repeat(40),
  files: ["src/example.ts"],
};
const report = {
  schemaVersion: 1,
  repository: context.repository,
  pr: context.pr,
  headSha: context.headSha,
  baseSha: context.baseSha,
  verdict: "PASS",
  complete: true,
  summary: "Reviewed all changes.",
  reviewedFiles: context.files,
  findings: [],
};
const message = (phase = "final_answer", value = report) => ({
  id: "msg_final",
  type: "message",
  role: "assistant",
  status: "completed",
  phase,
  content: [{ type: "output_text", text: JSON.stringify(value), annotations: [] }],
});
const toolCall = (id = "call_read") => ({
  id: `fc_${id}`,
  type: "function_call",
  status: "completed",
  call_id: id,
  name: "read_source",
  arguments: '{"path":"src/example.ts"}',
});
const response = (output = [message()], extra = {}) => ({
  id: "resp_one",
  object: "response",
  status: "completed",
  model: "gpt-5.5-2026-04-23",
  error: null,
  incomplete_details: null,
  output,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
    total_tokens: 150,
    input_tokens_details: { cached_tokens: 20 },
    output_tokens_details: { reasoning_tokens: 30 },
  },
  ...extra,
});
function fixture(t, responses = [response()], overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "review-api-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const requests = [],
    calls = [];
  const delivered = overrides.delivered ?? true;
  const reader = {
    initialContext: "FULL_DIFF_PRIVATE_SOURCE",
    tools: [
      {
        type: "function",
        name: "read_source",
        strict: true,
        parameters: {
          type: "object",
          additionalProperties: false,
          required: ["path"],
          properties: { path: { type: "string" } },
        },
      },
    ],
    async callTool(name, args) {
      calls.push({ name, args });
      return "FULL_BLOB_PRIVATE_SOURCE";
    },
    evidence() {
      return { complete: delivered };
    },
    ...overrides.reader,
  };
  const env = {
    REVIEW_CONTEXT: JSON.stringify(context),
    REVIEW_SOURCE_DIR: dir,
    RUNNER_TEMP: dir,
    GITHUB_OUTPUT: join(dir, "output"),
    OPENAI_API_KEY: "FAKE_TEST_KEY",
    ...overrides.env,
  };
  const options = {
    env,
    wait: async () => {},
    createReader: async (args) => {
      assert.deepEqual(args, {
        cwd: dir,
        headSha: context.headSha,
        baseSha: context.baseSha,
        changedFiles: context.files,
      });
      return reader;
    },
    fetchImpl: async (url, init) => {
      requests.push({ url, init, body: JSON.parse(init.body) });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      assert.ok(next, "unexpected paid request/retry");
      return next instanceof Response
        ? next
        : new Response(JSON.stringify(next), {
            headers: {
              "content-type": "application/json",
              "x-request-id": `req_${requests.length}`,
            },
          });
    },
    ...overrides.options,
  };
  return {
    dir,
    env,
    reader,
    requests,
    calls,
    options,
    metadata: () =>
      JSON.parse(readFileSync(join(dir, "agent-review-codex-api-metadata.json"), "utf8")),
    noReport: () => {
      assert.equal(existsSync(join(dir, "agent-review-codex-final.json")), false);
      assert.equal(existsSync(env.GITHUB_OUTPUT), false);
    },
  };
}

test("completed final answer writes real report and only whitelisted API metadata", async (t) => {
  const f = fixture(t);
  await runReview(f.options);
  const req = f.requests[0];
  assert.equal(req.url, "https://api.openai.com/v1/responses");
  assert.equal(req.init.method, "POST");
  assert.equal(req.init.redirect, "error");
  assert.equal(req.body.model, "gpt-5.5");
  assert.deepEqual(req.body.reasoning, { effort: "high" });
  assert.equal(req.body.store, false);
  assert.deepEqual(req.body.include, ["reasoning.encrypted_content"]);
  assert.equal(req.body.text.format.type, "json_schema");
  assert.equal(req.body.text.format.strict, true);
  assert.equal(req.body.tools.length, 1);
  assert.equal(req.body.tools[0].strict, true);
  assert.equal("previous_response_id" in req.body, false);
  assert.deepEqual(JSON.parse(readFileSync(join(f.dir, "agent-review-codex-final.json"))), report);
  assert.equal(
    readFileSync(f.env.GITHUB_OUTPUT, "utf8"),
    `final-message=${JSON.stringify(report)}\n`,
  );
  const metadata = f.metadata();
  assert.equal(metadata.completed, true);
  assert.equal(metadata.requests[0].requestId, "req_1");
  assert.equal(metadata.requests[0].responseId, "resp_one");
  assert.equal(metadata.requests[0].usage.total_tokens, 150);
  assert.equal(
    /FAKE_TEST_KEY|PRIVATE_SOURCE|Reviewed all changes/.test(JSON.stringify(metadata)),
    false,
  );
});

test("replays every item with phase/encrypted reasoning/call_id before tool outputs", async (t) => {
  const output = [
    {
      id: "rs_one",
      type: "reasoning",
      summary: [],
      encrypted_content: "ENCRYPTED_PRIVATE_REASONING",
    },
    message("commentary"),
    toolCall(),
  ];
  const f = fixture(t, [response(output), response([message()], { id: "resp_two" })], {
    delivered: true,
  });
  await runReview(f.options);
  const replay = f.requests[1].body.input;
  assert.deepEqual(replay.slice(1, 4), output);
  assert.deepEqual(replay[4], {
    type: "function_call_output",
    call_id: "call_read",
    output: "FULL_BLOB_PRIVATE_SOURCE",
  });
  assert.deepEqual(f.calls, [{ name: "read_source", args: { path: "src/example.ts" } }]);
  assert.equal(JSON.stringify(f.metadata()).includes("ENCRYPTED_PRIVATE_REASONING"), false);
});

test("commentary cannot replace the last final_answer", async (t) => {
  const block = {
    ...report,
    verdict: "BLOCK",
    summary: "A concrete defect.",
    findings: [
      {
        severity: "blocker",
        path: context.files[0],
        line: 1,
        problem: "Invalid guard",
        fix: "Check owner",
      },
    ],
  };
  const f = fixture(t, [response([message("commentary"), message("final_answer", block)])]);
  await runReview(f.options);
  assert.equal(
    JSON.parse(readFileSync(join(f.dir, "agent-review-codex-final.json"))).verdict,
    "BLOCK",
  );
});

const optionalPhaseMessage = (phase, value = report) => {
  const item = message("final_answer", value);
  if (phase === undefined) delete item.phase;
  else item.phase = phase;
  return item;
};

for (const phase of [undefined, null]) {
  test(`accepts a unique strict final JSON with optional phase ${phase}`, async (t) => {
    const f = fixture(t, [response([optionalPhaseMessage(phase)])]);
    await runReview(f.options);
    assert.deepEqual(
      JSON.parse(readFileSync(join(f.dir, "agent-review-codex-final.json"))),
      report,
    );
    assert.equal(f.metadata().completed, true);
  });

  test(`replays an unphased ${phase} preamble and toolcall without inventing a phase`, async (t) => {
    const preamble = {
      ...optionalPhaseMessage(phase),
      content: [{ type: "output_text", text: "I will read the changed source." }],
    };
    const output = [preamble, toolCall()];
    const f = fixture(t, [
      response(output),
      response([optionalPhaseMessage(phase)], { id: "resp_two" }),
    ]);
    await runReview(f.options);
    const replayed = f.requests[1].body.input.slice(1, 3);
    assert.deepEqual(replayed, output);
    assert.equal(Object.hasOwn(replayed[0], "phase"), phase !== undefined);
    if (phase === null) assert.equal(replayed[0].phase, null);
  });
}

test("an unphased preamble before the unique final JSON is not a second verdict", async (t) => {
  const preamble = {
    ...optionalPhaseMessage(undefined),
    content: [{ type: "output_text", text: "Review complete; preparing the report." }],
  };
  const f = fixture(t, [response([preamble, optionalPhaseMessage(null)])]);
  await runReview(f.options);
  assert.equal(f.metadata().completed, true);
});

test("explicit commentary containing a full report cannot replace an optional-phase final", async (t) => {
  const finalReport = {
    ...report,
    verdict: "INCOMPLETE",
    complete: false,
    summary: "More source context is needed.",
    reviewedFiles: [],
  };
  const f = fixture(t, [
    response([message("commentary"), optionalPhaseMessage(null, finalReport)]),
  ]);
  await runReview(f.options);
  assert.equal(
    JSON.parse(readFileSync(join(f.dir, "agent-review-codex-final.json"))).verdict,
    "INCOMPLETE",
  );
});

for (const [name, bad] of [
  ["commentary only", response([message("commentary")])],
  ["unknown phase", response([{ ...message(), phase: "progress" }])],
  ["empty phase", response([{ ...message(), phase: "" }])],
  ["non-string phase", response([{ ...message(), phase: 1 }])],
  [
    "ambiguous optional-phase finals",
    response([optionalPhaseMessage(undefined), optionalPhaseMessage(null)]),
  ],
  ["optional then explicit final", response([optionalPhaseMessage(undefined), message()])],
  ["explicit then optional final", response([message(), optionalPhaseMessage(null)])],
  ["optional final plus tool", response([optionalPhaseMessage(undefined), toolCall()])],
  ["tool plus optional final", response([toolCall(), optionalPhaseMessage(null)])],
  [
    "optional final followed by preamble",
    response([
      optionalPhaseMessage(null),
      {
        ...optionalPhaseMessage(undefined),
        content: [{ type: "output_text", text: "More work follows." }],
      },
    ]),
  ],
  [
    "unphased non-JSON without tool",
    response([
      {
        ...optionalPhaseMessage(undefined),
        content: [{ type: "output_text", text: "Still reviewing." }],
      },
    ]),
  ],
  [
    "unphased wrong-schema JSON",
    response([optionalPhaseMessage(undefined, { ...report, complete: "true" })]),
  ],
  [
    "null-phase refusal",
    response([{ ...optionalPhaseMessage(null), content: [{ type: "refusal", refusal: "No" }] }]),
  ],
  ["incomplete optional final", response([optionalPhaseMessage(null)], { status: "incomplete" })],
  ["incomplete status", response([message()], { status: "incomplete" })],
  [
    "incomplete details",
    response([message()], { incomplete_details: { reason: "max_output_tokens" } }),
  ],
  ["API error", response([message()], { error: { code: "server_error" } })],
  ["wrong model", response([message()], { model: "gpt-5.5-untrusted" })],
  ["missing response ID", response([message()], { id: null })],
  ["refusal", response([{ ...message(), content: [{ type: "refusal", refusal: "No" }] }])],
  [
    "refusal before final",
    response([
      { ...message("commentary"), content: [{ type: "refusal", refusal: "No" }] },
      message(),
    ]),
  ],
  ["unfinished message", response([{ ...message(), status: "in_progress" }])],
  ["duplicate final", response([message(), message()])],
  ["commentary after final", response([message(), message("commentary")])],
  ["final plus tool", response([message(), toolCall()])],
  ["unsupported hosted tool", response([{ type: "shell_call", id: "bad" }, message()])],
  ["unknown tool", response([{ ...toolCall(), name: "shell" }])],
  ["malformed tool arguments", response([{ ...toolCall(), arguments: "bad" }])],
  [
    "extra tool property",
    response([{ ...toolCall(), arguments: '{"path":"a","command":"curl"}' }]),
  ],
  ["duplicate tool IDs", response([toolCall(), toolCall()])],
  [
    "invalid JSON report",
    response([{ ...message(), content: [{ type: "output_text", text: "not JSON" }] }]),
  ],
  ["invalid schema report", response([message("final_answer", { ...report, complete: "true" })])],
])
  test(`rejects ${name} without a report`, async (t) => {
    const f = fixture(t, [bad]);
    await assert.rejects(runReview(f.options));
    f.noReport();
    assert.equal(f.requests.length, 1);
    assert.equal(f.metadata().completed, false);
  });

test("incomplete initial source delivery fails before any paid request", async (t) => {
  const f = fixture(t, undefined, { delivered: false });
  await assert.rejects(runReview(f.options), /source/i);
  assert.equal(f.requests.length, 0);
  assert.equal(f.metadata().sourceDelivery.complete, false);
  assert.equal(f.metadata().failure, "incomplete_source_delivery");
  f.noReport();
});

test("truthful INCOMPLETE remains a valid model report for the publisher", async (t) => {
  const f = fixture(
    t,
    [
      response([
        message("final_answer", {
          ...report,
          verdict: "INCOMPLETE",
          complete: false,
          reviewedFiles: [],
        }),
      ]),
    ],
    { delivered: true },
  );
  await runReview(f.options);
  assert.equal(f.metadata().completed, true);
});

for (const code of [302, 401, 429, 500])
  test(`HTTP ${code} never retries or manufactures a report`, async (t) => {
    const f = fixture(t, [new Response("PRIVATE_ERROR_BODY FAKE_TEST_KEY", { status: code })]);
    await assert.rejects(runReview(f.options));
    assert.equal(f.requests.length, 1);
    f.noReport();
    assert.equal(JSON.stringify(f.metadata()).includes("PRIVATE_ERROR_BODY"), false);
  });

test("uncertain transport failure is not retried or leaked", async (t) => {
  const f = fixture(t, [new Error("FAKE_TEST_KEY private transport")]);
  await assert.rejects(runReview(f.options), (error) => !error.message.includes("FAKE_TEST_KEY"));
  assert.equal(f.requests.length, 1);
  f.noReport();
});

test("round limit leaves tool cycle incomplete with no extra request", async (t) => {
  const f = fixture(t, [response([toolCall()])], { options: { maxRounds: 1 } });
  await assert.rejects(runReview(f.options), /round/i);
  assert.equal(f.requests.length, 1);
  f.noReport();
});

test("deadline aborts a pending fetch and rejects a late final response", async (t) => {
  const f = fixture(t, [], {
    options: {
      maxDurationMs: 15,
      requestTimeoutMs: 10,
      fetchImpl: async (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }),
    },
  });
  await assert.rejects(runReview(f.options), /time/i);
  f.noReport();
});

test("request deadline includes a response body that never finishes", async (t) => {
  let aborted = false;
  const f = fixture(t, [], {
    options: {
      requestTimeoutMs: 10,
      fetchImpl: async (_url, init) => {
        init.signal.addEventListener(
          "abort",
          () => {
            aborted = true;
          },
          { once: true },
        );
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{"id":'));
            },
          }),
        );
      },
    },
  });
  await assert.rejects(runReview(f.options), /time_limit/);
  assert.equal(aborted, true);
  f.noReport();
});

test("a response received after the total deadline cannot produce a report", async (t) => {
  let clock = 0;
  const f = fixture(t, [], {
    options: {
      maxDurationMs: 20,
      now: () => clock,
      fetchImpl: async () => {
        clock = 25;
        return new Response(JSON.stringify(response()));
      },
    },
  });
  await assert.rejects(runReview(f.options), /time_limit/);
  f.noReport();
});

test("failure after a tool round never promotes earlier commentary", async (t) => {
  const f = fixture(t, [
    response([message("commentary"), toolCall()]),
    new Error("connection lost"),
  ]);
  await assert.rejects(runReview(f.options));
  assert.equal(f.requests.length, 2);
  f.noReport();
});

test("call IDs cannot be reused across completed API responses", async (t) => {
  const f = fixture(t, [response([toolCall()]), response([toolCall()], { id: "resp_two" })]);
  await assert.rejects(runReview(f.options), /function_call/);
  assert.equal(f.calls.length, 1);
  f.noReport();
});

test("reader failure stops before another paid request and does not leak errors", async (t) => {
  const f = fixture(t, [response([toolCall()])], {
    reader: {
      callTool: async () => {
        throw new Error("PRIVATE_SOURCE");
      },
    },
  });
  await assert.rejects(runReview(f.options), /source_tool_error/);
  assert.equal(f.requests.length, 1);
  assert.equal(JSON.stringify(f.metadata()).includes("PRIVATE_SOURCE"), false);
  f.noReport();
});

test("missing or impossible usage is not replaced with invented costs", async (t) => {
  for (const usage of [null, { input_tokens: 10, output_tokens: 20, total_tokens: 1 }]) {
    const f = fixture(t, [response([message()], { usage })]);
    await assert.rejects(runReview(f.options), /usage/);
    assert.equal(f.metadata().requests[0].usage, null);
    f.noReport();
  }
});

test("final report with newline text remains exactly one GITHUB_OUTPUT key", async (t) => {
  const f = fixture(t, [
    response([
      message("final_answer", { ...report, summary: "line one\nmalicious-key=PASS\nline three" }),
    ]),
  ]);
  await runReview(f.options);
  assert.equal(readFileSync(f.env.GITHUB_OUTPUT, "utf8").split("\n").length, 2);
});

test("stale final file cannot be reused and fails before spending", async (t) => {
  const f = fixture(t);
  writeFileSync(join(f.dir, "agent-review-codex-final.json"), "STALE_PASS");
  await assert.rejects(runReview(f.options));
  assert.equal(f.requests.length, 0);
  assert.equal(existsSync(f.env.GITHUB_OUTPUT), false);
});

test("missing key or malformed context fails before spending", async (t) => {
  for (const env of [{ OPENAI_API_KEY: "" }, { REVIEW_CONTEXT: "{}" }]) {
    const f = fixture(t, undefined, { env });
    await assert.rejects(runReview(f.options));
    assert.equal(f.requests.length, 0);
    f.noReport();
  }
});

test("real Git source reader integrates with the stateless fake API cycle", async (t) => {
  const { createSourceReader } = await import("./review-source-reader.mjs");
  const f = fixture(t);
  const git = (...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "user.name=Offline Review Test",
        "-c",
        "user.email=review@example.invalid",
        ...args,
      ],
      {
        cwd: f.dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
      },
    ).trim();
  git("init", "--template=", "--initial-branch=main");
  mkdirSync(join(f.dir, "src"));
  writeFileSync(join(f.dir, context.files[0]), "export const value = 1;\n");
  git("add", "src/example.ts");
  git("commit", "-m", "Offline base fixture");
  const baseSha = git("rev-parse", "HEAD");
  writeFileSync(join(f.dir, context.files[0]), "export const value = 2;\n");
  git("add", "src/example.ts");
  git("commit", "-m", "Offline head fixture");
  const headSha = git("rev-parse", "HEAD");
  f.options.env.REVIEW_CONTEXT = JSON.stringify({ ...context, headSha, baseSha });
  const realReader = await createSourceReader({
    cwd: f.dir,
    headSha,
    baseSha,
    changedFiles: context.files,
  });
  f.options.createReader = async () => realReader;
  let round = 0;
  f.options.fetchImpl = async (url, init) => {
    round++;
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(init.body);
    assert.match(body.input[0].content, /export const value = 1/);
    assert.match(body.input[0].content, /export const value = 2/);
    assert.ok(body.tools.length > 0);
    assert.ok(body.tools.every((tool) => tool.type === "function" && tool.strict === true));
    if (round === 1)
      return new Response(
        JSON.stringify(
          response([
            {
              ...toolCall(),
              arguments: JSON.stringify({
                path: context.files[0],
                revision: "head",
                start_line: 1,
                max_lines: 500,
              }),
            },
          ]),
        ),
      );
    assert.equal(round, 2);
    assert.equal(body.input.at(-1).type, "function_call_output");
    assert.match(body.input.at(-1).output, /export const value = 2/);
    return new Response(
      JSON.stringify(response([message("final_answer", { ...report, headSha, baseSha })])),
      {
        headers: { "x-request-id": "req_real_reader_fixture" },
      },
    );
  };
  await runReview(f.options);
  assert.equal(f.metadata().sourceDelivery.complete, true);
  assert.equal(f.metadata().completed, true);
  assert.equal(f.metadata().sourceDelivery.reads.length, 1);
  assert.equal(round, 2);
  assert.equal(JSON.stringify(f.metadata()).includes("export const value"), false);
});


test("large-context rounds are paced without repeating any POST", async (t) => {
  let clock = 0;
  const waits = [];
  const f = fixture(t, [response([toolCall()]), response()]);
  f.options.now = () => clock;
  f.options.wait = async (ms) => { waits.push(ms); clock += ms; };
  await runReview(f.options);
  assert.deepEqual(waits, [61000]);
  assert.equal(f.requests.length, 2);
});

test("pacing cannot outlive the total review budget or issue another request", async (t) => {
  const f = fixture(t, [response([toolCall()]), response()]);
  f.options.now = () => 0;
  f.options.maxDurationMs = 60000;
  f.options.wait = async () => assert.fail("must reject an unaffordable wait");
  await assert.rejects(runReview(f.options), /time_limit/);
  assert.equal(f.requests.length, 1);
});

test("slow model turns already satisfy pacing and need no added wait", async (t) => {
  let clock = 0;
  const f = fixture(t, [response([toolCall()]), response()]);
  const fetchImpl = f.options.fetchImpl;
  f.options.now = () => clock;
  f.options.fetchImpl = async (...args) => { const response = await fetchImpl(...args); clock += 62000; return response; };
  f.options.wait = async () => assert.fail("no additional delay expected");
  await runReview(f.options);
  assert.equal(f.requests.length, 2);
});
