import express from 'express';
import { addDocuments } from '../../chromaService';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { get } from '../rag';

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
chromaRouter.post('/add', async (req, res) => {
  try {
    const result = await addDocuments(req.body.documents, req.body.ids,vectorStore);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

chromaRouter.get("/", async (req, res) => {
    const input = req.query.input as string
  let result = await get("1", input);
  res.send(result);
});



export default chromaRouter;
