import got from "got";
import dotenv from "dotenv-safe";
import { SheetResponse, News } from "./types";
import { last } from "lodash";
import { Client } from "pg";

dotenv.config();

console.log("Starting...");
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
const usedIds = new Set<number>();

interface TweetedNews {
  id: number;
}

const setup = async () => {
  const res = await client.query<TweetedNews>("SELECT * FROM tweeted_news");
  console.log("Adding", res.rows.length, "article to blacklist");
  for (const a of res.rows) {
    usedIds.add(a.id);
  }
  console.log("Added IDs:", usedIds);
};

const main = async () => {
  console.log("Getting news...");
  const { news }: SheetResponse = await got(process.env.SHEET_API!).json();

  const filteredNews = news.filter(n => !usedIds.has(n.id));

  if (filteredNews.length > 0) {
    const latestNews = last(filteredNews)!;
    await tweet(latestNews!);
    usedIds.add(latestNews.id);
    await client.query("INSERT INTO tweeted_news(id) VALUES($1)", [
      latestNews.id,
    ]);
    return;
  }
};

const tweet = async (article: News) => {
  const body = `${article.title} ${article.link}`;
  console.log("Tweeting:", body);
  await got(process.env.WEBHOOK!, {
    method: "post",
    json: { value1: body },
  });
};

(async () => {
  await client.connect();
  await setup();
  setInterval(main, 7_200_000);
  main();
})();
