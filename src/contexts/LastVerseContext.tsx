import React, { createContext, useContext, useState, ReactNode } from 'react';

type LastVerseType = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
} | null;

type LastVerseContextType = {
  lastVerse: LastVerseType;
  setLastVerse: (verse: LastVerseType) => void;
};

const LastVerseContext = createContext<LastVerseContextType | undefined>(undefined);

export const LastVerseProvider = ({ children }: { children: ReactNode }) => {
  const [lastVerse, setLastVerse] = useState<LastVerseType>(null);

  return (
    <LastVerseContext.Provider value={{ lastVerse, setLastVerse }}>
      {children}
    </LastVerseContext.Provider>
  );
};

export const useLastVerse = () => {
  const context = useContext(LastVerseContext);
  if (context === undefined) {
    throw new Error('useLastVerse must be used within a LastVerseProvider');
  }
  return context;
};
