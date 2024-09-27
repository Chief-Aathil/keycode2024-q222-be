import express from 'express';
import { addDocuments } from '../../chromaService';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { get } from '../rag';
import { addDocument } from '../chroma';

const chromaRouter = express.Router();
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});
let vectorStore: any;
try {
vectorStore = new Chroma(embeddings, {
  collectionName: "my_collection",
  url: "http://localhost:8000", // Optional, will default to this value
  collectionMetadata: {
    "hnsw:space": "cosine",
  }, // Optional, can be used to specify the distance method of the embedding space https://docs.trychroma.com/usage-guide#changing-the-distance-function
});
} catch (err) {
    console.log(err)
}

chromaRouter.get("/", async (req, res) => {
    const input = req.query.input as string
    const userId = req.query.userId as string
  let result = await get(userId, input);
  res.send(result);
});

chromaRouter.post("/add-documents", async (req, res) => {
  let { ids, metadats, documents } = req.body;
  documents = documents.map((doc: Object) => JSON.stringify(doc));
  await addDocument( ids, documents,  metadats)
  res.setHeader("Content-Type", "application/json");
  res.end()
});


export default chromaRouter;
