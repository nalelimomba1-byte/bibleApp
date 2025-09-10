import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { InteractionManager } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';
import bibleData from '../data/complete-kjv-bible.json';
import { Ionicons } from '@expo/vector-icons';
import { NotesService, BookmarksService } from '../services/notesService';
import { Note, Bookmark } from '../types/bible';
import { useLastVerse } from '../contexts/LastVerseContext';

// Define a estrutura de dados da Bíblia
interface NKJVBibleData {
  [bookName: string]: {
    [chapterNumber: string]: {
      [verseNumber: string]: string;
    };
  };
}

// Garante a tipagem correta do JSON importado
const typedBibleData = bibleData as NKJVBibleData;

// Altura do cabeçalho personalizado (usada para animação e espaçamento)
const DEFAULT_HEADER_HEIGHT = 56;

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
  const [showVerseSelector, setShowVerseSelector] = useState(false); // NEW: modal to jump to verse
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [verseNotes, setVerseNotes] = useState<{ [verseNumber: number]: Note[] }>({});
  const [verseBookmarks, setVerseBookmarks] = useState<{ [verseNumber: number]: boolean }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollYRef = useRef(0);
  const isHeaderHiddenRef = useRef(false);
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const verseYPositionsRef = useRef<{ [key: number]: number }>({});
  const { setLastVerse } = useLastVerse();
  const [showVerseOptions, setShowVerseOptions] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [sheetAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Rola para o topo ao mudar de capítulo
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    loadChapter();
    loadNotesAndBookmarks();
  }, [currentBook, currentChapter]);

  useEffect(() => {
    const { book: newBook, chapter: newChapter, verse: newVerse } = route.params || {};
    if (newBook && newBook !== currentBook) {
      setCurrentBook(newBook);
    }
    if (newChapter && newChapter !== currentChapter) {
      setCurrentChapter(newChapter);
    }
    if (newVerse && newVerse !== targetVerse) {
      setTargetVerse(newVerse);
    }
  }, [route.params]);

  useEffect(() => {
    if (targetVerse && verses.length > 0) {
      const attemptScroll = (attempt: number) => {
        const y = verseYPositionsRef.current[targetVerse];
        if (y !== undefined) {
          scrollViewRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
          setHighlightedVerse(targetVerse);
          setTimeout(() => {
            setHighlightedVerse(null);
            setTargetVerse(null);
          }, 2000);
        } else if (attempt < 10) {
          setTimeout(() => attemptScroll(attempt + 1), 100);
        }
      };

      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => attemptScroll(0));
      });
    }
  }, [targetVerse, verses]);

  const showHeader = () => {
    if (isHeaderHiddenRef.current) {
      isHeaderHiddenRef.current = false;
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const hideHeader = () => {
    if (!isHeaderHiddenRef.current) {
      isHeaderHiddenRef.current = true;
      Animated.timing(headerTranslateY, {
        toValue: -headerHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleOnScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollYRef.current;
    // Oculta ao rolar para baixo, mostra ao rolar para cima
    if (delta > 6) hideHeader();
    else if (delta < -6) showHeader();
    lastScrollYRef.current = y;
  };

  const scrollToVerse = (verseNumber: number) => {
    const y = verseYPositionsRef.current[verseNumber];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
      setHighlightedVerse(verseNumber);
      setTimeout(() => {
        setHighlightedVerse(null);
      }, 2000);
    } else {
      // If not measured yet, set targetVerse so the useEffect will attempt to scroll later
      setTargetVerse(verseNumber);
    }
  };

  const loadVerseNotes = async (verseNumbers: number[]) => {
    try {
      const notes = await NotesService.getNotesForVerse(currentBook, currentChapter);
      const notesMap: { [verseNumber: number]: Note[] } = {};
      notes.forEach(note => {
        if (note.verse) {
          if (!notesMap[note.verse]) {
            notesMap[note.verse] = [];
          }
          notesMap[note.verse].push(note);
        }
      });
      setVerseNotes(notesMap);
    } catch (error) {
      console.error('Error loading verse notes:', error);
    }
  };

  const loadVerseBookmarks = async (verseNumbers: number[]) => {
    try {
      const allBookmarks = await BookmarksService.getAllBookmarks();
      const bookmarksMap: { [verseNumber: number]: boolean } = {};
      
      // Filter bookmarks for current chapter and verses
      allBookmarks
        .filter((bookmark: Bookmark) => 
          bookmark.bookName === currentBook && 
          bookmark.chapter === currentChapter &&
          bookmark.verse !== undefined &&
          verseNumbers.includes(bookmark.verse)
        )
        .forEach((bookmark: Bookmark) => {
          if (bookmark.verse !== undefined) {
            bookmarksMap[bookmark.verse] = true;
          }
        });
      
      setVerseBookmarks(bookmarksMap);
    } catch (error) {
      console.error('Error loading verse bookmarks:', error);
    }
  };

  const loadChapter = (book: string = currentBook, chapter: number = currentChapter, verseToScroll?: number | null) => {
    setLoading(true);
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setTargetVerse(verseToScroll || null);
    setShowBookSelector(false);
    setShowChapterSelector(false);
    
    // Carrega os versículos do capítulo
    const chapterData = typedBibleData[book]?.[chapter];
    
    if (chapterData) {
      const versesList = Object.entries(chapterData)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([verseNumber, text]) => ({
          verse: parseInt(verseNumber),
          text
        }));
      
      setVerses(versesList);
      
      // Carrega as notas e favoritos
      loadVerseNotes(versesList.map(v => v.verse));
      loadVerseBookmarks(versesList.map(v => v.verse));
      
      // Rola para o versículo alvo após a renderização
      if (verseToScroll) {
        setTimeout(() => {
          scrollToVerse(verseToScroll);
        }, 100);
      }
      
      // Salva o último versículo lido
      const lastVerse = {
        book,
        chapter,
        verse: verseToScroll || 1,
        text: versesList[verseToScroll ? verseToScroll - 1 : 0]?.text || '',
        reference: `${book} ${chapter}:${verseToScroll || 1}`,
        timestamp: Date.now()
      };
      
      setLastVerse(lastVerse);
    }
    
    setLoading(false);
  };

  const loadNotesAndBookmarks = async () => {
    try {
      const allNotes = await NotesService.getAllNotes();
      const notesMap: { [verseNumber: number]: Note[] } = {};
      
      // Filter notes for current chapter and verses
      allNotes
        .filter((note: Note) => note.bookName === currentBook && note.chapter === currentChapter)
        .forEach((note: Note) => {
          if (note.verse) {
            if (!notesMap[note.verse]) notesMap[note.verse] = [];
            notesMap[note.verse].push(note);
          }
        });
      setVerseNotes(notesMap);

      const allBookmarks = await BookmarksService.getAllBookmarks();
      const bookmarksMap: { [verseNumber: number]: boolean } = {};
      allBookmarks.forEach((bookmark: Bookmark) => {
        if (bookmark.bookName === currentBook && bookmark.chapter === currentChapter) {
                bookmarksMap[bookmark.verse] = true;
            }
        });
        setVerseBookmarks(bookmarksMap);
    } catch (error) {
        console.error('Error loading notes and bookmarks:', error);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    // ... (função sem alterações)
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

  const getBookNames = () => Object.keys(typedBibleData);

  const getChapterNumbers = () => {
    const book = typedBibleData[currentBook];
    if (!book) return [];
    return Object.keys(book).map(num => parseInt(num)).sort((a, b) => a - b);
  };

  const selectBook = (bookName: string) => {
    setCurrentBook(bookName);
    setCurrentChapter(1);
    setShowBookSelector(false);
    // ABRE AUTOMATICAMENTE O SELETOR DE CAPÍTULOS PARA MELHORAR O FLUXO
    setTimeout(() => setShowChapterSelector(true), 400); 
  };

  const selectChapter = (chapterNumber: number) => {
    setCurrentChapter(chapterNumber);
    setShowChapterSelector(false);
  };
  
  // Ação: abrir opções do versículo (compatível com web/iOS/Android)
  const handleVerseAction = (verseNumber: number) => {
    setSelectedVerse(verseNumber);
    setShowVerseOptions(true);
    // Animate sheet up
    Animated.spring(sheetAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeVerseOptions = () => {
    // Animate sheet down
    Animated.spring(sheetAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowVerseOptions(false);
      setSelectedVerse(null);
    });
  };

  const handleAddNoteFromOptions = () => {
    if (selectedVerse == null) return;
    const reference = `${currentBook} ${currentChapter}:${selectedVerse}`;
    closeVerseOptions();
    navigation.navigate('Notes', {
      prefilledNote: {
        bookName: currentBook,
        chapter: currentChapter,
        verse: selectedVerse,
        title: reference,
      }
    });
  };

  const handleToggleBookmarkFromOptions = async () => {
    if (selectedVerse == null) return;
    await handleBookmarkToggle(selectedVerse);
    closeVerseOptions();
  };

  // Lógica de bookmark (função sem alterações)
  const handleBookmarkToggle = async (verseNumber: number) => {
    // ... (função sem alterações)
    try {
        if (verseBookmarks[verseNumber]) {
            const allBookmarks = await BookmarksService.getAllBookmarks();
            const bookmark = allBookmarks.find(b => b.bookName === currentBook && b.chapter === currentChapter && b.verse === verseNumber);
            if (bookmark) {
                await BookmarksService.removeBookmark(bookmark.id);
                setVerseBookmarks(prev => ({ ...prev, [verseNumber]: false }));
            }
        } else {
            await BookmarksService.addBookmark({ bookName: currentBook, chapter: currentChapter, verse: verseNumber, title: `${currentBook} ${currentChapter}:${verseNumber}` });
            setVerseBookmarks(prev => ({ ...prev, [verseNumber]: true }));
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  // NOVO: Componente para renderizar versículos - ENTIRE ROW IS CLICKABLE and removed ellipsis icon
  const renderVerse = (verse: { verse: number; text: string; }) => {
    const isHighlighted = targetVerse === verse.verse || highlightedVerse === verse.verse;
    const hasNotes = verseNotes[verse.verse] && verseNotes[verse.verse].length > 0;
    const isBookmarked = verseBookmarks[verse.verse];

    return (
      <TouchableOpacity
        key={verse.verse}
        activeOpacity={0.8}
        onPress={() => handleVerseAction(verse.verse)}
        onLayout={(e) => {
          verseYPositionsRef.current[verse.verse] = e.nativeEvent.layout.y;
        }}
        style={[styles.verseContainer, isHighlighted && styles.highlightedVerse]}
      >
        <Text style={styles.verseNumber}>{verse.verse}</Text>
        <Text style={styles.verseText}>
          {verse.text}
          {(hasNotes || isBookmarked) && (
            <>
              {' '}
              {isBookmarked && <Ionicons name="bookmark" size={14} color="#FBC02D" />}
              {' '}
              {hasNotes && <Ionicons name="document-text" size={14} color="#4CAF50" />}
            </>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho animado: oculta ao rolar para baixo e reaparece ao rolar para cima */}
      <Animated.View 
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}
      >
        <TouchableOpacity onPress={() => navigateChapter('prev')} style={styles.headerNavButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowBookSelector(true)} style={styles.headerReferenceButton}>
          <Text style={styles.headerReferenceText}>{`${currentBook} ${currentChapter}`}</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>

        {/* NEW: Show verse selector / quick jump modal */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowVerseSelector(true)} style={{ padding: 8, marginRight: 6 }}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateChapter('next')} style={styles.headerNavButton}>
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleOnScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.content}>
            {/* NOVO: Título do livro e "Drop Cap" do capítulo */}
            <Text style={styles.bookTitle}>{currentBook}</Text>
            <Text style={styles.chapterNumberDropCap}>{currentChapter}</Text>
            
            <View style={styles.versesContainer}>
              {verses.map(renderVerse)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODALS */}

      <Modal visible={showBookSelector} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Book</Text>
            <TouchableOpacity onPress={() => setShowBookSelector(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getBookNames()}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === currentBook && styles.selectedModalItem]}
                onPress={() => selectBook(item)}
              >
                <Text style={[styles.modalItemText, item === currentBook && styles.selectedModalItemText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Verse Selector Modal (NEW) */}
      <Modal visible={showVerseSelector} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Jump to Verse — {currentBook} {currentChapter}</Text>
            <TouchableOpacity onPress={() => setShowVerseSelector(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={verses.map(v => v.verse)}
            keyExtractor={(item) => item.toString()}
            numColumns={6}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item, index }) => {
              const isLastInRow = (index % 6) === 5;
              return (
                <TouchableOpacity
                  style={[styles.chapterModalItem, !isLastInRow && styles.chapterModalItemGap]}
                  onPress={() => {
                    setShowVerseSelector(false);
                    // ensure we try to scroll; if not measured yet, set targetVerse
                    scrollToVerse(item);
                  }}
                >
                  <Text style={styles.chapterModalItemText}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Bottom Sheet for verse options */}
      {showVerseOptions && (
        <>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1}
            onPress={closeVerseOptions}
          />
          
          {/* Bottom Sheet */}
          <Animated.View 
            style={[
              styles.bottomSheet,
              {
                transform: [{
                  translateY: sheetAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0], // Slide up from 300px below
                  })
                }],
                opacity: sheetAnimation,
              }
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {selectedVerse != null ? `${currentBook} ${currentChapter}:${selectedVerse}` : 'Options'}
            </Text>
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleAddNoteFromOptions}>
              <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.sheetOptionIcon} />
              <Text style={styles.sheetOptionText}>Add Note</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                if (selectedVerse == null) return;
                const reference = `${currentBook} ${currentChapter}:${selectedVerse}`;
                const text = verses.find(v => v.verse === selectedVerse)?.text || '';
                closeVerseOptions();
                navigation.navigate('Chat', {
                  initialPrompt: `Explain and biblically connect this verse: ${reference} — \"${text}\"`
                });
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" style={styles.sheetOptionIcon} />
              <Text style={styles.sheetOptionText}>Ask AI about verse</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleToggleBookmarkFromOptions}>
              <Ionicons 
                name={verseBookmarks[selectedVerse ?? -1] ? 'bookmark' : 'bookmark-outline'} 
                size={20} 
                color="#FBC02D" 
                style={styles.sheetOptionIcon} 
              />
              <Text style={styles.sheetOptionText}>
                {verseBookmarks[selectedVerse ?? -1] ? 'Remove Bookmark' : 'Add Bookmark'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sheetOption, styles.sheetCancel]} onPress={closeVerseOptions}>
              <Ionicons name="close" size={20} color="#999" style={styles.sheetOptionIcon} />
              <Text style={[styles.sheetOptionText, { color: '#999' }]}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <Modal visible={showChapterSelector} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Chapter for {currentBook}</Text>
            <TouchableOpacity onPress={() => setShowChapterSelector(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getChapterNumbers()}
            keyExtractor={(item) => item.toString()}
            numColumns={5} // Ajustado para melhor visualização
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item, index }) => {
              const isLastInRow = (index % 5) === 4;
              return (
                <TouchableOpacity
                  style={[
                    styles.chapterModalItem,
                    !isLastInRow && styles.chapterModalItemGap,
                    item === currentChapter && styles.selectedModalItem
                  ]}
                  onPress={() => selectChapter(item)}
                >
                  <Text style={[styles.chapterModalItemText, item === currentChapter && styles.selectedModalItemText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// NOVO / ALTERADO: StyleSheet completamente redesenhado
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  // CABEÇALHO FIXO
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: 'none',
    backgroundColor: '#181A1B', // Garante contraste e capta toques
    zIndex: 10, // Mantém o cabeçalho acima do conteúdo no Android/iOS
    elevation: 2, // Necessário no Android para z-order
  },
  headerNavButton: {
    padding: 8,
  },
  headerReferenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerReferenceText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  // CONTEÚDO DA PÁGINA
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  bookTitle: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: -20, // Sobrepõe um pouco o número do capítulo
    textAlign: 'center',
  },
  chapterNumberDropCap: {
    fontSize: 120,
    color: 'rgba(255, 255, 255, 0.2)',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  versesContainer: {
    marginTop: -40, // Puxa os versículos para cima, sobre o número
  },
  verseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
    padding: 6,
    borderRadius: 8,
  },
  verseNumber: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20, // Garante alinhamento
    marginTop: 5, // Alinha com a primeira linha do texto
  },
  verseText: {
    flex: 1,
    fontSize: 19,
    lineHeight: 32,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Georgia', // SUGERIDO: Usar uma fonte serifada melhora a leitura
  },
  highlightedVerse: {
    backgroundColor: 'rgba(0, 148, 56, 0.15)', // Cor de destaque sutil
    borderRadius: 8,
  },
  // Bottom Sheet Styles
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34, // Safe area padding
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sheetOptionIcon: {
    marginRight: 16,
    width: 20,
  },
  sheetOptionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
  },
  sheetCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  // MODALS
  modalContainer: {
    flex: 1,
    backgroundColor: '#181A1B',
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
    fontSize: 18,
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
    backgroundColor: 'rgba(0, 148, 56, 0.2)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedModalItemText: {
    color: '#00C853',
    fontWeight: '600',
  },
  gridContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  chapterModalItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterModalItemGap: {
    marginRight: 12,
  },
  chapterModalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
