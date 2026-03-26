import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function run() {
  try {
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    console.log("Requesting video...");
    const video = await hf.textToVideo({
      model: "ali-vilab/modelscope-damo-text-to-video-synthesis",
      inputs: "A futuristic city"
    });
    console.log("Success!", video.type, video.size);
  } catch (e) {
    console.error("TextToVideo failed:", e.message);
  }
}

run();
