import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/api.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const api = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`)
const originalFetch = globalThis.fetch
const originalTimeout = AbortSignal.timeout
let timeout
let request
AbortSignal.timeout = (milliseconds) => {
  timeout = milliseconds
  return new AbortController().signal
}
globalThis.fetch = async (url) => {
  request = url
  return new Response(JSON.stringify({ status: "ok" }))
}
try {
  assert.equal(await api.checkApiHealth(), true)
  assert.equal(request, "/api/health", "Hosted viewers must reach the API through their own origin, never visitor localhost")
  assert.ok(timeout >= 60_000, "Health checks must allow the hosted API to wake up")
  globalThis.fetch = async () => new Response("<html>not an API</html>")
  assert.equal(await api.checkApiHealth(), false, "An HTML page must not count as a healthy API")
} finally {
  globalThis.fetch = originalFetch
  AbortSignal.timeout = originalTimeout
}

const oldNodeEnv = process.env.NODE_ENV
const oldApiUrl = process.env.NEXT_PUBLIC_API_URL
process.env.NODE_ENV = "production"
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000"
try {
  const { default: config, resolveObservationApiUrl } = await import("../next.config.mjs")
  const rewrites = await config.rewrites()
  assert.deepEqual(rewrites, [{ source: "/api/:path*", destination: "https://minariviz-api.onrender.com/api/:path*" }])
  for (const value of [undefined, "", "  ", "http://127.0.0.1:8000", "http://[::1]:8000"]) {
    assert.equal(resolveObservationApiUrl(value, true), "https://minariviz-api.onrender.com")
  }
  assert.equal(resolveObservationApiUrl(undefined, false), "http://localhost:8000")
  assert.equal(resolveObservationApiUrl("http://localhost:8100/", false), "http://localhost:8100")
  assert.equal(resolveObservationApiUrl(" https://api.example.com/ ", true), "https://api.example.com")
} finally {
  if (oldNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = oldNodeEnv
  if (oldApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL
  else process.env.NEXT_PUBLIC_API_URL = oldApiUrl
}
console.log("Observation API routing and cold-start checks passed")
