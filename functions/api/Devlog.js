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

    const posts = messages.reverse().map(msg => ({

        id: msg.id,

        title: msg.content.split("\n")[0],

        content: msg.content,

        author: msg.author.username,

        avatar:
            `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`,

        date: msg.timestamp,

        images:
            msg.attachments.map(a => a.url)

    }));

    return Response.json(posts);
}