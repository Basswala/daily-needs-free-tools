export type Platform =
  | 'pure'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'threads'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp';

export interface CleanOptions {
  platform?: Platform;
  stripPreambles?: boolean;
  stripInvisibleUnicode?: boolean;
  cleanMultipleSpaces?: boolean;
  formatBullets?: boolean;
  collapseDeadSpace?: boolean;
  convertUnicodeBold?: boolean;
}

export interface CleanResult {
  text: string;
  stats: {
    invisibleCharactersRemoved: number;
    preamblesStripped: number;
    linesSaved: number;
  };
}

function toUnicodeBold(str: string): string {
  return Array.from(str)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
      return char;
    })
    .join('');
}

/**
 * Strips robotic AI preambles, invisible Unicode artifacts, dead line voids,
 * and formats Markdown bold and bullets for native social rendering.
 */
export function cleanAiContent(raw: string, options: CleanOptions = {}): CleanResult {
  if (!raw) {
    return {
      text: '',
      stats: { invisibleCharactersRemoved: 0, preamblesStripped: 0, linesSaved: 0 },
    };
  }

  const {
    platform = 'pure',
    stripPreambles = true,
    stripInvisibleUnicode = true,
    cleanMultipleSpaces = true,
    formatBullets = true,
    collapseDeadSpace = true,
    convertUnicodeBold = false,
  } = options;

  let text = raw;
  let invisibleCharactersRemoved = 0;
  let preamblesStripped = 0;

  if (stripPreambles) {
    const preambleRegex = /^(?:(?:Sure|Certainly|Here(?:'s| is| are)|Below is|I've generated|Here's an optimized|As requested)[^\n]*?:\s*\n+)/i;
    if (preambleRegex.test(text)) {
      text = text.replace(preambleRegex, '');
      preamblesStripped++;
    }
    const signoffRegex = /\n+(?:(?:Hope this helps|Let me know if you need|Feel free to ask|Let me know what you think|Enjoy!|Happy to help!)[^\n]*)$/i;
    if (signoffRegex.test(text)) {
      text = text.replace(signoffRegex, '');
      preamblesStripped++;
    }
  }

  if (stripInvisibleUnicode) {
    const invisibleRegex = /[\u200B-\u200D\uFEFF\u00A0\u2060\u180E\u2000-\u200A]/g;
    const matches = text.match(invisibleRegex);
    if (matches) invisibleCharactersRemoved = matches.length;
    text = text.replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, '');
    text = text.replace(/[\u00A0\u2000-\u200A]/g, ' ');
  }

  if (cleanMultipleSpaces) {
    text = text.replace(/[ \t]{2,}/g, ' ');
  }

  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  if (formatBullets) {
    text = text.replace(/^[ \t]*[*\-+]\s+/gm, '• ');
  }

  if (platform === 'whatsapp') {
    text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  } else if (convertUnicodeBold && ['linkedin', 'facebook', 'twitter', 'threads', 'instagram'].includes(platform)) {
    text = text.replace(/\*\*(.*?)\*\*/g, (_match, p1) => toUnicodeBold(p1));
  }

  const rawLines = (raw.match(/\n/g) || []).length;

  if (collapseDeadSpace) {
    if (platform === 'facebook') {
      text = text.replace(/\n{2,}/g, '\n');
    } else if (['linkedin', 'threads', 'twitter', 'tiktok', 'instagram'].includes(platform)) {
      text = text.replace(/\n{3,}/g, '\n\n');
      text = text.replace(/•\s*(.*?)\n\n+(?=•)/g, '• $1\n');
    } else {
      text = text.replace(/\n{3,}/g, '\n\n');
    }
  }

  text = text.trim();
  const cleanedLines = (text.match(/\n/g) || []).length;
  const linesSaved = Math.max(0, rawLines - cleanedLines);

  return {
    text,
    stats: {
      invisibleCharactersRemoved,
      preamblesStripped,
      linesSaved,
    },
  };
}
