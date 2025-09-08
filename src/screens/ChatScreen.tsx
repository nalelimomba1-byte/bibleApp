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
              editable={!loading} // Desabilita edição enquanto carrega
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
    alignItems: 'center',
    backgroundColor: '#2A2B32',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 44,
    // remove the outline
    outline: 'none',
    
    
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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