import got from "got";
import dotenv from "dotenv-safe";
import { SheetResponse, News } from "./types";
import { last } from "lodash";

dotenv.config();

console.log("Starting...");
const usedIds = new Set<number>();

const setup = async () => {
  const { news }: SheetResponse = await got(process.env.SHEET_API!).json();
  console.log("Adding", news.length, "article to blacklist");
  for (const a of news) {
    usedIds.add(a.id);
  }
};

const main = async () => {
  console.log("Getting news...");
  const { news }: SheetResponse = await got(process.env.SHEET_API!).json();

  const filteredNews = news.filter(n => !usedIds.has(n.id));

  if (filteredNews.length > 0) {
    await tweet(last(filteredNews)!);
    return;
  }
};

const tweet = async (article: News) => {
  const body = `${article.title} ${article.link}`;
  console.log("Tweeting:", body);
  await got(process.env.WEBHOOK!, {
    method: "post",
    json: { value1: body }
  });
};

(async () => {
  await setup();
  setInterval(main, 7_200_000);
  main();
})();
