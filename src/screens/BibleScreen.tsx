import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';
import bibleData from '../data/complete-kjv-bible.json';
import { Ionicons } from '@expo/vector-icons';
// Define NKJV data structure type
interface NKJVBibleData {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

// Assert the type of the imported JSON data
const typedBibleData = bibleData as NKJVBibleData;

type BibleScreenProps = {
  route: RouteProp<RootTabParamList, 'Bible'>;
  navigation: any;
};

export const BibleScreen = ({ route, navigation }: BibleScreenProps) => {
  const { book: initialBook, chapter: initialChapter, verse: initialVerse } = route.params || {};
  const [currentBook, setCurrentBook] = useState(initialBook || 'Genesis');
  const [currentChapter, setCurrentChapter] = useState(initialChapter || 1);
  const [targetVerse, setTargetVerse] = useState(initialVerse || null);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChapter();
  }, [currentBook, currentChapter]);

  // Watch for changes in route parameters (e.g., when navigating from daily verse)
  useEffect(() => {
    const { verse: newVerse } = route.params || {};
    if (newVerse && newVerse !== targetVerse) {
      setTargetVerse(newVerse);
    }
  }, [route.params]);

  // Handle targetVerse changes (e.g., from daily verse navigation)
  useEffect(() => {
    if (targetVerse && verses.length > 0) {
      // Scroll to the target verse
      setTimeout(() => {
        const verseIndex = verses.findIndex(v => v.verse === targetVerse);
        if (verseIndex !== -1 && scrollViewRef.current) {
          const headerHeight = 120;
          const verseHeight = 80;
          const scrollY = headerHeight + (verseIndex * verseHeight) - 50;
          
          scrollViewRef.current.scrollTo({ 
            y: Math.max(0, scrollY), 
            animated: true 
          });
        }
        
        // Set highlighted verse briefly
        setHighlightedVerse(targetVerse);
        
        // Remove highlight after 1.5 seconds
        setTimeout(() => {
          setHighlightedVerse(null);
          setTargetVerse(null);
        }, 1500);
      }, 500);
    }
  }, [targetVerse, verses]);

  const loadChapter = () => {
    setLoading(true);
    const book = typedBibleData[currentBook];
    if (book && book[currentChapter.toString()]) {
      const chapter = book[currentChapter.toString()];
      const verses = Object.entries(chapter).map(([verseNumber, text]) => ({
        verse: parseInt(verseNumber),
        text: text
      }));
      setVerses(verses);
      
    }
    setLoading(false);
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const bookNames = Object.keys(typedBibleData);
    const currentBookIndex = bookNames.indexOf(currentBook);
    const currentBookData = typedBibleData[currentBook];
    const chapterCount = Object.keys(currentBookData).length;
    
    if (direction === 'next') {
      if (currentChapter < chapterCount) {
        setCurrentChapter(currentChapter + 1);
      } else if (currentBookIndex < bookNames.length - 1) {
        setCurrentBook(bookNames[currentBookIndex + 1]);
        setCurrentChapter(1);
      }
    } else {
      if (currentChapter > 1) {
        setCurrentChapter(currentChapter - 1);
      } else if (currentBookIndex > 0) {
        const prevBookName = bookNames[currentBookIndex - 1];
        const prevBookData = typedBibleData[prevBookName];
        const prevChapterCount = Object.keys(prevBookData).length;
        setCurrentBook(prevBookName);
        setCurrentChapter(prevChapterCount);
      }
    }
  };

  const getBookNames = () => {
    return Object.keys(typedBibleData);
  };

  const getChapterNumbers = () => {
    const book = typedBibleData[currentBook];
    if (!book) return [];
    return Object.keys(book).map(num => parseInt(num)).sort((a, b) => a - b);
  };

  const selectBook = (bookName: string) => {
    setCurrentBook(bookName);
    setCurrentChapter(1); // Reset to first chapter when changing books
    setShowBookSelector(false);
  };

  const selectChapter = (chapterNumber: number) => {
    setCurrentChapter(chapterNumber);
    setShowChapterSelector(false);
  };

  const selectVerse = (verseNumber: number) => {
    setShowVerseSelector(false);
    
    // Highlight the selected verse
    setHighlightedVerse(verseNumber);
    
    // Remove highlight after 1.5 seconds
    setTimeout(() => {
      setHighlightedVerse(null);
    }, 1500);
    
    // Scroll to the specific verse with better calculation
    setTimeout(() => {
      const verseIndex = verses.findIndex(v => v.verse === verseNumber);
      if (verseIndex !== -1 && scrollViewRef.current) {
        // More accurate calculation considering header height and verse spacing
        const headerHeight = 120; // Approximate header height
        const verseHeight = 80; // More accurate verse height including margins
        const scrollY = headerHeight + (verseIndex * verseHeight) - 50; // Offset to center the verse
        
        scrollViewRef.current.scrollTo({ 
          y: Math.max(0, scrollY), 
          animated: true 
        });
      }
    }, 200);
  };

  const getVerseNumbers = () => {
    return verses.map(v => v.verse);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.bookTitle}>{currentBook}</Text>
          <Text style={styles.chapterNumber}>{currentChapter}</Text>
        </View>
        <View style={styles.versesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            verses.map((verse) => {
              const isHighlighted = targetVerse === verse.verse || highlightedVerse === verse.verse;
              return (
                <View 
                  key={verse.verse} 
                  style={[
                    styles.verseContainer,
                    isHighlighted && styles.highlightedVerse
                  ]}
                >
                  <Text style={styles.verseNumber}>{verse.verse}</Text>
                  <Text style={styles.verseText}>{verse.text}</Text>
                  <TouchableOpacity style={styles.noteIcon}>
                    <Ionicons name="document-text-outline" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.navigationBar}>
        <TouchableOpacity onPress={() => navigateChapter('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.selectionControls}>
          <TouchableOpacity onPress={() => setShowBookSelector(true)} style={styles.bottomSelector}>
            <Text style={styles.bottomSelectorText}>{currentBook}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowChapterSelector(true)} style={styles.bottomSelector}>
            <Text style={styles.bottomSelectorText}>{currentChapter}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowVerseSelector(true)} style={styles.bottomSelector}>
            <Text style={styles.bottomSelectorText}>Verse</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigateChapter('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Book Selection Modal */}
      <Modal
        visible={showBookSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Book</Text>
            <TouchableOpacity onPress={() => setShowBookSelector(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getBookNames()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  item === currentBook && styles.selectedModalItem
                ]}
                onPress={() => selectBook(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  item === currentBook && styles.selectedModalItemText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Chapter Selection Modal */}
      <Modal
        visible={showChapterSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Chapter</Text>
            <TouchableOpacity onPress={() => setShowChapterSelector(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getChapterNumbers()}
            keyExtractor={(item) => item.toString()}
            numColumns={4}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chapterModalItem,
                  item === currentChapter && styles.selectedModalItem
                ]}
                onPress={() => selectChapter(item)}
              >
                <Text style={[
                  styles.chapterModalItemText,
                  item === currentChapter && styles.selectedModalItemText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Verse Selection Modal */}
      <Modal
        visible={showVerseSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Verse</Text>
            <TouchableOpacity onPress={() => setShowVerseSelector(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getVerseNumbers()}
            keyExtractor={(item) => item.toString()}
            numColumns={6}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.verseModalItem}
                onPress={() => selectVerse(item)}
              >
                <Text style={styles.verseModalItemText}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  bookTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 5,
    opacity: 0.87,
  },
  chapterNumber: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
    opacity: 0.87,
  },

  scrollContent: {
    paddingBottom: 20,
  },
  versesContainer: {
    paddingHorizontal: 20,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  verseText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    color: '#fff',
    marginLeft: 12,
    marginRight: 24,
    opacity: 0.87,
  },
  verseNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  noteIcon: {
    padding: 4,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#121212',
  },
  navButton: {
    padding: 10,
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  bottomSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#333',
  },
  bottomSelectorText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginRight: 4,
    opacity: 0.87,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedModalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalItemText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.87,
  },
  selectedModalItemText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  chapterModalItem: {
    flex: 1,
    margin: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  chapterModalItemText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  verseModalItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  verseModalItemText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  // Highlight styles for target verse
  highlightedVerse: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  highlightedVerseNumber: {
    // Keep exactly the same as normal verse number
  },
  highlightedVerseText: {
    // Keep exactly the same as normal verse text
  },
});
