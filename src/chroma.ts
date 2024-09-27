import { ChromaClient } from "chromadb";
const client = new ChromaClient();

async function getCollection()  {
    return await client.getOrCreateCollection({
        name: "my_collection",
    });
}

export async function addDocument(ids: any[], documents: any[], metadatas: any[]) {
    let collection = await getCollection();
    const uuids = generateUUIDs(documents.length)
    await collection.add({
        ids: uuids,
        metadatas,
        documents,
    })
}

export async function queryChroma(queryText: string, n: number) {
    let collection = await getCollection();
    return await collection.query({
        queryTexts: queryText,
        nResults: n
    })
}

export async function peekCollection() {
    let collection = await getCollection();
    return await collection.peek()
}

export function generateUUIDs(n: any) {
    const uuids = [];
    for (let i = 0; i < n; i++) {
      const uuid = crypto.randomUUID();
      uuids.push(uuid);
    }
    return uuids;
  }