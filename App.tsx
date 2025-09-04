import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Bible: undefined;
  Chat: undefined;
  Notes: undefined;
  Plans: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Home Screen</Text>
      
      <View style={styles.verseContainer}>
        <Text style={styles.verseLabel}>Verse of the Day</Text>
        <Text style={styles.verseText}>"For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life." - John 3:16</Text>
      </View>

      <View style={styles.quickButtonsContainer}>
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Bible')}>
          <Text style={styles.buttonText}>Read Bible</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Chat')}>
          <Text style={styles.buttonText}>Ask AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Notes')}>
          <Text style={styles.buttonText}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Plans')}>
          <Text style={styles.buttonText}>Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BibleScreen = () => (
  <View style={styles.screen}>
    <Text>Bible Screen</Text>
  </View>
);

const ChatScreen = () => (
  <View style={styles.screen}>
    <Text>Chat Screen</Text>
  </View>
);

const NotesScreen = () => (
  <View style={styles.screen}>
    <Text>Notes Screen</Text>
  </View>
);

const PlansScreen = () => (
  <View style={styles.screen}>
    <Text>Plans Screen</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Bible" component={BibleScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Notes" component={NotesScreen} />
        <Tab.Screen name="Plans" component={PlansScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  verseContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  verseLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});