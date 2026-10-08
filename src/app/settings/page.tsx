import { SettingsForm } from "@/components/settings/SettingsForm";
import { IrisLogo } from "@/components/brand/IrisLogo";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
        <IrisLogo size={36} variant="badge" className="rounded-xl shadow-2xs shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">IRIS Settings</h2>
            <span className="text-[10px] font-semibold tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200 uppercase">
              Chief of Staff v1.0
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure system integrations, assistant persona, and scheduling parameters.
          </p>
        </div>
      </div>
      <SettingsForm />
    </div>
  );
}
