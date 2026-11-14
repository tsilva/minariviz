import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadavg } from "node:os";

if (process.env.GITHUB_ACTIONS !== "true") throw new Error("Brave automation is restricted to the reviewed CI job");
const require = createRequire(import.meta.url);
const { chromium } = require("./tools/node_modules/playwright-core");
const [output, cohortText, sequenceText] = process.argv.slice(2);
const cohort = Number(cohortText);
if (!output || ![1, 2].includes(cohort)) throw new Error("Invalid comparison arguments");
const sequence = JSON.parse(sequenceText);
const urls = JSON.parse(await readFile(join(output, "urls.json"), "utf8"));
let samples;
try { samples = JSON.parse(await readFile(join(output, "samples.json"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; samples = []; }
for (const variant of sequence) {
  if (!["baseline", "candidate"].includes(variant)) throw new Error("Unexpected variant");
  const browser = await chromium.launch({ executablePath: "/usr/bin/brave-browser", headless: true, chromiumSandbox: true });
  try {
    const version = browser.version();
    await writeFile(join(output, "browser.json"), JSON.stringify({ family: "Brave Stable", version, sandbox: true }));
    const page = await browser.newPage({ viewport: { width: 1350, height: 940 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    const sampleId = `${cohort}-${samples.length}-${variant}`;
    await page.goto(urls[variant] + "?sample=" + sampleId, { waitUntil: "networkidle", timeout: 30000 });
    const cards = await page.locator('button[aria-controls="dataset-inspector"]').evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")));
    if (cards.length !== 34) throw new Error("Catalogue cardinality changed");
    await page.getByRole("button", { name: "Breakout, Expert, Atari v0", exact: true }).click();
    await page.locator('#comparison-probe[data-detail-ready="true"]').waitFor({ state: "attached", timeout: 15000 });
    const probe = JSON.parse(await page.locator("#comparison-probe").textContent());
    if (probe.sampleId !== sampleId || !Number.isFinite(probe.detailMs) || !Number.isFinite(probe.lcpMs)) throw new Error("Incomplete correlated browser sample");
    const detail = (await page.locator("#dataset-inspector").innerText()).replace(/\s+/g, " ").trim();
    const detailMetadata = { heading: await page.locator("#dataset-inspector h2").textContent(), code: await page.locator("#dataset-inspector pre").textContent(), tabs: await page.locator("#dataset-inspector [role=tab]").allTextContents() };
    samples.push({ cohort, variant, ...probe, cards, detail, detailMetadata, errors, hostLoad: loadavg() });
    await writeFile(join(output, "samples.json"), JSON.stringify(samples, null, 2));
    if (samples.filter((sample) => sample.variant === variant).length === 1) await page.screenshot({ path: join(output, variant + "-detail.png"), fullPage: false });
  } finally { await browser.close(); }
}
