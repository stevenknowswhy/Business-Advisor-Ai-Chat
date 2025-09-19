import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "convex/react";
import {
  AdvisorWizardSchema,
  type AdvisorWizardInput,
  mapWizardToCreatePayload,
} from "../forms/schemas";

// Skeleton, minimal styling. Replace with your design system components.

type StepKey = "identity" | "expertise" | "role" | "review";
const steps: { key: StepKey; label: string }[] = [
  { key: "identity", label: "Identity" },
  { key: "expertise", label: "Expertise" },
  { key: "role", label: "Role" },
  { key: "review", label: "Review" },
];

export interface AdvisorWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: AdvisorWizardInput) => void;
}

export function AdvisorWizardDialog({ open, onOpenChange, onSubmit }: AdvisorWizardDialogProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const createAdvisor = useAction("advisors:create");

  const methods = useForm<AdvisorWizardInput>({
    resolver: zodResolver(AdvisorWizardSchema),
    mode: "onBlur",
    defaultValues: {
      identity: { name: "", title: "", oneLiner: "", avatarUrl: undefined, handle: undefined, tags: [] },
      expertise: { specialties: [], expertise: [], traits: [] },
      role: { mission: "", scopeIn: [], scopeOut: [], kpis: [], adviceStyle: { voice: "", tone: "" } },
    },
  });

  const currentStep = steps[activeIndex];

  function next() {
    setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function prev() {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmitAll(values: AdvisorWizardInput) {
    setError(null);
    try {
      setSubmitting(true);
      const payload = mapWizardToCreatePayload(values);
      const res = await createAdvisor({ payload } as any);
      if ((res as any)?.ok) {
        methods.reset();
        onSubmit?.(values);
        onOpenChange(false);
      } else {
        setError("Creation failed. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message ?? "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  // Per-step submit validates entire schema but UX can be improved later
  async function onNext() {
    const valid = await methods.trigger();
    if (valid) next();
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="advisor-wizard-title" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 rounded-md shadow-lg w-full max-w-2xl p-4">
        <div className="mb-4" aria-live="polite">
          <h2 id="advisor-wizard-title" className="text-lg font-semibold">Create Advisor</h2>
          <nav className="mt-2 flex gap-2" aria-label="Wizard steps">
            {steps.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                aria-current={idx === activeIndex ? "step" : undefined}
                className={`px-2 py-1 rounded ${idx === activeIndex ? "bg-blue-600 text-white" : "bg-neutral-200"}`}
                onClick={() => setActiveIndex(idx)}
                title={s.label}
              >
                {idx + 1}. {s.label}
              </button>
            ))}
          </nav>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(handleSubmitAll)}
            aria-describedby="wizard-desc"
          >
            <p id="wizard-desc" className="sr-only">Advisor creation wizard with 4 steps: Identity, Expertise, Role, and Review.</p>

            {currentStep.key === "identity" && (
              <section aria-label="Identity step" className="space-y-3">
                {/* TODO: replace with input components and proper labels */}
                <label className="block">
                  <span className="block text-sm">Name</span>
                  <input aria-label="Name" title="Name" className="w-full border p-2" {...methods.register("identity.name")} />
                </label>
                <label className="block">
                  <span className="block text-sm">Title</span>
                  <input aria-label="Title" title="Title" className="w-full border p-2" {...methods.register("identity.title")} />
                </label>
                <label className="block">
                  <span className="block text-sm">One-liner</span>
                  <input aria-label="One-liner" title="One-liner" className="w-full border p-2" {...methods.register("identity.oneLiner")} />
                </label>
              </section>
            )}

            {currentStep.key === "expertise" && (
              <section aria-label="Expertise step" className="space-y-3">
                <p className="text-sm text-neutral-600">Specialties, expertise, and traits inputs go here.</p>
              </section>
            )}

            {currentStep.key === "role" && (
              <section aria-label="Role step" className="space-y-3">
                <label className="block">
                  <span className="block text-sm">Mission</span>
                  <textarea aria-label="Mission" title="Mission" className="w-full border p-2" {...methods.register("role.mission")} />
                </label>
              </section>
            )}

            {currentStep.key === "review" && (
              <section aria-label="Review step" className="space-y-3">
                <pre className="bg-neutral-50 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(methods.getValues(), null, 2)}
                </pre>
              </section>
            )}

            {error && (
              <p role="alert" aria-live="assertive" className="text-red-600 text-sm">{error}</p>
            )}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <button type="button" onClick={prev} disabled={activeIndex === 0 || submitting} className="px-3 py-2 bg-neutral-200 rounded" title="Previous step">Back</button>
                {activeIndex < steps.length - 1 && (
                  <button type="button" onClick={onNext} disabled={submitting} className="px-3 py-2 bg-blue-600 text-white rounded" title="Next step">Next</button>
                )}
              </div>
              {activeIndex === steps.length - 1 && (
                <button type="submit" disabled={submitting} className="px-3 py-2 bg-green-600 text-white rounded" title="Create advisor">Create</button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
      <button type="button" className="fixed inset-0 -z-10" aria-label="Close" title="Close" onClick={() => onOpenChange(false)} />
    </div>
  );
}

export default AdvisorWizardDialog;

