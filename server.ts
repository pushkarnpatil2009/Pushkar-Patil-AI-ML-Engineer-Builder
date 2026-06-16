/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing middleware
  app.use(express.json());

  // lazy-initialize GoogleGenAI to prevent startup failures if key is not yet set
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not defined.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API endpoints:

  // AI Chat endpoint grounded in portfolio data
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, portfolioData } = req.body;
      
      let ai;
      try {
        ai = getAI();
      } catch (err: any) {
        return res.status(200).json({ 
          text: `Hi! I'm Pushkar's AI assistant. Currently, the AI capabilities are in demo mode because the **GEMINI_API_KEY** is not configured in your AI Studio secrets.\n\nTo activate my brains, please go to **Settings > Secrets** in the AI Studio editor, add \`GEMINI_API_KEY\` with a valid key, and wait for the dev server to start!\n\n*(In the meantime, feel free to explore Pushkar's beautiful portfolio sections!)*`
        });
      }

      // Grounding context from active DB data
      const profileInfo = portfolioData?.profile ? `
Name: ${portfolioData.profile.name}
Bio: ${portfolioData.profile.bio}
Skills: ${portfolioData.profile.skills}
GitHub: ${portfolioData.profile.githubLink}
LinkedIn: ${portfolioData.profile.linkedinLink}
Email: ${portfolioData.profile.email}
` : "Name: Pushkar Patil";

      const projectsInfo = portfolioData?.projects && portfolioData.projects.length > 0
        ? portfolioData.projects.map((p: any) => `
- Project: ${p.projectName}
  Description: ${p.description}
  Technologies: ${p.technologies}
  GitHub: ${p.githubLink || 'N/A'}
  Field: ${p.field}
  Est Arrival: ${p.estimatedArrival}
`).join("\n")
        : "None listed.";

      const certsInfo = portfolioData?.certifications && portfolioData.certifications.length > 0
        ? portfolioData.certifications.map((c: any) => `
- Certification: ${c.title} by ${c.issuer} (${c.date})
  Credential ID: ${c.credentialId || 'N/A'}
  Skills: ${c.skills || 'N/A'}
  Category: ${c.category}
`).join("\n")
        : "None listed.";

      const experiencesInfo = portfolioData?.experiences && portfolioData.experiences.length > 0
        ? portfolioData.experiences.map((e: any) => `
- ${e.role} at ${e.company} (${e.startDate} - ${e.endDate})
  Description: ${e.description}
  Skills: ${e.skills || 'N/A'}
`).join("\n")
        : "None listed.";

      const educationsInfo = portfolioData?.educations && portfolioData.educations.length > 0
        ? portfolioData.educations.map((ed: any) => `
- ${ed.degree} from ${ed.institution} (${ed.startDate} - ${ed.endDate})
  Location/Grade: ${ed.location || ''} ${ed.grade ? `(Grade: ${ed.grade})` : ''}
  Details: ${ed.description || 'N/A'}
`).join("\n")
        : "None listed.";

      const systemInstruction = `You are a warm, clean, and highly professional AI Personal Assistant for Pushkar Patil, an ambitious AI/ML & Software Engineer-to-be preparing for his B.Tech path.
Your task is to engage in friendly Q&A with employers, recruiters, and enthusiasts browsing Pushkar's portfolio.
Speak with confidence, humbleness, and professional clarity.

Ground your responses STRICTLY in the real-time database details provided below. Do not make up achievements or credentials. If a visitor asks about something outside this scope (e.g., "what's his phone number" or "does he have a PhD"), state that it isn't listed or suggest they contact Pushkar directly via the contact form.

---
REAL-TIME PORTFOLIO GROUNDING DATA:

1. PERSONAL BIO & PROFILE:
${profileInfo}

2. COMPLETED & ONGOING PROJECTS:
${projectsInfo}

3. ACQUIRED DECK OF CERTIFICATIONS:
${certsInfo}

4. PROFESSIONAL EXPERIENCE DETAILS:
${experiencesInfo}

5. ACADEMIC PIPELINE / EDUCATION:
${educationsInfo}
---

INSTRUCTIONS:
- Tailor your replies to highlight Pushkar's fit. Highlight specific certifications, credentials, or projects matching their inquiry.
- Keep responses concise, precise, and easy to read. Use high-contrast formatting in markdown.
- Guide the user to click sections of his page or use the Contact Terminal form.
`;

      // Map chat history
      const contentsList: any[] = [];
      if (history && history.length > 0) {
        history.forEach((h: any) => {
          contentsList.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }
      contentsList.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsList,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I apologize, but I could not compute a response right now.";
      res.json({ text: replyText });

    } catch (error: any) {
      console.error("AI Server Error (api/ai/chat):", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // AI Resume Match API
  app.post("/api/ai/match-job", async (req, res) => {
    try {
      const { jobDescription, portfolioData } = req.body;
      if (!jobDescription) {
        return res.status(400).json({ error: "Job description is required." });
      }

      let ai;
      try {
        ai = getAI();
      } catch (err: any) {
        // Fallback stub in case key is missing
        return res.status(200).json({
          score: 82,
          strengths: ["Machine Learning Fundamentals", "Python Data Science Pipelines", "Generative AI Core Essentials"],
          gaps: ["No direct B.Tech degree completion yet (current track is upcoming)"],
          analysis: "### Demo Match Analysis (Gemini API Key offline)\n\nPushkar has configured stellar portfolios in python classification, Generative AI agentic workflows (FastAPI + Google GenAI SDK), and has secured top-tier Google Cloud credentials!\n\nTo run interactive customized role screening with live Gemini LLM matching, please configure the `GEMINI_API_KEY` under **Settings > Secrets** in the builder."
        });
      }

      const pText = JSON.stringify(portfolioData || {});
      const targetPrompt = `Review and screen how well Pushkar Patil matches this Job Description based on his portfolio dataset (skills, projects, certifications, experiences, and education).

Job Description:
${jobDescription}

Pushkar's Portfolio Dataset:
${pText}

Identify alignment details:
1. Match Score: An integer from 0 to 100. Be honest but encouraging.
2. Strengths: List 3-4 specific exact areas or credentials where he matches the description perfectly (e.g. specific tool matches, project titles, certifications, programming languages).
3. Gaps: List 1-2 actual technologies, certifications, or expectations from the job description that aren't mentioned in his data.
4. Analysis: Provide a beautiful, highly detailed markdown synthesis of how Pushkar fits this position, and clear tactical advice for Pushkar on how to discuss his portfolio or what he should focus on to land this role.

Format the output strictly as a JSON object:
{
  "score": number,
  "strengths": string[],
  "gaps": string[],
  "analysis": string
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: targetPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const outText = response.text || "{}";
      try {
        const parsed = JSON.parse(outText);
        res.json(parsed);
      } catch (e) {
        res.json({
          score: 75,
          analysis: outText,
          strengths: ["Core Python Scripting", "ML Foundations"],
          gaps: ["Advanced Deep Deployment Architecture"],
        });
      }

    } catch (error: any) {
      console.error("AI Server Error (api/ai/match-job):", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Serve static assets in production, otherwise proxy to Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack DevServer active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup crash:", err);
});
