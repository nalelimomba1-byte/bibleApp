import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const TypingIndicator = () => {
  // Usamos useRef para que os valores da animação persistam entre as renderizações
  // Criamos um Animated.Value para cada ponto
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Função que cria a animação de "pulso" para um único ponto
    const createPulseAnimation = (dot: Animated.Value) => {
      return Animated.sequence([
        // Anima para o estado "aceso" (maior e mais opaco)
        Animated.timing(dot, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Anima de volta para o estado "apagado"
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    };

    // Mapeamos cada Animated.Value para sua respectiva animação de pulso
    const animations = dotAnimations.map((dot) => createPulseAnimation(dot));

    // Usamos Animated.stagger para iniciar cada animação de pulso com um atraso
    // E Animated.loop para repetir a sequência indefinidamente
    const loopedAnimation = Animated.loop(
      Animated.stagger(200, animations)
    );

    // Inicia a animação
    loopedAnimation.start();

    // Função de limpeza para parar a animação quando o componente for desmontado
    return () => {
      loopedAnimation.stop();
    };
  }, [dotAnimations]);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {dotAnimations.map((animValue, index) => {
          // Interpola o valor da animação (0 a 1) para a escala do ponto
          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1], // Vai de 60% a 100% do tamanho
          });

          // Interpola o valor da animação para a opacidade do ponto
          const opacity = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1], // Vai de 50% a 100% de opacidade
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start', // Para o balão não ocupar a largura toda
  },
  bubble: {
    backgroundColor: '#343541', // Cor mais próxima do ChatGPT
    borderRadius: 20, // Mais arredondado
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A9A9B2', // Cor mais suave para os pontos
    marginHorizontal: 3,
  },
});

export default TypingIndicator;