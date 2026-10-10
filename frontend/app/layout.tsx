import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Self-Organizing Multi-Agent Systems | Environmental Monitoring",
  description:
    "Decentralized environmental monitoring using autonomous agents, AI anomaly detection, and self-organizing networks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
