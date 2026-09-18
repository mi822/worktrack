const iconClass = "h-4 w-4 shrink-0";

export function NavIcon({ href }: { href: string }) {
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
    default:
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}
