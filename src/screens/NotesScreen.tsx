import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Note } from '../types/bible';
import { NotesService } from '../services/notesService';
import { RootTabParamList } from '../types/navigation';

interface NotesScreenProps {
  navigation: any;
  route: RouteProp<RootTabParamList, 'Notes'>;
}

export const NotesScreen = ({ navigation, route }: NotesScreenProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for new/edit note
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    bookName: '',
    chapter: '',
    verse: '',
    tags: '',
  });

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
      
      // Check for prefilled note from route params
      if (route.params?.prefilledNote) {
        const { prefilledNote } = route.params;
        setNoteForm({
          title: prefilledNote.title,
          content: '',
          bookName: prefilledNote.bookName,
          chapter: prefilledNote.chapter.toString(),
          verse: prefilledNote.verse.toString(),
          tags: '',
        });
        setShowAddNoteModal(true);
        
        // Clear the params after using them
        navigation.setParams({ prefilledNote: undefined });
      }
    }, [route.params])
  );

  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await NotesService.getAllNotes();
      // Sort by most recent first
      const sortedNotes = allNotes.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setNotes(sortedNotes);
      setFilteredNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  // Filter notes based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  const resetForm = () => {
    setNoteForm({
      title: '',
      content: '',
      bookName: '',
      chapter: '',
      verse: '',
      tags: '',
    });
  };

  const handleAddNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      const chapter = noteForm.chapter ? parseInt(noteForm.chapter) : 1;
      const verse = noteForm.verse ? parseInt(noteForm.verse) : undefined;
      const tags = noteForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await NotesService.saveNote({
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        bookName: noteForm.bookName.trim() || 'General',
        chapter,
        verse,
        tags: tags.length > 0 ? tags : undefined,
      });

      setShowAddNoteModal(false);
      resetForm();
      await loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote || !noteForm.title.trim() || !noteForm.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      const chapter = noteForm.chapter ? parseInt(noteForm.chapter) : 1;
      const verse = noteForm.verse ? parseInt(noteForm.verse) : undefined;
      const tags = noteForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await NotesService.updateNote(selectedNote.id, {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        bookName: noteForm.bookName.trim() || 'General',
        chapter,
        verse,
        tags: tags.length > 0 ? tags : undefined,
      });

      setShowEditNoteModal(false);
      setSelectedNote(null);
      resetForm();
      await loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotesService.deleteNote(note.id);
              await loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      bookName: note.bookName,
      chapter: note.chapter.toString(),
      verse: note.verse?.toString() || '',
      tags: note.tags?.join(', ') || '',
    });
    setShowEditNoteModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddNoteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVerseReference = (note: Note) => {
    if (note.verse) {
      return `${note.bookName} ${note.chapter}:${note.verse}`;
    }
    return `${note.bookName} ${note.chapter}`;
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteCard} onPress={() => openEditModal(item)}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNote(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content}
      </Text>
      
      <View style={styles.noteFooter}>
        <Text style={styles.verseReference}>
          {getVerseReference(item)}
        </Text>
        <Text style={styles.noteDate}>
          {formatDate(item.updatedAt)}
        </Text>
      </View>
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderNoteModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditNoteModal : showAddNoteModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Note' : 'Add Note'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (isEdit) {
                setShowEditNoteModal(false);
                setSelectedNote(null);
              } else {
                setShowAddNoteModal(false);
              }
              resetForm();
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={noteForm.title}
            onChangeText={(text) => setNoteForm({ ...noteForm, title: text })}
            placeholder="Enter note title"
            placeholderTextColor="#666"
          />

          <Text style={styles.inputLabel}>Content *</Text>
          <TextInput
            style={[styles.textInput, styles.contentInput]}
            value={noteForm.content}
            onChangeText={(text) => setNoteForm({ ...noteForm, content: text })}
            placeholder="Write your note here..."
            placeholderTextColor="#666"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Book</Text>
          <TextInput
            style={styles.textInput}
            value={noteForm.bookName}
            onChangeText={(text) => setNoteForm({ ...noteForm, bookName: text })}
            placeholder="e.g., Genesis, Matthew"
            placeholderTextColor="#666"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Chapter</Text>
              <TextInput
                style={styles.textInput}
                value={noteForm.chapter}
                onChangeText={(text) => setNoteForm({ ...noteForm, chapter: text })}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Verse (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={noteForm.verse}
                onChangeText={(text) => setNoteForm({ ...noteForm, verse: text })}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.textInput}
            value={noteForm.tags}
            onChangeText={(text) => setNoteForm({ ...noteForm, tags: text })}
            placeholder="e.g., prayer, faith, hope"
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={isEdit ? handleEditNote : handleAddNote}
          >
            <Text style={styles.saveButtonText}>
              {isEdit ? 'Update Note' : 'Save Note'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}></Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
          placeholderTextColor="#666"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Tap the + button to create your first note'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#666"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Note Modal */}
      {renderNoteModal(false)}

      {/* Edit Note Modal */}
      {renderNoteModal(true)}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  clearSearchButton: {
    padding: 4,
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginTop: 4,
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
