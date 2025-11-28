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
      `<div class="box">
       <div class="box-body"><p>Vi börjar öppna luckorna 1 december.</p></div>
       </div>`
    );

    fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
    return;
  }

  const {
    escapeHtml,
    extractUParam,
    formatDateDDMMYYYY,
    linkifyMessage,
    renderAttachments,
  } = require("./src/helpers");

  const boxes = posts
    .map((post) => {
      const attachmentsHtml = renderAttachments(
        post.attachments,
        post.permalink_url
      );
      const messageHtml = linkifyMessage(post.message);
      const date = escapeHtml(formatDateDDMMYYYY(post.created_time));
      const permalink = escapeHtml(post.permalink_url || "");

      const dayOnly = (date && date.split && date.split(".")[0]) || "";
      return `
      <div class="box">
        <div class="box-header">
          <span class="date-badge">${escapeHtml(dayOnly)}</span>
          
        </div>
        <div class="box-body">
          <p>
            ${messageHtml}<br />
            <a class="post-link" href="${permalink}" target="_blank">Öppna inlägget på Facebook</a>
          </p>
          
          ${attachmentsHtml}
          
        </div>
      </div>
      `;
    })
    .join("\n");

  const html = template.replace("<!--CONTENT-->", boxes);

  fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
}

run().catch((err) => {
  console.error(
    "Fel vid generering av index.html:",
    err && err.stack ? err.stack : err
  );
  process.exit(1);
});
