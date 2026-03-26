import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HfInference } from '@huggingface/inference';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const topic = formData.get("topic") as string || "AI and Technology";
    const style = formData.get("style") as string || "Fast-paced & High Energy";
    
    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json({ error: "HuggingFace API key not configured." }, { status: 500 });
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    const cinematographerPrompt = `You are a professional cinematographer writing visual prompts for an AI video generator. 
The videos are for SkillCred (skillcred.in), a high-end platform for engineering mastery.

RULES:
- NO TEXT ON SCREEN. NO LOGOS. NO SYMBOLS. Current AI models generate gibberish; avoid all text to ensure professionalism.
- Describe ONLY what the camera sees — focus on high-fidelity technical environments.
- Use cinematic language: shot types, lighting, camera movement, depth of field.
- Visuals should strictly reflect SkillCred's official technical tracks and syllabus: 
  1. Fullstack / Mobile (Weeks 1-4 Solo Projects: Dashboards, Interactive Apps)
  2. AI & ML / Data Engineering (Weeks 5-6 Pair Projects: Predictive Suites)
  3. IoT / Cloud / DevOps (Weeks 7-8 Group Capstones: Fleet Orchestrators, Pipeline Enforcers)
  4. Cybersecurity (Automated DevSecOps, Lineage SaaS)
- Focus on: high-end hardware, complex code flows, Streamlit dashboards, glowing server racks, and "HR Signals" (portfolio-ready projects).
- NO TEXT. NO LOGOS. NO GIBBERISH SYMBOLS. Ensure all technical concepts are visual-only.
- Keep each visual prompt under 40 words.
- NO abstract concepts — only physical, visible things.`;

    const scriptPrompt = `You are a professional cinematic storyteller. 
Topic: "${topic}". Style: ${style}.
Mission: "SkillCred (skillcred.in) — Learn. Build. Verify. Get Hired."

TASK: Write a FLUID, CONTINUOUS 60-second monologue.
CRITICAL: Do NOT write isolated slogans for each scene. Every scene's narration must be a continuation of the previous thought. Sentences MUST span across 2 or 3 scenes (Enjambment).

FORMAT:
Return ONLY a valid JSON object.
{
  "title": "catchy title",
  "hook": "Attention grabber",
  "scenes": [
    { 
      "visual": "Cinematic visual (STRICTLY NO TEXT, NO LOGOS)", 
      "narration": "Fragment of the continuous story." 
    }
  ]
}

STORYTELLING RULES:
1. FLOW: If I read all 30 "narration" fields together, it MUST form one perfectly natural paragraph.
2. BRIDGING: Use conjunctions (and, but, because, while) to bridge scenes.
3. PACING: ~5 words per scene. 2 seconds per scene.
4. NO CLICKBAIT: Avoid "Start your journey" or "Unlock your potential." Use authentic engineering descriptions.
5. SYLLABUS: Mention standard 8-week tracks (Solo/Pair/Capstone) or the 4-week Fast Track naturally within the story.
6. NO TEXT: Strictly NO text on screen in visual prompts.
7. Output: Exactly 12 scenes (12 scenes x 5 seconds = 60s total).`;

    console.log(`Generating script via Llama-3.3-70B: ${topic}`);

    const qwenResponse = await hf.chatCompletion({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: cinematographerPrompt },
        { role: "user", content: scriptPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    let text = qwenResponse.choices[0].message.content || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let scriptData;
    try {
      scriptData = JSON.parse(text);
    } catch(e) {
      console.error("Malformed AI output:", text);
      throw new Error("AI returned malformed JSON block");
    }

    let videoRecord;
    try {
      videoRecord = await prisma.generatedVideo.create({
        data: {
          title: scriptData.title || topic,
          script: JSON.stringify(scriptData),
          status: 'GENERATING',
        }
      });
    } catch (dbError) {
      console.error("Failed to save video to database:", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      scriptData,
      videoId: videoRecord?.id,
      status: "Script Generated."
    });

  } catch (error: any) {
    console.error("Video script generation failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate video script" }, { status: 500 });
  }
}
