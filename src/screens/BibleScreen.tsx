import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { InteractionManager } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';
import bibleData from '../data/complete-kjv-bible.json';
import { Ionicons } from '@expo/vector-icons';
import { NotesService, BookmarksService } from '../services/notesService';
import { Note, Bookmark } from '../types/bible';

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
  // REMOVIDO - O seletor de versículo não é mais um modal, a rolagem será usada
  // const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [verseNotes, setVerseNotes] = useState<{ [verseNumber: number]: Note[] }>({});
  const [verseBookmarks, setVerseBookmarks] = useState<{ [verseNumber: number]: boolean }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollYRef = useRef(0);
  const isHeaderHiddenRef = useRef(false);
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const verseYPositionsRef = useRef<{ [key: number]: number }>({});

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
        const y = verseYPositionsRef.current[targetVerse as number];
        if (y !== undefined) {
          scrollViewRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
          setHighlightedVerse(targetVerse as number);
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

  const loadChapter = () => {
    setLoading(true);
    verseYPositionsRef.current = {};
    const book = typedBibleData[currentBook];
    if (book && book[currentChapter.toString()]) {
      const chapter = book[currentChapter.toString()];
      setVerses(Object.entries(chapter).map(([verseNumber, text]) => ({
        verse: parseInt(verseNumber),
        text: text
      })));
    }
    setLoading(false);
  };

  const loadNotesAndBookmarks = async () => {
    // ... (função sem alterações)
    try {
        const notes = await NotesService.getNotesForVerse(currentBook, currentChapter);
        const notesMap: { [verseNumber: number]: Note[] } = {};
        notes.forEach(note => {
            if (note.verse) {
                if (!notesMap[note.verse]) notesMap[note.verse] = [];
                notesMap[note.verse].push(note);
            }
        });
        setVerseNotes(notesMap);

        const allBookmarks = await BookmarksService.getAllBookmarks();
        const bookmarksMap: { [verseNumber: number]: boolean } = {};
        allBookmarks.forEach(bookmark => {
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
  
  // Ação ao pressionar um versículo (função sem alterações)
  const handleVerseAction = (verseNumber: number) => {
    // ... (função sem alterações)
    const verseText = verses.find(v => v.verse === verseNumber)?.text || '';
    const reference = `${currentBook} ${currentChapter}:${verseNumber}`;
    Alert.alert(
      reference,
      verseText.length > 100 ? verseText.substring(0, 100) + '...' : verseText,
      [
        { text: 'Add Note', onPress: () => navigation.navigate('Notes', { prefilledNote: { bookName: currentBook, chapter: currentChapter, verse: verseNumber, title: reference } }) },
        { text: verseBookmarks[verseNumber] ? 'Remove Bookmark' : 'Add Bookmark', onPress: () => handleBookmarkToggle(verseNumber) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  // NOVO: Componente para renderizar versículos
  const renderVerse = (verse: { verse: number; text: string; }) => {
    const isHighlighted = targetVerse === verse.verse || highlightedVerse === verse.verse;
    const hasNotes = verseNotes[verse.verse] && verseNotes[verse.verse].length > 0;
    const isBookmarked = verseBookmarks[verse.verse];

    return (
      <TouchableOpacity 
        key={verse.verse} 
        onPress={() => handleVerseAction(verse.verse)}
        activeOpacity={0.6}
      >
        <View
          onLayout={(e) => {
            verseYPositionsRef.current[verse.verse] = e.nativeEvent.layout.y;
          }}
          style={[styles.verseContainer, isHighlighted && styles.highlightedVerse]}
        >
          <Text style={styles.verseNumber}>{verse.verse}</Text>
          <Text style={styles.verseText}>
            {verse.text}
            {/* Ícones de notas e favoritos são mostrados no final do texto para um visual mais limpo */}
            {(hasNotes || isBookmarked) && (
              <>
                {' '}
                {isBookmarked && <Ionicons name="bookmark" size={14} color="#FBC02D" />}
                {' '}
                {hasNotes && <Ionicons name="document-text" size={14} color="#4CAF50" />}
              </>
            )}
          </Text>
        </View>
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
        
        <TouchableOpacity onPress={() => navigateChapter('next')} style={styles.headerNavButton}>
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
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

      {/* REMOVIDO: Barra de navegação inferior foi movida para o cabeçalho */}

      {/* MODAIS (com pequenas melhorias de estilo) */}
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
    backgroundColor: 'rgba(251, 192, 45, 0.15)', // Cor de destaque sutil
    borderRadius: 8,
  },
  // ESTILOS DOS MODAIS
  modalContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
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
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedModalItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  modalItemText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedModalItemText: {
    color: '#4CAF50', // Cor de destaque verde
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 8,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  chapterModalItem: {
    width: '18%', // 5 colunas com espaçamento
    marginVertical: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  chapterModalItemGap: {
    marginRight: '2.5%',
  },
  chapterModalItemText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});

