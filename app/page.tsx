export default function Home() {
  return (
    <main>
      <h1>Telegram ID Tracker</h1>
      <p>Deploy this on Vercel and set your Telegram webhook to <code>/api/telegram</code>.</p>
      <ol>
        <li>Create a Vercel project, add <code>KV</code> (Upstash) integration.</li>
        <li>Set <code>TELEGRAM_SECRET_TOKEN</code> env variable.</li>
        <li>Set Telegram webhook: <code>https://&lt;your-app&gt;.vercel.app/api/telegram</code> with the same secret token.</li>
        <li>Open <a href="/dashboard">/dashboard</a> to see counts.</li>
      </ol>
    </main>
  );
}