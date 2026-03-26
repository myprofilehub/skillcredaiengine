async function test(url) {
  try {
    console.log("\n=========================");
    console.log("Pinging ->", url);
    const res = await fetch(`${url}/generate_full_video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
        "User-Agent": "skillcred-api-client/1.0"
      },
      body: JSON.stringify({
        topic: "Test ping",
        style: "Test",
        num_scenes: 1
      })
    });
    
    console.log("STATUS:", res.status, res.statusText);
    const text = await res.text();
    console.log("RESPONSE BODY HEAD:", text.substring(0, 200).replace(/\n/g, " "));
  } catch(e) {
    console.error("FETCH ERROR:", e);
  }
}

async function run() {
    await test("https://a8fe2d3869451.notebooksn.jarvislabs.net");
    await test("https://a8fe2d3869452.notebooksn.jarvislabs.net");
}
run();
