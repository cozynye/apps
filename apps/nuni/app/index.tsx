import { Redirect } from 'expo-router';

// S1: the app shell only hosts the dev screens. S2 replaces this with the tab navigator.
export default function Index() {
  return <Redirect href="/dev" />;
}
