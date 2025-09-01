import { kv } from "@vercel/kv";

export default async function Dashboard() {
  const ids = (await kv.smembers<string>("set:ids")) || [];
  const actions = (await kv.smembers<string>("set:actions")) || [];
  const chatIds = (await kv.smembers<string>("set:chats")) || [];

  const idCounts = await Promise.all(
    ids.map(async (id) => ({
      id,
      count: Number((await kv.get<number>(`count:global:id:${id}`)) || 0),
    }))
  );

  const actionCounts = await Promise.all(
    actions.map(async (a) => ({
      action: a,
      count: Number((await kv.get<number>(`count:action:global:${a}`)) || 0),
    }))
  );

  const chats = await Promise.all(
    chatIds.map(async (cid) => {
      const meta = (await kv.hgetall<{ title?: string; type?: string }>(`hash:chat:${cid}`)) || {};
      return { chat_id: cid, title: meta.title || "", type: meta.type || "" };
    })
  );

  return (
    <main>
      <h1>Dashboard</h1>

      <section>
        <h2>Global ID Counts</h2>
        <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">ID</th><th align="right">Count</th></tr></thead>
          <tbody>
            {idCounts.map(({ id, count }) => (
              <tr key={id}><td>{id}</td><td align="right">{count}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Global Actions</h2>
        <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Action</th><th align="right">Count</th></tr></thead>
          <tbody>
            {actionCounts.map(({ action, count }) => (
              <tr key={action}><td>{action}</td><td align="right">{count}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Chats</h2>
        <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Chat ID</th><th align="left">Title</th><th align="left">Type</th></tr></thead>
          <tbody>
            {chats.map(({ chat_id, title, type }) => (
              <tr key={chat_id}><td>{chat_id}</td><td>{title}</td><td>{type}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}