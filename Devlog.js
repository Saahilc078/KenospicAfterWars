async function loadDevlogs() {
  const container = document.getElementById("container");
  const loading = document.getElementById("loading");

  try {
    const res = await fetch("/api/devlogs");
    const text = await res.text();

    console.log("API RESPONSE:", text);

    if (!res.ok) {
      loading.remove();
      container.innerHTML = `<div class="error">${text}</div>`;
      return;
    }

    const data = JSON.parse(text);

    loading.remove();

    if (!Array.isArray(data)) {
      container.innerHTML = `<div class="error">Invalid API format</div>`;
      return;
    }

    data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";

      const sectionsHTML = formatSections(post.content);

      card.innerHTML = `
        <div class="card-header">
          <img class="avatar" src="${post.avatar}" />
          <div>
            <div class="title">${post.title}</div>
            <div class="meta">
              ${post.author} • ${new Date(post.date).toLocaleString()}
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
    console.error(err);
    loading.innerText = "Failed to load devlogs (check console)";
  }
}

/**
 * Converts your style:
 * Additions
 * - Added X
 * - Added Y
 *
 * Enhancements
 * - Fixed Z
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
          <h3>${currentSection}</h3>
          <ul>
      `;
      continue;
    }

    if (!currentSection) {
      html += `<p>${line}</p>`;
      continue;
    }

    html += `<li>${line}</li>`;
  }

  if (currentSection) html += "</ul></div>";

  return html;
}

loadDevlogs();