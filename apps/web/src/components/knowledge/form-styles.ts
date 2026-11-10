import { FactCategory, type ProfileFact } from "@echo/contracts";

export const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
export const label = "flex flex-col gap-1 text-sm font-medium";
export const card = "rounded-2xl border border-line bg-surface p-4 md:p-5";

export const CATEGORY_LABEL: Record<ProfileFact["category"], string> = {
  experience: "Experience",
  skill: "Skill",
  project: "Project",
  education: "Education",
  preference: "Preference",
  other: "Other",
};

export const CATEGORIES = FactCategory.options;
