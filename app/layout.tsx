import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobSync",
  description: "Job platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900">
        {children}
      </body>
    </html>
  );
}
