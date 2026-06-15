export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response("Missing env variables", { status: 500 });
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
      return new Response("Discord returned invalid response:\n" + text, {
        status: 500
      });
    }

    if (!Array.isArray(messages)) {
      return new Response("Invalid Discord data format", { status: 500 });
    }

    // 🔥 convert to RAW TEXT format
    const output = messages
      .reverse()
      .map(msg => {
        const title = (msg.content?.split("\n")[0] || "Devlog").trim();
        const body = msg.content || "";

        return [
          "===POST===",
          "TITLE:" + title,
          "AUTHOR:" + (msg.author?.username || "unknown"),
          "DATE:" + (msg.timestamp || ""),
          "CONTENT:",
          body,
          "===END==="
        ].join("\n");
      })
      .join("\n\n");

    return new Response(output, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

  } catch (err) {
    return new Response("Server error: " + err.message, {
      status: 500
    });
  }
}