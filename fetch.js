// Try to use global fetch (Node 18+). If not available, try require('node-fetch')
// (CJS / node-fetch v2). If that fails, fall back to dynamic import of node-fetch
// (v3 ESM). This makes the module resilient across Node versions and install
// configurations.

async function getFetch() {
  if (typeof fetch === "function") return fetch;

  try {
    // node-fetch v2 exposes a require() compatible export
    // eslint-disable-next-line global-require
    const nf = require("node-fetch");
    return nf;
  } catch (err) {
    // attempt dynamic import (node-fetch v3)
    const mod = await import("node-fetch");
    return mod.default || mod;
  }
}

module.exports = async function fetchPosts(pageId, token) {
  if (!pageId || !token) {
    throw new Error(
      "Missing FB_PAGE_ID or FB_ACCESS_TOKEN environment variables."
    );
  }

  const fetchFn = await getFetch();

  //   const url = `https://graph.facebook.com/v24.0/${pageId}/feed`;
  const url = `https://graph.facebook.com/v24.0/${pageId}/posts?fields=message,created_time,permalink_url&access_token=${token}`;

  const res = await fetchFn(url);
  const data = await res.json();

  if (!data || !data.data) {
    throw new Error("Kunde inte hämta data: " + JSON.stringify(data));
  }

  const posts = [data.data[0]];
  const latestPost = data.data[0];
  const messageData = await (
    await fetchFn(
      `https://graph.facebook.com/v24.0/${latestPost.id}?fields=message,attachments&access_token=${token}`
    )
  ).json();

  //   console.log("Message data:", JSON.stringify(messageData, null, 2));
  latestPost.attachments = messageData.attachments;

  return [latestPost];

  return data.data.filter(
    (post) => post.message
    //   && (post.message.includes("suno") || post.message.includes("Lucka"))
  );
};
