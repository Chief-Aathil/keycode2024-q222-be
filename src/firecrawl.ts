import FirecrawlApp from "@mendable/firecrawl-js";

export async function crawl(){
  const app = new FirecrawlApp({ apiKey: "fc-00cd1ac7827e4751ba15268d2e7bd9fd" });

  // Scrape a website
  const scrapeResponse = await app.scrapeUrl("https://firecrawl.dev", {
    formats: ["markdown", "html"],
  });

  if (!scrapeResponse.success) {
    throw new Error(`Failed to scrape: ${scrapeResponse.error}`);
  }

  console.log(scrapeResponse);

  // Crawl a website
  const crawlResponse = await app.crawlUrl("https://firecrawl.dev", {
    limit: 100,
    scrapeOptions: {
      formats: ["markdown", "html"],
    },
  });

  if (!crawlResponse.success) {
    throw new Error(`Failed to crawl: ${crawlResponse.error}`);``
  }

  console.log(crawlResponse);
  return crawlResponse.data;
}
