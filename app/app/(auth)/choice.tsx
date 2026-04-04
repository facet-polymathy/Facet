import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ChoiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.heading}>Join Facet</Text>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.filledButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/email?mode=signup')}
          >
            <Text style={styles.filledButtonText}>Create account</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.outlinedButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/email?mode=login')}
          >
            <Text style={styles.outlinedButtonText}>Log in</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  filledButton: {
    backgroundColor: '#9B6B9B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  filledButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlinedButton: {
    borderWidth: 1.5,
    borderColor: '#9B6B9B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlinedButtonText: {
    color: '#9B6B9B',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
