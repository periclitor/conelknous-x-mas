const fs = require("fs");
const fetchPosts = require("./fetch");

async function run() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_ACCESS_TOKEN;

  const posts = await fetchPosts(pageId, token);

  if (posts.length === 0) {
    console.log("Inga matchande inlägg hittades.");
    return;
  }

  const latest = posts[0];
  const template = fs.readFileSync("index-template.html", "utf8");

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

  fs.writeFileSync("index.html", html);
}

run();
