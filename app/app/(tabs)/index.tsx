import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

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

type Lesson = {
  id: string;
  title: string;
  estimated_read_minutes: number;
  topics: {
    id: string;
    name: string;
  };
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const topicName = lesson.topics?.name ?? '';
  const color = TOPIC_COLORS[topicName] ?? '#AAAAAA';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/lesson/${lesson.id}`)}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <Text style={[styles.topicName, { color }]}>{topicName}</Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.readTime}>{lesson.estimated_read_minutes} min read</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    async function fetchLessons() {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, topics(id, name)')
        .eq('is_published', true)
        .limit(20);

      if (error) {
        setError(error);
      } else {
        setLessons((data as unknown as Lesson[]) ?? []);
      }
      setLoading(false);
    }

    fetchLessons();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.greeting}>{greeting()}</Text>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#9B6B9B" />
        </View>
      )}

      {!loading && error != null && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{JSON.stringify(error, null, 2)}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LessonCard lesson={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF8C7A',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    borderRadius: 2,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  topicName: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  lessonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  readTime: {
    color: '#888899',
    fontSize: 13,
  },
});
