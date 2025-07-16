import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import matter from 'gray-matter';
import BlogPostPage from '../src/pages/BlogPostPage.tsx';

// This is a workaround for the JSX issue in the script context.
// In a full SSR setup, you'd typically pre-compile JSX or use a proper build tool.
// For now, we'll explicitly use React.createElement for BlogPostPage.
const BlogPostPageComponent = BlogPostPage as any;

const blogContentDir = path.resolve(process.cwd(), 'public', 'blog-content');
const blogIndexFile = path.resolve(process.cwd(), 'public', 'blog-index.json');
console.log(`Current working directory: ${process.cwd()}`);
const distDir = path.resolve(process.cwd(), 'dist');
console.log(`Resolved distDir: ${distDir}`);
const blogDistDir = path.join(distDir, 'blog');
console.log(`Resolved blogDistDir: ${blogDistDir}`);

const buildBlogPosts = async () => {
  console.log('Starting buildBlogPosts...');
  if (!fs.existsSync(blogContentDir)) {
    console.error(`Error: Blog content directory not found at ${blogContentDir}`);
    return;
  }

  if (!fs.existsSync(blogIndexFile)) {
    console.error(`Error: Blog index file not found at ${blogIndexFile}. Run 'npm run generate:blog-index' first.`);
    return;
  }

  const blogIndex = JSON.parse(fs.readFileSync(blogIndexFile, 'utf8'));
  console.log(`Blog index loaded. Found ${blogIndex.length} posts.`);

  // Ensure dist/blog directory exists
  console.log(`Checking blog distribution directory: ${blogDistDir}`);
  if (!fs.existsSync(blogDistDir)) {
    console.log(`Creating blog distribution directory: ${blogDistDir}`);
    fs.mkdirSync(blogDistDir, { recursive: true });
    console.log('Blog distribution directory created.');
  }

  // Read the main index.html template
  const templatePath = path.resolve(process.cwd(), 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: index.html template not found at ${templatePath}`);
    return;
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  for (const postMeta of blogIndex) {
    const { slug } = postMeta;
    const markdownFilePath = path.join(blogContentDir, `${slug}.md`);

    if (!fs.existsSync(markdownFilePath)) {
      console.warn(`Warning: Markdown file not found for slug: ${slug}`);
      continue;
    }

    const markdown = fs.readFileSync(markdownFilePath, 'utf8');
    const { data, content } = matter(markdown);

    const initialContent = {
      title: data.title || 'Untitled',
      author: data.author || 'Unknown Author',
      publishedAt: data.publishedAt || new Date().toISOString(),
      content,
    };

    // Render the React component to a string
    const appHtml = ReactDOMServer.renderToString(
      React.createElement(StaticRouter, { location: `/blog/${slug}` },
        React.createElement(BlogPostPageComponent, { initialContent: initialContent })
      )
    );

    // Inject the rendered HTML into the template
    let finalHtml = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    // Dynamically find the main JS and CSS files
    const assetsDir = path.join(distDir, 'assets');
    const filesInAssets = fs.readdirSync(assetsDir);

    const mainJsFile = filesInAssets.find(file => file.startsWith('main-') && file.endsWith('.js'));
    const mainCssFile = filesInAssets.find(file => file.startsWith('main-') && file.endsWith('.css'));

    if (!mainJsFile || !mainCssFile) {
        throw new Error('Could not find main JS or CSS bundle in dist/assets. Run `npm run vite:build` first.');
    }

    // Replace the /src/main.tsx and /src/main.css references with the hashed bundle names
    finalHtml = finalHtml.replace('<script type="module" src="/src/main.tsx"></script>', `<script type="module" src="/assets/${mainJsFile}"></script>`);
    finalHtml = finalHtml.replace('<link rel="stylesheet" href="/src/main.css">', `<link rel="stylesheet" href="/assets/${mainCssFile}">`);

    // Create directory for the slug if it doesn't exist
    const postDir = path.join(blogDistDir, slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    // Write the HTML file
    const outputPath = path.join(postDir, 'index.html');
    console.log(`Writing to output path: ${outputPath}`);
    fs.writeFileSync(outputPath, finalHtml);
    try {
      fs.writeFileSync(outputPath, finalHtml);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error writing file ${outputPath}:`, error);
    }
  }
  console.log('Blog posts static generation complete.');
};

buildBlogPosts();
