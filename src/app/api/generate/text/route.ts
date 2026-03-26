export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { GoogleGenAI } from '@google/genai';
import { SKILLCRED_STREAMS, PLATFORM_GUIDELINES } from '@/lib/skillcred-context';
import { prisma } from '@/lib/prisma';

let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({});
} catch (e) {
  console.warn("⚠️ GoogleGenAI initialized without API key.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, stream, platform, contentType, tone = "professional yet engaging", numberOfVariations = 1 } = body;
    
    if (!ai) {
      return NextResponse.json({ error: "Gemini API key is not configured. Add GEMINI_API_KEY to your .env file." }, { status: 500 });
    }

    // Find the stream context & hashtags from our library
    const streamData = SKILLCRED_STREAMS.find(s => s.name === stream);
    const platformGuide = (PLATFORM_GUIDELINES as any)[platform];

    // Ensure we ask for 1 to 3 variations
    const count = Math.min(Math.max(Number(numberOfVariations) || 1, 1), 3);

    const systemInstruction = `You are an expert AI Content Marketing Engine for SkillCred (https://www.skillcred.in).
SkillCred is a project-based learning platform with 8 core streams helping people master tech through real building.

THE 8 SKILLCRED STREAMS:
${SKILLCRED_STREAMS.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}

YOUR CURRENT TASK:
- Platform: ${platform}
- Stream: ${stream || "General AI / Tech World"}
${streamData ? `- Stream Description: ${streamData.description}` : ''}
${streamData ? `- Required Hashtags: ${streamData.hashtags}` : ''}
- Topic: ${topic}
- Content Type: ${contentType || "tip"}
- Tone: ${tone}
${platformGuide ? `\nPLATFORM GUIDELINES for ${platform}:
- Style: ${platformGuide.style}
- Format: ${platformGuide.format}` : ''}

REQUIREMENTS:
- Hook: Must IMMEDIATELY grab attention in the first line.
- Body: Provide actionable value. Reference SkillCred naturally where relevant.
- Call to Action: Encourage engagement (comments, shares, or visiting SkillCred).
- Link: MUST include the SkillCred website link (https://www.skillcred.in) at the end of every post.
- Formatting: Use appropriate emojis and spacing for ${platform}.
- There are NO length or character count limits. Make it as long and detailed as necessary to provide massive value.
- MUST include the required hashtags at the very end.

Generate EXACTLY ${count} distinct variation(s) of this post.
Return the output as a valid JSON array of strings, where each string is a full post variation. DO NOT wrap the output in markdown code blocks.
Example format:
[
  "Variation 1 full text here...",
  "Variation 2 full text here..."
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemInstruction,
    });
    
    let rawText = response.text || "[]";
    // Clean markdown blocks if Gemini happened to wrap it
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let variations = [];
    try {
      variations = JSON.parse(rawText);
      if (!Array.isArray(variations)) throw new Error("Not an array");
    } catch (e) {
      // Fallback if parsing fails - just return as single variation
      variations = [rawText];
    }

    try {
      await Promise.all(
        variations.map((content: string) =>
          prisma.generatedPost.create({
            data: {
              platform,
              content,
              stream,
              status: 'DRAFT',
            },
          })
        )
      );
    } catch (dbError) {
      console.error("Failed to save posts to database:", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      content: variations, // This is now an array
      hashtags: streamData?.hashtags || "", // Pass hashtags back directly
      metadata: { platform, stream, topic, contentType }
    });
    
  } catch (error: any) {
    console.error("Text generation failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate text" }, { status: 500 });
  }
}
