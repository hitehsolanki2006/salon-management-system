import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  const update = await req.json();

  if (!update.message?.text) return new Response("ok");

  const chatId = update.message.chat.id.toString();
  const text = update.message.text;

  if (text === "/start") {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Telegram notifications enabled successfully!",
      }),
    });

    // TEMP: store chat_id without user until linked
    await supabase.from("users").update({
      telegram_chat_id: chatId,
      telegram_enabled: true
    }).eq("email", update.message.from.username);

    return new Response("ok");
  }

  return new Response("ignored");
});
