import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeEmojis(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updatedCount += removeEmojis(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Comprehensive emoji regex matching Unicode ranges
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2139}\u{25B6}\u{23F1}\u{23F2}\u{23F3}\u{23E9}-\u{23EC}]/gu;
      const newContent = content.replace(emojiRegex, '');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Cleaned: ${fullPath}`);
        updatedCount++;
      }
    }
  }
  return updatedCount;
}

const targetDir = path.join(__dirname, 'frontend/src');
console.log(`Scanning for emojis in ${targetDir}...`);
const total = removeEmojis(targetDir);
console.log(`Done! Removed emojis from ${total} files.`);
