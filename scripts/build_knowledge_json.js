const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const articlesDir = path.join(projectRoot, 'data', 'articles');
const mergedTxtFile = path.join(projectRoot, 'data', 'k12_knowledge.txt');
const outputJson = path.join(projectRoot, 'data', 'k12_knowledge.json');

console.log('🔄 Đang đồng bộ và biên dịch tri thức K12Online sang JSON siêu tốc...');

let articles = [];

// Cách 1: Đọc từ thư mục articles nếu có
if (fs.existsSync(articlesDir)) {
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.txt'));
  if (files.length > 0) {
    articles = files.map((file, idx) => {
      const fullPath = path.join(articlesDir, file);
      const text = fs.readFileSync(fullPath, 'utf-8');

      const titleMatch = text.match(/### BÀI VIẾT.*?:\s*(.*?)\n/);
      const catMatch = text.match(/- Chuyên mục:\s*(.*?)\n/);
      const linkMatch = text.match(/- Link gốc:\s*(.*?)\n/);

      const title = titleMatch ? titleMatch[1].trim() : file.replace('.txt', '').replace(/^\d+_\s*/, '');
      const category = catMatch ? catMatch[1].trim() : 'Chung';
      const sourceUrl = linkMatch ? linkMatch[1].trim() : 'https://hotro.k12online.vn';

      let content = text;
      const contentMatch = text.match(/\*\*Nội dung:\*\*\s*([\s\S]*?)={20,}/);
      if (contentMatch) {
        content = contentMatch[1].trim();
      }

      return {
        id: idx + 1,
        title,
        category,
        sourceUrl,
        content: content || text.trim()
      };
    });
  }
}

// Cách 2: Nếu chưa có thư mục articles, đọc từ file gộp k12_knowledge.txt
if (articles.length === 0 && fs.existsSync(mergedTxtFile)) {
  const rawContent = fs.readFileSync(mergedTxtFile, 'utf-8');
  const sections = rawContent.split('='.repeat(50));

  articles = sections
    .filter(s => s.trim().length > 50)
    .map((sec, idx) => {
      const titleMatch = sec.match(/### BÀI VIẾT.*?:\s*(.*?)\n/);
      const catMatch = sec.match(/- Chuyên mục:\s*(.*?)\n/);
      const linkMatch = sec.match(/- Link gốc:\s*(.*?)\n/);

      return {
        id: idx + 1,
        title: titleMatch ? titleMatch[1].trim() : 'Bài viết K12Online',
        category: catMatch ? catMatch[1].trim() : 'Chung',
        sourceUrl: linkMatch ? linkMatch[1].trim() : 'https://hotro.k12online.vn',
        content: sec.trim()
      };
    });
}

if (articles.length > 0) {
  fs.writeFileSync(outputJson, JSON.stringify(articles), 'utf-8');
  const sizeMb = (fs.statSync(outputJson).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Đã biên dịch thành công ${articles.length} bài viết vào data/k12_knowledge.json (${sizeMb} MB)!`);
} else {
  console.warn('⚠️ Không tìm thấy bài viết nào để biên dịch!');
}
