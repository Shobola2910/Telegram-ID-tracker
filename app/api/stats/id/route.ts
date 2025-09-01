import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").toUpperCase();
  if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

  const global = Number((await kv.get<number>(`count:global:id:${id}`)) || 0);
  const chatIds = (await kv.smembers<string>("set:chats")) || [];

  const perChat = await Promise.all(
    chatIds.map(async (cid) => ({
      chat_id: cid,
      count: Number((await kv.get<number>(`count:chat:${cid}:id:${id}`)) || 0),
      meta: (await kv.hgetall<{ title?: string; type?: string }>(`hash:chat:${cid}`)) || {},
    }))
  );

  return new Response(JSON.stringify({ id, global, perChat }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}