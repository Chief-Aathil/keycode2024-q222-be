import "cheerio";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import {JSONLoader} from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { VectorStore } from "@langchain/core/vectorstores";

const apiKey = process.env.OPENAI_API_KEY

export async function get(vectorStore: VectorStore) {

    // const loader = new CheerioWebBaseLoader(
    //     "https://lilianweng.github.io/posts/2023-06-23-agent/"
    // );
    // const loader = new DirectoryLoader(
    //     "./data",
    //     {
    //         ".json": (path) => new JSONLoader(path),
    //             // ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
    //             // ".txt": (path) => new TextLoader(path),
    //             // ".csv": (path) => new CSVLoader(path, "text"),
    //     }
    // );
    // const docs = await loader.load();

    // const docs = await loader.load();

    // const textSplitter = new RecursiveCharacterTextSplitter({
    //     chunkSize: 1000,
    //     chunkOverlap: 200,
    // });
    // const splits = await textSplitter.splitDocuments(docs);
    // const embeddings = new OpenAIEmbeddings({
    //     model: "text-embedding-3-small",
    // });
    
    // const vectorStore = new Chroma(embeddings, {
    //     collectionName: "a-test-collection",
    //     url: "http://localhost:8000", // Optional, will default to this value
    //     collectionMetadata: {
    //       "hnsw:space": "cosine",
    //     }, // Optional, can be used to specify the distance method of the embedding space https://docs.trychroma.com/usage-guide#changing-the-distance-function
    //   });
    /*  await MemoryVectorStore.fromDocuments(
        splits,
        new OpenAIEmbeddings({apiKey })
    );  */

    // Retrieve and generate using the relevant snippets of the blog.
    const retriever = vectorStore.asRetriever();
    const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
    const llm = new ChatOpenAI({
        apiKey,
        model: "gpt-4o-mini",
        temperature: 0
    });

    const ragChain = await createStuffDocumentsChain({
        llm,
        prompt,
        outputParser: new StringOutputParser(),
    });


    const retrievedDocs = await retriever.invoke("Can you get the details of iphone 14 in JSON format");
    console.log("#####################################")
    console.log(retrievedDocs)
    const result = await ragChain.invoke({
        question: "Can you get the details of iphone 14 in JSON format",
        context: retrievedDocs,
    });
    console.log(result);
}

