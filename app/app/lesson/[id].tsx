import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const TOPIC_COLORS: Record<string, string> = {
  Science: '#7EC8E3',
  Space: '#B8F0D8',
  History: '#F5DEB3',
  Psychology: '#FFB6C1',
  Philosophy: '#9B6B9B',
  Finance: '#D4B8F0',
  Technology: '#B8E8F0',
  Math: '#FFDAB9',
  Geography: '#6B8F6B',
  Health: '#FF8C7A',
  Art: '#FFF3A3',
};

type Card = {
  id: string;
  card_number: number;
  title: string | null;
  body: string;
};

type Lesson = {
  id: string;
  title: string;
  topics: { name: string } | null;
};

function ProgressBars({ total, current, color }: { total: number; current: number; color: string }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressBar,
            { flex: 1 },
            i < current
              ? { backgroundColor: color }
              : i === current
              ? { backgroundColor: '#FFFFFF' }
              : { backgroundColor: '#333350' },
          ]}
        />
      ))}
    </View>
  );
}

function FinalCardActions() {
  return (
    <View style={styles.finalActions}>
      <TouchableOpacity style={styles.outlinedButton} onPress={() => console.log('save')}>
        <Text style={styles.outlinedButtonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlinedButton} onPress={() => console.log('share')}>
        <Text style={styles.outlinedButtonText}>Share</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filledButton} onPress={() => console.log('deep dive')}>
        <Text style={styles.filledButtonText}>Deep Dive</Text>
      </TouchableOpacity>
    </View>
  );
}

function SwipeCard({
  card,
  isFinal,
  topicColor,
  onDismiss,
}: {
  card: Card;
  isFinal: boolean;
  topicColor: string;
  onDismiss: () => void;
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const dismiss = () => {
    onDismiss();
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(dismiss)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${(translateX.value / SCREEN_WIDTH) * 12}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={[styles.cardTopBorder, { backgroundColor: topicColor }]} />
        <View style={styles.cardContent}>
          {card.title ? (
            <Text style={styles.cardTitle}>{card.title}</Text>
          ) : null}
          <Text style={styles.cardBody}>{card.body}</Text>
          {isFinal && <FinalCardActions />}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [lessonRes, cardsRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, topics(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('lesson_cards')
          .select('*')
          .eq('lesson_id', id)
          .order('card_number', { ascending: true }),
      ]);

      if (lessonRes.data) setLesson(lessonRes.data as unknown as Lesson);
      if (cardsRes.data) setCards(cardsRes.data as Card[]);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  const topicName = lesson?.topics?.name ?? '';
  const topicColor = TOPIC_COLORS[topicName] ?? '#9B6B9B';

  const handleDismiss = () => {
    setCurrentIndex((i) => i + 1);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9B6B9B" />
      </View>
    );
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson?.title}</Text>
          <Text style={[styles.headerTopic, { color: topicColor }]}>{topicName}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Card stack */}
      <View style={styles.stackContainer}>
        {currentIndex >= cards.length ? (
          <View style={styles.doneContainer}>
            <Text style={styles.doneText}>All done!</Text>
          </View>
        ) : (
          <>
            {/* Next card (behind) */}
            {visibleCards[1] && (
              <View style={[styles.card, styles.cardBehind]}>
                <View style={[styles.cardTopBorder, { backgroundColor: topicColor }]} />
                <View style={styles.cardContent}>
                  {visibleCards[1].title ? (
                    <Text style={styles.cardTitle}>{visibleCards[1].title}</Text>
                  ) : null}
                  <Text style={styles.cardBody}>{visibleCards[1].body}</Text>
                </View>
              </View>
            )}
            {/* Current card (on top) */}
            <SwipeCard
              key={cards[currentIndex].id}
              card={cards[currentIndex]}
              isFinal={currentIndex === cards.length - 1}
              topicColor={topicColor}
              onDismiss={handleDismiss}
            />
          </>
        )}
      </View>

      {/* Progress bars */}
      <ProgressBars total={cards.length} current={currentIndex} color={topicColor} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTopic: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  stackContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBehind: {
    top: 10,
    left: 6,
    right: 6,
    bottom: -10,
    opacity: 0.7,
  },
  cardTopBorder: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 24,
  },
  cardTitle: {
    color: '#9B6B9B',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  cardBody: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 26,
  },
  finalActions: {
    marginTop: 32,
    gap: 12,
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: '#9B6B9B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlinedButtonText: {
    color: '#9B6B9B',
    fontSize: 15,
    fontWeight: '600',
  },
  filledButton: {
    backgroundColor: '#9B6B9B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filledButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
