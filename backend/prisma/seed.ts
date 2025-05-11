import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const knowledgeBasePath = path.join(__dirname, '../../ai-agent/knowledge_base.json');
  const data = await fs.readFile(knowledgeBasePath, 'utf-8');
  const entries = JSON.parse(data);
  
  for (const entry of entries) {
    await prisma.knowledgeBaseEntry.upsert({
      where: { question: entry.question },
      update: {},
      create: {
        question: entry.question,
        answer: entry.answer,
        source: 'initial-import'
      }
    });
  }
  
  console.log('Database seeded with existing knowledge base entries');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });