async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  try {
    const res = await fetch("/api/devlogs", {
      cache: "no-store"
    });

    const text = await res.text();
    console.log("RAW RESPONSE:\n", text);

    loading?.remove();

    if (!res.ok) {
      container.innerHTML = `<pre class="error">${escapeHtml(text)}</pre>`;
      return;
    }

    const posts = parsePosts(text);

    container.innerHTML = "";

    posts.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="card-header">
          <div>
            <div class="title">${escapeHtml(post.title)}</div>
            <div class="meta">
              ${escapeHtml(post.author)} • ${post.date || "unknown"}
            </div>
          </div>
        </div>

        <div class="content">
          ${formatContent(post.content)}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

/**
 * Parse raw backend format
 */
function parsePosts(text) {
  const blocks = text.split("===POST===").filter(Boolean);

  return blocks.map(block => {
    const lines = block.split("\n");

    let title = "";
    let author = "";
    let date = "";
    let contentIndex = lines.indexOf("CONTENT:");

    for (const line of lines) {
      if (line.startsWith("TITLE:")) title = line.replace("TITLE:", "").trim();
      if (line.startsWith("AUTHOR:")) author = line.replace("AUTHOR:", "").trim();
      if (line.startsWith("DATE:")) date = line.replace("DATE:", "").trim();
    }

    const content = lines.slice(contentIndex + 1).join("\n").replace("===END===", "").trim();

    return { title, author, date, content };
  });
}

/**
 * Format Discord-style devlogs
 */
function formatContent(text) {
  if (!text) return "<i>No content</i>";

  return text
    .split("\n")
    .map(line => {
      line = line.trim();
      if (!line) return "";

      if (/^[A-Z][A-Za-z0-9 ]+$/.test(line) && line.length < 40) {
        return `<h3>${escapeHtml(line)}</h3>`;
      }

      if (line.startsWith("-")) {
        return `<li>${escapeHtml(line.slice(1).trim())}</li>`;
      }

      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDevlogs();