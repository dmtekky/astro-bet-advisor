const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const blogContentDir = path.resolve(process.cwd(), 'public', 'blog-content');
const blogIndexFile = path.resolve(process.cwd(), 'public', 'blog-index.json');

const generateBlogIndex = () => {
  if (!fs.existsSync(blogContentDir)) {
    console.warn(`Directory not found: ${blogContentDir}`);
    return;
  }

  const files = fs.readdirSync(blogContentDir);
  const posts = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(blogContentDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      const slug = file.replace(/\.md$/, '');
      return { slug, ...data };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  fs.writeFileSync(blogIndexFile, JSON.stringify(posts, null, 2));
  console.log(`Generated blog index with ${posts.length} posts.`);
};

generateBlogIndex();
