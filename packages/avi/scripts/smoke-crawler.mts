import { crawl } from '../src/crawler-v2';

const url = process.argv[2] || 'https://www.martykoepke.com';
const c = await crawl(url);
console.log('CRAWL OK');
console.log('  url:', c.url);
console.log('  title:', c.title);
console.log('  status:', c.status);
console.log('  h1[0]:', c.h1[0]?.slice(0, 80));
console.log('  schema_blocks:', c.schema_blocks.length);
console.log('  has_org_schema:', c.has_organization_schema);
console.log('  has_person_schema:', c.has_person_schema);
console.log('  sameAs links:', c.same_as_links.length);
console.log('  word_count:', c.word_count);
console.log('  keyword_stuffing:', c.keyword_stuffing_detected);
console.log('  diff_above_fold:', c.differentiation_above_fold);
console.log('  raw_text (first 200):');
console.log('   ', c.raw_text_sample.slice(0, 200));
