import { StyleSheet, Text, View } from 'react-native';

export default function BudgetScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Budget</Text>
      <Text style={styles.body}>Set limits and keep each category on track.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '700',
  },
  body: {
    marginTop: 12,
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
});
