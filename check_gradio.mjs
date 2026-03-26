import { client } from "@gradio/client";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const app = await client("hysts/Shap-E", { hf_token: process.env.HUGGINGFACE_API_KEY });
    console.log(await app.view_api());
  } catch(e) { console.error("Shap-E error", e.message); }
  
  try {
    const app2 = await client("multimodalart/stable-video-diffusion", { hf_token: process.env.HUGGINGFACE_API_KEY });
    console.log(await app2.view_api());
  } catch(e) { console.error("SVD error", e.message); }
}

run().catch(console.error);
