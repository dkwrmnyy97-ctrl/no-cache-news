// Worldwide coverage: region registry + source feeds.
//
// Region membership is decided by WHERE THE PUBLISHER IS BASED, never by what
// an article discusses. That keeps assignment deterministic and auditable; the
// places a story is about are tracked separately (bullet.places).
//
// To add a region: add an entry to REGIONS, then add sources with that region
// id. A region only becomes selectable once its sources return relevant
// articles and a briefing is generated for it (see regionAvailability()).
//
// Each source records publisher country and original language so the UI can
// show provenance. kind: 'news' (outlet) or 'primary' (regulator, CERT,
// government body). filter: false skips the keyword relevance filter — used
// for primary sources whose whole feed is in scope.
//
// Every feed below was verified to respond with recent items on 2026-10-16.

export const REGIONS = [
  { id: 'europe', label: 'Europe', description: 'Including the UK and countries outside the EU' },
  { id: 'china',  label: 'China',  description: 'Mainland China and Hong Kong' },
  { id: 'apac',   label: 'Asia-Pacific', description: 'Excluding China' },
];

export const ALL_REGION = { id: 'all', label: 'All international', description: 'Every available region' };

export const REGION_IDS = REGIONS.map(r => r.id);

export function isValidRegion(id) {
  return id === 'all' || REGION_IDS.includes(id);
}

