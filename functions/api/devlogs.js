export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response("Missing env variables: DISCORD_TOKEN or DISCORD_CHANNEL", { status: 500 });
    }

    const res = await fetch(
      `https://discord.com/api/v10/channels/${channel}/messages?limit=100`,
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
    const logMessages = messages.filter(msg =>
      (msg.content || "").trimStart().toUpperCase().startsWith("LOGS")
    );

    // Group by UTC date (YYYY-MM-DD)
    const byDate = {};
    for (const msg of logMessages) {
      const date = msg.timestamp.slice(0, 10); // "2024-03-15"
      if (!byDate[date]) {
        byDate[date] = { date, messages: [] };
      }
      byDate[date].messages.push(msg);
    }

    // Build one post per date, most recent first
    const posts = Object.values(byDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(group => {
        // Sort messages within the day oldest-first so content reads in order
        group.messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        // Merge all text content, skip duplicate "LOGS" headers after the first
        let title = "";
        const contentParts = [];
        const attachments = [];

        group.messages.forEach((msg, i) => {
          const body = (msg.content || "").trim();
          const lines = body.split("\n");

          if (i === 0) {
            // First message: first line is the title, rest is content
            title = lines[0].trim();
            const rest = lines.slice(1).join("\n").trim();
            if (rest) contentParts.push(rest);
          } else {
            // Subsequent messages on the same day: skip the LOGS line, keep rest
            const rest = lines
              .filter((l, idx) => !(idx === 0 && l.trim().toUpperCase().startsWith("LOGS")))
              .join("\n")
              .trim();
            if (rest) contentParts.push(rest);
          }

          // Collect all attachments
          (msg.attachments || []).forEach(a => {
            attachments.push({
              url: a.url,
              type: a.content_type || "",
              name: a.filename || ""
            });
          });
        });

        // Use the author from the first message
        const firstMsg = group.messages[0];

        return {
          title: title || "LOGS",
          date: group.date,
          author: firstMsg.author?.username || "unknown",
          avatar: firstMsg.author?.avatar
            ? `https://cdn.discordapp.com/avatars/${firstMsg.author.id}/${firstMsg.author.avatar}.png`
            : "",
          content: contentParts.join("\n\n"),
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