export const metadata = {
  title: "Telegram ID Tracker",
  description: "Telegram → Vercel KV tracker with 1-hour per-chat de-duplication",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, Arial, sans-serif", padding: 20, maxWidth: 980, margin: "0 auto" }}>
        {children}
      </body>
    </html>
  );
}