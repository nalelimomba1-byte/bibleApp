import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { BibleScreen } from './src/screens/BibleScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RootTabParamList } from './src/types/navigation';
import { LastVerseProvider } from './src/contexts/LastVerseContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

// ChatScreen now lives in src/screens/ChatScreen

// Use a fixed icon size across all tabs to ensure consistent UI on mobile
const TAB_ICON_SIZE = 22;



export default function App() {
  return (
    <LastVerseProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#181A1B',
              borderTopWidth: 0,
              borderTopColor: 'none',
              height: 54,
              paddingTop: 0,
              paddingBottom: 2,
            },
            tabBarItemStyle: {
              paddingVertical: 0,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              marginBottom: 0,
            },
            tabBarAllowFontScaling: true,
            tabBarActiveTintColor: '#ffd166',
            tabBarInactiveTintColor: '#666',
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: '#181A1B',
            },
            headerTintColor: '#fff',
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={TAB_ICON_SIZE} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Bible"
            component={BibleScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book-outline" size={TAB_ICON_SIZE} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbubble-outline" size={TAB_ICON_SIZE} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="document-text-outline" size={TAB_ICON_SIZE} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </LastVerseProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    
  },
});