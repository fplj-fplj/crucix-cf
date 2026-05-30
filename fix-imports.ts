#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// 修复 API 目录下的所有文件
const apiDir = '/workspace/src/api';
const apiFiles = getAllFiles(apiDir, '.ts');

console.log('Fixing API files...');

apiFiles.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  
  // 修复导入路径
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/types['"]/g, `from '../types'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/types['"]/g, `from '../../types'`);
  
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/kv['"]/g, `from '../utils/kv'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/kv['"]/g, `from '../../utils/kv'`);
  
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/sweep\/orchestrator['"]/g, `from '../utils/sweep/orchestrator'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/alerts\/classifier['"]/g, `from '../utils/alerts/classifier'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/alerts\/dedup['"]/g, `from '../utils/alerts/dedup'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/alerts\/history['"]/g, `from '../utils/alerts/history'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/bots\/telegram['"]/g, `from '../utils/bots/telegram'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/bots\/discord['"]/g, `from '../utils/bots/discord'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/llm\/provider['"]/g, `from '../utils/llm/provider'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/lib\/llm\/translator['"]/g, `from '../utils/llm/translator'`);
  
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/bots\/discord['"]/g, `from '../../utils/bots/discord'`);
  content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/lib\/bots\/telegram['"]/g, `from '../../utils/bots/telegram'`);
  
  // 重命名导出为默认导出
  if (content.includes('export async function onRequestGet')) {
    content = content.replace('export async function onRequestGet', 'export default async function handleGet');
  } else if (content.includes('export async function onRequestPost')) {
    content = content.replace('export async function onRequestPost', 'export default async function handlePost');
  } else if (content.includes('export async function onRequestPut')) {
    content = content.replace('export async function onRequestPut', 'export default async function handlePut');
  }
  
  writeFileSync(file, content, 'utf-8');
  console.log(`Fixed: ${file}`);
});

// 修复 workers 文件
const workerFile = '/workspace/src/workers/cron-sweep.ts';
let workerContent = readFileSync(workerFile, 'utf-8');

workerContent = workerContent.replace(/from ['"]\.\.\/lib\/types['"]/g, `from '../types'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/kv['"]/g, `from '../utils/kv'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/sweep\/orchestrator['"]/g, `from '../utils/sweep/orchestrator'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/alerts\/classifier['"]/g, `from '../utils/alerts/classifier'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/alerts\/dedup['"]/g, `from '../utils/alerts/dedup'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/alerts\/history['"]/g, `from '../utils/alerts/history'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/bots\/telegram['"]/g, `from '../utils/bots/telegram'`);
workerContent = workerContent.replace(/from ['"]\.\.\/lib\/bots\/discord-webhook['"]/g, `from '../utils/bots/discord-webhook'`);

// 重命名 worker 导出
if (workerContent.includes('export default')) {
  workerContent = workerContent.replace(/export default\s*\{/s, 'export async function runScheduledSweep(env: Env, ctx: ExecutionContext): Promise<void> {');
}
writeFileSync(workerFile, workerContent, 'utf-8');
console.log(`Fixed: ${workerFile}`);

console.log('\n✅ All files fixed!');

function getAllFiles(dirPath: string, extension: string): string[] {
  let files: string[] = [];
  const items = readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dirPath, item.name);
    if (item.isDirectory()) {
      files = [...files, ...getAllFiles(fullPath, extension)];
    } else if (item.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}
