import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://api.openai.com/v1/responses";
const MODELS = new Set(["gpt-5.5", "gpt-5.5-2026-04-23"]);
const MAX_DURATION = 35 * 60_000;
const MAX_ROUNDS = 40;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = 16 * 1024 * 1024;
const MAX_REPORT_BYTES = 500_000;

class ReviewError extends Error {
  constructor(code) {
    super(`Review did not complete: ${code}. No verdict was published.`);
    this.code = code;
  }
}
const fail = (code) => {
  throw new ReviewError(code);
};
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const identifier = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value);

function parseContext(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("invalid_context");
  }
  if (
    !object(value) ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.repository ?? "") ||
    !Number.isSafeInteger(value.pr) ||
    value.pr <= 0 ||
    !/^[a-f0-9]{40}$/.test(value.headSha ?? "") ||
    !/^[a-f0-9]{40}$/.test(value.baseSha ?? "") ||
    !Array.isArray(value.files) ||
    value.files.length < 1 ||
    value.files.length > 3000 ||
    value.files.some(
      (path) => typeof path !== "string" || !path || path.length > 4096 || path.includes("\0"),
    ) ||
    new Set(value.files).size !== value.files.length
  )
    fail("invalid_context");
  return {
    repository: value.repository,
    pr: value.pr,
    headSha: value.headSha,
    baseSha: value.baseSha,
    files: value.files,
  };
}

// This deliberately supports only the types used by the trusted review schema
// and source tools. Unknown schema constraints fail closed rather than being ignored.
function matchesSchema(value, schema) {
  const supported = [
    "type",
    "properties",
    "required",
    "additionalProperties",
    "items",
    "enum",
    "description",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
  ];
  if (!object(schema) || Object.keys(schema).some((key) => !supported.includes(key))) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === "object") {
    return (
      object(value) &&
      schema.additionalProperties === false &&
      object(schema.properties) &&
      Array.isArray(schema.required) &&
      schema.required.every((key) => Object.hasOwn(value, key)) &&
      Object.keys(value).every(
        (key) =>
          Object.hasOwn(schema.properties, key) &&
          matchesSchema(value[key], schema.properties[key]),
      )
    );
  }
  if (schema.type === "array")
    return Array.isArray(value) && value.every((item) => matchesSchema(item, schema.items));
  if (schema.type === "string")
    return (
      typeof value === "string" &&
      (schema.minLength === undefined || value.length >= schema.minLength) &&
      (schema.maxLength === undefined || value.length <= schema.maxLength)
    );
  if (schema.type === "integer")
    return (
      Number.isSafeInteger(value) &&
      (schema.minimum === undefined || value >= schema.minimum) &&
      (schema.maximum === undefined || value <= schema.maximum)
    );
  if (schema.type === "boolean") return typeof value === "boolean";
  return false;
}

function usageEvidence(usage) {
  if (
    !object(usage) ||
    ![usage.input_tokens, usage.output_tokens, usage.total_tokens].every(integer) ||
    usage.input_tokens + usage.output_tokens !== usage.total_tokens
  )
    return null;
  const result = {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    total_tokens: usage.total_tokens,
  };
  for (const [field, detail, maximum] of [
    ["input_tokens_details", "cached_tokens", usage.input_tokens],
    ["output_tokens_details", "reasoning_tokens", usage.output_tokens],
  ]) {
    const number = usage[field]?.[detail];
    if (number !== undefined) {
      if (!integer(number) || number > maximum) return null;
      result[field] = { [detail]: number };
    }
  }
  return result;
}

async function bounded(operation, milliseconds) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ReviewError("time_limit"));
        }, milliseconds);
      }),
    ]);
  } catch (error) {
    if (controller.signal.aborted) fail("time_limit");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readResponse(response) {
  if (!response.body) fail("missing_response_body");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) fail("response_size_limit");
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof ReviewError) throw error;
    fail("invalid_response_body");
  }
}

