// src/screens/ChatScreen.tsx
import React, { useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';
import { useChat, ChatMessage } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';

type ChatRoute = RouteProp<RootTabParamList, 'Chat'>;

// Componente para quando a lista está vazia
const EmptyChat = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="chatbubbles-outline" size={48} color="#444654" />
    <Text style={styles.emptyText}>Start a conversation!</Text>
    <Text style={styles.emptySubText}>Ask anything about the Bible.</Text>
  </View>
);

export const ChatScreen = () => {
  const route = useRoute<ChatRoute>();
  const { messages, input, loading, listRef, setInput, sendMessage } = useChat();

  // Preenche o input com o prompt inicial da navegação
  useEffect(() => {
    if (route.params?.initialPrompt) {
      setInput(route.params.initialPrompt);
    }
  }, [route.params, setInput]);

  // Envolvemos renderItem em useCallback para otimização,
  // embora com `MessageBubble` e `React.memo` o ganho seja menor.
  const renderItem = useCallback(({ item }: { item: ChatMessage }) => <MessageBubble message={item} />, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Ajuste fino pode ser necessário
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyChat}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
          onContentSizeChange={() => {
            if (listRef.current && (messages.length > 0 || loading)) {
              listRef.current.scrollToEnd({ animated: true });
            }
          }}
        />

        <View style={styles.inputBar}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask something about the Bible..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              editable={!loading}
              textAlignVertical="top"
              scrollEnabled={true}
              returnKeyType="default"
              blurOnSubmit={false}
              enablesReturnKeyAutomatically={true}
              accessibilityLabel="Type your message here"
              accessibilityHint="Type your question about the Bible and press the send button"
              importantForAccessibility="yes"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || input.trim().length === 0}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#181A1B',
  },
  listContent: {
    flexGrow: 1, // Importante para o EmptyChat centralizar
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#181A1B',
    borderTopWidth: 0,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to bottom for better appearance with expanding input
    backgroundColor: '#2A2B32',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 48,
    maxHeight: 220, // Slightly more than input maxHeight to account for padding
    borderWidth: 0,
    outlineWidth: 0,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 200, // Increased max height for better readability
    minHeight: 24, // Minimum height for empty input
    borderWidth: 0,
    outlineWidth: 0,
    textAlignVertical: 'top', // Better for multiline input
    paddingVertical: 0, // Better control over vertical padding
    includeFontPadding: Platform.OS === 'android', // Prevents extra padding on Android
  } as const, // Using const assertion for better type safety
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 0,
    outlineWidth: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Empurra um pouco para cima para não ficar atrás do input
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  }
});