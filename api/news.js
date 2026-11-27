import { handleNews } from '../server/newsHandler.js'

// Guardian News Desk headlines (public RSS feeds, CDN-cached for 15 minutes).
export default async function handler(req, res) {
  await handleNews(req, res)
}
