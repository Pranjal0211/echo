import { SCREENS, type ScreenId } from "../components/sidebar.tsx";

export function ComingSoon({ screen }: { screen: ScreenId }) {
  const meta = SCREENS.find((s) => s.id === screen);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <section className="grid flex-1 place-items-center p-8">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold">{meta.label}</h1>
        <p className="mt-1 text-sm text-muted">Arrives in {meta.milestone}. See the roadmap in the README.</p>
      </div>
    </section>
  );
}