function inspectOutput(response, tools, callIds, schema) {
  if (
    response.status !== "completed" ||
    response.error != null ||
    response.incomplete_details != null
  )
    fail("incomplete_response");
  if (!Array.isArray(response.output) || !response.output.length) fail("missing_output");
  const calls = [];
  let finalText;
  for (const item of response.output) {
    if (!object(item) || (item.status !== undefined && item.status !== "completed"))
      fail("incomplete_output_item");
    if (item.type === "reasoning") continue;
    if (item.type === "function_call") {
      if (
        finalText !== undefined ||
        !identifier(item.call_id) ||
        callIds.has(item.call_id) ||
        !tools.has(item.name) ||
        typeof item.arguments !== "string" ||
        item.arguments.length > 50_000
      )
        fail("invalid_function_call");
      let args;
      try {
        args = JSON.parse(item.arguments);
      } catch {
        fail("invalid_function_arguments");
      }
      if (!matchesSchema(args, tools.get(item.name).parameters)) fail("invalid_function_arguments");
      callIds.add(item.call_id);
      calls.push({ name: item.name, callId: item.call_id, args });
      continue;
    }
    if (
      item.type !== "message" ||
      item.role !== "assistant" ||
      item.status !== "completed" ||
      (item.phase != null && !["commentary", "final_answer"].includes(item.phase)) ||
      !Array.isArray(item.content) ||
      !item.content.length
    )
      fail("invalid_assistant_output");
    if (item.content.some((part) => part.type === "refusal")) fail("model_refusal");
    if (item.content.some((part) => part.type !== "output_text" || typeof part.text !== "string"))
      fail("invalid_message_content");
    if (finalText !== undefined) fail("ambiguous_final_answer");
    const text = item.content.map((part) => part.text).join("");
    if (item.phase === "final_answer") finalText = text;
    // The official response message schema permits missing/null phase. Only a
    // strict report is a final candidate in that case; ordinary tool preambles
    // remain replayable. Never reinterpret explicit commentary as a verdict.
    if (item.phase == null && Buffer.byteLength(text) <= MAX_REPORT_BYTES) {
      let candidate;
      try {
        candidate = JSON.parse(text);
      } catch {
        // An unphased preamble is not a report.
      }
      if (matchesSchema(candidate, schema)) finalText = text;
    }
  }
  if (calls.length) {
    if (finalText !== undefined) fail("final_answer_with_open_calls");
    return { calls };
  }
  if (finalText === undefined || Buffer.byteLength(finalText) > MAX_REPORT_BYTES)
    fail("missing_or_oversized_final_answer");
  let report;
  try {
    report = JSON.parse(finalText);
  } catch {
    fail("invalid_final_json");
  }
  if (!matchesSchema(report, schema)) fail("invalid_final_schema");
  return { calls, report };
}

async function defaultReader(args) {
  const { createSourceReader } = await import("./review-source-reader.mjs");
  return createSourceReader(args);
}

