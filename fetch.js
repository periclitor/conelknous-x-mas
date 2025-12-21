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

  // Request posts and include attachments in the same Graph API call by using the
  // `fields` parameter. This avoids an extra request per post. We request
  // commonly-used subfields of attachments (media, description, target, title,
  // type, url). Set limit=30 and follow paging.next to retrieve additional pages.
  const baseUrl = `https://graph.facebook.com/v24.0/${pageId}/posts`;
  const fields =
    "message,created_time,permalink_url,attachments{media,description,target,title,type,url}";
  let url = `${baseUrl}?fields=${encodeURIComponent(
    fields
  )}&limit=30&access_token=${token}`;

  const allData = [];
  const MAX_PAGES = 50; // safety cap
  let pagesFetched = 0;

  while (url && pagesFetched < MAX_PAGES) {
    const res = await fetchFn(url);
    const data = await res.json();

    if (!data || !data.data) {
      throw new Error("Kunde inte hämta data: " + JSON.stringify(data));
    }

    allData.push(...data.data);

    if (data.paging && data.paging.next) {
      url = data.paging.next;
    } else {
      url = null;
    }

    pagesFetched += 1;
  }

  if (allData.length === 0) {
    throw new Error("Kunde inte hämta data: tomt resultat");
  }

  return allData.filter((post) => {
    if (!post || !post.message) return false;
    const msg = post.message;
    return msg.includes("Dagens låt:") || msg.includes("Bonus låt:");
  });
};
