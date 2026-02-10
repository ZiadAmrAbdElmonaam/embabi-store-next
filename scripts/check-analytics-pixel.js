#!/usr/bin/env node
/**
 * Quick check: does the site serve the Meta Pixel script with the expected ID?
 * Run: npm run check-analytics-pixel -- http://localhost:3000
 * (Server must be running.)
 */

const url = process.argv[2] || 'http://localhost:3000';

async function main() {
  console.log('Fetching:', url);
  let html;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.error('HTTP', res.status);
      process.exit(1);
    }
    html = await res.text();
  } catch (e) {
    console.error('Fetch failed:', e.message);
    process.exit(1);
  }

  const hasFbq = /fbq\s*\(\s*['"]init['"]\s*,\s*['"]([^'"]+)['"]/.test(html);
  const hasFbevents = html.includes('fbevents.js');
  const pixelId = hasFbq ? html.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]([^'"]+)['"]/)?.[1] : null;

  console.log('');
  console.log('Meta Pixel check:');
  console.log('  fbevents.js loaded:', hasFbevents ? 'yes' : 'no');
  console.log('  fbq("init", ...) present:', hasFbq ? 'yes' : 'no');
  if (pixelId) console.log('  Pixel ID in page:', pixelId);
  console.log('');

  if (hasFbevents && hasFbq && pixelId) {
    console.log('OK – Pixel script is on the page with ID:', pixelId);
    process.exit(0);
  }

  if (!hasFbevents || !hasFbq) {
    console.log('Pixel script not found. Is NEXT_PUBLIC_META_PIXEL_ID set in .env?');
    process.exit(1);
  }
  process.exit(0);
}

main();
