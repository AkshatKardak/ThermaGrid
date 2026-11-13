import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 4180 + Math.floor(Math.random() * 100);
const BASE_URL = `http://localhost:${PORT}`;

async function runVerification() {
  console.log('--- Starting Vite Preview Server ---');
  const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    env: { ...process.env, PATH: `/home/akshat/.nvm/versions/node/v26.13.0/bin:${process.env.PATH}` },
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => process.stdout.write(d.toString()));
  server.stderr.on('data', (d) => process.stderr.write(d.toString()));

  // Wait for server to be responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    console.error('Failed to start Vite preview server');
    server.kill();
    process.exit(1);
  }

  console.log('--- Vite Preview Ready. Launching Playwright ---');
  const browser = await chromium.launch({ headless: true });
  let failed = false;

  function assert(condition, message, details = '') {
    if (!condition) {
      console.error(`❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
      failed = true;
    } else {
      console.log(`✅ PASS: ${message} ${details ? `(${details})` : ''}`);
    }
  }

  try {
    // ==========================================
    // Phase 1 Checkpoint: Left x Alignment at 1440 & 1024
    // ==========================================
    for (const width of [1440, 1024]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      const headerLogoX = await page.$eval('#header-logo', (el) => Math.round(el.getBoundingClientRect().left));
      const heroLeftCardX = await page.$eval('#hero-left-card', (el) => Math.round(el.getBoundingClientRect().left));
      const sectionHeaderX = await page.$eval('[data-section-header="true"]', (el) => Math.round(el.getBoundingClientRect().left));
      const howItWorksX = await page.$eval('#how-it-works', (el) => Math.round(el.getBoundingClientRect().left));

      console.log(`\n[Viewport ${width}px Measured Left X]:`);
      console.log(`  Header Logo:    ${headerLogoX}px`);
      console.log(`  Hero Left Card: ${heroLeftCardX}px`);
      console.log(`  SectionHeader:  ${sectionHeaderX}px`);
      console.log(`  How It Works:   ${howItWorksX}px`);

      const delta1 = Math.abs(headerLogoX - heroLeftCardX);
      const delta2 = Math.abs(headerLogoX - sectionHeaderX);
      const delta3 = Math.abs(headerLogoX - howItWorksX);

      assert(delta1 <= 1 && delta2 <= 1 && delta3 <= 1, `Shared left x at ${width}px (±1px)`, `delta: max ${Math.max(delta1, delta2, delta3)}px`);
      await page.close();
    }

    // ==========================================
    // Phase 2 Checkpoint: Sign-in Page
    // ==========================================
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#clerk-card-wrapper', { timeout: 10000 });

      // 1. Auth panel left edge equals header container left edge
      const headerContainerX = await page.$eval('#header-container', (el) => Math.round(el.getBoundingClientRect().left));
      const authPanelX = await page.$eval('#auth-panel', (el) => Math.round(el.getBoundingClientRect().left));
      assert(
        Math.abs(authPanelX - headerContainerX) <= 1,
        'Auth panel left edge equals header container left edge',
        `authPanel: ${authPanelX}px, headerContainer: ${headerContainerX}px`
      );

      // 2. Computed panel background is rgb(20, 24, 26) (#14181A)
      const panelBg = await page.$eval('#auth-panel', (el) => window.getComputedStyle(el).backgroundColor);
      assert(
        panelBg === 'rgb(20, 24, 26)',
        'Auth panel computed background is rgb(20, 24, 26) (--panel-dark #14181A)',
        `got: ${panelBg}`
      );

      // 3. Clerk card width equals demo-block width
      const clerkCardWidth = await page.$eval('#clerk-card-wrapper', (el) => Math.round(el.getBoundingClientRect().width));
      const demoBlockWidth = await page.$eval('#demo-account-block', (el) => Math.round(el.getBoundingClientRect().width));
      assert(
        Math.abs(clerkCardWidth - demoBlockWidth) <= 2,
        'Clerk card width equals demo-block width',
        `clerk: ${clerkCardWidth}px, demo: ${demoBlockWidth}px`
      );

      // 4. One brand only on the sign-in page
      const brandLogos = await page.$$eval('#auth-panel a[href="/"]', (els) => els.length);
      assert(brandLogos === 0, 'No duplicate brand logo inside auth panel');

      // 5. No box shadow other than none, no gradient background on Clerk elements
      const shadowAndGradients = await page.$$eval(
        '#auth-form-stack *',
        (els) => {
          const defects = [];
          for (const el of els) {
            const style = window.getComputedStyle(el);
            const isNoShadow =
              !style.boxShadow ||
              style.boxShadow === 'none' ||
              style.boxShadow.replace(/rgba?\(0,\s*0,\s*0,\s*0\)\s*0px\s*0px\s*0px\s*0px/g, '').replace(/,/g, '').trim() === '';

            if (!isNoShadow) {
              defects.push(`boxShadow on <${el.tagName.toLowerCase()} class="${el.className}">: ${style.boxShadow}`);
            }
            if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
              defects.push(`gradient on <${el.tagName.toLowerCase()}>: ${style.backgroundImage}`);
            }
          }
          return defects;
        }
      );
      assert(shadowAndGradients.length === 0, 'No element in auth form stack has box-shadow or gradient background', shadowAndGradients.slice(0, 3).join('; '));

      await page.close();
    }

    // ==========================================
    // Phase 3 Checkpoint: India Choropleth Hero
    // ==========================================
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      // 1. India Choropleth renders SVG geography paths
      const geographyCount = await page.$$eval('#india-choropleth-hero path', (els) => els.length);
      assert(geographyCount >= 30, 'India choropleth renders state/UT geographies', `paths found: ${geographyCount}`);

      // 2. Legend is rendered on --raised with risk scale
      const hasLegend = await page.$eval('#india-choropleth-hero', (el) => el.textContent.includes('Risk Scale (HTSI)'));
      assert(hasLegend, 'India choropleth displays 5-band risk scale legend');

      // 3. Hero left card and right card render side-by-side on desktop
      const leftRect = await page.$eval('#hero-left-card', (el) => el.getBoundingClientRect());
      const rightRect = await page.$eval('#hero-right-card', (el) => el.getBoundingClientRect());
      assert(rightRect.left >= leftRect.right - 2, 'Hero left card and right choropleth sit side-by-side without horizontal overlap');

      await page.close();
    }

    // ==========================================
    // Phase 4 Checkpoint: How It Works & FAQ Accordion
    // ==========================================
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      // 1. How It Works has exactly 3 steps
      const stepCount = await page.$$eval('#how-it-works > *', (els) => els.length);
      assert(stepCount === 3, 'How It Works renders exactly 3 plain-language steps', `steps: ${stepCount}`);

      // 2. FAQ Accordion has 8 questions
      const faqCount = await page.$$eval('#faq button', (els) => els.length);
      assert(faqCount === 8, 'FAQ accordion renders exactly 8 questions', `faqs: ${faqCount}`);

      // 3. First question is open by default, clicking second opens it
      const firstFaqAnswerVisible = await page.$eval('#faq', (el) => el.textContent.includes('ECMWF/ERA5-Land reanalysis'));
      assert(firstFaqAnswerVisible, 'FAQ first item is expanded by default');

      await page.close();
    }

    // ==========================================
    // Phase 5 Checkpoint: No horizontal overflow across all viewports
    // ==========================================
    for (const width of [1440, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!overflow, `No horizontal overflow at ${width}px (scrollWidth <= innerWidth)`);
      await page.close();
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    await browser.close();
    server.kill();
  }

  if (failed) {
    console.error('\n❌ Verification encountered failures.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CHECKPOINTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runVerification();
