import React, { useId, useMemo } from 'react';
import '../styles/handwrittenHeading.css';

/**
 * HandwrittenHeading Component
 * Multi-color cursive handwriting motion like HandwrittenIntro.
 * Uses Great Vibes + Dancing Script with staggered ink reveal.
 * Palette: Rama Green -> Peacock Blue -> Bright Violet Purple.
 */
const HandwrittenHeading = ({
  text = '',
  size = 'normal', // 'hero', 'normal', 'compact'
  withFlourish = true,
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const gradientId = `hwGrad_${uniqueId}`;

  // Parse words and assign color groups
  const parsedData = useMemo(() => {
    if (!text) return { words: [], totalLetters: 0 };

    let wordsArray = [];

    // Special case for "CommandFlow" compound word
    if (text.toLowerCase() === 'commandflow' || text.toLowerCase() === 'command flow') {
      wordsArray = [
        { text: 'Command', colorClass: 'hw-color-green' },
        { text: 'Flow', colorClass: 'hw-color-blue' }
      ];
    } else {
      const rawWords = text.trim().split(/\s+/);

      if (rawWords.length === 1) {
        // Single word: split characters into 3 vibrant gradient color zones
        const singleWord = rawWords[0];
        const len = singleWord.length;
        const part1 = Math.ceil(len * 0.38);
        const part2 = Math.ceil(len * 0.72);

        wordsArray = [
          { text: singleWord.slice(0, part1), colorClass: 'hw-color-green' },
          { text: singleWord.slice(part1, part2), colorClass: 'hw-color-blue' },
          { text: singleWord.slice(part2), colorClass: 'hw-color-purple' }
        ];
      } else if (rawWords.length === 2) {
        // 2 words: e.g. "Saved Contacts", "Command Center"
        wordsArray = [
          { text: rawWords[0], colorClass: 'hw-color-green' },
          { text: rawWords[1], colorClass: 'hw-color-blue' }
        ];
      } else if (rawWords.length === 3) {
        // 3 words: e.g. "Connected Services & Ecosystem"
        wordsArray = [
          { text: rawWords[0], colorClass: 'hw-color-green' },
          { text: rawWords[1], colorClass: 'hw-color-blue' },
          { text: rawWords[2], colorClass: 'hw-color-purple' }
        ];
      } else {
        // 4+ words: e.g. "Analytics & Execution History"
        const third = Math.ceil(rawWords.length / 3);
        const group1 = rawWords.slice(0, third).join(' ');
        const group2 = rawWords.slice(third, third * 2).join(' ');
        const group3 = rawWords.slice(third * 2).join(' ');

        wordsArray = [
          { text: group1, colorClass: 'hw-color-green' },
          { text: group2, colorClass: 'hw-color-blue' },
          { text: group3, colorClass: 'hw-color-purple' }
        ];
      }
    }

    // Build letter tokens with staggered delay
    let letterIndex = 0;
    const structuredWords = wordsArray.map((group, gIdx) => {
      const chars = group.text.split('').map((ch) => {
        const isSpace = ch === ' ';
        const delay = isSpace ? 0 : (letterIndex * 0.04) + 0.08;
        if (!isSpace) letterIndex++;

        // Determine special font class for optimal legibility
        let fontClass = '';
        if (ch === 'd' || ch === 'D') fontClass = 'font-pinyon-d';
        else if (ch === 'A') fontClass = 'font-capital-a';
        else if (ch === 'I') fontClass = 'font-capital-i';

        return {
          char: ch,
          delay: delay.toFixed(2),
          isSpace,
          fontClass
        };
      });

      return {
        ...group,
        chars
      };
    });

    return {
      words: structuredWords,
      totalLetters: letterIndex
    };
  }, [text]);

  const flourishDelay = Math.max(0.4, (parsedData.totalLetters * 0.04) + 0.15).toFixed(2);

  return (
    <div className={`handwritten-heading-wrap ${className}`} style={style} aria-label={text}>
      <h1 className={`handwritten-heading-title size-${size}`}>
        {parsedData.words.map((wordGroup, wIdx) => (
          <span key={wIdx} className={`hw-word ${wordGroup.colorClass}`}>
            {wordGroup.chars.map((item, cIdx) => (
              item.isSpace ? (
                <span key={cIdx} style={{ display: 'inline-block', width: '0.4em' }}>&nbsp;</span>
              ) : (
                <span
                  key={cIdx}
                  className={`hw-char ${item.fontClass}`}
                  style={{ animationDelay: `${item.delay}s` }}
                >
                  {item.char}
                </span>
              )
            ))}
          </span>
        ))}
      </h1>

      {withFlourish && (
        <svg
          className="hw-flourish-svg"
          viewBox="0 0 380 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 14 C 60 20, 110 6, 175 12 C 240 18, 305 6, 365 14"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            className="hw-flourish-stroke"
            style={{ animationDelay: `${flourishDelay}s` }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D29E" />
              <stop offset="50%" stopColor="#00A3E0" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default HandwrittenHeading;
