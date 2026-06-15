export async function onRequest(context) {

    const token = context.env.DISCORD_TOKEN;
    const channel = context.env.DISCORD_CHANNEL;

    const response = await fetch(
        `https://discord.com/api/v10/channels/${channel}/messages?limit=20`,
        {
            headers: {
                Authorization: `Bot ${token}`
            }
        }
    );

    if (!response.ok) {
        return new Response("Discord API Error", {
            status: response.status
        });
    }

    const messages = await response.json();

    const posts = messages.reverse().map(msg => {

        const avatarHash = msg.author.avatar
            ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;

        return {
            id: msg.id,
            title: msg.content.split("\n")[0] || "Untitled",
            content: msg.content,
            author: msg.author.username,
            avatar: avatarHash,
            date: msg.timestamp,
            images: msg.attachments.map(a => a.url)
        };
    });

    return Response.json(posts);
}