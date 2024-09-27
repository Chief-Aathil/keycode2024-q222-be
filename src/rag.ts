import "cheerio";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { queryChroma } from "./chroma";

const apiKey = process.env.OPENAI_API_KEY

export async function get(inputPrompt: string) {
    // Retrieve and generate using the relevant snippets of the blog.
    // const retriever = vectorStore.asRetriever();
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


    // const retrievedDocs = await retriever.invoke("dell laptop");

    const retrievedDocs = await queryChroma("dell laptop", 100);
    const docs: Document[] = []
    for (let i = 0; i < retrievedDocs.documents.length; i++) {
        docs.push(new Document({
            id: retrievedDocs.ids[i] as unknown as string,
            pageContent: retrievedDocs.documents[i] as unknown as string,
            metadata: retrievedDocs.metadatas[i],
        }));
    }
    console.log("#####################################")
    console.log(retrievedDocs)
    const result = await ragChain.invoke({
        question: "From the context find the jsons that match dell laptops as json",
        context:  docs,
    });
    return result
}

