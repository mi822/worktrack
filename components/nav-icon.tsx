export function NavIcon({
  href,
  size = "md",
}: {
  href: string;
  size?: "md" | "lg";
}) {
  const iconClass = size === "lg" ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0";
  switch (href) {
    case "/":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2.5 7.2 8 2.5l5.5 4.7V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7.2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "/admin/users":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="6" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M2.5 13c.4-2 1.8-3 3.5-3s3.1 1 3.5 3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="11" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10.2 13c.2-1.2 1-2 2.3-2 1 0 1.7.5 2 1.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "/admin/hours":
    case "/timesheet":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5v3.2L10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "/admin/qr":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 3h4v4H3V3Zm6 0h4v4H9V3ZM3 9h4v4H3V9Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 9h1v1h-1V9Zm2 0h1v1h-1V9Zm-2 2h1v1h-1v-1Zm2 2h1v1h-1v-1Zm-2 0h1v1h-1v-1Zm2-2h1v1h-1v-1Z" fill="currentColor" />
        </svg>
      );
    case "/admin/attendance":
    case "/attendance":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 2.5v2M11 2.5v2M2.5 7h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "/scan":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 5.5V4a1 1 0 0 1 1-1h1.5M11.5 3H13a1 1 0 0 1 1 1v1.5M13 11.5V13a1 1 0 0 1-1 1h-1.5M4.5 13H3a1 1 0 0 1-1-1v-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2 8h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "/projects":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 5.5 8 3l5 2.5v6L8 14l-5-2.5v-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 8v6M3 5.5 8 8l5-2.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "/intern-logs":
    case "/learning-log":
    case "/summary":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 3.5h8v9.5H4V3.5Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "/tasks":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 4h9M3.5 8h9M3.5 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M3.5 4 5 5.5 7 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "/performance":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.5 11V8.5M8 11V5M11.5 11V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "/surveys":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5V11a1 1 0 0 1-1-1V4Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M5.5 6h5M5.5 8h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "/documents":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 2.5h5l3 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M9 2.5v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "plus":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "search":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "percent":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m12.5 3.5-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="4.5" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="11.5" cy="11.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "logout":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6.5 2.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M10 5l3 3-3 3M13 8H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alert":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2.5 14 13H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.2" r=".8" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m5.5 8 1.8 1.8L10.8 6.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "user":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 13.5c.5-2.4 2.5-3.8 5-3.8s4.5 1.4 5 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "more":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}
