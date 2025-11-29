// Helper utilities extracted from build.js

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractUParam(link) {
  if (!link) return link;
  try {
    const parsed = new URL(link);
    const u = parsed.searchParams.get("u");
    if (u) return u;
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

function formatDateDDMMYYYY(timeStr) {
  if (!timeStr) return "";
  const m = String(timeStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m && m[1] && m[2] && m[3]) {
    const year = m[1];
    const month = m[2];
    const day = m[3];
    return `${day}.${month}.${year}`;
  }
  try {
    const d = new Date(timeStr);
    if (!isNaN(d)) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear());
      return `${day}.${month}.${year}`;
    }
  } catch (e) {
    // ignore
  }
  return String(timeStr);
}

function linkifyMessage(rawMsg) {
  if (!rawMsg) return "";
  const urlRegex = /https?:\/\/[\S]+/gi;
  let lastIndex = 0;
  let out = "";
  rawMsg.replace(urlRegex, (match, offset) => {
    out += escapeHtml(rawMsg.slice(lastIndex, offset));

    let url = match;
    let trailing = "";
    while (url.length && /[.,!?:;)]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }

    const href = extractUParam(url);
    out += `<a href="${escapeHtml(
      href
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    out += escapeHtml(trailing);

    lastIndex = offset + match.length;
    return match;
  });
  out += escapeHtml(rawMsg.slice(lastIndex));
  return out.replace(/\n/g, "<br>");
}

function renderAttachments(attachments, fallbackPermalink) {
  let attachmentsHtml = "";
  if (
    !attachments ||
    !Array.isArray(attachments.data) ||
    attachments.data.length === 0
  ) {
    return attachmentsHtml;
  }

  attachmentsHtml += '<div class="attachments">';
  for (const att of attachments.data) {
    const rawLink =
      att.url || (att.target && att.target.url) || fallbackPermalink;
    const link = extractUParam(rawLink);
    attachmentsHtml += '<div class="attachment">';

    if (att.media && att.media.image && att.media.image.src) {
      const imgSrc = escapeHtml(att.media.image.src);
      const imgAlt = escapeHtml(att.title || "attachment image");
      attachmentsHtml += `<a href="${escapeHtml(
        link
      )}" target="_blank"><img class="attachment-image" src="${imgSrc}" alt="${imgAlt}" width="100%"/></a>`;
    }

    attachmentsHtml += "</div>";
  }
  attachmentsHtml += "</div>";
  return attachmentsHtml;
}

module.exports = {
  escapeHtml,
  formatDateDDMMYYYY,
  linkifyMessage,
  renderAttachments,
};
