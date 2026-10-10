const loader = '<script defer src="/assets/analytics.js" data-site-analytics></script>';

// Transform only the website copy, leaving private game sources untouched.
export function withSiteAnalytics(html) {
  if ((html.match(/<\/head\s*>/gi) || []).length !== 1) {
    throw new Error('Game HTML must contain exactly one closing head tag for site analytics.');
  }
  const clean = html.replace(/\s*<script\b[^>]*\bdata-site-analytics\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  return clean.replace(/<\/head\s*>/i, `  ${loader}${newline}</head>`);
}