// The CLI cannot override endpoint, model, trusted prompt/schema or raise limits.
// Injectable transport/clock/reader and lower limits make offline fault tests possible.
export async function runReview({
  env = process.env,
  fetchImpl = fetch,
  createReader = defaultReader,
  now = () => performance.now(),
  maxRounds = MAX_ROUNDS,
  maxDurationMs = MAX_DURATION,
  requestTimeoutMs = 10 * 60_000,
} = {}) {
  const started = now();
  const metadata = {
    version: 1,
    model: "gpt-5.5",
    reasoningEffort: "high",
    completed: false,
    requests: [],
  };
  let reader, finalPath, metadataPath;
  const remaining = () => {
    const value = maxDurationMs - (now() - started);
    if (value <= 0) fail("time_limit");
    return value;
  };
  const saveMetadata = () => {
    metadata.elapsedMs = Math.max(0, Math.round(now() - started));
    if (reader) metadata.sourceDelivery = reader.evidence();
    if (metadataPath)
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + "\n", { mode: 0o600 });
  };
  try {
    if (
      !Number.isSafeInteger(maxRounds) ||
      maxRounds < 1 ||
      maxRounds > MAX_ROUNDS ||
      !Number.isSafeInteger(maxDurationMs) ||
      maxDurationMs < 1 ||
      maxDurationMs > MAX_DURATION ||
      !Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs < 1 ||
      requestTimeoutMs > MAX_DURATION
    )
      fail("invalid_limits");
    if (
      !env.RUNNER_TEMP ||
      !isAbsolute(env.RUNNER_TEMP) ||
      !env.GITHUB_OUTPUT ||
      !isAbsolute(env.GITHUB_OUTPUT)
    )
      fail("invalid_output_paths");
    finalPath = join(env.RUNNER_TEMP, "agent-review-codex-final.json");
    metadataPath = join(env.RUNNER_TEMP, "agent-review-codex-api-metadata.json");
    if (existsSync(finalPath)) fail("preexisting_final_artifact");
    if (!env.OPENAI_API_KEY || /[\r\n]/.test(env.OPENAI_API_KEY)) fail("missing_credentials");
    if (!env.REVIEW_SOURCE_DIR || !isAbsolute(env.REVIEW_SOURCE_DIR))
      fail("invalid_source_directory");
    const context = parseContext(env.REVIEW_CONTEXT);
    metadata.context = {
      repository: context.repository,
      pr: context.pr,
      headSha: context.headSha,
      baseSha: context.baseSha,
    };
    const prompt = readFileSync(join(ROOT, ".github/codex/agent-review.md"), "utf8");
    const schema = JSON.parse(
      readFileSync(join(ROOT, ".github/codex/agent-review.schema.json"), "utf8"),
    );
    reader = await bounded(
      () =>
        createReader({
          cwd: env.REVIEW_SOURCE_DIR,
          headSha: context.headSha,
          baseSha: context.baseSha,
          changedFiles: context.files,
        }),
      remaining(),
    );
    if (
      !reader ||
      typeof reader.initialContext !== "string" ||
      !reader.initialContext ||
      !Array.isArray(reader.tools) ||
      !reader.tools.length ||
      typeof reader.callTool !== "function" ||
      typeof reader.evidence !== "function"
    )
      fail("invalid_source_reader");
    const tools = new Map();
    for (const tool of reader.tools) {
      if (
        tool.type !== "function" ||
        tool.strict !== true ||
        !identifier(tool.name) ||
        tools.has(tool.name) ||
        tool.parameters?.type !== "object" ||
        tool.parameters.additionalProperties !== false
      )
        fail("invalid_source_tools");
      tools.set(tool.name, tool);
    }
    // Initial diff delivery is immutable; unsupported source cannot be repaired
    // by later tool calls. Do not spend on a review that cannot be completed.
    if (reader.evidence()?.complete !== true) fail("incomplete_source_delivery");
    const input = [
      {
        role: "user",
        content: `Immutable review context:\n${JSON.stringify(context)}\n\n${reader.initialContext}`,
      },
    ];
    const callIds = new Set();
    for (let round = 1; round <= maxRounds; round++) {
      const timeout = Math.min(remaining(), requestTimeoutMs);
      const body = JSON.stringify({
        model: "gpt-5.5",
        reasoning: { effort: "high" },
        store: false,
        include: ["reasoning.encrypted_content"],
        instructions: prompt,
        input,
        tools: reader.tools,
        max_output_tokens: 32768,
        text: { format: { type: "json_schema", name: "agent_review", strict: true, schema } },
      });
      if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) fail("request_size_limit");
      const record = { round };
      metadata.requests.push(record);
      saveMetadata();
      // One POST per round. Even HTTP 429/5xx or an uncertain connection failure
      // must not repeat a potentially billable model request.
      const response = await bounded(async (signal) => {
        let http;
        try {
          http = await fetchImpl(ENDPOINT, {
            method: "POST",
            redirect: "error",
            signal,
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body,
          });
        } catch {
          fail("transport_error");
        }
        record.httpStatus = http.status;
        const requestId = http.headers.get("x-request-id");
        if (identifier(requestId)) record.requestId = requestId;
        if (!http.ok || http.redirected) {
          await http.body?.cancel().catch(() => {});
          fail("http_error");
        }
        return readResponse(http);
      }, timeout);
      remaining();
      if (!object(response) || !identifier(response.id) || !MODELS.has(response.model))
        fail("invalid_response_identity");
      record.responseId = response.id;
      record.model = response.model;
      record.usage = usageEvidence(response.usage);
      if (!record.usage) fail("missing_or_invalid_usage");
      const { calls, report } = inspectOutput(response, tools, callIds, schema);
      // Preserve every original output item, including assistant phase, call_id
      // and encrypted reasoning. store:false means none can be reconstructed later.
      input.push(...response.output);
      if (report) {
        if (report.complete && reader.evidence()?.complete !== true)
          fail("incomplete_source_delivery");
        remaining();
        const serialized = JSON.stringify(report);
        writeFileSync(finalPath, serialized + "\n", { flag: "wx", mode: 0o600 });
        appendFileSync(env.GITHUB_OUTPUT, `final-message=${serialized}\n`);
        metadata.completed = true;
        saveMetadata();
        return report;
      }
      if (round === maxRounds) fail("round_limit");
      for (const call of calls) {
        let output;
        try {
          output = await bounded(() => reader.callTool(call.name, call.args), remaining());
        } catch (error) {
          if (error instanceof ReviewError) throw error;
          fail("source_tool_error");
        }
        if (typeof output !== "string" || Buffer.byteLength(output) > MAX_REQUEST_BYTES)
          fail("invalid_source_tool_output");
        input.push({ type: "function_call_output", call_id: call.callId, output });
      }
      saveMetadata();
    }
    fail("round_limit");
  } catch (error) {
    const safeError = error instanceof ReviewError ? error : new ReviewError("runner_error");
    metadata.failure = safeError.code;
    saveMetadata();
    throw safeError;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runReview().catch((error) => {
    // Never print transport bodies, source content, reasoning or credentials.
    console.error(error instanceof ReviewError ? error.message : "Review runner failed.");
    process.exitCode = 1;
  });
}
