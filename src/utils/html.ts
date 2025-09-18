export function escapeHtml(value: any) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char as '&' | '<' | '>' | '"' | "'"] ?? char))
}
