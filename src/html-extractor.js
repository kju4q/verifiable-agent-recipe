'use strict';

/**
 * html-extractor.js
 * Parses HTML/blog-post leak documents and extracts:
 *  - Page title and meta description
 *  - Key quoted claims (pull-quotes, blockquotes, <em>/<strong> emphasis)
 *  - Structured FAQ entries (JSON-LD)
 *  - Capability claims (coding, reasoning, cybersecurity)
 *  - Cyber-risk warnings
 *  - Timeline / provenance signals
 *
 * No external dependencies — pure regex + stdlib.
 */

// Phrases that signal high-value claims worth surfacing
const SIGNAL_PHRASES = [
  'step change',
  'most capable',
  'dramatically higher',
  'far ahead',
  'cyber capabilit',
  'exploit vulnerabilit',
  'outpace',
  'defenders',
  'presages',
  'wave of models',
  'new tier',
  'above opus',
  'leaked',
  'human error',
  'cms misconfiguration',
  '3,000',
  'fortune',
];

/**
 * Parse an HTML document and return a structured extraction result.
 * @param {string} html  Raw HTML string
 * @param {string} filename  Original filename (for context)
 * @returns {LeakExtraction}
 */
function extractFromHtml(html, filename = 'document.html') {
  const title = extractTitle(html);
  const metaDescription = extractMeta(html, 'description');
  const faqEntries = extractJsonLdFaq(html);
  const blockquotes = extractBlockquotes(html);
  const keyQuotes = extractKeyQuotes(html);
  const capabilities = extractCapabilities(html);
  const cyberRiskWarnings = extractCyberRisk(html);
  const timeline = extractTimeline(html);
  const plainText = htmlToText(html);
  const signalMatches = findSignalMatches(plainText);

  return {
    filename,
    title,
    metaDescription,
    faqEntries,
    blockquotes,
    keyQuotes,
    capabilities,
    cyberRiskWarnings,
    timeline,
    signalMatches,
    plainText,
    // Convenience: all unique notable quotes in one flat array
    allNotableQuotes: dedupeQuotes([
      ...blockquotes,
      ...keyQuotes,
      ...cyberRiskWarnings,
    ]),
  };
}

// ── Internal extractors ──────────────────────────────────────────────────────

function extractTitle(html) {
  const m = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return m ? cleanText(m[1]) : '';
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? cleanText(m[1]) : '';
}

function extractJsonLdFaq(html) {
  const blocks = [];
  const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@type'] === 'FAQPage') {
        for (const item of data.mainEntity || []) {
          blocks.push({
            question: item.name || '',
            answer: item.acceptedAnswer?.text || '',
          });
        }
      }
    } catch { /* skip malformed */ }
  }
  return blocks;
}

function extractBlockquotes(html) {
  const quotes = [];
  const regex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const text = cleanText(htmlToText(m[1]));
    if (text.length > 20) quotes.push(text);
  }
  return quotes;
}

function extractKeyQuotes(html) {
  const quotes = new Set();

  // Pattern 1: content inside "pull-quote" or "quote" class divs
  const classPatterns = [
    /class="[^"]*(?:quote|pull-quote|blockquote|highlight|callout)[^"]*"[^>]*>([\s\S]{20,300}?)</gi,
    /class="[^"]*(?:stat|metric|claim|key-claim)[^"]*"[^>]*>([\s\S]{10,200}?)</gi,
  ];

  for (const pat of classPatterns) {
    let m;
    while ((m = pat.exec(html)) !== null) {
      const t = cleanText(htmlToText(m[1]));
      if (t.length > 15) quotes.add(t);
    }
  }

  // Pattern 2: sentences containing signal phrases in visible text
  const text = htmlToText(html);
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (SIGNAL_PHRASES.some(p => lower.includes(p)) && s.length > 30 && s.length < 500) {
      quotes.add(cleanText(s));
    }
  }

  return [...quotes].filter(q => q.length > 20);
}

function extractCapabilities(html) {
  const text = htmlToText(html);
  const capabilities = {};

  const patterns = {
    coding: /coding[^.!?\n]{0,200}/gi,
    reasoning: /reasoning[^.!?\n]{0,200}/gi,
    cybersecurity: /cyber(?:security|[- ]capabilit)[^.!?\n]{0,300}/gi,
    overall: /(?:step change|most capable|new tier)[^.!?\n]{0,200}/gi,
  };

  for (const [key, regex] of Object.entries(patterns)) {
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      const cleaned = cleanText(m[0]);
      if (cleaned.length > 20 && !matches.includes(cleaned)) {
        matches.push(cleaned);
        if (matches.length >= 3) break;
      }
    }
    if (matches.length) capabilities[key] = matches;
  }

  return capabilities;
}

function extractCyberRisk(html) {
  const text = htmlToText(html);
  const warnings = new Set();

  // High-signal cyber risk patterns
  const patterns = [
    /far ahead of any other[^.!?]{0,150}/gi,
    /exploit vulnerabilit[^.!?]{0,200}/gi,
    /outpace[^.!?]{0,150}/gi,
    /presages[^.!?]{0,200}/gi,
    /wave of models[^.!?]{0,200}/gi,
    /defenders can[^.!?]{0,150}/gi,
    /faster than[^.!?]{0,150}/gi,
  ];

  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const cleaned = cleanText(m[0]);
      if (cleaned.length > 20) warnings.add(cleaned);
    }
  }

  return [...warnings];
}

function extractTimeline(html) {
  const text = htmlToText(html);
  const events = [];
  // Match date patterns like "March 26, 2026" or "February 2026"
  const datePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},\s+)?\d{4}[^\n.!?]{0,200}/g;
  let m;
  while ((m = datePattern.exec(text)) !== null) {
    const cleaned = cleanText(m[0]);
    if (cleaned.length > 10 && !events.some(e => e.includes(cleaned.slice(0, 20)))) {
      events.push(cleaned);
    }
  }
  return events.slice(0, 10);
}

function findSignalMatches(text) {
  const lower = text.toLowerCase();
  return SIGNAL_PHRASES.filter(p => lower.includes(p));
}

// ── Utilities ────────────────────────────────────────────────────────────────

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanText(s) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/^["'\s]+|["'\s]+$/g, '');
}

function dedupeQuotes(arr) {
  const seen = new Set();
  return arr.filter(q => {
    const key = q.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { extractFromHtml, htmlToText };
