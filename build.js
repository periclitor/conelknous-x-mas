const fs = require("fs");
const path = require("path");
const fetchPosts = require("./fetch");

async function run() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_ACCESS_TOKEN;

  const templatePath = path.resolve(__dirname, "index-template.html");

  const template = fs.readFileSync(templatePath, "utf8");

  const posts = await fetchPosts(pageId, token);

  if (!posts || posts.length === 0) {
    console.log(
      "Inga matchande inlägg hittades. Skriver en index.html med meddelande."
    );

    const html = template.replace(
      "<!--CONTENT-->",
      `<p><i>Hittad inte dagens inlägg. Kom tillbaka om en stund.</i></p>`
    );

    fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
    return;
  }

  const latest = posts[0];
  console.log("Message data:", JSON.stringify(latest, null, 2));

  // Small helper to escape HTML content coming from the post
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Extract the 'u' parameter from Facebook redirect URLs like
  // https://l.facebook.com/l.php?u=ENCODED_URL&h=...
  // If present, return the decoded value; otherwise return the original input.
  function extractUParam(link) {
    if (!link) return link;
    try {
      const parsed = new URL(link);
      const u = parsed.searchParams.get("u");
      if (u) return u; // URLSearchParams.get() returns the decoded value
    } catch (e) {
      // fall through to regex fallback
    }
    const m = link.match(/[?&]u=([^&]+)/);
    if (m && m[1]) {
      try {
        return decodeURIComponent(m[1]);
      } catch (e) {
        return m[1];
      }
    }
    return link;
  }

  // Format a timestamp into dd.mm.YYYY (leading zeros for day and month)
  // Example: "2025-11-26T19:35:49+0000" -> "26.11.2025"
  function formatDateDDMMYYYY(timeStr) {
    if (!timeStr) return "";
    // Try a simple regex first to avoid Date parsing issues
    const m = String(timeStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m && m[1] && m[2] && m[3]) {
      const year = m[1];
      const month = m[2];
      const day = m[3];
      return `${day}.${month}.${year}`;
    }
    // Fallback to Date parsing
    try {
      const d = new Date(timeStr);
      if (!isNaN(d)) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear());
        return `${day}.${month}.${year}`;
      }
    } catch (e) {
      // ignore and return original
    }
    return String(timeStr);
  }

  // Build attachments HTML (if any). Renders a small image (thumbnail), title and description and a link.
  let attachmentsHtml = "";
  if (
    latest.attachments &&
    Array.isArray(latest.attachments.data) &&
    latest.attachments.data.length
  ) {
    attachmentsHtml += '<div class="attachments">';
    for (const att of latest.attachments.data) {
      // prefer the attachment's url or target.url, but if it is a Facebook redirect (l.facebook.com)
      // extract only the 'u' parameter (the actual destination) per request
      const rawLink =
        att.url || (att.target && att.target.url) || latest.permalink_url;
      const link = extractUParam(rawLink);
      attachmentsHtml += '<div class="attachment">';

      // render image thumbnail if available
      if (att.media && att.media.image && att.media.image.src) {
        const imgSrc = escapeHtml(att.media.image.src);
        const imgAlt = escapeHtml(att.title || "attachment image");
        // use a small width for thumbnail display
        attachmentsHtml += `<a href="${escapeHtml(
          link
        )}" target="_blank"><img class="attachment-image" src="${imgSrc}" alt="${imgAlt}" width="100%"/></a>`;
      }

      // render title/description
      if (att.title || att.description) {
        attachmentsHtml += '<div class="attachment-meta">';
        if (att.title) {
          attachmentsHtml += `<p class="attachment-title"><a href="${escapeHtml(
            link
          )}" target="_blank">${escapeHtml(att.title)}</a></p>`;
        }
        if (att.description) {
          attachmentsHtml += `<p class="attachment-description">${escapeHtml(
            att.description
          )}</p>`;
        }
        attachmentsHtml += "</div>";
      } else {
        // fallback to showing the link
        attachmentsHtml += `<p><a href="${escapeHtml(
          link
        )}" target="_blank">${escapeHtml(link)}</a></p>`;
      }

      attachmentsHtml += "</div>";
    }
    attachmentsHtml += "</div>";
  }

  const html = template.replace(
    "<!--CONTENT-->",
    `
    <div class="box">
  <p><b>Datum:</b> ${escapeHtml(formatDateDDMMYYYY(latest.created_time))}</p>
      <p>${
        latest.message ? escapeHtml(latest.message).replace(/\n/g, "<br>") : ""
      }</p>
   
      ${attachmentsHtml}

        <p><a href="${escapeHtml(
          latest.permalink_url
        )}" target="_blank">Öppna inlägget på Facebook</a></p>
    </div>
    
    `
  );

  fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
}

run().catch((err) => {
  console.error(
    "Fel vid generering av index.html:",
    err && err.stack ? err.stack : err
  );
  process.exit(1);
});
