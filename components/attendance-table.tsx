"use client";

import { EmptyNote, StatusPill } from "@/components/dashboard/ui";
import { EMPTY_ATTENDANCE, EMPTY_ATTENDANCE_HINT } from "@/lib/dashboards/empty-copy";
import { formatDate, formatTime } from "@/lib/format-date";
import type { PresenceRow } from "@/lib/presence/types";
import { ROLE_LABEL } from "@/lib/roles";
import { isAppRole } from "@/lib/types";
import { useMemo, useState } from "react";

export function AttendanceTable({ records }: { records: PresenceRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [date, setDate] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((row) => {
      if (status !== "all" && row.status !== status) {
        return false;
      }
      if (role !== "all" && row.role !== role) {
        return false;
      }
      if (date && row.work_date !== date) {
        return false;
      }
      if (needle && !row.full_name.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [records, query, status, role, date]);

  if (records.length === 0) {
    return (
      <EmptyNote title={EMPTY_ATTENDANCE}>{EMPTY_ATTENDANCE_HINT}</EmptyNote>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field-label">
          <span className="field-caption">User</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people"
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="field-input"
          />
        </label>
        <label className="field-label">
          <span className="field-caption">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="field-input"
          >
            <option value="all">All</option>
            <option value="intern">Intern</option>
            <option value="employee">Employee</option>
            <option value="project_head">Project head</option>
            <option value="manager">Manager</option>
          </select>
        </label>
        <label className="field-label">
          <span className="field-caption">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="field-input"
          >
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyNote title="No matches.">Clear a filter to see more rows.</EmptyNote>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Time recorded</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 font-medium">{row.full_name}</td>
                  <td className="py-3 pr-4">
                    {isAppRole(row.role) ? ROLE_LABEL[row.role] : row.role}
                  </td>
                  <td className="py-3 pr-4">{formatDate(row.work_date)}</td>
                  <td className="py-3 pr-4">{formatTime(row.scanned_at)}</td>
                  <td className="py-3">
                    <StatusPill tone={row.status === "present" ? "ok" : "warn"}>
                      {row.status === "present" ? "Present" : "Late"}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
