import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types/navigation';
import bibleData from '../data/complete-kjv-bible.json';
import { NKJVBibleData } from '../types/bible';

export const HomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [dailyVerse, setDailyVerse] = useState({
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    reference: 'John 3:16'
  });

  const typedBibleData = bibleData as NKJVBibleData;

  // Simple seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const getDailyVerse = () => {
    // Get today's date as a seed (YYYYMMDD format)
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                      (today.getMonth() + 1).toString().padStart(2, '0') + 
                      today.getDate().toString().padStart(2, '0');
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

  useEffect(() => {
    // Get today's daily verse when component mounts
    getDailyVerse();
  }, []);

  const handleDailyVersePress = () => {
    navigation.navigate('Bible', {
      book: dailyVerse.book,
      chapter: dailyVerse.chapter,
      verse: dailyVerse.verse,
      reference: dailyVerse.reference
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Daily Verse Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Verse</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>
          <TouchableOpacity style={styles.card} onPress={handleDailyVersePress}>
            <Text style={styles.verseText}>"{dailyVerse.text}"</Text>
            <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reading Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Reading</Text>
          <TouchableOpacity style={styles.card}>
            <View>
              <Text style={styles.bookTitle}>Psalms 23</Text>
              <Text style={styles.lastRead}>Last read 2 days ago</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reading Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Reading Plans</Text>
          <TouchableOpacity style={styles.card}>
            <View>
              <Text style={styles.planTitle}>30 Days with Jesus</Text>
              <Text style={styles.planProgress}>Progress: 12/30 days</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    opacity: 0.8,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  verseText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  verseReference: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  lastRead: {
    fontSize: 14,
    color: '#666',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  planProgress: {
    fontSize: 14,
    color: '#666',
  },
});
