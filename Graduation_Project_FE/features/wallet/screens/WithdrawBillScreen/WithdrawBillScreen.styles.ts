import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../../../shared/constants/Colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  billCard: {
    width: width - 40,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success + '1A', // 10% opacity success color
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.success,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 24,
  },
  dashedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  detailsContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
  },
  valueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.background,
  },
  homeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  }
});
