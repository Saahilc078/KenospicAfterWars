async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  try {
    const res = await fetch("/api/devlogs");

    const text = await res.text();

    if (!res.ok) {
      loading.remove();
      container.innerHTML = `<div class="error">${text}</div>`;
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      loading.remove();
      container.innerHTML = `<div class="error">Invalid JSON returned:\n\n${text}</div>`;
      return;
    }

    loading.remove();

    if (!Array.isArray(data)) {
      container.innerHTML = `<div class="error">API did not return array</div>`;
      return;
    }

    data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";

      const sectionsHTML = buildSections(post.content || "");

      card.innerHTML = `
        <div class="card-header">
          <img class="avatar" src="${post.avatar}" />
          <div>
            <div class="title">${post.title || "Devlog"}</div>
            <div class="meta">
              ${post.author || "unknown"} • ${new Date(post.date).toLocaleString()}
            </div>
          </div>
        </div>

        ${sectionsHTML}
      `;

      container.appendChild(card);
    });

  } catch (err) {
    loading.remove();
    container.innerHTML = `<div class="error">${err.stack || err}</div>`;
  }
}

/*
  Turns your Discord-style logs into sections:
  "Additions"
  - item
  - item
*/
function buildSections(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let html = "";
  let currentSection = null;

  for (let line of lines) {

    // Detect section headers (Additions, Enhancements, etc.)
    if (
      line.length < 40 &&
      (line.endsWith(":") || line.toUpperCase() === line || /^[A-Z][a-zA-Z ]+$/.test(line))
    ) {
      if (currentSection) html += `</ul></div>`;

      currentSection = line.replace(":", "");

      html += `
        <div class="section">
          <h3>${currentSection}</h3>
          <ul>
      `;
      continue;
    }

    // Normal bullet line
    if (!currentSection) {
      html += `<div class="section"><p>${line}</p></div>`;
      continue;
    }

    html += `<li>${line}</li>`;
  }

  if (currentSection) html += `</ul></div>`;

  return html;
}

loadDevlogs();