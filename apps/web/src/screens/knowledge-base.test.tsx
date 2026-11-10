import type { Profile } from "@echo/contracts";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProfileState } from "../hooks.ts";
import { KnowledgeBaseScreen } from "./knowledge-base.tsx";

const PROFILE: Profile = {
  name: "Jordan Lee",
  headline: "Frontend engineer",
  styleNotes: ["Short and warm"],
  facts: [
    { id: "f-react", text: "Four years of React", category: "experience", verified: true, sensitivity: "normal" },
    { id: "f-rust", text: "Production Rust experience", category: "skill", verified: false, sensitivity: "normal" },
    { id: "f-visa", text: "Will need visa sponsorship", category: "other", verified: true, sensitivity: "ask_every_time" },
  ],
  styleExamples: [{ id: "ex-1", situation: "Replying to a recruiter", text: "Thanks for reaching out! Jordan" }],
};

/** Renders the screen with real state, like App does. */
function Harness({ initial, missing = false }: { initial: Profile | null; missing?: boolean }) {
  const [profile, setProfile] = useState(initial);
  const [isMissing, setMissing] = useState(missing);
  const state: ProfileState = {
    profile,
    loading: false,
    error: missing ? "No profile yet." : null,
    missing: isMissing,
    setProfile: (p) => {
      setProfile(p);
      setMissing(false);
    },
  };
  return <KnowledgeBaseScreen state={state} />;
}

/** fetch stand-in: records calls and answers with what `reply` returns for each. */
function mockApi(reply: (method: string, url: string, body: unknown) => { status?: number; json: unknown }) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      const { status = 200, json } = reply(method, url, body);
      return new Response(JSON.stringify(json), { status });
    }),
  );
  return calls;
}

const section = (name: RegExp) => screen.getByRole("region", { name });

