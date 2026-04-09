// Generate static sitemap.xml
const TOOLS = [
  { category: 'finance', slug: 'sip-calculator' }, { category: 'finance', slug: 'gst-calculator' },
  { category: 'finance', slug: 'home-loan-emi-calculator' }, { category: 'finance', slug: 'salary-calculator' },
  { category: 'finance', slug: 'fd-calculator' }, { category: 'finance', slug: 'lumpsum-calculator' },
  { category: 'finance', slug: 'fire-calculator' }, { category: 'finance', slug: 'invoice-generator' },
  { category: 'finance', slug: 'ppf-calculator' }, { category: 'finance', slug: 'income-tax-calculator' },
  { category: 'finance', slug: 'discount-calculator' }, { category: 'finance', slug: 'rd-calculator' },
  { category: 'finance', slug: 'car-loan-emi-calculator' }, { category: 'finance', slug: 'gold-calculator' },
  { category: 'finance', slug: 'simple-interest-calculator' }, { category: 'finance', slug: 'nps-calculator' },
  { category: 'finance', slug: 'personal-loan-emi-calculator' }, { category: 'finance', slug: 'hra-calculator' },
  { category: 'finance', slug: 'gratuity-calculator' }, { category: 'finance', slug: 'cagr-calculator' },
  { category: 'finance', slug: 'inflation-calculator' }, { category: 'finance', slug: 'compound-interest-calculator' },
  { category: 'realestate', slug: 'stamp-duty-calculator' }, { category: 'realestate', slug: 'construction-cost-calculator' },
  { category: 'realestate', slug: 'bigha-to-sqft' }, { category: 'realestate', slug: 'rent-vs-buy-calculator' },
  { category: 'academic', slug: 'cgpa-to-percentage' }, { category: 'academic', slug: 'attendance-calculator' },
  { category: 'academic', slug: 'age-calculator' }, { category: 'academic', slug: 'percentage-calculator' },
  { category: 'academic', slug: 'bmi-calculator' }, { category: 'academic', slug: 'speed-distance-time' },
  { category: 'academic', slug: 'number-base-converter' }, { category: 'academic', slug: 'gpa-calculator' },
  { category: 'academic', slug: 'sgpa-to-cgpa' }, { category: 'academic', slug: 'ratio-calculator' },
  { category: 'academic', slug: 'roman-numeral-converter' },
  { category: 'lifestyle', slug: 'fuel-cost-calculator' }, { category: 'lifestyle', slug: 'calorie-calculator' },
  { category: 'lifestyle', slug: 'bill-split-calculator' }, { category: 'lifestyle', slug: 'tip-calculator' },
  { category: 'lifestyle', slug: 'sleep-calculator' }, { category: 'lifestyle', slug: 'water-intake-calculator' },
  { category: 'lifestyle', slug: 'electricity-bill-calculator' }, { category: 'lifestyle', slug: 'pregnancy-due-date-calculator' },
  { category: 'converters', slug: 'unit-converter' }, { category: 'converters', slug: 'data-size-converter' },
  { category: 'converters', slug: 'currency-converter' }, { category: 'converters', slug: 'number-to-words' },
  { category: 'converters', slug: 'area-calculator' },
];

const BASE = 'https://calcbharat.com';
const today = new Date().toISOString().split('T')[0];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/calculators/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/about/</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE}/contact/</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE}/privacy-policy/</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
  <url><loc>${BASE}/terms-of-service/</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
  <url><loc>${BASE}/disclaimer/</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
`;

for (const t of TOOLS) {
  xml += `  <url><loc>${BASE}/${t.category}/${t.slug}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
}

xml += `</urlset>`;

const fs = require('fs');
fs.writeFileSync('./public/sitemap.xml', xml);
console.log('Sitemap generated with', TOOLS.length + 7, 'URLs');
