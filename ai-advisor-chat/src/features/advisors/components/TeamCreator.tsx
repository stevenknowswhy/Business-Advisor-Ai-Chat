import * as React from "react";
import { useCreateTeam } from "../hooks/useCreateTeam";

// Minimal cross-compatible types (structural match to DS types)
export type DSButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: string;
  size?: string;
  fullWidth?: boolean;
  className?: string;
};

export interface FilterOption { value: string; label: string; count?: number }
export interface DSFilterDropdownProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

const templates = [
  { id: "startup-founding-team", label: "🚀 Startup Founding Team" },
  { id: "marketing-dream-team", label: "📈 Marketing Dream Team" },
  { id: "product-development-team", label: "💻 Product Development Team" },
];

export interface TeamCreatorProps {
  onAdvisorsCreated?: (advisorIds: string[]) => void;
  ButtonComponent?: React.ComponentType<DSButtonProps>;
  SelectComponent?: React.ComponentType<DSFilterDropdownProps>;
}

export function TeamCreator({ onAdvisorsCreated, ButtonComponent, SelectComponent }: TeamCreatorProps) {
  const { createTeam, loading, error, lastResult, reset } = useCreateTeam();
  const [templateId, setTemplateId] = React.useState(templates[0]?.id || '');

  async function onCreate() {
    reset();
    const res = await createTeam(templateId);
    if (res?.advisorIds && onAdvisorsCreated) onAdvisorsCreated(res.advisorIds);
  }

  const SelectEl = SelectComponent;
  const ButtonEl = ButtonComponent;

  return (
    <section aria-labelledby="team-creator-title" className="p-4 border rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 id="team-creator-title" className="text-lg font-semibold">Create Advisor Team</h2>
        {loading && (
          <span className="flex items-center text-sm text-gray-600" aria-live="polite">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Advisor is thinking...
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="templateSelect">Template</label>
          {SelectEl ? (
            <SelectEl
              options={templates.map(t => ({ value: t.id, label: t.label }))}
              value={templateId}
              onChange={(v) => { if (typeof v === 'string') setTemplateId(v); }}
              label="Template"
              disabled={loading}
              placeholder="Select template..."
              size="md"
              className="w-full"
            />
          ) : (
            <select
              id="templateSelect"
              aria-label="Template"
              title="Template"
              className="w-full border border-gray-300 rounded-md h-10 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              disabled={loading}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="sm:col-span-1">
          {ButtonEl ? (
            <ButtonEl
              onClick={onCreate}
              disabled={loading}
              loading={loading}
              className="w-full h-10"
              aria-busy={loading}
              title="Create team"
            >
              Create Team
            </ButtonEl>
          ) : (
            <button
              type="button"
              onClick={onCreate}
              disabled={loading}
              className="w-full h-10 inline-flex items-center justify-center rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
              title="Create team"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>Create Team</>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3" role="alert" aria-live="assertive">
          <div className="flex items-start justify-between">
            <p className="text-sm text-red-700">{error}</p>
            {ButtonEl ? (
              <ButtonEl
                onClick={onCreate}
                disabled={loading}
                variant="ghost"
                className="text-sm text-red-700"
                title="Retry creating team"
              >
                Retry
              </ButtonEl>
            ) : (
              <button
                type="button"
                onClick={onCreate}
                disabled={loading}
                className="text-sm font-medium text-red-700 hover:underline"
                title="Retry creating team"
              >
                Retry
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-red-600">Tip: Make sure you are signed in and try again. You can also wait a minute if you hit the rate limit.</p>
        </div>
      )}

      {lastResult && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-800">Team created successfully</p>
          <p className="mt-1 text-sm text-green-900">Template: <span className="font-mono">{lastResult.templateId}</span></p>
          <p className="text-sm text-green-900">Advisors created: <strong>{lastResult.advisorIds.length}</strong></p>

          {lastResult.advisors && lastResult.advisors.length > 0 && (
            <ul className="mt-2 text-sm text-green-900 list-disc list-inside">
              {lastResult.advisors.map(a => (
                <li key={a._id}><span className="font-medium">{a.name}</span> <span className="text-gray-600">(@{a.handle})</span></li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="/marketplace?tab=my-advisors"
              className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-green-300 text-green-800 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              title="View New Advisors"
            >
              View New Advisors
            </a>
            {ButtonEl ? (
              <ButtonEl onClick={() => reset()} variant="outline" className="h-9">
                Create Another
              </ButtonEl>
            ) : (
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                title="Create another team"
              >
                Create Another
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default TeamCreator;
