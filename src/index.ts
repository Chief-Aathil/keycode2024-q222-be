import 'dotenv/config'
import express, { Request, Response } from "express";
// import generateResponse from "./util/gpt.generateResponse";
// import router from "./route/gpt.route";
import cors from "cors";
import bodyParser from "body-parser";
import { test } from "./rag";
import { crawl } from "./firecrawl";


const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());

app.get("/", (_req: Request, res: Response) => {
    res.send("ok")
});

app.get("/test", async (_req: Request, res: Response) => {
 let result = await test();
  res.send(result);
});

app.get("/crawl", async (_req: Request, res: Response) => {
 let result = await crawl();
  res.send(result);
 });


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
