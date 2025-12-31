import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hawkeyes | Real-Time Intelligence Engine",
  description: "AI-powered spatial intelligence for physical spaces. Real-time monitoring, threat detection, and incident response.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
