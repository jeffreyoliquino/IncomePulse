import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Input, Card } from '../../components/ui';

interface ExchangeRates {
  usd: number;
  aud: number;
  lastUpdated: string;
}

interface RateHistoryPoint {
  date: string;
  label: string;
  rate: number;
}

const screenWidth = Dimensions.get('window').width;

type HistoryPair = 'usd' | 'aud';
type HistoryRange = '7d' | '30d' | '90d';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('PHP');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rate history state
  const [historyPair, setHistoryPair] = useState<HistoryPair>('usd');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30d');
  const [rateHistory, setRateHistory] = useState<RateHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/php.json'
      );

      if (!response.ok) throw new Error('Failed to fetch rates');

      const data = await response.json();
      const phpRates = data.php;

      setRates({
        usd: 1 / phpRates.usd,
        aud: 1 / phpRates.aud,
        lastUpdated: new Date().toLocaleString('en-PH'),
      });
    } catch {
      setError('Could not fetch exchange rates. Using cached rates.');
      setRates({
        usd: 56.5,
        aud: 36.5,
        lastUpdated: 'Cached',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRateHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);

      const days = historyRange === '7d' ? 7 : historyRange === '30d' ? 30 : 90;
      const points: RateHistoryPoint[] = [];

      // Sample every few days to keep requests reasonable
      const step = days <= 7 ? 1 : days <= 30 ? 3 : 7;
      const fetchPromises: Promise<void>[] = [];

      for (let i = days; i >= 0; i -= step) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

        fetchPromises.push(
          fetch(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/php.json`
          )
            .then((res) => {
              if (!res.ok) throw new Error('not ok');
              return res.json();
            })
            .then((data) => {
              const phpRates = data.php;
              const rate = 1 / phpRates[historyPair];
              points.push({ date: dateStr, label, rate });
            })
            .catch(() => {
              // Skip dates with no data
            })
        );
      }

      await Promise.allSettled(fetchPromises);
      points.sort((a, b) => a.date.localeCompare(b.date));

      if (points.length > 0) {
        setRateHistory(points);
      }
    } catch {
      // Silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPair, historyRange]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    fetchRateHistory();
  }, [fetchRateHistory]);

  const getRate = (from: string, to: string): number => {
    if (!rates) return 0;
    if (from === 'PHP' && to === 'USD') return 1 / rates.usd;
    if (from === 'PHP' && to === 'AUD') return 1 / rates.aud;
    if (from === 'USD' && to === 'PHP') return rates.usd;
    if (from === 'AUD' && to === 'PHP') return rates.aud;
    if (from === 'USD' && to === 'AUD') return rates.usd / rates.aud;
    if (from === 'AUD' && to === 'USD') return rates.aud / rates.usd;
    if (from === to) return 1;
    return 0;
  };

  const convertedAmount = parseFloat(amount || '0') * getRate(fromCurrency, toCurrency);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const currencies = ['PHP', 'USD', 'AUD'];

  // Chart stats
  const historyMin = rateHistory.length > 0 ? Math.min(...rateHistory.map((p) => p.rate)) : 0;
  const historyMax = rateHistory.length > 0 ? Math.max(...rateHistory.map((p) => p.rate)) : 0;
  const historyAvg =
    rateHistory.length > 0
      ? rateHistory.reduce((sum, p) => sum + p.rate, 0) / rateHistory.length
      : 0;
  const historyChange =
    rateHistory.length >= 2
      ? rateHistory[rateHistory.length - 1].rate - rateHistory[0].rate
      : 0;
  const historyChangePercent =
    rateHistory.length >= 2 ? (historyChange / rateHistory[0].rate) * 100 : 0;

  // Prepare chart labels - show only a few to avoid crowding
  const chartLabels = rateHistory.length > 0
    ? rateHistory.map((p, i) => {
        const step = Math.max(1, Math.floor(rateHistory.length / 5));
        return i % step === 0 || i === rateHistory.length - 1 ? p.label : '';
      })
    : [];

  return (
    <ScrollView className="flex-1 px-4 pt-4">
      {/* Current Rates */}
      {loading ? (
        <Card variant="elevated" className="mb-4 items-center py-8">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-sm text-surface-400">Fetching rates...</Text>
        </Card>
      ) : (
        <Card variant="elevated" className="mb-4">
          <Text className="mb-3 text-sm font-semibold text-surface-500">
            CURRENT RATES
          </Text>
          {rates && (
            <>
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <Text className="text-xl">{'🇺🇸'}</Text>
                  <Text className="ml-2 text-sm text-surface-700">1 USD</Text>
                </View>
                <Text className="text-base font-bold text-surface-900">
                  = ₱{rates.usd.toFixed(2)}
                </Text>
              </View>
              <View className="my-1 h-px bg-surface-100" />
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <Text className="text-xl">{'🇦🇺'}</Text>
                  <Text className="ml-2 text-sm text-surface-700">1 AUD</Text>
                </View>
                <Text className="text-base font-bold text-surface-900">
                  = ₱{rates.aud.toFixed(2)}
                </Text>
              </View>
              <Text className="mt-2 text-xs text-surface-400">
                Updated: {rates.lastUpdated}
              </Text>
            </>
          )}
        </Card>
      )}

      {/* Rate History Chart */}
      <Card variant="elevated" className="mb-4">
        <Text className="mb-3 text-sm font-semibold text-surface-500">
          RATE HISTORY
        </Text>

        {/* Pair Selector */}
        <View className="flex-row gap-2 mb-3">
          <Pressable
            onPress={() => setHistoryPair('usd')}
            className={`flex-1 rounded-lg py-2 items-center ${
              historyPair === 'usd' ? 'bg-primary-600' : 'bg-surface-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                historyPair === 'usd' ? 'text-white' : 'text-surface-600'
              }`}
            >
              USD/PHP
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setHistoryPair('aud')}
            className={`flex-1 rounded-lg py-2 items-center ${
              historyPair === 'aud' ? 'bg-primary-600' : 'bg-surface-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                historyPair === 'aud' ? 'text-white' : 'text-surface-600'
              }`}
            >
              AUD/PHP
            </Text>
          </Pressable>
        </View>

        {/* Range Selector */}
        <View className="flex-row gap-2 mb-4">
          {(['7d', '30d', '90d'] as HistoryRange[]).map((range) => (
            <Pressable
              key={range}
              onPress={() => setHistoryRange(range)}
              className={`flex-1 rounded-full py-1.5 items-center ${
                historyRange === range ? 'bg-primary-100' : 'bg-surface-50'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  historyRange === range ? 'text-primary-700' : 'text-surface-500'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        {historyLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text className="mt-2 text-xs text-surface-400">Loading history...</Text>
          </View>
        ) : rateHistory.length >= 2 ? (
          <>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    data: rateHistory.map((p) => p.rate),
                    color: () => (historyChange >= 0 ? '#16a34a' : '#dc2626'),
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={180}
              yAxisLabel="₱"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: () => '#94a3b8',
                style: { borderRadius: 12 },
                propsForDots: { r: '3', strokeWidth: '1' },
              }}
              bezier
              withVerticalLines={false}
              style={{ marginLeft: -16, borderRadius: 12 }}
            />

            {/* Stats */}
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-lg bg-surface-50 p-2">
                <Text className="text-xs text-surface-400">Change</Text>
                <Text
                  className={`text-sm font-bold ${
                    historyChange >= 0 ? 'text-accent-600' : 'text-danger-600'
                  }`}
                >
                  {historyChange >= 0 ? '+' : ''}
                  {historyChange.toFixed(2)} ({historyChangePercent >= 0 ? '+' : ''}
                  {historyChangePercent.toFixed(2)}%)
                </Text>
              </View>
              <View className="flex-1 rounded-lg bg-surface-50 p-2">
                <Text className="text-xs text-surface-400">Average</Text>
                <Text className="text-sm font-bold text-surface-700">
                  ₱{historyAvg.toFixed(2)}
                </Text>
              </View>
            </View>
            <View className="mt-2 flex-row gap-2">
              <View className="flex-1 rounded-lg bg-surface-50 p-2">
                <Text className="text-xs text-surface-400">Low</Text>
                <Text className="text-sm font-bold text-danger-600">
                  ₱{historyMin.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 rounded-lg bg-surface-50 p-2">
                <Text className="text-xs text-surface-400">High</Text>
                <Text className="text-sm font-bold text-accent-600">
                  ₱{historyMax.toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View className="items-center py-6">
            <Text className="text-sm text-surface-400">
              Rate history unavailable
            </Text>
          </View>
        )}
      </Card>

      {/* Converter */}
      <Card variant="elevated" className="mb-4">
        <Text className="mb-3 text-sm font-semibold text-surface-500">
          CONVERT
        </Text>

        <Input
          label="Amount"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <View className="flex-row gap-2 mb-4">
          {currencies.map((c) => (
            <Pressable
              key={`from-${c}`}
              onPress={() => setFromCurrency(c)}
              className={`flex-1 rounded-lg py-2 items-center ${
                fromCurrency === c ? 'bg-primary-600' : 'bg-surface-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  fromCurrency === c ? 'text-white' : 'text-surface-600'
                }`}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="items-center my-2">
          <Pressable
            onPress={swapCurrencies}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-100 active:bg-surface-200"
          >
            <FontAwesome name="exchange" size={16} color="#64748b" />
          </Pressable>
        </View>

        <Text className="mb-2 text-sm font-medium text-surface-700">To</Text>
        <View className="flex-row gap-2 mb-4">
          {currencies.map((c) => (
            <Pressable
              key={`to-${c}`}
              onPress={() => setToCurrency(c)}
              className={`flex-1 rounded-lg py-2 items-center ${
                toCurrency === c ? 'bg-primary-600' : 'bg-surface-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  toCurrency === c ? 'text-white' : 'text-surface-600'
                }`}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="rounded-xl bg-accent-50 p-4">
          <Text className="text-sm text-accent-700">Converted Amount</Text>
          <Text className="mt-1 text-2xl font-bold text-accent-800">
            {toCurrency === 'PHP'
              ? `₱${convertedAmount.toFixed(2)}`
              : toCurrency === 'USD'
              ? `$${convertedAmount.toFixed(2)}`
              : `A$${convertedAmount.toFixed(2)}`}
          </Text>
          <Text className="mt-1 text-xs text-accent-600">
            1 {fromCurrency} = {getRate(fromCurrency, toCurrency).toFixed(4)}{' '}
            {toCurrency}
          </Text>
        </View>
      </Card>

      {error && (
        <Card variant="outlined" className="mb-8">
          <Text className="text-xs text-warning-600">{error}</Text>
        </Card>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
