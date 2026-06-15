async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  try {
    console.log("Fetching devlogs...");

    const res = await fetch("/api/devlogs");

    const text = await res.text();
    console.log("API RAW RESPONSE:", text);

    // ❗ ALWAYS remove loading (no matter what)
    loading?.remove();

    // ❌ Handle HTTP errors safely
    if (!res.ok) {
      container.innerHTML = `
        <div class="error">
          <b>API Error (${res.status})</b><br><br>
          <pre>${escapeHtml(text)}</pre>
        </div>
      `;
      return;
    }

    let data;

    // ❌ Safe JSON parse (prevents silent crash)
    try {
      data = JSON.parse(text);
    } catch (e) {
      container.innerHTML = `
        <div class="error">
          <b>Invalid JSON from API</b><br><br>
          <pre>${escapeHtml(text)}</pre>
        </div>
      `;
      return;
    }

    if (!Array.isArray(data)) {
      container.innerHTML = `
        <div class="error">API did not return an array</div>
      `;
      return;
    }

    console.log("Parsed devlogs:", data);

    container.innerHTML = "";

    data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";

      const sectionsHTML = formatSections(post.content || "");

      card.innerHTML = `
        <div class="card-header">
          <img class="avatar" src="${post.avatar || ''}" />
          <div>
            <div class="title">${post.title || "Devlog"}</div>
            <div class="meta">
              ${post.author || "unknown"} • 
              ${post.date ? new Date(post.date).toLocaleString() : "no date"}
            </div>
          </div>
        </div>

        <div class="content">
          ${sectionsHTML}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("FATAL ERROR:", err);

    loading?.remove();
    container.innerHTML = `
      <div class="error">
        <b>Fetch Failed</b><br><br>
        <pre>${err.stack || err}</pre>
      </div>
    `;
  }
}

/**
 * Your patch note parser
 */
function formatSections(text) {
  if (!text) return "<i>No content</i>";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let html = "";
  let currentSection = null;

  for (const line of lines) {

    const isHeader =
      line.length < 40 &&
      /^[A-Z][A-Za-z0-9 ]+$/.test(line);

    if (isHeader) {
      if (currentSection) html += "</ul></div>";

      currentSection = line;

      html += `
        <div class="section">
          <h3>${escapeHtml(currentSection)}</h3>
          <ul>
      `;
      continue;
    }

    if (!currentSection) {
      html += `<p>${escapeHtml(line)}</p>`;
      continue;
    }

    html += `<li>${escapeHtml(line)}</li>`;
  }

  if (currentSection) html += "</ul></div>";

  return html;
}

/**
 * Prevents broken HTML / injection issues
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDevlogs();