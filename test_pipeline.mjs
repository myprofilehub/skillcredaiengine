import { HfInference } from "@huggingface/inference";
import { client } from "@gradio/client";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

async function run() {
  try {
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    console.log("1. Generating SDXL Image using HF Serverless...");
    const imageBlob = await hf.textToImage({
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: "A futuristic cyberpunk city with flying cars"
    });
    
    // Save locally to debug
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync("test_image.jpg", buffer);
    console.log("Image saved! Size:", buffer.length);
    
    // Convert Blob to File format required by Gradio
    const imageFile = new File([imageBlob], "test_image.jpg", { type: "image/jpeg" });
    
    console.log("2. Connecting to SVD Gradio Space...");
    const app = await client("multimodalart/stable-video-diffusion", { hf_token: process.env.HUGGINGFACE_API_KEY });
    
    console.log("3. Submitting to queue (This could take 2-5 minutes)...");
    const result = await app.predict("/video", [
      imageBlob, // image
      0, // seed
      true, // randomize_seed
      127, // motion_bucket_id
      6 // fps_id
    ]);
    
    console.log("SUCCESS! Result:", result);
    
    // result.data[0].video is the filepath or URL
    
  } catch (e) {
    console.error("Pipeline failed:", e.message);
  }
}

run();
