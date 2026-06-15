export async function onRequest(context) {
  try {
    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    if (!token || !channel) {
      return new Response(JSON.stringify({
        error: "Missing environment variables"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channel}/messages?limit=20`,
      {
        headers: {
          Authorization: `Bot ${token}`
        }
      }
    );

    if (!response.ok) {
      const errText = await response.text();

      return new Response(JSON.stringify({
        error: "Discord API Error",
        status: response.status,
        details: errText
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const messages = await response.json();

    const posts = messages.reverse().map(msg => {
      const avatar = msg.author?.avatar
        ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;

      const title =
        msg.content?.split("\n")[0] ||
        "Devlog";

      return {
        id: msg.id,
        title,
        content: msg.content || "",
        author: msg.author?.username || "unknown",
        avatar,
        date: msg.timestamp,
        images: (msg.attachments || []).map(a => a.url)
      };
    });

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Function crashed",
      details: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}