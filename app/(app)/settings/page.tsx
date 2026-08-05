import { PushSettings } from "@/components/PushSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">Settings</h1>
      <PushSettings />
    </div>
  );
}
