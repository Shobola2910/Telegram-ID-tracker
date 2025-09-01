import { kv } from "@vercel/kv";

export async function GET() {
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

  return new Response(JSON.stringify({ ids: idCounts, actions: actionCounts, chats }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}