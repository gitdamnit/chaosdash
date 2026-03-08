import type { Express } from "express";
import type { Server } from "http";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Fun Tools: Magic ToDo ──────────────────────────────────────────────
  app.post("/api/goblin/breakdown", async (req, res) => {
    try {
      const { task, difficulty } = req.body;
      if (!task) return res.status(400).json({ error: "task required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an ADHD task assistant. Break tasks into tiny, specific, concrete micro-steps.
Each step should take 2-5 minutes. Use clear action verbs.
Difficulty: ${difficulty || "medium"} (low = fewer/simpler steps, high = more/detailed steps).
Respond with ONLY a JSON array of strings, no markdown, no explanation.
Example: ["Open the document", "Write the first heading", "List 3 bullet points"]`,
          },
          { role: "user", content: `Break this task into micro-steps: "${task}"` },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      const steps = Array.isArray(parsed.steps) ? parsed.steps : Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
      res.json({ steps: Array.isArray(steps) ? steps : [] });
    } catch (err) {
      console.error("breakdown error:", err);
      res.status(500).json({ error: "Failed to break down task" });
    }
  });

  // ── Fun Tools: Time Estimator ─────────────────────────────────────────
  app.post("/api/goblin/estimate", async (req, res) => {
    try {
      const { task } = req.body;
      if (!task) return res.status(400).json({ error: "task required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an ADHD time-blindness coach. Give realistic time estimates, accounting for ADHD tax (transitions, hyperfocus risk, interruptions).
Respond with ONLY valid JSON: { "estimate": "20-30 minutes", "adhd_note": "brief ADHD-specific tip", "breakdown": ["5m: X", "10m: Y"] }`,
          },
          { role: "user", content: `How long will this realistically take with ADHD: "${task}"` },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (err) {
      console.error("estimate error:", err);
      res.status(500).json({ error: "Failed to estimate" });
    }
  });

  // ── Fun Tools: Tone Fixer ─────────────────────────────────────────────
  app.post("/api/goblin/tone", async (req, res) => {
    try {
      const { text, targetTone } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });

      const toneMap: Record<string, string> = {
        formal: "more formal and professional, suitable for workplace communication",
        casual: "more casual, friendly and conversational",
        direct: "more direct and concise, no fluff",
        soft: "softer and gentler, less harsh or blunt",
        assertive: "more assertive and confident while staying polite",
        clear: "simpler and clearer, easy to understand",
      };

      const toneDescription = toneMap[targetTone] || "clearer and more appropriate";

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `Rewrite the user's text to be ${toneDescription}. Keep the same core meaning. Respond with ONLY JSON: { "rewritten": "...", "changes": "brief description of changes made" }`,
          },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (err) {
      console.error("tone error:", err);
      res.status(500).json({ error: "Failed to adjust tone" });
    }
  });

  // ── Fun Tools: Kindness Judge ─────────────────────────────────────────
  app.post("/api/goblin/judge", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are a social cue coach for people who struggle with reading tone (common with ADHD/autism).
Analyze the text and respond with ONLY JSON:
{ 
  "score": 1-10 (1=very blunt/harsh, 5=neutral, 10=very warm/kind),
  "label": "Very Blunt" | "Somewhat Blunt" | "Neutral" | "Somewhat Kind" | "Very Kind",
  "explanation": "brief explanation of tone",
  "suggestion": "optional gentler rewrite if score < 6, else null"
}`,
          },
          { role: "user", content: `Judge the tone of: "${text}"` },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (err) {
      console.error("judge error:", err);
      res.status(500).json({ error: "Failed to judge tone" });
    }
  });

  // ── Research: Fetch open-access ADHD papers ──────────────────────────────
  app.get("/api/research", async (req, res) => {
    try {
      const { query = "ADHD executive function", sort = "date" } = req.query;
      const cleanQuery = encodeURIComponent(query as string);
      const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${cleanQuery}+AND+OPEN_ACCESS:y&resultType=lite&format=json&pageSize=15`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`EuropePMC error: ${response.status}`);
      
      const data: any = await response.json();
      const papers = (data.resultList?.result || []).map((p: any) => ({
        id: p.id || p.pmid || p.pmcid,
        title: p.title,
        authors: p.authorString,
        year: p.pubYear,
        journal: p.journalTitle,
        abstract: p.abstractText,
        url: p.fullTextUrlList?.fullTextUrl?.find((u: any) => u.availabilityCode === "OA")?.url
          || (p.pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${p.pmcid}/` : null)
          || (p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : null),
        source: p.source,
        citedByCount: p.citedByCount || 0,
      }));

      res.json({ papers, total: data.hitCount });
    } catch (err) {
      console.error("research error:", err);
      res.status(500).json({ error: "Failed to fetch research papers" });
    }
  });

  // ── News: ADHD news from Reddit r/ADHD + ADDitude ────────────────────────
  app.get("/api/news", async (req, res) => {
    try {
      const results: any[] = [];

      // Reddit r/ADHD - hot posts
      try {
        const redditRes = await fetch("https://www.reddit.com/r/ADHD/hot.json?limit=20&raw_json=1", {
          headers: { "User-Agent": "ChaosDash/1.0 ADHD Navigator App" }
        });
        if (redditRes.ok) {
          const reddit: any = await redditRes.json();
          const posts = reddit?.data?.children || [];
          for (const p of posts) {
            const d = p.data;
            if (d.stickied || d.score < 10) continue;
            results.push({
              id: `reddit-${d.id}`,
              title: d.title,
              summary: d.selftext ? d.selftext.substring(0, 300) + (d.selftext.length > 300 ? '...' : '') : '',
              url: d.is_self ? `https://reddit.com${d.permalink}` : d.url,
              source: 'r/ADHD Community',
              date: new Date(d.created_utc * 1000).toISOString(),
              score: d.score,
              type: d.is_self ? 'discussion' : 'link',
            });
          }
        }
      } catch (e) { console.error("Reddit fetch failed:", e); }

      // ADDitude Magazine RSS
      try {
        const rssRes = await fetch("https://www.additudemag.com/feed/", {
          headers: { "User-Agent": "ChaosDash/1.0" }
        });
        if (rssRes.ok) {
          const xml = await rssRes.text();
          const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          for (const item of itemMatches.slice(0, 10)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim();
            const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
            const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').substring(0, 300).trim();
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
            if (title && link) {
              results.push({
                id: `additude-${Buffer.from(link).toString('base64').substring(0, 16)}`,
                title,
                summary: desc,
                url: link,
                source: 'ADDitude Magazine',
                date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                score: 0,
                type: 'article',
              });
            }
          }
        }
      } catch (e) { console.error("ADDitude RSS fetch failed:", e); }

      // CHADD news RSS
      try {
        const chaddRes = await fetch("https://chadd.org/feed/", {
          headers: { "User-Agent": "ChaosDash/1.0" }
        });
        if (chaddRes.ok) {
          const xml = await chaddRes.text();
          const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          for (const item of itemMatches.slice(0, 8)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim();
            const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
            const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').substring(0, 300).trim();
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
            if (title && link) {
              results.push({
                id: `chadd-${Buffer.from(link).toString('base64').substring(0, 16)}`,
                title,
                summary: desc,
                url: link,
                source: 'CHADD',
                date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                score: 0,
                type: 'article',
              });
            }
          }
        }
      } catch (e) { console.error("CHADD RSS fetch failed:", e); }

      res.json({ items: results });
    } catch (err) {
      console.error("news error:", err);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // ── SMART Goals: AI helper ───────────────────────────────────────────────
  app.post("/api/goals/smart-help", async (req, res) => {
    try {
      const { step, goalContext } = req.body;
      if (!step) return res.status(400).json({ error: "step required" });

      const stepPrompts: Record<string, string> = {
        specific: "Help the user make their goal MORE SPECIFIC. It should clearly state what they want to accomplish, who is involved, where, and why. Avoid vague language.",
        measurable: "Help the user define HOW THEY WILL MEASURE SUCCESS. Suggest specific numbers, metrics, percentages, or milestones they can track. Be concrete.",
        achievable: "Help the user assess if the goal is REALISTIC given their situation. Suggest a practical version if it seems too ambitious. Consider ADHD challenges.",
        relevant: "Help the user articulate WHY THIS GOAL MATTERS to them personally. Connect it to their values, bigger life goals, or current situation.",
        timeBound: "Help the user set a REALISTIC DEADLINE. Suggest a specific date range. Account for ADHD time blindness — add buffer time and suggest milestone check-ins.",
      };

      const context = Object.entries(goalContext || {})
        .filter(([, v]) => v && (v as string).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an ADHD-friendly life coach helping someone create a SMART goal. 
${stepPrompts[step] || "Help refine this part of the SMART goal."}
Be warm, practical, and ADHD-aware. Keep suggestions concise (1-2 sentences max).
Respond with ONLY JSON: { "suggestion": "your specific suggestion text" }`,
          },
          {
            role: "user",
            content: `Help me with the "${step}" part of my SMART goal.\n\nWhat I've filled in so far:\n${context || "(nothing yet)"}`
          },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (err) {
      console.error("smart-help error:", err);
      res.status(500).json({ error: "Failed to get AI suggestion" });
    }
  });

  // ── Voice: Whisper transcription ─────────────────────────────────────────
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audio, mimeType = 'audio/webm' } = req.body;
      if (!audio) return res.status(400).json({ error: "audio required" });

      const buffer = Buffer.from(audio, 'base64');
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'en',
      });

      res.json({ text: transcription.text });
    } catch (err) {
      console.error("transcribe error:", err);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  return httpServer;
}
