export type TextChunk = {
  ordinal: number;
  text: string;
  wordCount: number;
};

const DEFAULT_TARGET_WORDS = 1_600;
const DEFAULT_MIN_WORDS = 500;

function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches?.length ?? 0;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chunkText(
  rawText: string,
  opts: { targetWords?: number; minWords?: number } = {},
): TextChunk[] {
  const targetWords = opts.targetWords ?? DEFAULT_TARGET_WORDS;
  const minWords = opts.minWords ?? DEFAULT_MIN_WORDS;
  const paragraphs = normalizeText(rawText)
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: TextChunk[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    const wouldExceedTarget = currentWords > 0 && currentWords + paragraphWords > targetWords;
    const currentIsLargeEnough = currentWords >= minWords;

    if (wouldExceedTarget && currentIsLargeEnough) {
      chunks.push({
        ordinal: chunks.length + 1,
        text: current.join('\n\n'),
        wordCount: currentWords,
      });
      current = [];
      currentWords = 0;
    }

    current.push(paragraph);
    currentWords += paragraphWords;
  }

  if (current.length > 0) {
    chunks.push({
      ordinal: chunks.length + 1,
      text: current.join('\n\n'),
      wordCount: currentWords,
    });
  }

  return chunks;
}

