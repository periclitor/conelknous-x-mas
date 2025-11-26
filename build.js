const fs = require("fs");
const path = require("path");
const fetchPosts = require("./fetch");

async function run() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_APP_TOKEN;

  const templatePath = path.resolve(__dirname, "index-template.html");

  const template = fs.readFileSync(templatePath, "utf8");

  const posts = await fetchPosts(pageId, token);

  if (!posts || posts.length === 0) {
    console.log(
      "Inga matchande inlägg hittades. Skriver en index.html med meddelande."
    );

    const html = template.replace(
      "<!--CONTENT-->",
      `<p><i>Inga matchande inlägg hittades vid senaste körning.</i></p>`
    );

    fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
    return;
  }

  const latest = posts[0];

  const html = template.replace(
    "<!--CONTENT-->",
    `
      <p><b>Datum:</b> ${latest.created_time}</p>
      <p>${latest.message.replace(/\n/g, "<br>")}</p>
      <p><a href="${
        latest.permalink_url
      }" target="_blank">Öppna inlägget på Facebook</a></p>
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
