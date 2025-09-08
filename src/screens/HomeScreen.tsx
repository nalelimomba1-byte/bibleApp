import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useLastVerse } from '../contexts/LastVerseContext';
import { RootTabParamList } from '../types/navigation';
import bibleData from '../data/complete-kjv-bible.json';
import { NKJVBibleData } from '../types/bible';
import { Ionicons } from '@expo/vector-icons'; // NOVO: Importando ícones

// NOVO: Imagem de fundo para o versículo do dia. Substitua pela sua ou use uma remota.
const verseBgImage = { uri: 'https://images.unsplash.com/photo-1509172833213-2cca5c1f0c97?q=80&w=2070&auto=format&fit=crop' };

export const HomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  // O estado e a lógica para obter o versículo do dia permanecem os mesmos
  const [dailyVerse, setDailyVerse] = React.useState({
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    reference: 'John 3:16'
  });

  const { lastVerse } = useLastVerse();

  const typedBibleData = bibleData as NKJVBibleData;

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const getDailyVerse = () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    const seed = parseInt(dateString);

    const bookNames = Object.keys(typedBibleData);
    const bookIndex = Math.floor(seededRandom(seed) * bookNames.length);
    const randomBook = bookNames[bookIndex];
    
    const book = typedBibleData[randomBook];
    const chapterNumbers = Object.keys(book).map(num => parseInt(num)).sort((a, b) => a - b);
    const chapterIndex = Math.floor(seededRandom(seed + 1) * chapterNumbers.length);
    const randomChapter = chapterNumbers[chapterIndex];
    
    const chapter = book[randomChapter.toString()];
    const verseNumbers = Object.keys(chapter).map(num => parseInt(num)).sort((a, b) => a - b);
    const verseIndex = Math.floor(seededRandom(seed + 2) * verseNumbers.length);
    const randomVerse = verseNumbers[verseIndex];
    
    const verseText = chapter[randomVerse.toString()];

    setDailyVerse({
      book: randomBook,
      chapter: randomChapter,
      verse: randomVerse,
      text: verseText,
      reference: `${randomBook} ${randomChapter}:${randomVerse}`
    });
  };

  const handleVersePress = (book: string, chapter: number, verse: number) => {
    navigation.navigate('Bible', { book, chapter, verse });
  };

  React.useEffect(() => {
    getDailyVerse();
  }, []);

  const handleDailyVersePress = () => {
    handleVersePress(dailyVerse.book, dailyVerse.chapter, dailyVerse.verse);
  };

  // Função para formatar o tempo decorrido
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 
          ? `Last read 1 ${unit} ago`
          : `Last read ${interval} ${unit}s ago`;
      }
    }
    
    return 'Just now';
  };

  // Função para saudação dinâmica
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* NOVO: Cabeçalho de boas-vindas */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.subGreetingText}>Let's connect with God's Word</Text>
        </View>

        {/* ALTERADO: Seção do Versículo do Dia (Hero Component) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verse of the Day</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={handleDailyVersePress}>
            <ImageBackground
              source={verseBgImage}
              style={styles.heroCard}
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.heroOverlay} />
              <Text style={styles.heroVerseText}>"{dailyVerse.text}"</Text>
              <Text style={styles.heroVerseReference}>{dailyVerse.reference}</Text>
            </ImageBackground>
          </TouchableOpacity>
          {/* NOVO: Botões de ação para o versículo */}
          <View style={styles.actionsContainer}>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ALTERADO: Seção de Leitura Recente */}
        {lastVerse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            <TouchableOpacity 
              style={styles.infoCard}
              onPress={() => handleVersePress(
                lastVerse.book, 
                lastVerse.chapter, 
                lastVerse.verse
              )}
            >
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle} numberOfLines={1}>
                  {lastVerse.reference}
                </Text>
                <Text style={styles.infoCardSubtitle}>
                  {lastVerse.text.length > 60 
                    ? `${lastVerse.text.substring(0, 60)}...` 
                    : lastVerse.text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#555" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// NOVO / ALTERADO: StyleSheet completamente redesenhado
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 32,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreetingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  // Estilos do Versículo do Dia (Hero)
  heroCard: {
    height: 220,
    justifyContent: 'center',
    padding: 24,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  heroVerseText: {
    fontSize: 20,
    color: '#fff',
    lineHeight: 30,
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  heroVerseReference: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  // Estilos dos Botões de Ação
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Estilos do Card de Informações (Continue Lendo)
  infoCard: {
    backgroundColor: '#2A2B32',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardContent: {
    flex: 1,
    marginRight: 12,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoCardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  lastReadText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Estilos dos Cards de Planos
  planCard: {
    backgroundColor: '#2d5c5c',
    borderRadius: 12,
    padding: 16,
    width: 150,
    height: 100,
    justifyContent: 'space-between',
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  planCardProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});