describe("KnowledgeBaseScreen", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("separates suggestions waiting for review from approved facts", () => {
    render(<Harness initial={PROFILE} />);
    const review = section(/Needs your review/);
    const approved = section(/Approved facts/);
    expect(within(review).getByText("Production Rust experience")).toBeInTheDocument();
    expect(within(approved).getByText("Four years of React")).toBeInTheDocument();
    expect(within(approved).getByText("Ask every time")).toBeInTheDocument();
    expect(within(approved).queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
  });

  it("approves a suggestion, which moves it to approved facts", async () => {
    const calls = mockApi((_m, _u, body) => ({
      json: { profile: { ...PROFILE, facts: PROFILE.facts.map((f) => (f.id === "f-rust" ? { ...f, ...(body as object) } : f)) } },
    }));
    render(<Harness initial={PROFILE} />);
    await userEvent.click(within(section(/Needs your review/)).getByRole("button", { name: /Approve/ }));
    expect(calls[0]).toEqual({ method: "PATCH", url: "/api/profile/facts/f-rust", body: { verified: true } });
    expect(await within(section(/Approved facts/)).findByText("Production Rust experience")).toBeInTheDocument();
    expect(within(section(/Needs your review/)).getByText(/Nothing waiting/)).toBeInTheDocument();
  });

  it("suggests facts from a pasted resume and reports what was added", async () => {
    const suggested = { id: "f-new", text: "Shipped a React Native app", category: "project", verified: false, sensitivity: "normal" };
    const calls = mockApi(() => ({ json: { profile: { ...PROFILE, facts: [...PROFILE.facts, suggested] }, added: 1, skipped: 2 } }));
    render(<Harness initial={PROFILE} />);
    expect(screen.getByText(/isn't saved/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Resume text"), "- Shipped a React Native app");
    await userEvent.click(screen.getByRole("button", { name: /Suggest facts/ }));
    expect(calls[0]).toMatchObject({ method: "POST", url: "/api/profile/facts/suggest", body: { resumeText: "- Shipped a React Native app" } });
    expect(await screen.findByRole("status")).toHaveTextContent("Added 1 suggestion to review. Skipped 2");
    expect(within(section(/Needs your review/)).getByText("Shipped a React Native app")).toBeInTheDocument();
    expect(screen.getByLabelText("Resume text")).toHaveValue("");
  });

  it("shows the model's error when suggesting fails", async () => {
    mockApi(() => ({ status: 429, json: { error: { code: "model_error", message: "Gemini's free-tier limit was reached." } } }));
    render(<Harness initial={PROFILE} />);
    await userEvent.type(screen.getByLabelText("Resume text"), "- Something");
    await userEvent.click(screen.getByRole("button", { name: /Suggest facts/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("free-tier limit");
  });

  it("adds a fact you type, marked ask every time", async () => {
    const calls = mockApi(() => ({ json: { profile: PROFILE } }));
    render(<Harness initial={PROFILE} />);
    const form = screen.getByRole("form", { name: "Add a fact" });
    await userEvent.type(within(form).getByLabelText("New fact"), "Notice period is two months");
    await userEvent.selectOptions(within(form).getByLabelText("Category"), "preference");
    await userEvent.click(within(form).getByLabelText("Ask me every time"));
    await userEvent.click(within(form).getByRole("button", { name: /Add fact/ }));
    expect(calls[0]).toEqual({
      method: "POST",
      url: "/api/profile/facts",
      body: { text: "Notice period is two months", category: "preference", sensitivity: "ask_every_time" },
    });
  });

  it("edits and deletes a fact", async () => {
    const calls = mockApi(() => ({ json: { profile: PROFILE } }));
    render(<Harness initial={PROFILE} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit: Four years of React" }));
    const form = screen.getByRole("form", { name: "Edit fact" });
    await userEvent.clear(within(form).getByLabelText("Fact"));
    await userEvent.type(within(form).getByLabelText("Fact"), "Five years of React");
    await userEvent.click(within(form).getByRole("button", { name: "Save" }));
    expect(calls[0]).toEqual({
      method: "PATCH",
      url: "/api/profile/facts/f-react",
      body: { text: "Five years of React", category: "experience", sensitivity: "normal" },
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete: Production Rust experience" }));
    expect(calls[1]).toMatchObject({ method: "DELETE", url: "/api/profile/facts/f-rust" });
  });

  it("saves style notes one per line and adds a style example", async () => {
    const calls = mockApi(() => ({ json: { profile: PROFILE } }));
    render(<Harness initial={PROFILE} />);
    const notes = screen.getByLabelText("How you write");
    await userEvent.clear(notes);
    await userEvent.type(notes, "Short{enter}{enter}  Direct  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(calls[0]?.body).toEqual({ name: "Jordan Lee", headline: "Frontend engineer", styleNotes: ["Short", "Direct"] });

    const form = screen.getByRole("form", { name: "Add a message you wrote" });
    await userEvent.type(within(form).getByLabelText("Situation"), "Declining");
    await userEvent.type(within(form).getByLabelText("Message"), "Thanks, I'll pass. Jordan");
    await userEvent.click(within(form).getByRole("button", { name: /Add example/ }));
    expect(calls[1]).toEqual({ method: "POST", url: "/api/profile/examples", body: { situation: "Declining", text: "Thanks, I'll pass. Jordan" } });
  });

  it("asks for a name first when there's no profile yet", async () => {
    const created: Profile = { name: "Sam Rivera", headline: "", styleNotes: [], facts: [], styleExamples: [] };
    const calls = mockApi(() => ({ json: { profile: created } }));
    render(<Harness initial={null} missing />);
    expect(screen.getByRole("heading", { name: "Set up your profile" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Resume text")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Name"), "Sam Rivera");
    await userEvent.click(screen.getByRole("button", { name: "Create profile" }));
    expect(calls[0]).toMatchObject({ method: "PATCH", url: "/api/profile", body: { name: "Sam Rivera" } });
    expect(await screen.findByLabelText("Resume text")).toBeInTheDocument();
  });
});
