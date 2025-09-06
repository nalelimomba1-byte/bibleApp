export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}

export interface Book {
  id: number;
  name: string;
  chapters: Chapter[];
}

export interface BibleData {
  books: Book[];
}

// NKJV data structure types
export interface NKJVVerse {
  [verseNumber: string]: string;
}

export interface NKJVChapter {
  [chapterNumber: string]: NKJVVerse;
}

export interface NKJVBook {
  [bookName: string]: NKJVChapter;
}

export interface NKJVBibleData {
  [bookName: string]: NKJVChapter;
}
