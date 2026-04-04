import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Card {
  card_number: number;
  title: string;
  body: string;
  has_image: boolean;
  image_query: string;
}

interface Lesson {
  title: string;
  topic: string;
  estimated_read_minutes: number;
  cards: Card[];
}

export async function POST(req: NextRequest) {
  let lessons: Lesson[];

  try {
    lessons = await req.json();
    if (!Array.isArray(lessons)) throw new Error('Expected a JSON array of lessons.');
  } catch (e) {
    return NextResponse.json({ error: `Invalid JSON: ${(e as Error).message}` }, { status: 400 });
  }

  // Cache topic name → id lookups
  const topicCache: Record<string, number> = {};

  async function getTopicId(topic: string): Promise<number | null> {
    if (topicCache[topic] !== undefined) return topicCache[topic];
    const { data, error } = await supabase
      .from('topics')
      .select('id')
      .eq('name', topic)
      .single();
    if (error || !data) return null;
    topicCache[topic] = data.id;
    return data.id;
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lesson of lessons) {
    try {
      const topicId = await getTopicId(lesson.topic);
      if (topicId === null) {
        errors.push(`Lesson "${lesson.title}": topic "${lesson.topic}" not found in topics table.`);
        skipped++;
        continue;
      }

      // Skip if already exists
      const { data: existing } = await supabase
        .from('lessons')
        .select('id')
        .eq('title', lesson.title)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert lesson
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          topic_id: topicId,
          title: lesson.title,
          estimated_read_minutes: lesson.estimated_read_minutes,
          is_published: true,
        })
        .select('id')
        .single();

      if (lessonError || !newLesson) {
        errors.push(`Lesson "${lesson.title}": ${lessonError?.message ?? 'insert failed'}`);
        skipped++;
        continue;
      }

      // Insert cards
      const { error: cardsError } = await supabase.from('lesson_cards').insert(
        lesson.cards.map((card) => ({
          lesson_id: newLesson.id,
          card_number: card.card_number,
          title: card.title,
          body: card.body,
          has_image: card.has_image,
          image_query: card.image_query,
        }))
      );

      if (cardsError) {
        errors.push(`Lesson "${lesson.title}" cards: ${cardsError.message}`);
        // Lesson was inserted — still count it but flag the card error
        inserted++;
        continue;
      }

      inserted++;
    } catch (e) {
      errors.push(`Lesson "${lesson.title}": unexpected error — ${(e as Error).message}`);
      skipped++;
    }
  }

  return NextResponse.json({ inserted, skipped, errors });
}
