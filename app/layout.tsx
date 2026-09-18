import type { Metadata } from "next";
import { Manrope, Source_Sans_3, Geist_Mono } from "next/font/google";
import "./globals.css";

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Manrope({
  variable: "--font-display-face",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${body.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
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
