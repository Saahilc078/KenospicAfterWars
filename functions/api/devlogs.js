export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response("Missing env variables: DISCORD_TOKEN or DISCORD_CHANNEL", { status: 500 });
    }

    const res = await fetch(
      `https://discord.com/api/v10/channels/${channel}/messages?limit=50`,
      {
        headers: { Authorization: `Bot ${token}` }
      }
    );

    const text = await res.text();
    let messages;
    try {
      messages = JSON.parse(text);
    } catch {
      return new Response("Discord returned invalid JSON:\n" + text, { status: 500 });
    }

    if (!Array.isArray(messages)) {
      return new Response("Discord API error: " + JSON.stringify(messages, null, 2), { status: 500 });
    }

    // Only keep messages that start with "LOGS"
    const logMessages = messages
      .filter(msg => (msg.content || "").trimStart().toUpperCase().startsWith("LOGS"))
      .reverse();

    const posts = logMessages.map(msg => {
      const body = (msg.content || "").trim();

      // Everything after the first line is the post body
      const lines = body.split("\n");
      const title = lines[0].trim(); // e.g. "LOGS - Week 4"
      const content = lines.slice(1).join("\n").trim();

      // Attachments: images and videos uploaded directly to Discord
      const attachments = (msg.attachments || []).map(a => ({
        url: a.url,
        type: a.content_type || "",
        name: a.filename || "",
        width: a.width || null,
        height: a.height || null
      }));

      return {
        title,
        author: msg.author?.username || "unknown",
        authorId: msg.author?.id || "",
        avatar: msg.author?.avatar
          ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
          : "",
        date: msg.timestamp || "",
        content,
        attachments
      };
    });

    return new Response(JSON.stringify(posts, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}