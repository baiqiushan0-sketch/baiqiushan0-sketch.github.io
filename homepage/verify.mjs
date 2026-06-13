// web-verify: Playwright 页面验证脚本
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PAGE_URL = 'http://localhost:8080/gesture-3d.html';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, 'screenshots');

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('pageerror', err => errors.push(err.message));
const consoleLogs = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

try {
  console.log('🔄 打开页面...');
  await page.goto(PAGE_URL, { waitUntil: 'networkidle', timeout: 15000 });

  console.log('⏳ 等待 3 秒让页面加载...');
  await page.waitForTimeout(3000);

  // 检查关键元素
  const checks = {};
  checks.canvas = await page.$('#c') !== null;
  checks.video = await page.$('#v') !== null;
  checks.skeletonCanvas = await page.$('#sc') !== null;
  checks.gestureHints = await page.$('#gesture-hint') !== null;
  checks.startButton = await page.$('#btn') !== null;

  console.log('\n📋 页面元素检查:');
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${v ? '✅' : '❌'} ${k}`);
  }

  // 截全屏
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullPath = `${SCREENSHOT_DIR}/full-${ts}.png`;
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(`\n📸 截图已保存: ${fullPath}`);

  // 截 canvas 特写
  const canvasEl = await page.$('#c');
  if (canvasEl) {
    const canvasPath = `${SCREENSHOT_DIR}/canvas-${ts}.png`;
    await canvasEl.screenshot({ path: canvasPath });
    console.log(`📸 Canvas 特写: ${canvasPath}`);
  }

  console.log(errors.length ? `\n⚠️  控制台错误 (${errors.length}):` : '\n✅ 无控制台错误');
  errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));

  const allOk = Object.values(checks).every(Boolean) && errors.length === 0;
  console.log(`\n${allOk ? '✅ 验证通过' : '⚠️  存在问题需要修复'}`);
} catch (e) {
  console.error('❌ 验证失败:', e.message);
  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const errPath = `${SCREENSHOT_DIR}/error-${now}.png`;
  await page.screenshot({ path: errPath });
  console.log(`📸 错误截图: ${errPath}`);
} finally {
  await browser.close();
}