export const WORLDWIDE_SOURCES = [
  // ── Europe ────────────────────────────────────────────────────────────────
  { name: 'heise online',            url: 'https://www.heise.de/rss/heise-atom.xml',            region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 'heise Security',          url: 'https://www.heise.de/security/rss/news-atom.xml',    region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 'Golem.de',                url: 'https://rss.golem.de/rss.php?feed=RSS2.0',          region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 't3n',                     url: 'https://t3n.de/rss.xml',                            region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 'netzpolitik.org',         url: 'https://netzpolitik.org/feed/',                     region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 'silicon.de',              url: 'https://www.silicon.de/feed',                       region: 'europe', country: 'Germany',        language: 'de', kind: 'news' },
  { name: 'Le Monde Informatique',   url: 'https://www.lemondeinformatique.fr/flux-rss/thematique/toutes-les-actualites/rss.xml', region: 'europe', country: 'France', language: 'fr', kind: 'news' },
  { name: 'ZDNet France',            url: 'https://www.zdnet.fr/feeds/rss/actualites/',        region: 'europe', country: 'France',         language: 'fr', kind: 'news' },
  { name: '01net',                   url: 'https://www.01net.com/actualites/feed/',            region: 'europe', country: 'France',         language: 'fr', kind: 'news' },
  { name: 'Numerama',                url: 'https://www.numerama.com/feed/',                    region: 'europe', country: 'France',         language: 'fr', kind: 'news' },
  { name: 'CNIL',                    url: 'https://www.cnil.fr/fr/rss.xml',                    region: 'europe', country: 'France',         language: 'fr', kind: 'primary', filter: false },
  { name: 'Xataka',                  url: 'https://www.xataka.com/feedburner.xml',             region: 'europe', country: 'Spain',          language: 'es', kind: 'news' },
  { name: 'EU-Startups',             url: 'https://www.eu-startups.com/feed/',                 region: 'europe', country: 'Spain',          language: 'en', kind: 'news' },
  { name: 'The Register',            url: 'https://www.theregister.com/headlines.atom',        region: 'europe', country: 'United Kingdom', language: 'en', kind: 'news' },
  { name: 'Computer Weekly',         url: 'https://www.computerweekly.com/rss/All-Computer-Weekly-content.xml', region: 'europe', country: 'United Kingdom', language: 'en', kind: 'news' },
  { name: 'Sifted',                  url: 'https://sifted.eu/feed',                            region: 'europe', country: 'United Kingdom', language: 'en', kind: 'news' },
  { name: 'UK NCSC',                 url: 'https://www.ncsc.gov.uk/api/1/services/v1/news-rss-feed.xml', region: 'europe', country: 'United Kingdom', language: 'en', kind: 'primary', filter: false },
  { name: 'The Next Web',            url: 'https://thenextweb.com/feed',                       region: 'europe', country: 'Netherlands',    language: 'en', kind: 'news' },
  { name: 'Silicon Republic',        url: 'https://www.siliconrepublic.com/feed',              region: 'europe', country: 'Ireland',        language: 'en', kind: 'news' },
  { name: 'European Commission (Digital Strategy)', url: 'https://digital-strategy.ec.europa.eu/en/rss.xml', region: 'europe', country: 'European Union', language: 'en', kind: 'primary', filter: false },

  // ── China ─────────────────────────────────────────────────────────────────
  { name: 'IT之家 (IThome)',          url: 'https://www.ithome.com/rss/',                       region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: 'cnBeta',                  url: 'https://www.cnbeta.com.tw/backend.php',             region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: '量子位 (QbitAI)',          url: 'https://www.qbitai.com/feed',                       region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: '钛媒体 (TMTPost)',         url: 'https://www.tmtpost.com/rss.xml',                   region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: '雷峰网 (Leiphone)',        url: 'https://www.leiphone.com/feed',                     region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: '爱范儿 (ifanr)',           url: 'https://www.ifanr.com/feed',                        region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: '安全客 (Anquanke)',        url: 'https://api.anquanke.com/data/v1/rss',              region: 'china', country: 'China',          language: 'zh', kind: 'news' },
  { name: 'TechNode',                url: 'https://technode.com/feed/',                        region: 'china', country: 'China',          language: 'en', kind: 'news' },
  { name: 'Pandaily',                url: 'https://pandaily.com/feed/',                        region: 'china', country: 'China',          language: 'en', kind: 'news' },
  { name: 'South China Morning Post', url: 'https://www.scmp.com/rss/36/feed',                 region: 'china', country: 'Hong Kong',      language: 'en', kind: 'news' },

  // ── Asia-Pacific (excluding China) ────────────────────────────────────────
  { name: 'ITmedia AI+',             url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',      region: 'apac', country: 'Japan',          language: 'ja', kind: 'news' },
  { name: 'ITmedia NEWS',            url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', region: 'apac', country: 'Japan',          language: 'ja', kind: 'news' },
  { name: 'ITmedia Enterprise',      url: 'https://rss.itmedia.co.jp/rss/2.0/enterprise.xml',  region: 'apac', country: 'Japan',          language: 'ja', kind: 'news' },
  { name: 'Publickey',               url: 'https://www.publickey1.jp/atom.xml',                region: 'apac', country: 'Japan',          language: 'ja', kind: 'news' },
  { name: 'JPCERT/CC',               url: 'https://www.jpcert.or.jp/rss/jpcert.rdf',           region: 'apac', country: 'Japan',          language: 'ja', kind: 'primary', filter: false },
  { name: 'ZDNet Korea',             url: 'https://feeds.feedburner.com/zdkorea',              region: 'apac', country: 'South Korea',    language: 'ko', kind: 'news' },
  { name: '전자신문 (etnews)',        url: 'https://rss.etnews.com/Section901.xml',             region: 'apac', country: 'South Korea',    language: 'ko', kind: 'news' },
  { name: 'Yonhap',                  url: 'https://en.yna.co.kr/RSS/news.xml',                 region: 'apac', country: 'South Korea',    language: 'en', kind: 'news' },
  { name: 'iThome Taiwan',           url: 'https://www.ithome.com.tw/rss',                     region: 'apac', country: 'Taiwan',         language: 'zh-TW', kind: 'news' },
  { name: 'iThome Taiwan Security',  url: 'https://www.ithome.com.tw/rss/security',            region: 'apac', country: 'Taiwan',         language: 'zh-TW', kind: 'news' },
  { name: 'Inc42',                   url: 'https://inc42.com/feed/',                           region: 'apac', country: 'India',          language: 'en', kind: 'news' },
  { name: 'MediaNama',               url: 'https://www.medianama.com/feed/',                   region: 'apac', country: 'India',          language: 'en', kind: 'news' },
  { name: 'Tech in Asia',            url: 'https://www.techinasia.com/feed',                   region: 'apac', country: 'Singapore',      language: 'en', kind: 'news' },
  { name: 'e27',                     url: 'https://e27.co/feed/',                              region: 'apac', country: 'Singapore',      language: 'en', kind: 'news' },
  { name: 'iTnews',                  url: 'https://www.itnews.com.au/RSS/rss.ashx',            region: 'apac', country: 'Australia',      language: 'en', kind: 'news' },
];

// Original-language search terms used to keep only in-scope stories from
// general-interest feeds. Latin-script terms match on word boundaries;
// CJK terms match as substrings (no word boundaries in those scripts).
// Short acronyms (AI, KI, IA) are case-sensitive to avoid matching ordinary words.
const CASE_SENSITIVE_TERMS = ['AI', 'KI', 'IA', 'LLM', 'GPU', 'IPO', 'CVE', 'NHI'];

export const TOPIC_TERMS = {
  en: ['artificial intelligence', 'machine learning', 'generative', 'chatbot', 'openai', 'anthropic', 'deepseek', 'nvidia', 'semiconductor', 'chip', 'chips', 'chipmaker',
       'data centre', 'data center', 'cloud', 'cyber', 'cyberattack', 'cybersecurity', 'security', 'vulnerability', 'vulnerabilities', 'exploit', 'breach', 'ransomware', 'malware', 'phishing', 'hacker', 'hackers', 'hacking',
       'zero-day', 'patch', 'data protection', 'privacy', 'gdpr', 'ai act', 'regulation', 'regulator', 'startup', 'start-up', 'funding', 'raises', 'raised', 'acquisition', 'acquires', 'valuation',
       'robot', 'robotics', 'quantum', 'software', 'tech', 'technology', 'digital', 'model', 'models', 'agent', 'agents', 'identity'],
  de: ['künstliche intelligenz', 'sprachmodell', 'chatbot', 'generative', 'maschinelles lernen', 'sicherheitslücke', 'sicherheitslücken', 'schwachstelle', 'schwachstellen', 'angriff', 'cyberangriff', 'hacker',
       'ransomware', 'malware', 'phishing', 'datenschutz', 'dsgvo', 'chip', 'chips', 'halbleiter', 'rechenzentrum', 'cloud', 'start-up', 'startup', 'finanzierung', 'übernahme', 'regulierung', 'ai act',
       'cyber', 'it-sicherheit', 'digital', 'software', 'roboter', 'quanten', 'openai', 'nvidia', 'patch', 'kritische infrastruktur'],
  fr: ['intelligence artificielle', 'ia générative', 'chatbot', 'faille', 'failles', 'vulnérabilité', 'vulnérabilités', 'cyberattaque', 'cybersécurité', 'rançongiciel', 'ransomware', 'malware', 'piratage', 'pirates',
       'hameçonnage', 'données personnelles', 'rgpd', 'puce', 'puces', 'semi-conducteur', 'semi-conducteurs', 'centre de données', 'datacenter', 'cloud', 'start-up', 'startup', 'levée de fonds', 'lève',
       'rachat', 'acquisition', 'régulation', 'règlement', 'numérique', 'logiciel', 'robot', 'quantique', 'openai', 'nvidia', 'mistral', 'cnil', 'anssi'],
  es: ['inteligencia artificial', 'chatbot', 'ciberataque', 'ciberseguridad', 'vulnerabilidad', 'hackeo', 'ransomware', 'malware', 'privacidad', 'datos personales', 'chip', 'chips', 'semiconductores',
       'centro de datos', 'nube', 'startup', 'financiación', 'ronda', 'adquisición', 'regulación', 'software', 'robot', 'cuántica', 'openai', 'nvidia', 'digital'],
  zh: ['人工智能', '大模型', '模型', '智能体', '生成式', '机器人', '具身', '芯片', '半导体', '算力', '数据中心', '云', '漏洞', '网络安全', '安全', '攻击', '勒索', '黑客', '恶意', '数据', '隐私',
       '融资', '收购', '上市', '估值', '监管', '合规', '自动驾驶', '量子', '软件', '开源', '英伟达', '华为', '阿里', '腾讯', '百度', '字节', 'DeepSeek', 'OpenAI', '資安', '晶片', '半導體', '人工智慧', '模型', '駭客', '弱點', '雲端'],
  ja: ['人工知能', '生成AI', '大規模言語モデル', 'エージェント', '脆弱性', '不正アクセス', 'サイバー', 'ランサム', 'マルウェア', 'セキュリティ', '情報漏えい', '個人情報', '半導体', 'データセンター',
       'クラウド', 'スタートアップ', '資金調達', '買収', '規制', 'ロボット', '量子', 'ソフトウェア', 'OpenAI', 'NVIDIA', 'DX'],
  ko: ['인공지능', '생성형', '거대언어모델', '에이전트', '반도체', '데이터센터', '클라우드', '보안', '해킹', '해커', '취약점', '랜섬웨어', '악성코드', '개인정보', '스타트업', '투자 유치', '투자유치',
       '인수', '규제', '로봇', '양자', '소프트웨어', '엔비디아', '삼성전자', 'SK하이닉스', '네이버', '카카오'],
};

const CJK = /[぀-ヿ㐀-鿿가-힯]/;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build one matcher per language (plus the case-sensitive acronyms, which
// apply to every language because tech outlets everywhere write "AI").
const MATCHERS = Object.fromEntries(Object.entries(TOPIC_TERMS).map(([lang, terms]) => {
  const latin = terms.filter(t => !CJK.test(t));
  const cjk = terms.filter(t => CJK.test(t));
  const latinRe = latin.length ? new RegExp(`(^|[^\\p{L}\\p{N}])(${latin.map(escapeRegex).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu') : null;
  return [lang, { latinRe, cjk }];
}));
const ACRONYM_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${CASE_SENSITIVE_TERMS.join('|')})(?=$|[^\\p{L}\\p{N}]|[\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af])`, 'u');

export function baseLanguage(lang) {
  return String(lang || 'en').split('-')[0].toLowerCase();
}

/** True when an article's title/snippet mentions an in-scope topic in its own language (or English). */
export function isRelevant(article) {
  const text = `${article.title || ''} ${article.summary || ''}`;
  if (ACRONYM_RE.test(text)) return true;
  const langs = new Set([baseLanguage(article.language), 'en']);
  for (const lang of langs) {
    const m = MATCHERS[lang];
    if (!m) continue;
    if (m.latinRe && m.latinRe.test(text)) return true;
    if (m.cjk.some(t => text.includes(t))) return true;
  }
  return false;
}

export const LANGUAGE_NAMES = {
  en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', nl: 'Dutch',
  zh: 'Chinese', 'zh-TW': 'Chinese (Traditional)', ja: 'Japanese', ko: 'Korean',
};
