import { Button } from '@repo/ui';
import { StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>Klar Kasse</Text>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.body}>Track today's spending and recent activity.</Text>
      <Button label="Create receipt" style={styles.button} onPress={() => console.log('Create receipt')} />
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
  eyebrow: {
    marginBottom: 8,
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  button: {
    marginTop: 24,
  },
});
