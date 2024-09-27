import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";

export async function addDocuments(
  documents: Document[],
  ids: {
    ids?: string[];
  },
  vectorStore: Chroma
): Promise<string[]> {
  try {
    const result = await vectorStore.addDocuments(documents, ids);
    return result;
  } catch (error) {
    console.log("Error adding documents", error);
    throw new Error(error);
  }
}
