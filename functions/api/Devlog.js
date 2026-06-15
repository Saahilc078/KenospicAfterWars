export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return jsonResponse(
        { error: "Missing DISCORD_TOKEN or DISCORD_CHANNEL" },
        500
      );
    }

    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channel}/messages?limit=20`,
      {
        headers: {
          Authorization: `Bot ${token}`
        }
      }
    );

    const rawText = await discordRes.text();

    let messages;
    try {
      messages = JSON.parse(rawText);
    } catch {
      return jsonResponse({
        error: "Discord returned invalid JSON",
        raw: rawText
      }, 500);
    }

    if (!Array.isArray(messages)) {
      return jsonResponse({
        error: "Discord response was not an array",
        raw: messages
      }, 500);
    }

    const posts = messages
      .reverse()
      .map(msg => ({
        id: msg.id,
        title: (msg.content?.split("\n")[0]) || "Devlog",
        content: msg.content || "",
        author: msg.author?.username || "unknown",
        avatar: msg.author?.avatar
          ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/0.png`,
        date: msg.timestamp || null,
        images: (msg.attachments || []).map(a => a.url)
      }));

    return jsonResponse(posts, 200);

  } catch (err) {
    return jsonResponse({
      error: "Function crashed",
      details: err.message
    }, 500);
  }
}

/**
 * Safe JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}