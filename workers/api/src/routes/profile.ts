import { Hono } from "hono";
import {
  CreateFactRequest,
  CreateStyleExampleRequest,
  SuggestFactsRequest,
  UpdateFactRequest,
  UpdateProfileRequest,
  type Profile,
  type SuggestFactsResponse,
} from "@echo/contracts";
import { cleanSuggestions } from "@echo/ai";
import type { AppDeps } from "../deps.ts";
import { HttpError, notFound, parseBody, toErrorResponse } from "../http.ts";
import { MissingProfileError } from "../supabase-store.ts";

/**
 * Knowledge Base (FR-02): the owner's profile, facts and style examples. Facts the owner
 * types start verified; facts suggested from a resume start unverified, and only verified
 * facts ever reach a draft (see selectUsableFacts in @echo/core).
 */
export function profileRoutes({ store, suggester, newId }: AppDeps) {
  const routes = new Hono();
  routes.onError(toErrorResponse);

  /** Load, change and save the whole profile, then answer with it. */
  async function change(update: (profile: Profile) => void): Promise<{ profile: Profile }> {
    const profile = await store.getProfile();
    update(profile);
    await store.saveProfile(profile);
    return { profile };
  }

  routes.get("/profile", async (c) => c.json({ profile: await store.getProfile() }));

  /** Edit name, headline or style notes. On a fresh database this creates the profile. */
  routes.patch("/profile", async (c) => {
    const req = await parseBody(c, UpdateProfileRequest);
    let profile: Profile;
    try {
      profile = await store.getProfile();
    } catch (err) {
      if (!(err instanceof MissingProfileError)) throw err;
      if (!req.name) throw new HttpError(400, "bad_request", "name: add your name to create your profile.");
      profile = { name: req.name, headline: "", styleNotes: [], facts: [], styleExamples: [] };
    }
    if (req.name !== undefined) profile.name = req.name;
    if (req.headline !== undefined) profile.headline = req.headline;
    if (req.styleNotes !== undefined) profile.styleNotes = req.styleNotes;
    await store.saveProfile(profile);
    return c.json({ profile });
  });

  routes.post("/profile/facts", async (c) => {
    const req = await parseBody(c, CreateFactRequest);
    const body = await change((p) => {
      p.facts.push({ id: newId(), text: req.text, category: req.category, sensitivity: req.sensitivity, verified: true });
    });
    return c.json(body, 201);
  });

  routes.patch("/profile/facts/:id", async (c) => {
    const req = await parseBody(c, UpdateFactRequest);
    const id = c.req.param("id");
    return c.json(
      await change((p) => {
        const fact = p.facts.find((f) => f.id === id);
        if (!fact) throw notFound("Fact");
        Object.assign(fact, req);
      }),
    );
  });

  routes.delete("/profile/facts/:id", async (c) => {
    const id = c.req.param("id");
    return c.json(
      await change((p) => {
        if (!p.facts.some((f) => f.id === id)) throw notFound("Fact");
        p.facts = p.facts.filter((f) => f.id !== id);
      }),
    );
  });

  /**
   * Suggest facts from a pasted resume. The resume goes to the model once and is never
   * stored or logged; the suggestions are saved unverified for the owner to review.
   */
  routes.post("/profile/facts/suggest", async (c) => {
    const req = await parseBody(c, SuggestFactsRequest);
    const before = await store.getProfile();
    const suggestions = await suggester.suggestFacts(req.resumeText);
    const { facts, skipped } = cleanSuggestions(suggestions, before.facts);
    const { profile } = await change((p) => {
      for (const f of facts) p.facts.push({ id: newId(), ...f, verified: false });
    });
    const body: SuggestFactsResponse = { profile, added: facts.length, skipped };
    return c.json(body);
  });

  routes.post("/profile/examples", async (c) => {
    const req = await parseBody(c, CreateStyleExampleRequest);
    const body = await change((p) => {
      p.styleExamples.push({ id: newId(), situation: req.situation, text: req.text });
    });
    return c.json(body, 201);
  });

  routes.delete("/profile/examples/:id", async (c) => {
    const id = c.req.param("id");
    return c.json(
      await change((p) => {
        if (!p.styleExamples.some((e) => e.id === id)) throw notFound("Style example");
        p.styleExamples = p.styleExamples.filter((e) => e.id !== id);
      }),
    );
  });

  return routes;
}
