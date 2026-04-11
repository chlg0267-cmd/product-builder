#!/usr/bin/env node
'use strict';

// Scan blog/*.html, read <title> and <meta name="publish-date"> from each,
// then regenerate blog.html (the listing page) and sitemap.xml.
//
// Run locally:  node scripts/build-blog-index.js
// Run in CI:    .github/workflows/publish-blog.yml

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const INDEX_PATH = path.join(ROOT, 'blog.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE = 'https://chlg0267-cmd.github.io/product-builder';

function readPost(file) {
  const abs = path.join(BLOG_DIR, file);
  const html = fs.readFileSync(abs, 'utf8');
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const rawTitle = titleMatch ? titleMatch[1] : file;
  // strip site suffix
  const title = rawTitle.split('·')[0].trim();
  const dateMatch = html.match(/<meta name="publish-date" content="([^"]+)"/);
  const publishDate = dateMatch ? dateMatch[1] : '2026-01-01';
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : '';
  const ledeMatch = html.match(/<p class="post-lede">([\s\S]*?)<\/p>/);
  const lede = ledeMatch ? ledeMatch[1].replace(/<[^>]+>/g, '').trim() : description;
  const wordCount = (html.match(/<(p|li|h2|h3)[^>]*>([^<]*)/g) || [])
    .map((m) => m.replace(/<[^>]+>/g, ''))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const readMin = Math.max(3, Math.round(wordCount / 200));
  return { file, title, publishDate, description, lede, readMin };
}

function collectPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html'));
  const posts = files.map(readPost);
  // newest first
  posts.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  return posts;
}

function formatDate(iso) {
  // iso is "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SSZ"
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function renderCard(p) {
  return `      <a href="blog/${p.file}" class="blog-card">
        <div class="bc-date">${formatDate(p.publishDate)}</div>
        <div class="bc-title">${escapeHtml(p.title)}</div>
        <div class="bc-lede">${escapeHtml(p.lede)}</div>
        <div class="bc-meta">약 ${p.readMin}분 분량 · 계속 읽기 →</div>
      </a>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildIndex(posts) {
  const cards = posts.length
    ? posts.map(renderCard).join('\n')
    : `      <p class="blog-empty">첫 글을 준비 중입니다. 곧 만나요!</p>`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>블로그 · 로또 6/45 번호 분석기</title>
<meta name="description" content="로또 6/45, 확률론, 통계학, 행동경제학을 주제로 한 교육용 블로그. 당첨 예측이 아닌 '숫자를 정확히 이해하기' 를 위한 글들을 정기적으로 발행합니다.">
<meta name="keywords" content="로또 블로그, 확률론, 통계학, 로또 분석, 도박 심리">
<meta name="author" content="chlg0267-cmd">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/blog.html">

<meta property="og:type" content="website">
<meta property="og:title" content="로또 6/45 번호 분석기 블로그">
<meta property="og:description" content="로또 6/45, 확률론, 통계학을 다루는 교육용 블로그">
<meta property="og:url" content="${SITE}/blog.html">
<meta property="og:locale" content="ko_KR">

<!-- Google Search Console -->
<meta name="google-site-verification" content="k4szCZQrawr6nySB8_WeQNgCVKlX6iVOyahPHS7X2ug" />

<!-- Google AdSense -->
<meta name="google-adsense-account" content="ca-pub-3325342113116512">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3325342113116512" crossorigin="anonymous"></script>

<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="subpage">

  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="index.html">홈</a>
    <span>›</span>
    <span>블로그</span>
  </nav>

  <h1>블로그</h1>
  <p class="subpage-meta">EDUCATIONAL WRITING ON PROBABILITY &amp; STATISTICS</p>

  <p>이 블로그는 로또 6/45, 확률론, 통계학, 그리고 인간이 "숫자" 를 어떻게 오해하는지에 관한 글들을 모아둔 곳입니다. 매 글의 목표는 단 하나 — <strong>당첨 번호를 예측하는 것이 아니라, 숫자를 정확히 이해하도록 돕는 것</strong> 입니다. 본 사이트 전체가 교육·오락 목적의 무료 도구이며, 모든 글은 그 취지에 맞춰 작성됩니다.</p>

  <p>새 글은 약 2 시간 간격으로 자동 발행되며, 최근 글이 맨 위에 노출됩니다.</p>

  <div class="blog-list">
${cards}
  </div>

  <footer class="site-footer">
    <nav class="footer-nav">
      <a href="index.html">홈</a>
      <a href="blog.html">블로그</a>
      <a href="guide.html">로또 가이드</a>
      <a href="statistics.html">통계 분석</a>
      <a href="faq.html">FAQ</a>
      <a href="about.html">사이트 소개</a>
      <a href="privacy.html">개인정보처리방침</a>
      <a href="terms.html">이용약관</a>
    </nav>
    <p class="footer-copy">© 2026 로또 6/45 번호 분석기 · 본 사이트는 오락 및 학습 목적이며 당첨을 보장하지 않습니다.</p>
  </footer>

</div>
</body>
</html>
`;
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log(`✓ blog.html (${posts.length} post${posts.length === 1 ? '' : 's'})`);
}

function buildSitemap(posts) {
  const staticUrls = [
    { loc: SITE + '/', priority: '1.0', changefreq: 'weekly' },
    { loc: SITE + '/blog.html', priority: '0.9', changefreq: 'daily' },
    { loc: SITE + '/guide.html', priority: '0.9', changefreq: 'monthly' },
    { loc: SITE + '/statistics.html', priority: '0.9', changefreq: 'monthly' },
    { loc: SITE + '/faq.html', priority: '0.8', changefreq: 'monthly' },
    { loc: SITE + '/about.html', priority: '0.7', changefreq: 'monthly' },
    { loc: SITE + '/privacy.html', priority: '0.5', changefreq: 'yearly' },
    { loc: SITE + '/terms.html', priority: '0.5', changefreq: 'yearly' },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const staticBlock = staticUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const postBlock = posts
    .map(
      (p) => `  <url>
    <loc>${SITE}/blog/${p.file}</loc>
    <lastmod>${p.publishDate.slice(0, 10)}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticBlock}${postBlock ? '\n' + postBlock : ''}
</urlset>
`;
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`✓ sitemap.xml (${staticUrls.length + posts.length} urls)`);
}

const posts = collectPosts();
buildIndex(posts);
buildSitemap(posts);
