import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RetailOS",
  description: "Secure operating intelligence for African fashion retail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
