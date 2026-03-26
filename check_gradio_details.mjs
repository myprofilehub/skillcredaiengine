import { client } from "@gradio/client";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const app = await client("multimodalart/stable-video-diffusion", { hf_token: process.env.HUGGINGFACE_API_KEY });
  const apiInfo = await app.view_api();
  console.log(JSON.stringify(apiInfo.named_endpoints['/video'], null, 2));
}

run().catch(console.error);
