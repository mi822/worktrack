export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const IANA_TIMEZONES = [
  "Africa/Douala",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Europe/Paris",
  "Europe/London",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "Asia/Dubai",
] as const;

export type WorkSchedule = {
  id: 1;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  work_start: string;
  work_end: string;
  late_threshold_minutes: number;
  break_start: string | null;
  break_end: string | null;
  timezone: string;
};

export type QrCodeRow = {
  id: number;
  token: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
};

export type PresenceStatus = "present" | "late";

export type PresenceRow = {
  id: number;
  user_id: string;
  work_date: string;
  scanned_at: string;
  status: PresenceStatus;
  qr_code_id: number;
  full_name: string;
};
