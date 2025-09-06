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

// Notes system types
export interface Note {
  id: string;
  title: string;
  content: string;
  bookName: string;
  chapter: number;
  verse?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface Bookmark {
  id: string;
  bookName: string;
  chapter: number;
  verse: number;
  title?: string;
  createdAt: string;
}

export interface HighlightColor {
  id: string;
  name: string;
  color: string;
}

export interface Highlight {
  id: string;
  bookName: string;
  chapter: number;
  verse: number;
  colorId: string;
  createdAt: string;
}