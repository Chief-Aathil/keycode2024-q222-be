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

app.get("/", (req: Request, res: Response) => {
    res.send("ok")
});

app.get("/test", (req: Request, res: Response) => {
 return  test();
});

app.get("/crawl", async (req: Request, res: Response) => {
  return await crawl();
 });


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
