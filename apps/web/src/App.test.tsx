import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.tsx";

describe("App shell", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [] }))));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows a coming-soon screen for features in later milestones", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Daily Digest/ }));
    expect(screen.getByRole("heading", { name: "Daily Digest" })).toBeInTheDocument();
    expect(screen.getByText(/Arrives in Milestone 5/)).toBeInTheDocument();
  });

  it("shows an error when the API is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Can't reach the Echo API/);
  });
});
