import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function MainApp() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Graduation Project FE!</Text>
      <Text>Source code is now organized in the src/ directory.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
