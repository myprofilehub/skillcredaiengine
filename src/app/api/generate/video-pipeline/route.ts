export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-videos');

export async function POST(req: Request) {
  try {
    const { topic, style = "Cinematic and professional", scenes: overrideScenes, videoId } = await req.json();

    const colabUrl = process.env.KAGGLE_VIDEO_ENDPOINT;
    if (!colabUrl) throw new Error("Missing KAGGLE_VIDEO_ENDPOINT in .env file");
    
    // Safety trailing-slash removal
    const baseUrl = colabUrl.replace(/\/+$/, '');

    // Ensure output directory exists locally for the final completed video
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TRIGGER MASTER HUNYUANVIDEO 1.5 PIPELINE ON JARVISLABS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // If the frontend already generated a script, we force Qwen to use exact wording.
    // Otherwise, Qwen dynamically generates 30 scenes entirely autonomously!
    const payloadTopic = overrideScenes 
      ? `Use EXACTLY these visual descriptions and narrations, do not change them or add to them, just reformat into JSON: ${JSON.stringify(overrideScenes)}`
      : topic;

    // Use exactly 12 scenes (12 scenes x 5s = 60s) for the new 121-frame standard
    const numScenes = overrideScenes ? overrideScenes.length : 12;

    console.log(`Submitting full payload to Native HunyuanVideo 1.5 on JarvisLabs...`);
    const generateUrl = `${baseUrl}/generate_full_video`;
    
    const startRes = await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
        "User-Agent": "skillcred-api-client/1.0"
      },
      body: JSON.stringify({
        topic: payloadTopic,
        style: style,
        num_scenes: numScenes
      })
    });

    if (!startRes.ok) {
      const errorText = await startRes.text();
      throw new Error(`JarvisLabs Server returned HTTP ${startRes.status}: ${errorText.substring(0, 100)}`);
    }

    const startData = await startRes.json();
    if (!startData.success || !startData.job_id) {
      throw new Error(startData.error || "JarvisLabs master-server failed to acknowledge job");
    }

    const jobId = startData.job_id;
    console.log(`Master Video Pipeline Job [${jobId}] active across Dual A100 GPUs! Polling...`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // POLL UNTIL COMPLETE (Handles 30 minutes of parallel generation gracefully)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let finalVideoBase64 = null;
    let finalTime = 0;
    
    while (true) {
      await new Promise(res => setTimeout(res, 5000)); // Poll every 5s
      try {
        const statusRes = await fetch(`${baseUrl}/status/${jobId}`, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
            "User-Agent": "skillcred-api-client/1.0"
          }
        });
        if (!statusRes.ok) continue; 
        
        const statusData = await statusRes.json();
        
        if (statusData.status === "completed") {
          finalVideoBase64 = statusData.video_base64;
          finalTime = statusData.time;
          break;
        } else if (statusData.status === "failed") {
          throw new Error(`Master Job [${jobId}] failed natively on JarvisLabs: ${statusData.error}`);
        }
      } catch(err) {
        // Safe to ignore fetch network timeouts during a 30-minute generation queue
      }
    }

    const jobDir = path.join(OUTPUT_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    // Instantly unpack the returned Base64 60-second video!
    const outputPath = path.join(jobDir, 'final_video.mp4');
    const buffer = Buffer.from(finalVideoBase64, 'base64');
    fs.writeFileSync(outputPath, buffer);

    console.log(`\n🎉 NATIVE HUNYUANVIDEO PIPELINE COMPLETED IN ${finalTime} SECONDS!`);
    console.log(`Saved flawless output to ${outputPath}`);

    const videoUrlWithPrefix = `/ai-engine/api/videos/${jobId}/final_video.mp4`;
    const thumbnailUrlWithPrefix = videoUrlWithPrefix.replace('.mp4', '.jpg');
    
    const appBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '').replace('/ai-engine', '');
    const absoluteVideoUrl = `${appBaseUrl}${videoUrlWithPrefix}`;
    const absoluteThumbnailUrl = `${appBaseUrl}${thumbnailUrlWithPrefix}`;

    // Update Prisma status
    if (videoId) {
      try {
        await prisma.generatedVideo.update({
          where: { id: videoId },
          data: {
            status: 'COMPLETED',
            videoUrl: videoUrlWithPrefix, 
            thumbnailUrl: thumbnailUrlWithPrefix
          }
        });
      } catch (dbError) {
        console.error("Failed to update video status in database:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      videoUrl: absoluteVideoUrl,
      thumbnailUrl: absoluteThumbnailUrl,
      jobId,
      scriptData: overrideScenes || null,
      message: `HunyuanVideo 1.5 master generation completed beautifully in ${finalTime} seconds!`
    });

  } catch (error: any) {
    console.error("Open-Sora master pipeline failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Master Pipeline failed"
    }, { status: 500 });
  }
}
