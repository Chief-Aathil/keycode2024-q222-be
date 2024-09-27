import "cheerio";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { pull } from "langchain/hub";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { queryChroma } from "./chroma";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

const apiKey = process.env.OPENAI_API_KEY


export let systemMessage = `You find the intents from a prompt and convert to a query that can be passed to a vector database that contains lots of data for a product with ecommerce platforms with link.

PROMPT: "I want to buy a gift for my son's 23rd birthday"
EXPECTED OUTPUT:  "mobile phone, badminton racket, cricket bat"

PROMPT: "I want to buy a gift my wife for wedding anniversary"
EXPECTED OUTPUT:  "Rossess ,earrings, bangles, photo frame"

Note : only give the expected output as json array`;
export const changeSystemMessage = (newSystemMessage: string) => {
  systemMessage= newSystemMessage;
}


const getNewMemory = (): BufferMemory => {
  const chatHistory = new ChatMessageHistory([
    new AIMessage(systemMessage)
  ]);

  const memory = new BufferMemory({
    chatHistory
  });

  return memory;
}


const createChain = (): ConversationChain => {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4",
    maxTokens: 2000
  });

  const chain = new ConversationChain({ llm: model, memory: getNewMemory() });
  return chain;
}

const chains: { [key: string]: ConversationChain } = {};

export const resetHistory = (userId: string) => {
    const chain = chains[userId];
    if (!chain) {
      return;
    }
    chain.memory = getNewMemory();
}

const generateResponse = async (userId: string, prompt: string): Promise<string> => {
  try {
    console.log(`user: ${userId} sent prompt: ${prompt}`);
    let chain = chains[userId];
    if (!chain) {
      chain = createChain();
      chains[userId] = chain;
    }
    const result = await chain.call({ input: prompt });

    return result.response;
  } catch (error) {
    throw new Error(`Error generating response: ${error.message}`);
  }
};

export async function get(userId: string, question: string) {
    console.log("#####################################")
    const keywords = await generateResponse(userId, question)
    console.log(`Got keywords: ${keywords}`)
    const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
    const llm = new ChatOpenAI({
        apiKey,
        model: "gpt-4o-mini",
        temperature: 0
    });

    // Retrieve and generate using the relevant snippets of the blog.
    // const retriever = vectorStore.asRetriever();
    const ragChain = await createStuffDocumentsChain({
        llm,
        prompt,
        outputParser: new StringOutputParser(),
    });


    // const retrievedDocs = await retriever.invoke("dell laptop");

    const retrievedDocs = await queryChroma(keywords, 20);
    const docs: Document[] = []
    for (let i = 0; i < retrievedDocs.documents.length; i++) {
        docs.push(new Document({
            id: retrievedDocs.ids[i] as unknown as string,
            pageContent: retrievedDocs.documents[i] as unknown as string,
            metadata: retrievedDocs.metadatas[i],
        }));
    }

    console.log("#####################################")
    // console.log(retrievedDocs)
    const result = await ragChain.invoke({
        question: `From the data provided filter the relevant JSON content without changing it that satisfy the keywords ${keywords}
        The output should be in the format of JSON as
        {
            "products": [
                <JSON for product 1>,
                <JSON for product 2>,
                    ...
            ]
        }
        `,
        context:  docs,
    });
    return result
}

