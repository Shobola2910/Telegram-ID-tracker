import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { extractIds, classifyAction } from "@/lib/utils";

type TGUser = { id: number; first_name?: string; last_name?: string; username?: string; };
type TGChat = { id: number; type?: string; title?: string; username?: string; };
type TGMessage = { message_id: number; from?: TGUser; chat: TGChat; text?: string; };
type TGUpdate = { message?: TGMessage; edited_message?: TGMessage; channel_post?: TGMessage; edited_channel_post?: TGMessage; };

const SECRET = process.env.TELEGRAM_SECRET_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token") || "";
    if (SECRET && headerSecret && headerSecret !== SECRET) {
      return new NextResponse("forbidden", { status: 403 });
    }

    const update = (await req.json()) as TGUpdate;
    const msg =
      update.message ||
      update.edited_message ||
      update.channel_post ||
      update.edited_channel_post;

    if (!msg || typeof msg.text !== "string") {
      return NextResponse.json({ ok: true });
    }

    const text = msg.text || "";
    const ids = extractIds(text);
    const action = classifyAction(text);

    const chatId = String(msg.chat?.id ?? "");
    const chatTitle = msg.chat?.title || msg.chat?.username || "";
    const chatType = msg.chat?.type || "unknown";

    // register chat metadata
    if (chatId) {
      await kv.sadd("set:chats", chatId);
      await kv.hset(`hash:chat:${chatId}`, { title: chatTitle, type: chatType });
    }

    if (ids.length === 0) {
      // No IDs: still can count action globally (optional: only count with id? requirement says count IDs, so skip increment action if no ID)
      return NextResponse.json({ ok: true });
    }

    // For each ID: per-chat 1-hour dedupe, then increment counters
    const promises: Promise<any>[] = [];
    for (const { normalized } of ids) {
      // dedupe key: seen:<chat_id>:<ID>
      const key = `seen:${chatId}:${normalized}`;
      // set with TTL 3600s and NX (only if not exists)
      const setOk = await kv.set(key, "1", { ex: 3600, nx: true });
      if (setOk !== null) {
        // first time within 1h for this chat+id => count
        promises.push(kv.sadd("set:ids", normalized));
        promises.push(kv.incr(`count:global:id:${normalized}`));
        if (chatId) promises.push(kv.incr(`count:chat:${chatId}:id:${normalized}`));

        if (action) {
          promises.push(kv.sadd("set:actions", action));
          promises.push(kv.incr(`count:action:global:${action}`));
          if (chatId) promises.push(kv.incr(`count:action:chat:${chatId}:${action}`));
        }
      }
    }

    if (promises.length) await Promise.all(promises);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("telegram webhook error:", e?.message || e);
    // Always 200 so Telegram doesn't retry aggressively
    return NextResponse.json({ ok: true });
  }
}