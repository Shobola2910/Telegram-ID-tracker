import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chat_id");
  if (!chatId) return new Response(JSON.stringify({ error: "chat_id required" }), { status: 400 });

  const ids = (await kv.smembers<string>("set:ids")) || [];
  const actions = (await kv.smembers<string>("set:actions")) || [];

  const idCounts = await Promise.all(
    ids.map(async (id) => ({
      id,
      count: Number((await kv.get<number>(`count:chat:${chatId}:id:${id}`)) || 0),
    }))
  );

  const actionCounts = await Promise.all(
    actions.map(async (a) => ({
      action: a,
      count: Number((await kv.get<number>(`count:action:chat:${chatId}:${a}`)) || 0),
    }))
  );

  const meta = (await kv.hgetall<{ title?: string; type?: string }>(`hash:chat:${chatId}`)) || {};

  return new Response(JSON.stringify({ chat: { chat_id: chatId, ...meta }, ids: idCounts, actions: actionCounts }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}