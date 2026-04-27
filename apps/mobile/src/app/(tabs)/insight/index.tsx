import { StyleSheet, Text, View } from 'react-native';

export default function InsightScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Insight</Text>
      <Text style={styles.body}>Review trends, categories, and spending patterns.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
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
