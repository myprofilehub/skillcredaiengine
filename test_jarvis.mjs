import fs from "fs";

const urls = [
  "https://2a215a3866571.notebooksn.jarvislabs.net",
  "https://2a215a3866572.notebooksn.jarvislabs.net",
  "https://2a215a3866571.notebooksn.jarvislabs.net/health",
  "https://2a215a3866572.notebooksn.jarvislabs.net/health",
  "https://2a215a3866571.notebooksn.jarvislabs.net/generate",
  "https://2a215a3866572.notebooksn.jarvislabs.net/generate",
];

async function test(url) {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    const preview = text.substring(0, 150).replace(/\n/g, ' ');
    console.log(`✅ ${res.status} ${url}\n   ${preview}\n`);
  } catch (e) {
    console.log(`❌ ${url}\n   ${e.message}\n`);
  }
}

(async () => {
  for (const u of urls) await test(u);
})();
