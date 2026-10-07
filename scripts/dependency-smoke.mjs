import assert from "node:assert/strict"
import fs from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const require = createRequire(import.meta.url)
const virtualRequire = createRequire(
  new URL("../node_modules/.pnpm/node_modules/security-smoke.cjs", import.meta.url),
)
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const lock = fs.readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8")

for (const dependencies of [packageJson.dependencies, packageJson.devDependencies]) {
  for (const specifier of Object.values(dependencies ?? {})) {
    assert.doesNotMatch(specifier, /^(?:git(?:\+|:)|https?:|file:|link:|workspace:)/i)
  }
}
assert.doesNotMatch(lock, /(?:git\+|github\.com\/|\b(?:file|link):|\btarball:)/i)

const versionFloors = {
  "@babel/core": "7.29.7",
  "@opentelemetry/core": "2.10.0",
  "brace-expansion": "1.1.21",
  "fast-uri": "3.1.8",
  "nanoid": "3.3.19",
  "postcss": "8.5.23",
}
for (const [name, floor] of Object.entries(versionFloors)) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const matches = [...lock.matchAll(new RegExp(`^  ['"]?${escapedName}@([^:\\s('"]+)`, "gm"))]
  assert.ok(matches.length, `missing lock entry: ${name}`)
  for (const match of matches) {
    const required = (name === "brace-expansion" && match[1].startsWith("5.")) ? "5.0.12" : floor
    const actual = match[1].split(".").map(Number)
    const minimum = required.split(".").map(Number)
    const firstDifference = actual.findIndex((part, index) => part !== minimum[index])
    assert.ok(firstDifference === -1 || actual[firstDifference] > minimum[firstDifference], `${name}@${match[1]} below security floor ${required}`)
  }
}

const fastUri = virtualRequire("fast-uri")
const validUri = fastUri.parse("https://trusted.example/path")
assert.equal(validUri.error, undefined)
assert.equal(validUri.host, "trusted.example")
for (const maliciousUri of [
  "https://trusted.example\\@evil.example/path",
  "https:\\\\evil.example/path",
]) {
  assert.match(fastUri.parse(maliciousUri).error, /literal backslash/i)
}

const braceRequire = createRequire(
  new URL(
    "../node_modules/.pnpm/brace-expansion@5.0.12/node_modules/brace-expansion/package.json",
    import.meta.url,
  ),
)
const braceExpansion = braceRequire("brace-expansion")
const expand = braceExpansion.expand ?? braceExpansion
assert.deepEqual(expand("dataset-{train,test}"), ["dataset-train", "dataset-test"])
const expansionStarted = Date.now()
assert.equal(expand("{}".repeat(40), { max: 1_000 }).length, 1)
assert.equal(expand("{1..1000000000}", { max: 1_000 }).length, 1_000)
assert.ok(Date.now() - expansionStarted < 1_000, "brace-expansion limits were not applied promptly")

const { ROOT_CONTEXT, propagation } = virtualRequire("@opentelemetry/api")
const { W3CBaggagePropagator } = virtualRequire("@opentelemetry/core")
const oversizedBaggage = Array.from({ length: 1_000 }, (_, index) => `key${index}=value`).join(",")
const extractedContext = new W3CBaggagePropagator().extract(
  ROOT_CONTEXT,
  { baggage: oversizedBaggage },
  { get: (carrier, key) => carrier[key], keys: (carrier) => Object.keys(carrier) },
)
assert.equal(propagation.getBaggage(extractedContext).getAllEntries().length, 180)

const temporaryDirectory = await mkdtemp(join(tmpdir(), "minariviz-postcss-"))
const secretPath = join(temporaryDirectory, "secret.map")
await writeFile(secretPath, "MINARIVIZ_SECRET_SENTINEL")
const originalReadFileSync = fs.readFileSync
let secretWasRead = false
fs.readFileSync = function guardedRead(path, ...args) {
  if (typeof path === "string" && resolve(path) === resolve(secretPath)) secretWasRead = true
  return originalReadFileSync.call(this, path, ...args)
}
try {
  const postcss = require("postcss")
  const result = await postcss().process(
    `a{color:red}\n/*# sourceMappingURL=${secretPath} */`,
    { from: undefined },
  )
  assert.equal(result.css, "a{color:red}")
  assert.equal(secretWasRead, false, "PostCSS followed an attacker-controlled source map path")
} finally {
  fs.readFileSync = originalReadFileSync
  await rm(temporaryDirectory, { recursive: true })
}
