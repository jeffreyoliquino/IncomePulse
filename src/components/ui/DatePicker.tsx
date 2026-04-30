import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  error?: string;
  placeholder?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');

  // Parse current value or use today
  const parseDate = (dateStr: string) => {
    if (!dateStr) {
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth(),
        day: today.getDate(),
      };
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };

  const { year: selectedYear, month: selectedMonth, day: selectedDay } = parseDate(value);
  const [displayYear, setDisplayYear] = useState(selectedYear);
  const [displayMonth, setDisplayMonth] = useState(selectedMonth);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const { year, month, day } = parseDate(dateStr);
    return `${MONTHS[month]} ${day}, ${year}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDaySelect = (day: number) => {
    const monthStr = String(displayMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${displayYear}-${monthStr}-${dayStr}`);
    setIsOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    setDisplayMonth(month);
    setViewMode('day');
  };

  const handleYearSelect = (year: number) => {
    setDisplayYear(year);
    setViewMode('month');
  };

  const prevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const nextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const borderColor = error
    ? 'border-danger-500'
    : isOpen
    ? 'border-primary-500'
    : 'border-surface-300';

  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

  // Generate year range
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => {
          setIsOpen(!isOpen);
          setViewMode('day');
          setDisplayYear(selectedYear);
          setDisplayMonth(selectedMonth);
        }}
        className={`flex-row items-center justify-between rounded-xl border bg-white dark:bg-surface-800 px-4 py-3 ${borderColor}`}
      >
        <View className="flex-row items-center flex-1">
          <FontAwesome
            name="calendar"
            size={16}
            color="#64748b"
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-base ${
              value
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-400'
            }`}
          >
            {formatDisplayDate(value)}
          </Text>
        </View>
        <FontAwesome
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#64748b"
        />
      </Pressable>

      {isOpen && (
        <View
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-300 dark:border-surface-600 mt-1 p-3"
        >
          {viewMode === 'day' && (
            <>
              {/* Month/Year Header */}
              <View className="flex-row items-center justify-between mb-3">
                <Pressable onPress={prevMonth} className="p-2">
                  <FontAwesome name="chevron-left" size={14} color="#64748b" />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('month')}
                  className="flex-row items-center"
                >
                  <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    {MONTHS[displayMonth]} {displayYear}
                  </Text>
                  <FontAwesome
                    name="caret-down"
                    size={14}
                    color="#64748b"
                    style={{ marginLeft: 6 }}
                  />
                </Pressable>
                <Pressable onPress={nextMonth} className="p-2">
                  <FontAwesome name="chevron-right" size={14} color="#64748b" />
                </Pressable>
              </View>

              {/* Day Headers */}
              <View className="flex-row mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <View key={day} className="flex-1 items-center">
                    <Text className="text-xs font-medium text-surface-500">
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View className="flex-row flex-wrap">
                {/* Empty cells for days before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ width: '14.28%', height: 36 }} />
                ))}
                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    day === selectedDay &&
                    displayMonth === selectedMonth &&
                    displayYear === selectedYear;
                  const isToday =
                    day === new Date().getDate() &&
                    displayMonth === new Date().getMonth() &&
                    displayYear === new Date().getFullYear();

                  return (
                    <Pressable
                      key={day}
                      onPress={() => handleDaySelect(day)}
                      style={{ width: '14.28%', height: 36 }}
                      className="items-center justify-center"
                    >
                      <View
                        className={`w-8 h-8 items-center justify-center rounded-full ${
                          isSelected
                            ? 'bg-primary-600'
                            : isToday
                            ? 'bg-primary-100'
                            : ''
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            isSelected
                              ? 'text-white font-bold'
                              : isToday
                              ? 'text-primary-600 font-medium'
                              : 'text-surface-700 dark:text-surface-300'
                          }`}
                        >
                          {day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Quick Actions */}
              <View className="flex-row justify-between mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <Pressable
                  onPress={() => {
                    const today = new Date();
                    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(today.getDate()).padStart(2, '0');
                    onChange(`${today.getFullYear()}-${monthStr}-${dayStr}`);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1"
                >
                  <Text className="text-sm text-primary-600 font-medium">Today</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  className="px-3 py-1"
                >
                  <Text className="text-sm text-surface-500">Cancel</Text>
                </Pressable>
              </View>
            </>
          )}

          {viewMode === 'month' && (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <Pressable
                  onPress={() => setDisplayYear(displayYear - 1)}
                  className="p-2"
                >
                  <FontAwesome name="chevron-left" size={14} color="#64748b" />
                </Pressable>
                <Pressable onPress={() => setViewMode('year')}>
                  <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    {displayYear}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDisplayYear(displayYear + 1)}
                  className="p-2"
                >
                  <FontAwesome name="chevron-right" size={14} color="#64748b" />
                </Pressable>
              </View>
              <View className="flex-row flex-wrap">
                {MONTHS.map((month, index) => (
                  <Pressable
                    key={month}
                    onPress={() => handleMonthSelect(index)}
                    style={{ width: '33.33%' }}
                    className="p-2"
                  >
                    <View
                      className={`py-2 items-center rounded-lg ${
                        index === displayMonth ? 'bg-primary-100' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          index === displayMonth
                            ? 'text-primary-600 font-medium'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {viewMode === 'year' && (
            <ScrollView style={{ maxHeight: 200 }}>
              <View className="flex-row flex-wrap">
                {years.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => handleYearSelect(year)}
                    style={{ width: '25%' }}
                    className="p-2"
                  >
                    <View
                      className={`py-2 items-center rounded-lg ${
                        year === displayYear ? 'bg-primary-100' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          year === displayYear
                            ? 'text-primary-600 font-medium'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {year}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {error && (
        <Text className="mt-1 text-sm text-danger-500">{error}</Text>
      )}
    </View>
  );
};
