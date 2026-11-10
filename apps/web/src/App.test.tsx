import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";

describe("App shell", () => {
  it("shows a coming-soon screen for features in later milestones", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Daily Digest/ }));
    expect(screen.getByRole("heading", { name: "Daily Digest" })).toBeInTheDocument();
    expect(screen.getByText(/Arrives in Milestone 5/)).toBeInTheDocument();
  });
});
