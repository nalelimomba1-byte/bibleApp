// src/components/MessageBubble.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../hooks/useChat'; // Importando o tipo do hook

type MessageBubbleProps = {
  message: ChatMessage;
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '92%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#343541',
    borderTopRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#444654',
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    color: '#D1D5DB', // Cor um pouco mais suave para melhor leitura
    fontSize: 16,
    lineHeight: 24,
  },
});

// React.memo previne que o componente seja re-renderizado se suas props não mudarem.
// Essencial para performance em listas.
export default memo(MessageBubble);