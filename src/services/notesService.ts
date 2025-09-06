import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, Bookmark, Highlight, HighlightColor } from '../types/bible';

// Simple UUID generator for React Native
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  NOTES: '@bible_app_notes',
  BOOKMARKS: '@bible_app_bookmarks',
  HIGHLIGHTS: '@bible_app_highlights',
  HIGHLIGHT_COLORS: '@bible_app_highlight_colors',
};

// Default highlight colors
const DEFAULT_HIGHLIGHT_COLORS: HighlightColor[] = [
  { id: 'yellow', name: 'Yellow', color: '#FEF3C7' },
  { id: 'green', name: 'Green', color: '#D1FAE5' },
  { id: 'blue', name: 'Blue', color: '#DBEAFE' },
  { id: 'pink', name: 'Pink', color: '#FCE7F3' },
  { id: 'purple', name: 'Purple', color: '#E9D5FF' },
];

// Notes Service
export const NotesService = {
  // Get all notes
  async getAllNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },

  // Get notes for a specific verse
  async getNotesForVerse(bookName: string, chapter: number, verse?: number): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => 
      note.bookName === bookName && 
      note.chapter === chapter && 
      (verse ? note.verse === verse : true)
    );
  },

  // Save a note
  async saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    try {
      const allNotes = await this.getAllNotes();
      const newNote: Note = {
        ...note,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      allNotes.push(newNote);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(allNotes));
      return newNote;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  },

  // Update a note
  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const allNotes = await this.getAllNotes();
      const noteIndex = allNotes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) return null;
      
      const updatedNote = {
        ...allNotes[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      allNotes[noteIndex] = updatedNote;
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(allNotes));
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Delete a note
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const allNotes = await this.getAllNotes();
      const filteredNotes = allNotes.filter(note => note.id !== noteId);
      
      if (filteredNotes.length === allNotes.length) return false;
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filteredNotes));
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },

  // Search notes
  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    const lowercaseQuery = query.toLowerCase();
    
    return allNotes.filter(note =>
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  },
};

// Bookmarks Service
export const BookmarksService = {
  // Get all bookmarks
  async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      const bookmarksJson = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return bookmarksJson ? JSON.parse(bookmarksJson) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  // Add bookmark
  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    try {
      const allBookmarks = await this.getAllBookmarks();
      
      // Check if bookmark already exists
      const exists = allBookmarks.some(b =>
        b.bookName === bookmark.bookName &&
        b.chapter === bookmark.chapter &&
        b.verse === bookmark.verse
      );
      
      if (exists) {
        throw new Error('Bookmark already exists for this verse');
      }
      
      const newBookmark: Bookmark = {
        ...bookmark,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      
      allBookmarks.push(newBookmark);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(allBookmarks));
      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  },

  // Remove bookmark
  async removeBookmark(bookmarkId: string): Promise<boolean> {
    try {
      const allBookmarks = await this.getAllBookmarks();
      const filteredBookmarks = allBookmarks.filter(bookmark => bookmark.id !== bookmarkId);
      
      if (filteredBookmarks.length === allBookmarks.length) return false;
      
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filteredBookmarks));
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  },

  // Check if verse is bookmarked
  async isBookmarked(bookName: string, chapter: number, verse: number): Promise<boolean> {
    const allBookmarks = await this.getAllBookmarks();
    return allBookmarks.some(bookmark =>
      bookmark.bookName === bookName &&
      bookmark.chapter === chapter &&
      bookmark.verse === verse
    );
  },
};

// Highlights Service
export const HighlightsService = {
  // Get highlight colors
  async getHighlightColors(): Promise<HighlightColor[]> {
    try {
      const colorsJson = await AsyncStorage.getItem(STORAGE_KEYS.HIGHLIGHT_COLORS);
      return colorsJson ? JSON.parse(colorsJson) : DEFAULT_HIGHLIGHT_COLORS;
    } catch (error) {
      console.error('Error getting highlight colors:', error);
      return DEFAULT_HIGHLIGHT_COLORS;
    }
  },

  // Initialize default colors if not exists
  async initializeDefaultColors(): Promise<void> {
    try {
      const existingColors = await AsyncStorage.getItem(STORAGE_KEYS.HIGHLIGHT_COLORS);
      if (!existingColors) {
        await AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHT_COLORS, JSON.stringify(DEFAULT_HIGHLIGHT_COLORS));
      }
    } catch (error) {
      console.error('Error initializing colors:', error);
    }
  },

  // Get all highlights
  async getAllHighlights(): Promise<Highlight[]> {
    try {
      const highlightsJson = await AsyncStorage.getItem(STORAGE_KEYS.HIGHLIGHTS);
      return highlightsJson ? JSON.parse(highlightsJson) : [];
    } catch (error) {
      console.error('Error getting highlights:', error);
      return [];
    }
  },

  // Add highlight
  async addHighlight(highlight: Omit<Highlight, 'id' | 'createdAt'>): Promise<Highlight> {
    try {
      const allHighlights = await this.getAllHighlights();
      
      // Remove existing highlight for this verse if any
      const filteredHighlights = allHighlights.filter(h =>
        !(h.bookName === highlight.bookName &&
          h.chapter === highlight.chapter &&
          h.verse === highlight.verse)
      );
      
      const newHighlight: Highlight = {
        ...highlight,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      
      filteredHighlights.push(newHighlight);
      await AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(filteredHighlights));
      return newHighlight;
    } catch (error) {
      console.error('Error adding highlight:', error);
      throw error;
    }
  },

  // Remove highlight
  async removeHighlight(bookName: string, chapter: number, verse: number): Promise<boolean> {
    try {
      const allHighlights = await this.getAllHighlights();
      const filteredHighlights = allHighlights.filter(highlight =>
        !(highlight.bookName === bookName &&
          highlight.chapter === chapter &&
          highlight.verse === verse)
      );
      
      if (filteredHighlights.length === allHighlights.length) return false;
      
      await AsyncStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(filteredHighlights));
      return true;
    } catch (error) {
      console.error('Error removing highlight:', error);
      return false;
    }
  },

  // Get highlight for verse
  async getHighlightForVerse(bookName: string, chapter: number, verse: number): Promise<Highlight | null> {
    const allHighlights = await this.getAllHighlights();
    return allHighlights.find(highlight =>
      highlight.bookName === bookName &&
      highlight.chapter === chapter &&
      highlight.verse === verse
    ) || null;
  },
};
