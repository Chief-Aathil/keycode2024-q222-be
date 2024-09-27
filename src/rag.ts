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
const chains: { [key: string]: ConversationChain } = {};
const prompts: { [key: string]: string[] } = {};



export let systemMessage = `You find the intents from a prompt and convert to a query that can be passed to a vector database that contains lots of data for a product with ecommerce platforms with link.

PROMPT: "I want to buy a gift for my son's 23rd birthday"
EXPECTED OUTPUT:  "[mobile phone, badminton racket, cricket bat]"

PROMPT: "I want to buy a gift my wife for wedding anniversary"
EXPECTED OUTPUT:  "[Rossess, earrings, bangles, photo frame]"

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
    // return keywords
    console.log(`Got keywords: ${keywords}`)
    const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
    const llm = new ChatOpenAI({
        apiKey,
        model: "gpt-4o",
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

    const retrievedDocs = await queryChroma(keywords, 200);
    const docs: Document[] = []



    for (let i = 0; i < retrievedDocs.documents[0].length; i++) {
        docs.push(new Document({
            id: retrievedDocs.ids[0][i] as unknown as string,
            pageContent: retrievedDocs.documents[0][i] as unknown as string,
            // metadata: retrievedDocs.metadaec[i],
        }));
    }

    console.log("Got data from Chroma: ", docs.length)

    const docsWithoutURL = docs.map((doc) => {
        try {
            // Parse the JSON string into an object
            const pageContentObject = JSON.parse(doc.pageContent);

            delete pageContentObject.url;
            delete pageContentObject.imgUrl;
            delete pageContentObject.type;


            pageContentObject.id = doc.id

            // Create a new Document with the modified content
            return new Document({ ...doc, pageContent: JSON.stringify(pageContentObject) });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            // Return the original document if there's an error
            return doc;
        }
    });

    let userPrompts = prompts[userId];

    if (!userPrompts) {
        console.log("Creating new List for ", userId, " ", userPrompts)
        userPrompts = []
        prompts[userId] = userPrompts ;
    }

    userPrompts.push(question)

    const q = `${JSON.stringify(userPrompts)} This array contains the chat history till now in order.
    From the data provided, return the ids of the items that satisfy the questions or the keywords ${keywords}. Return minimum of 10 items.
            Expected OUTPUT: ["<id1>", "<id2>
                            if there are no IDs return []", ....]
                                        `
    // console.log(q)

    // console.log(retrievedDocs)
    const ids = await ragChain.invoke({
        question: q,
        context:  docsWithoutURL,
    });
    console.log(ids)
    const idsList = JSON.parse(ids) as string[]
    console.log("Ids: " + idsList.length)
    return {
        "products": docs.filter(doc => idsList.includes(doc.id!)).map(doc => JSON.parse(doc.pageContent))
    }
}

