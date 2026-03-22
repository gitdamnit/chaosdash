import type { Express, Request, Response } from "express";
import type { Server } from "http";
import OpenAI, { toFile } from "openai";
import { isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import type { AuthenticatedRequest } from "./types";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register auth routes
  registerAuthRoutes(app);

  // ── Tasks ──────────────────────────────────────────────────────────────────
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getTasks(getUserId(req));
      res.json(items);
    } catch (err) {
      console.error("tasks get error:", err);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createTask(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      console.error("tasks post error:", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateTask(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      console.error("tasks put error:", err);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      console.error("tasks delete error:", err);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ── Project Tasks ──────────────────────────────────────────────────────────
  app.get("/api/project-tasks", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getProjectTasks(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch project tasks" });
    }
  });

  app.post("/api/project-tasks", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createProjectTask(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create project task" });
    }
  });

  app.put("/api/project-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateProjectTask(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update project task" });
    }
  });

  app.delete("/api/project-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProjectTask(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete project task" });
    }
  });

  // ── Routines ───────────────────────────────────────────────────────────────
  app.get("/api/routines", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getRoutines(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch routines" });
    }
  });

  app.post("/api/routines", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createRoutine(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create routine" });
    }
  });

  app.put("/api/routines/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateRoutine(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update routine" });
    }
  });

  app.delete("/api/routines/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteRoutine(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete routine" });
    }
  });

  // ── Goals ──────────────────────────────────────────────────────────────────
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getGoals(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createGoal(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateGoal(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteGoal(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // ── Mood Entries ───────────────────────────────────────────────────────────
  app.get("/api/moods", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getMoodEntries(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch moods" });
    }
  });

  app.post("/api/moods", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createMoodEntry(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create mood entry" });
    }
  });

  app.put("/api/moods/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateMoodEntry(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update mood entry" });
    }
  });

  app.delete("/api/moods/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMoodEntry(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete mood entry" });
    }
  });

  // ── Time Blocks ────────────────────────────────────────────────────────────
  app.get("/api/time-blocks", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getTimeBlocks(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch time blocks" });
    }
  });

  app.post("/api/time-blocks", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createTimeBlock(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create time block" });
    }
  });

  app.put("/api/time-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateTimeBlock(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update time block" });
    }
  });

  app.delete("/api/time-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTimeBlock(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete time block" });
    }
  });

  // ── Pinned Notes ───────────────────────────────────────────────────────────
  app.get("/api/pinned-notes", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getPinnedNotes(getUserId(req));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pinned notes" });
    }
  });

  app.post("/api/pinned-notes", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createPinnedNote(getUserId(req), req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to create pinned note" });
    }
  });

  app.put("/api/pinned-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updatePinnedNote(getUserId(req), String(req.params.id), req.body);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to update pinned note" });
    }
  });

  app.delete("/api/pinned-notes/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePinnedNote(getUserId(req), String(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete pinned note" });
    }
  });

  // ── Brain Dump ─────────────────────────────────────────────────────────────
  app.get("/api/brain-dump", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getBrainDump(getUserId(req));
      res.json({ content });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch brain dump" });
    }
  });

  app.put("/api/brain-dump", isAuthenticated, async (req, res) => {
    try {
      await storage.setBrainDump(getUserId(req), req.body.content ?? "");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save brain dump" });
    }
  });

  // ── Fun Tools: Magic ToDo ──────────────────────────────────────────────
  app.post("/api/goblin/breakdown", async (req, res) => {
    try {
      const { task, difficulty } = req.body;
      if (!task) return res.status(400).json({ error: "task required" });

      const stepCount = difficulty === 'low' ? '4-6' : difficulty === 'high' ? '10-15' : '6-10';

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an expert ADHD coach who specializes in breaking overwhelming tasks into tiny, immediately actionable micro-steps.

Your job: take ANY task the user gives you and break it into ${stepCount} concrete micro-steps.

Rules for every step:
- Start with a physical action verb: Open, Click, Type, Write, Copy, Go to, Find, Set, Turn on, Pick up, etc.
- Be SO specific that there is zero ambiguity — not "research options" but "Google 'best free IDE 2026' and open the first 3 results"
- Each step takes 2-5 minutes max
- Zero meta-steps like "Plan", "Think about", "Consider", "Decide" — only tangible actions
- Account for the actual setup steps people skip (opening the right app, finding the file, etc.)

Respond ONLY with valid JSON: {"steps": ["step 1", "step 2", ...]}`,
          },
          { role: "user", content: `Task: "${task}"` },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
      res.json({ steps });
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
            content: `You are an ADHD time coach who gives brutally honest, realistic time estimates — NOT the neurotypical optimistic version.

The ADHD tax is real: everything takes 2-3x longer due to task initiation, transitions, hyperfocus rabbit holes, and interruptions.

When estimating:
1. Identify every sub-component of the task (including setup, finding things, context-switching)
2. Apply the ADHD multiplier (2x for simple tasks, 3x for complex ones)
3. Flag the biggest time-sink risks specific to THIS task
4. Give a specific actionable ADHD tip that addresses the actual challenge in this task

Respond ONLY with valid JSON:
{
  "estimate": "X-Y hours/minutes (realistic ADHD estimate)",
  "adhd_note": "Specific, actionable tip for THIS exact task — not generic advice",
  "breakdown": ["Xm: specific sub-task", "Ym: specific sub-task", ...]
}`,
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

      const toneInstructions: Record<string, string> = {
        formal: `Rewrite as polished, professional communication. Use complete sentences, proper grammar, no contractions. Appropriate for a workplace email or formal request. Remove casual language, slang, or emotional venting. Keep the core message but elevate the register.`,

        casual: `Rewrite as something you'd genuinely text to a friend. Use contractions ("I'm", "can't", "you're"). Add natural filler words (honestly, tbh, basically, kind of). Shorter sentences. Drop the formality completely. It should sound like a real human, not a watered-down formal version.`,

        soft: `Rewrite to be emotionally gentle and warm. Use "I feel..." and "I notice..." framing instead of "you" statements. Add empathetic phrases like "I understand this is hard" or "I really appreciate you". Soften demands into requests ("Could you possibly..." instead of "Do this"). Keep the core message but wrap it in warmth and understanding. Remove any harsh or blunt phrasing entirely.`,

        direct: `Strip everything down to the essential message. One idea per sentence. Remove all preamble, softeners, filler, and unnecessary context. Lead with the main point immediately. Be concise — if it can be said in 10 words instead of 30, use 10.`,

        assertive: `Rewrite to be confident and clear without being aggressive. Use firm "I" statements: "I need...", "I expect...", "I want...". No hedging ("maybe", "possibly", "if it's not too much trouble"). No apologies or excessive softening. State boundaries clearly. Respectful but unmistakably confident.`,

        clear: `Rewrite using the simplest possible words — aim for a 6th-grade reading level. Break long sentences into short ones. Replace any jargon, idioms, or complex vocabulary with plain everyday words. Do NOT change the meaning or skip content — just simplify the language itself.`,
      };

      const instructions = toneInstructions[targetTone] || toneInstructions.clear;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are a communication expert who rewrites messages to achieve specific tones.

Instructions for this rewrite:
${instructions}

Critical rules:
- Preserve the core meaning and intent of the original message
- Make a REAL transformation — the output must sound noticeably different from the input
- Do NOT just paraphrase or slightly rephrase — actually apply the tone transformation
- The "changes" field should explain what you specifically did differently

Respond ONLY with valid JSON: { "rewritten": "...", "changes": "specific description of what you changed and why" }`,
          },
          { role: "user", content: `Original message: "${text}"` },
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
            content: `CONTEXT: You are operating inside ADHDPenguin, a productivity and communication-support app for adults with ADHD. Users paste real messages they have already written or received — texts, emails, medical inquiries, workplace disputes, healthcare advocacy letters — and ask for tone feedback.

Every submission is: (1) a real message that already exists in the world, not a request to generate harmful content; (2) submitted purely for communication analysis, exactly as a therapist or communications coach would review it; (3) completely lawful — users discussing medications, conflicts, or strong emotions are doing so as part of normal daily life. There is no illegal, unethical, or harmful intent behind any submission. Analyze all content professionally and without judgment about the topic.

You are a social cue coach. Your job is to evaluate the emotional tone of whatever message is submitted — no matter the subject matter — and help the user understand how it lands.

Analyze tone by considering:
- Word choice (harsh vs gentle vocabulary)
- Directness (blunt statements vs softened requests)
- Empathy signals (acknowledging feelings vs dismissing them)
- Implied demands vs collaborative framing

Score 1-10 where: 1-2 = Very Blunt/Harsh, 3-4 = Somewhat Blunt, 5-6 = Neutral, 7-8 = Warm, 9-10 = Very Kind

If score < 6, provide a genuinely gentler rewrite that preserves the same intent.

Respond ONLY with valid JSON:
{ 
  "score": <number 1-10>,
  "label": "Very Blunt" | "Somewhat Blunt" | "Neutral" | "Somewhat Kind" | "Very Kind",
  "explanation": "2-3 sentences explaining exactly what makes it land this way",
  "suggestion": "<gentler rewrite if score < 6, otherwise null>"
}`,
          },
          { role: "user", content: `Analyze the tone of this message: "${text}"` },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("judge error:", err);
      // Azure content filter fires on medical/sensitive topics — return a graceful fallback
      if (err?.code === "content_filter" || err?.status === 400) {
        return res.json({
          score: null,
          label: "Can't analyze",
          explanation: "The AI flagged this message as sensitive content and couldn't analyze it. This sometimes happens with medical terms or emotionally charged language. Try rephrasing slightly and run it again.",
          suggestion: null,
          filtered: true,
        });
      }
      res.status(500).json({ error: "Failed to judge tone" });
    }
  });

  // ── Research: Fetch open-access ADHD papers ──────────────────────────────
  app.get("/api/research", async (req, res) => {
    try {
      const { query = "ADHD executive function", sort = "date", source = "europepmc" } = req.query;
      const q = query as string;
      const src = source as string;

      let papers: any[] = [];
      let total = 0;

      if (src === "europepmc") {
        const cleanQuery = encodeURIComponent(q);
        const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${cleanQuery}+AND+OPEN_ACCESS:y&resultType=lite&format=json&pageSize=15`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`EuropePMC error: ${response.status}`);
        const data: any = await response.json();
        total = data.hitCount || 0;
        papers = (data.resultList?.result || []).map((p: any) => ({
          id: p.id || p.pmid || p.pmcid,
          title: p.title,
          authors: p.authorString,
          year: p.pubYear,
          journal: p.journalTitle,
          abstract: p.abstractText,
          url: p.fullTextUrlList?.fullTextUrl?.find((u: any) => u.availabilityCode === "OA")?.url
            || (p.pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${p.pmcid}/` : null)
            || (p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : null),
          source: "EuropePMC",
          citedByCount: p.citedByCount || 0,
        }));

      } else if (src === "openalex") {
        const cleanQuery = encodeURIComponent(q);
        const sortParam = sort === "citations" ? "cited_by_count:desc" : "publication_date:desc";
        const url = `https://api.openalex.org/works?search=${cleanQuery}&filter=is_oa:true&sort=${sortParam}&per-page=15&mailto=adhd-research@example.com`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`OpenAlex error: ${response.status}`);
        const data: any = await response.json();
        total = data.meta?.count || 0;

        const reconstructAbstract = (invertedIndex: any): string => {
          if (!invertedIndex) return "";
          const wordPositions: { word: string; pos: number }[] = [];
          for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const pos of positions as number[]) {
              wordPositions.push({ word, pos });
            }
          }
          wordPositions.sort((a, b) => a.pos - b.pos);
          return wordPositions.map(wp => wp.word).join(" ");
        };

        papers = (data.results || []).map((p: any) => {
          const authorships = p.authorships || [];
          const authors = authorships.slice(0, 5).map((a: any) => a.author?.display_name).filter(Boolean).join(", ");
          const year = p.publication_year ? String(p.publication_year) : "";
          const journal = p.primary_location?.source?.display_name || p.host_venue?.display_name || "";
          const abstract = reconstructAbstract(p.abstract_inverted_index);
          const url = p.primary_location?.landing_page_url || p.primary_location?.pdf_url || p.doi || "";
          return {
            id: p.id,
            title: p.title || "(No title)",
            authors,
            year,
            journal,
            abstract,
            url,
            source: "OpenAlex",
            citedByCount: p.cited_by_count || 0,
          };
        });

      } else if (src === "semanticscholar") {
        const cleanQuery = encodeURIComponent(q);
        const sortParam = sort === "citations" ? "citationCount" : "publicationDate";
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${cleanQuery}&fields=title,authors,year,venue,abstract,externalIds,citationCount,isOpenAccess,openAccessPdf&sort=${sortParam}&limit=15`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Semantic Scholar error: ${response.status}`);
        const data: any = await response.json();
        total = data.total || 0;
        papers = (data.data || []).map((p: any) => {
          const authors = (p.authors || []).slice(0, 5).map((a: any) => a.name).join(", ");
          const url = p.openAccessPdf?.url
            || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null)
            || (p.externalIds?.PubMed ? `https://pubmed.ncbi.nlm.nih.gov/${p.externalIds.PubMed}/` : null)
            || "";
          return {
            id: p.paperId,
            title: p.title || "(No title)",
            authors,
            year: p.year ? String(p.year) : "",
            journal: p.venue || "",
            abstract: p.abstract || "",
            url,
            source: "Semantic Scholar",
            citedByCount: p.citationCount || 0,
          };
        });

      } else if (src === "pubmed") {
        const cleanQuery = encodeURIComponent(q);
        const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${cleanQuery}&retmax=15&retmode=json&sort=${sort === "citations" ? "relevance" : "pub+date"}`;
        const esearchResp = await fetch(esearchUrl);
        if (!esearchResp.ok) throw new Error(`PubMed esearch error: ${esearchResp.status}`);
        const esearchData: any = await esearchResp.json();
        const ids: string[] = esearchData.esearchresult?.idlist || [];
        total = parseInt(esearchData.esearchresult?.count || "0", 10);

        if (ids.length > 0) {
          const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
          const esummaryResp = await fetch(esummaryUrl);
          if (!esummaryResp.ok) throw new Error(`PubMed esummary error: ${esummaryResp.status}`);
          const esummaryData: any = await esummaryResp.json();
          const uids: string[] = esummaryData.result?.uids || [];
          papers = uids.map((uid: string) => {
            const p = esummaryData.result[uid];
            if (!p) return null;
            const authors = (p.authors || []).slice(0, 5).map((a: any) => a.name).join(", ");
            const year = p.pubdate ? p.pubdate.split(" ")[0] : "";
            const journal = p.source || p.fulljournalname || "";
            const pmcid = (p.articleids || []).find((a: any) => a.idtype === "pmc")?.value;
            const url = pmcid
              ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
              : `https://pubmed.ncbi.nlm.nih.gov/${uid}/`;
            return {
              id: uid,
              title: p.title || "(No title)",
              authors,
              year,
              journal,
              abstract: "",
              url,
              source: "PubMed",
              citedByCount: 0,
            };
          }).filter(Boolean);
        }
      } else {
        return res.status(400).json({ error: "Unknown source" });
      }

      res.json({ papers, total });
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
          headers: { "User-Agent": "ADHD Penguin/1.0 ADHD Navigator App" }
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
          headers: { "User-Agent": "ADHD Penguin/1.0" }
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
          headers: { "User-Agent": "ADHD Penguin/1.0" }
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

  // ── Books: Open Library + Project Gutenberg ──────────────────────────────
  app.get("/api/books", async (req, res) => {
    const query = (req.query.query as string) || 'ADHD';
    const source = (req.query.source as string) || 'openlibrary';

    interface Book {
      id: string; title: string; authors: string; year: string;
      subjects: string[]; description: string; url: string;
      coverUrl: string; downloadUrl: string; source: string;
      pages: number; language: string;
    }

    try {
      const books: Book[] = [];

      if (source === 'openlibrary') {
        // has_fulltext=true filters to only books with an actual digital version on Internet Archive
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&fields=key,title,author_name,first_publish_year,subject,isbn,cover_i,number_of_pages_median,ia,language,lending_edition_s,public_scan_b&limit=40`;
        const r = await fetch(url, { headers: { 'User-Agent': 'ADHD Penguin ADHD App (contact@replit.app)' } });
        if (!r.ok) throw new Error('Open Library fetch failed');
        const data = await r.json() as { docs?: any[] };
        for (const doc of (data.docs || [])) {
          if (books.length >= 24) break;
          const ia = (doc.ia || [])[0] || '';
          if (!ia) continue; // skip catalog-only entries with no digital version
          const key = doc.key || '';
          const isbn = (doc.isbn || [])[0] || '';
          const coverId = doc.cover_i;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '';
          // public_scan_b = true means full free read, otherwise it's borrow-only
          const isFreeRead = !!doc.public_scan_b;
          const downloadUrl = `https://archive.org/details/${ia}`;
          const langs: string[] = doc.language || [];
          books.push({
            id: `ol-${key.replace('/works/', '')}`,
            title: doc.title || 'Untitled',
            authors: (doc.author_name || []).join(', ') || 'Unknown',
            year: String(doc.first_publish_year || ''),
            subjects: (doc.subject || []).slice(0, 5),
            description: isFreeRead ? 'Full text available free' : 'Available to borrow via Internet Archive',
            url: `https://openlibrary.org${key}`,
            coverUrl,
            downloadUrl,
            source: isFreeRead ? 'Open Library (Free)' : 'Open Library (Borrow)',
            pages: doc.number_of_pages_median || 0,
            language: langs.includes('eng') || langs.length === 0 ? 'English' : langs[0],
          });
        }
      } else if (source === 'gutenberg') {
        const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&languages=en`;
        const r = await fetch(url, { headers: { 'User-Agent': 'ADHD Penguin ADHD App' } });
        if (!r.ok) throw new Error('Gutendex fetch failed');
        const data = await r.json() as { results?: any[] };
        for (const book of (data.results || []).slice(0, 24)) {
          const formats: Record<string, string> = book.formats || {};
          const epubUrl = formats['application/epub+zip'] || formats['application/epub'] || '';
          const pdfUrl = formats['application/pdf'] || '';
          const htmlUrl = formats['text/html'] || formats['text/html; charset=utf-8'] || '';
          const downloadUrl = epubUrl || pdfUrl || htmlUrl || `https://www.gutenberg.org/ebooks/${book.id}`;
          const authors = (book.authors || []).map((a: any) => a.name).join(', ');
          const subjects: string[] = (book.subjects || []).slice(0, 5);
          const year = (book.copyright || '').match(/\d{4}/)?.[0] || '';
          books.push({
            id: `gut-${book.id}`,
            title: book.title || 'Untitled',
            authors,
            year,
            subjects,
            description: '',
            url: `https://www.gutenberg.org/ebooks/${book.id}`,
            coverUrl: formats['image/jpeg'] || '',
            downloadUrl,
            source: 'Project Gutenberg',
            pages: 0,
            language: 'English',
          });
        }
      } else if (source === 'googlebooks') {
        // filter=free-ebooks returns only books with full free access
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&filter=free-ebooks&maxResults=24&langRestrict=en&orderBy=relevance`;
        const r = await fetch(url, { headers: { 'User-Agent': 'ADHD Penguin App' } });
        if (!r.ok) throw new Error('Google Books fetch failed');
        const data = await r.json() as { items?: any[] };
        for (const item of (data.items || []).slice(0, 24)) {
          const vol = item.volumeInfo || {};
          const access = item.accessInfo || {};
          const epubLink = access.epub?.downloadLink || '';
          const pdfLink = access.pdf?.downloadLink || '';
          const downloadUrl = epubLink || pdfLink || vol.canonicalVolumeLink || `https://books.google.com/books?id=${item.id}`;
          const coverUrl = (vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail || '').replace('http:', 'https:');
          const formatLabel = epubLink ? 'EPUB available' : pdfLink ? 'PDF available' : 'Free preview';
          books.push({
            id: `gb-${item.id}`,
            title: vol.title || 'Untitled',
            authors: (vol.authors || []).join(', ') || 'Unknown',
            year: (vol.publishedDate || '').slice(0, 4),
            subjects: (vol.categories || []).slice(0, 5),
            description: formatLabel,
            url: vol.canonicalVolumeLink || `https://books.google.com/books?id=${item.id}`,
            coverUrl,
            downloadUrl,
            source: 'Google Books',
            pages: vol.pageCount || 0,
            language: vol.language === 'en' ? 'English' : (vol.language || 'English'),
          });
        }
      } else if (source === 'dbooks') {
        const url = `https://www.dbooks.org/api/search/${encodeURIComponent(query)}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'ADHD Penguin App' } });
        if (!r.ok) throw new Error('dBooks fetch failed');
        const data = await r.json() as { status?: string; books?: any[] };
        for (const book of (data.books || []).slice(0, 24)) {
          books.push({
            id: `db-${book.id}`,
            title: book.title || 'Untitled',
            authors: book.authors || 'Unknown',
            year: '',
            subjects: [],
            description: book.subtitle || 'Free programming ebook',
            url: book.url || 'https://www.dbooks.org',
            coverUrl: book.image || '',
            downloadUrl: book.url || 'https://www.dbooks.org',
            source: 'dBooks',
            pages: 0,
            language: 'English',
          });
        }
      } else if (source === 'standardebooks') {
        // Standard Ebooks OPDS catalog
        const url = `https://standardebooks.org/opds/all`;
        const r = await fetch(url, { headers: { 'User-Agent': 'ADHD Penguin ADHD App', 'Accept': 'application/atom+xml,application/xml' } });
        if (!r.ok) throw new Error('Standard Ebooks fetch failed');
        const text = await r.text();
        // Extract entries from XML
        const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
        const q = query.toLowerCase();
        for (const entry of entries) {
          const titleM = entry.match(/<title[^>]*>([^<]+)<\/title>/);
          const authorM = entry.match(/<name>([^<]+)<\/name>/);
          const idM = entry.match(/<id>([^<]+)<\/id>/);
          const epubM = entry.match(/href="([^"]+\.epub[^"]*)"/);
          const coverM = entry.match(/href="([^"]+?\.(?:jpg|jpeg|png)[^"]*)"/);
          const catM = entry.match(/<category[^>]+label="([^"]+)"/g) || [];

          const title = titleM?.[1] || '';
          const author = authorM?.[1] || '';
          const idStr = idM?.[1] || '';

          if (!title.toLowerCase().includes(q) && !author.toLowerCase().includes(q)) continue;

          const urlMatch = idStr.match(/https?:\/\/[^\s<]+/);
          const bookUrl = urlMatch?.[0] || 'https://standardebooks.org/ebooks';
          books.push({
            id: `se-${idStr.replace(/[^a-z0-9]/gi, '-')}`,
            title,
            authors: author,
            year: '',
            subjects: catM.map(c => c.match(/label="([^"]+)"/)?.[1] || '').filter(Boolean).slice(0, 5),
            description: '',
            url: bookUrl,
            coverUrl: coverM?.[1] || '',
            downloadUrl: epubM?.[1] || bookUrl,
            source: 'Standard Ebooks',
            pages: 0,
            language: 'English',
          });
          if (books.length >= 20) break;
        }
      }

      res.json({ books, total: books.length });
    } catch (err) {
      console.error("books error:", err);
      res.status(500).json({ error: "Failed to fetch books", books: [] });
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

  // ── Body Doubling ─────────────────────────────────────────────────────────
  app.get("/api/body-double/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json({ sessions });
    } catch (err) {
      console.error("body-double get error:", err);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/body-double/sessions", isAuthenticated, async (req, res) => {
    try {
      const { task, durationMinutes } = req.body;
      if (!task || !durationMinutes) return res.status(400).json({ error: "task and durationMinutes required" });
      const authReq = req as import("./types").AuthenticatedRequest;
      const session = await storage.createWorkSession(
        authReq.user.id,
        authReq.user.username,
        String(task).trim(),
        Number(durationMinutes)
      );
      res.json(session);
    } catch (err) {
      console.error("body-double post error:", err);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.patch("/api/body-double/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!["completed", "abandoned"].includes(status)) return res.status(400).json({ error: "invalid status" });
      const session = await storage.updateWorkSession(id, getUserId(req), status as "completed" | "abandoned");
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (err) {
      console.error("body-double patch error:", err);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  return httpServer;
}
