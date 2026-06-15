export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response("Missing env variables: DISCORD_TOKEN or DISCORD_CHANNEL", { status: 500 });
    }

    const res = await fetch(
      `https://discord.com/api/v10/channels/${channel}/messages?limit=20`,
      {
        headers: {
          Authorization: `Bot ${token}`
        }
      }
    );

    const text = await res.text();

    let messages;
    try {
      messages = JSON.parse(text);
    } catch {
      return new Response("Discord returned invalid JSON:\n" + text, { status: 500 });
    }

    // Discord returns an object with a "code" field on error (e.g. missing access)
    if (!Array.isArray(messages)) {
      return new Response(
        "Discord API error: " + JSON.stringify(messages, null, 2),
        { status: 500 }
      );
    }

    const output = messages
      .reverse()
      .map(msg => {
        // msg.content can be empty if the message is embed-only
        // Fall back to embed title/description if content is blank
        let body = (msg.content || "").trim();

        if (!body && msg.embeds && msg.embeds.length > 0) {
          const embed = msg.embeds[0];
          const parts = [];
          if (embed.title) parts.push(embed.title);
          if (embed.description) parts.push(embed.description);
          if (embed.fields) {
            embed.fields.forEach(f => {
              parts.push(`${f.name}\n${f.value}`);
            });
          }
          body = parts.join("\n\n");
        }

        // Use first non-empty line as title, fallback to "Devlog"
        const firstLine = body.split("\n").find(l => l.trim()) || "";
        const title = firstLine.length > 0 && firstLine.length < 80
          ? firstLine.trim()
          : "Devlog";

        return [
          "===POST===",
          "TITLE:" + title,
          "AUTHOR:" + (msg.author?.username || "unknown"),
          "DATE:" + (msg.timestamp || ""),
          "AVATAR:" + (msg.author?.avatar
            ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
            : ""),
          "CONTENT:",
          body || "(no content)",
          "===END==="
        ].join("\n");
      })
      .join("\n\n");

    return new Response(output, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    return new Response("Server error: " + err.message, { status: 500 });
  }
}