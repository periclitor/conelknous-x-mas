const fetch = require("node-fetch");

module.exports = async function fetchPosts(pageId, token) {
  const url = `https://graph.facebook.com/${pageId}/posts?fields=message,created_time,permalink_url&limit=20&access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.data) {
    throw new Error("Kunde inte hämta data: " + JSON.stringify(data));
  }

  return data.data.filter(
    (post) =>
      post.message &&
      (post.message.includes("suno") || post.message.includes("Lucka"))
  );
};
