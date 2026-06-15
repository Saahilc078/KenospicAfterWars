async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  const API_URL = window.location.origin + "/api/devlogs";

  try {
    console.log("Fetching:", API_URL);

    const res = await fetch(API_URL, {
      method: "GET",
      cache: "no-store"
    });

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    loading?.remove();

    // ❌ Hard fail if not OK
    if (!res.ok) {
      container.innerHTML = `
        <div class="error">
          <h3>API Error (${res.status})</h3>
          <pre>${escapeHtml(text)}</pre>
        </div>
      `;
      return;
    }

    // ❌ Validate JSON before parsing
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      container.innerHTML = `
        <div class="error">
          <h3>Invalid JSON from API</h3>
          <pre>${escapeHtml(text)}</pre>
        </div>
      `;
      return;
    }

    if (!Array.isArray(data)) {
      container.innerHTML = `
        <div class="error">
          API did not return an array
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="card-header">
          <img class="avatar" src="${post.avatar || ""}" />
          <div>
            <div class="title">${escapeHtml(post.title || "Devlog")}</div>
            <div class="meta">
              ${escapeHtml(post.author || "unknown")} • 
              ${post.date ? new Date(post.date).toLocaleString() : "unknown"}
            </div>
          </div>
        </div>

        <div class="content">
          ${formatContent(post.content || "")}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);

    loading?.remove();
    container.innerHTML = `
      <div class="error">
        <h3>Fetch Failed</h3>
        <pre>${err.message}</pre>
      </div>
    `;
  }
}

/**
 * Converts Discord-style devlogs into readable sections
 */
function formatContent(text) {
  if (!text) return "<i>No content</i>";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let html = "";
  let inList = false;

  for (const line of lines) {
    const isHeader = /^[A-Z][A-Za-z0-9 ]+$/.test(line) && line.length < 40;

    if (isHeader) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }

      html += `<h3>${escapeHtml(line)}</h3>`;
      continue;
    }

    if (line.startsWith("-")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${escapeHtml(line.slice(1).trim())}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${escapeHtml(line)}</p>`;
    }
  }

  if (inList) html += "</ul>";

  return html;
}

/**
 * Prevent HTML breaking / injection
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