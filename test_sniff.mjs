import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function run() {
  const url = process.env.KAGGLE_VIDEO_ENDPOINT;
  console.log("URL from .env:", url);

  try {
    console.log("\nPinging endpoint...");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
        "User-Agent": "skillcred-api-client/1.0"
      },
      body: JSON.stringify({
        prompt: "A dog running in a park",
        aspectRatio: "16:9"
      })
    });

    console.log("HTTP Status:", res.status);
    const text = await res.text();

    // Check if it's HTML (error page) or JSON
    if (text.trim().startsWith("<")) {
      console.log("❌ Got HTML error page (first 300 chars):");
      console.log(text.substring(0, 300));
    } else {
      try {
        const json = JSON.parse(text);
        console.log("✅ Got JSON response!");
        console.log("Keys:", Object.keys(json));
        console.log("success:", json.success);
        if (json.video_base64) console.log("video_base64 length:", json.video_base64.length);
        if (json.image_base64) console.log("image_base64 length:", json.image_base64.length);
        if (json.error) console.log("error:", json.error);
        if (json.message) console.log("message:", json.message);
      } catch {
        console.log("❌ Got non-JSON text:", text.substring(0, 300));
      }
    }
  } catch (e) {
    console.log("❌ FETCH ERROR:", e.message);
  }
}

run();
