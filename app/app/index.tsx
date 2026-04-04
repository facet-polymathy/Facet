// Facet
import { Redirect } from 'expo-router';

export default function Root() {
  // Hardcoded to auth — real session check wired in step 13
  return <Redirect href="/(auth)" />;
}
