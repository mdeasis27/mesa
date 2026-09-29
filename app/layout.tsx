import type { Metadata } from "next";
import { fontVariables } from "@/design-system/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesa · Multi-agent orchestration with typed handoffs",
  description:
    "A supervisor + three specialists with typed handoffs, budget enforcement in code, step tracing and a terminating reviewer subgraph — no API keys required in demo mode.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="dark" enableSystem={false} attribute="class">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
