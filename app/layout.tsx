import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DTCE Member Portal",
  description: "Directorate of Teens and Children Education - Member Registration Portal",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
