import { SaveHoursButton } from "@/app/admin/hours/save-hours-button";
import { SectionHeader } from "@/components/dashboard/ui";
import { saveWorkSchedule } from "@/lib/presence/schedule-actions";
import { toInputTime } from "@/lib/presence/schedule-input";
import {
  IANA_TIMEZONES,
  WEEKDAYS,
  WEEKDAY_LABEL,
  type WorkSchedule,
} from "@/lib/presence/types";

function timeValue(value: string | null | undefined) {
  const next = toInputTime(value ?? null);
  return next === "" ? undefined : next;
}

export function HoursForm({
  schedule,
  error,
  saved,
}: {
  schedule: WorkSchedule | null;
  error: string | null;
  saved?: boolean;
}) {
  return (
    <form action={saveWorkSchedule} autoComplete="off" className="panel mt-6 space-y-6 p-5 sm:p-6">
      <SectionHeader
        icon="/timesheet"
        title="Schedule"
        description="Used for presence, lateness and timesheets"
      />
      {error ? <p className="alert-error">{error}</p> : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Hours saved.
        </p>
      ) : null}

      <fieldset>
        <legend className="field-caption">Working days</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {WEEKDAYS.map((day) => (
            <label key={day} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={day}
                defaultChecked={schedule ? schedule[day] : false}
                className="size-4 rounded border-line"
              />
              {WEEKDAY_LABEL[day]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 min-[480px]:grid-cols-2">
        <label className="field-label">
          <span className="field-caption">Start</span>
          <input
            type="time"
            name="work_start"
            required
            defaultValue={timeValue(schedule?.work_start)}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">End</span>
          <input
            type="time"
            name="work_end"
            required
            defaultValue={timeValue(schedule?.work_end)}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Late threshold (minutes after start)</span>
          <input
            type="number"
            name="late_threshold_minutes"
            min={0}
            step={1}
            required
            defaultValue={
              schedule ? String(schedule.late_threshold_minutes) : undefined
            }
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Timezone</span>
          <select
            name="timezone"
            required
            defaultValue={schedule?.timezone ?? ""}
            className="field-input"
          >
            <option value="" disabled>
              Select a timezone
            </option>
            {(schedule?.timezone &&
            !(IANA_TIMEZONES as readonly string[]).includes(schedule.timezone)
              ? [schedule.timezone, ...IANA_TIMEZONES]
              : IANA_TIMEZONES
            ).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span className="field-caption">Break start (optional)</span>
          <input
            type="time"
            name="break_start"
            defaultValue={timeValue(schedule?.break_start)}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Break end (optional)</span>
          <input
            type="time"
            name="break_end"
            defaultValue={timeValue(schedule?.break_end)}
            className="field-input"
          />
        </label>
      </div>

      <SaveHoursButton />
    </form>
  );
}
