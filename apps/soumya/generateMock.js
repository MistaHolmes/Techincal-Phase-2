import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateData = () => {
  const users = ['Soumya', 'Suprit', 'Alex', 'MistaHolmes', 'sk-mustakim-ali', 'Guest'];
  const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
  const devices = ['Desktop', 'Mobile', 'Tablet', 'Smartwatch'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Brave', 'Opera'];
  const referrers = ['Google', 'Direct', 'Twitter', 'LinkedIn', 'GitHub', 'Reddit'];
  const events = ['page_view', 'click', 'scroll', 'form_submit', 'video_play', 'purchase'];

  const data = [];
  
  // Generating exactly 3000 objects. ~45,000 lines of mock JSON data.
  for (let i = 0; i < 3000; i++) {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
    data.push({
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: timestamp,
      user_id: `usr_${Math.floor(Math.random() * 10000)}`,
      username: users[Math.floor(Math.random() * users.length)],
      event_type: events[Math.floor(Math.random() * events.length)],
      session_duration_seconds: Math.floor(Math.random() * 3600),
      metrics: {
        time_on_page_ms: Math.floor(Math.random() * 120000),
        interaction_score: parseFloat((Math.random() * 10).toFixed(2)),
        scroll_depth_percent: Math.floor(Math.random() * 100),
        bounce: Math.random() > 0.8
      },
      demographics: {
        region: regions[Math.floor(Math.random() * regions.length)],
        country_code: ['US', 'UK', 'IN', 'CA', 'AU', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 8)],
        language: ['en-US', 'en-GB', 'fr-FR', 'es-ES', 'de-DE'][Math.floor(Math.random() * 5)]
      },
      technical: {
        device_category: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'][Math.floor(Math.random() * 5)],
        screen_resolution: ['1920x1080', '1366x768', '1440x900', '390x844', '414x896'][Math.floor(Math.random() * 5)]
      },
      traffic_source: {
        medium: ['organic', 'cpc', 'referral', 'email', 'none'][Math.floor(Math.random() * 5)],
        source: referrers[Math.floor(Math.random() * referrers.length)],
        campaign: Math.random() > 0.5 ? `campaign_${Math.floor(Math.random() * 20)}` : null
      },
      metadata: {
        page_url: `/blog/article-${Math.floor(Math.random() * 500)}`,
        is_returning_visitor: Math.random() > 0.6,
        theme_preference: Math.random() > 0.5 ? 'dark' : 'light'
      }
    });
  }

  return data;
};

const main = () => {
  const dataDir = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const payload = generateData();
  const filePath = path.join(dataDir, 'mockAnalytics.json');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Successfully generated massive mock payload at ${filePath}`);
};

main();
