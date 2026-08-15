/**
 * Language Detection Service
 * Detects English, Tamil, or Tanglish input text.
 */

const detectLanguage = (text = '') => {
  const clean = text.trim();
  if (!clean) return 'english';

  // Check for native Tamil script characters (\u0B80-\u0BFF)
  const tamilCharRegex = /[\u0B80-\u0BFF]/;
  if (tamilCharRegex.test(clean)) {
    return 'tamil';
  }

  // Common Tanglish terms & suffix patterns
  const tanglishPatterns = [
    /\b(naalaikku|naalai|innikku|sollu|panni|pannu|irukku|varuven|varuvaen|ku|la|kku|irukkangala|kaaka|anuppu|anuppungal)\b/i,
    /\b(sir-ku|advisor-ku|hod-ku|friend-ku|team-ku|gmail-la|telegram-la)\b/i,
    /\b(enakku|en|namma|thara|vandhu|vaanga|po|poda|vanga|dhaan)\b/i
  ];

  for (const pattern of tanglishPatterns) {
    if (pattern.test(clean)) {
      return 'tanglish';
    }
  }

  return 'english';
};

module.exports = {
  detectLanguage
};
