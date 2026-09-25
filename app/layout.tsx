import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkTrack",
  description:
    "Employee task allocation, presence monitoring, and engagement tracking.",
};

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} h-full antialiased`}
    >
      {supabaseOrigin ? (
        <head>
          <link rel="preconnect" href={supabaseOrigin} />
          <link rel="dns-prefetch" href={supabaseOrigin} />
        </head>
      ) : null}
      <body className="flex min-h-full flex-col font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
