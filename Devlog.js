export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response("Missing env variables: DISCORD_TOKEN or DISCORD_CHANNEL", { status: 500 });
    }

    // Fetch all messages via pagination (Discord max 100 per request)
    async function fetchAllMessages() {
      const all = [];
      let before = null;

      while (true) {
        const url = `https://discord.com/api/v10/channels/${channel}/messages?limit=100`
          + (before ? `&before=${before}` : "");

        const res = await fetch(url, {
          headers: { Authorization: `Bot ${token}` }
        });

        const text = await res.text();
        let batch;
        try { batch = JSON.parse(text); }
        catch { throw new Error("Discord returned invalid JSON: " + text); }

        if (!Array.isArray(batch)) {
          throw new Error("Discord API error: " + JSON.stringify(batch));
        }

        if (batch.length === 0) break;

        all.push(...batch);
        before = batch[batch.length - 1].id; // oldest message id in this batch

        // Stop if we got fewer than 100 (last page)
        if (batch.length < 100) break;

        // Safety cap: don't fetch more than 1000 messages
        if (all.length >= 1000) break;
      }

      return all;
    }

    function isLogMessage(msg) {
      // Matches: LOGS, #LOGS, # LOGS, ## LOGS, ### LOGS, # logs, etc.
      return /^#{0,3}\s*LOGS\b/i.test((msg.content || "").trimStart());
    }

    function stripLogsLine(content) {
      // Remove the first line (the LOGS header) regardless of # prefix
      return content.split("\n").slice(1).join("\n").trim();
    }

    const messages = await fetchAllMessages();
    const logMessages = messages.filter(isLogMessage);

    // Group by UTC date
    const byDate = {};
    for (const msg of logMessages) {
      const date = msg.timestamp.slice(0, 10);
      if (!byDate[date]) byDate[date] = { date, messages: [] };
      byDate[date].messages.push(msg);
    }

    // Build posts, most recent first
    const posts = Object.values(byDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(group => {
        group.messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        const contentParts = [];
        const attachments = [];

        group.messages.forEach(msg => {
          const rest = stripLogsLine((msg.content || "").trim());
          if (rest) contentParts.push(rest);

          (msg.attachments || []).forEach(a => {
            attachments.push({
              url: a.url,
              type: a.content_type || "",
              name: a.filename || ""
            });
          });
        });

        const [, month, day] = group.date.split("-");
        const title = `LOG ${day}.${month}`;

        const firstMsg = group.messages[0];

        return {
          title,
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