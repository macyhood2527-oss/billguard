import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/common/ScreenContainer';
import InputField from '../../components/common/InputField';
import BillCard from '../../components/bills/BillCard';
import GlassCard from '../../components/common/GlassCard';
import { colors } from '../../constants/colors';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { listBillCategories, listBills } from '../../services/billService';

const quickStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Due Soon', value: 'upcoming' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid', value: 'paid' },
];

export default function BillsListScreen() {
  const { notice } = useLocalSearchParams();
  const { currencyCode } = useCurrency();
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    if (!notice) return;

    setNoticeMessage(String(notice));

    const timeout = setTimeout(() => {
      setNoticeMessage('');
      router.setParams({ notice: undefined });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const rows = await listBillCategories();
        if (!active) return;
        setCategories(rows);
      } catch {
        if (!active) return;
        setCategories([]);
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const rows = await listBills();
      setBills(rows);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to load bills.');
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const filteredBills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesQuery =
        !normalizedQuery ||
        bill.name.toLowerCase().includes(normalizedQuery) ||
        bill.category.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' ? bill.isPaidThisMonth : bill.dueKind === statusFilter || bill.status === statusFilter);

      const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [bills, query, statusFilter, categoryFilter]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Bills List</Text>
        <Text style={styles.subtitle}>All recurring obligations in one clean list</Text>
      </View>

      <GlassCard style={styles.filtersCard}>
        <InputField label="Search" value={query} onChangeText={setQuery} placeholder="Search bill name or category" />

        <Text style={styles.filterLabel}>Quick Filter</Text>
        <View style={styles.segmentedWrap}>
          {quickStatusOptions.map((option) => {
            const active = statusFilter === option.value;

            return (
              <Pressable
                key={option.value}
                style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.advancedToggle} onPress={() => setShowAdvancedFilters((prev) => !prev)}>
          <Text style={styles.advancedToggleText}>{showAdvancedFilters ? 'Hide Advanced Filters' : 'More Filters'}</Text>
          <Text style={styles.advancedChevron}>{showAdvancedFilters ? '−' : '+'}</Text>
        </Pressable>

        {showAdvancedFilters ? (
          <>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={categoryFilter} onValueChange={setCategoryFilter} style={styles.picker}>
                <Picker.Item label="All Categories" value="all" />
                {categories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>

            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </Pressable>
          </>
        ) : null}

      </GlassCard>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {noticeMessage ? <Text style={styles.successText}>{noticeMessage}</Text> : null}

      {!loading && !errorMessage && bills.length === 0 ? (
        <Text style={styles.emptyText}>No bills yet. Add your first bill from the Add Bill tab.</Text>
      ) : null}

      {!loading && !errorMessage && bills.length > 0 && filteredBills.length === 0 ? (
        <Text style={styles.emptyText}>No bills match your filters.</Text>
      ) : null}

      {!loading && !errorMessage
        ? filteredBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} currencyCode={currencyCode} onPress={() => router.push(`/bills/${bill.id}`)} />
          ))
        : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  filtersCard: {
    marginBottom: 12,
  },
  filterLabel: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  segmentButton: {
    minWidth: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  segmentButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(225,29,72,0.2)',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  advancedToggle: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advancedToggleText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 13,
  },
  advancedChevron: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickerWrap: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.textPrimary,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  clearButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  successText: {
    color: colors.success,
    fontWeight: '600',
    marginBottom: 12,
  },
});
