async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  try {
    console.log("Fetching devlogs...");

    const res = await fetch("/api/devlogs");

    const text = await res.text();
    console.log("RAW API RESPONSE:", text);

    loading?.remove();

    // ❌ Handle non-OK responses
    if (!res.ok) {
      container.innerHTML = `
        <div class="error">
          <h3>API Error (${res.status})</h3>
          <pre>${escapeHtml(text)}</pre>
        </div>
      `;
      return;
    }

    let data;

    // ❌ Safe JSON parsing
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
          <img class="avatar" src="${post.avatar}" />
          <div>
            <div class="title">${escapeHtml(post.title)}</div>
            <div class="meta">
              ${escapeHtml(post.author)} • 
              ${post.date ? new Date(post.date).toLocaleString() : "unknown"}
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
 * Simple devlog formatter
 */
function formatContent(text) {
  if (!text) return "<i>No content</i>";

  return text
    .split("\n")
    .map(line => {
      line = line.trim();
      if (!line) return "";

      if (line.match(/^[A-Z][A-Za-z0-9 ]+$/) && line.length < 40) {
        return `<h4>${escapeHtml(line)}</h4>`;
      }

      if (line.startsWith("-")) {
        return `<li>${escapeHtml(line.slice(1).trim())}</li>`;
      }

      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
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