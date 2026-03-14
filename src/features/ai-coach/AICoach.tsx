import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui';
import { useAICoachStore } from '@/src/stores/aiCoachStore';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { buildFinancialContext } from './services/financialContext';
import { generateResponse, getQuickInsights } from './services/coachEngine';
import { InsightCard } from './components/InsightCard';
import type { AIMessage } from '@/src/types/database';

const QUICK_QUESTIONS = [
  { label: 'How am I doing?', icon: 'bar-chart' },
  { label: 'Spending by category', icon: 'list' },
  { label: 'Compare to last month', icon: 'exchange' },
  { label: 'How much did I save this month?', icon: 'bank' },
  { label: 'How much did I earn this month?', icon: 'money' },
  { label: 'Where can I save?', icon: 'scissors' },
  { label: 'Should I invest?', icon: 'line-chart' },
  { label: '50/30/20 rule', icon: 'pie-chart' },
  { label: 'Tax tips', icon: 'file-text-o' },
  { label: 'Emergency fund', icon: 'shield' },
];

export function AICoach() {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const {
    messages,
    activeConversation,
    addMessage,
    addConversation,
    setActiveConversation,
    setMessages,
  } = useAICoachStore();

  const { transactions } = useTransactionStore();
  const ctx = useMemo(() => buildFinancialContext(), [transactions.length]);
  const insights = useMemo(() => getQuickInsights(ctx), [ctx]);

  // Start a new conversation if none active
  useEffect(() => {
    if (!activeConversation) {
      const newConversation = {
        id: Date.now().toString(),
        user_id: '',
        title: 'Financial Coaching',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addConversation(newConversation);
      setActiveConversation(newConversation);
      setMessages([]);
    }
  }, [activeConversation, addConversation, setActiveConversation, setMessages]);

  const handleSend = (text?: string) => {
    const query = (text ?? inputText).trim();
    if (!query) return;

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      conversation_id: activeConversation?.id ?? '',
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Generate and add assistant response
    const response = generateResponse(query, ctx);
    const assistantMessage: AIMessage = {
      id: `assistant-${Date.now()}`,
      conversation_id: activeConversation?.id ?? '',
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString(),
    };

    setTimeout(() => {
      addMessage(assistantMessage);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);

    setInputText('');
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleNewChat = () => {
    const newConversation = {
      id: Date.now().toString(),
      user_id: '',
      title: 'Financial Coaching',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addConversation(newConversation);
    setActiveConversation(newConversation);
    setMessages([]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-50"
      keyboardVerticalOffset={90}
    >
      {/* Header actions */}
      <View className="flex-row items-center justify-between bg-white px-4 py-2 border-b border-surface-100">
        <View className="flex-row items-center">
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-primary-100">
            <FontAwesome name="graduation-cap" size={14} color="#2563eb" />
          </View>
          <Text className="text-sm font-medium text-surface-700">
            PH Financial Coach
          </Text>
        </View>
        <Pressable onPress={handleNewChat} className="p-2">
          <FontAwesome name="plus-square-o" size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {/* Show insights and welcome when no messages */}
        {messages.length === 0 && (
          <>
            {/* Welcome */}
            <View className="mb-4 items-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <FontAwesome name="graduation-cap" size={28} color="#2563eb" />
              </View>
              <Text className="text-lg font-bold text-surface-900">
                BudgetBox Coach
              </Text>
              <Text className="mt-1 text-center text-sm text-surface-500">
                Your personal PH financial advisor. Ask me anything about
                budgeting, saving, investing, and more.
              </Text>
            </View>

            {/* Insight cards */}
            {insights.length > 0 && (
              <>
                <Text className="mb-2 text-xs font-semibold text-surface-400">
                  YOUR INSIGHTS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  {insights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onPress={() => handleSend(insight.title)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Quick questions */}
            <Text className="mb-2 text-xs font-semibold text-surface-400">
              ASK ME ABOUT
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() => handleSend(q.label)}
                  className="flex-row items-center rounded-full bg-white border border-surface-200 px-3 py-2"
                >
                  <FontAwesome
                    name={q.icon as any}
                    size={12}
                    color="#2563eb"
                  />
                  <Text className="ml-2 text-xs font-medium text-surface-700">
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ScrollView>

      {/* Input area */}
      <View className="border-t border-surface-200 bg-white px-4 py-3">
        <View className="flex-row items-end gap-2">
          <View className="flex-1 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your finances..."
              multiline
              maxLength={500}
              className="max-h-24 text-sm text-surface-900"
              placeholderTextColor="#94a3b8"
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
          </View>
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              inputText.trim() ? 'bg-primary-600' : 'bg-surface-200'
            }`}
          >
            <FontAwesome
              name="send"
              size={14}
              color={inputText.trim() ? '#ffffff' : '#94a3b8'}
            />
          </Pressable>
        </View>

        {/* Quick action chips when in conversation */}
        {messages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <View className="flex-row gap-2">
              {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() => handleSend(q.label)}
                  className="rounded-full bg-surface-100 px-3 py-1.5"
                >
                  <Text className="text-xs text-surface-600">{q.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
    >
      {!isUser && (
        <View className="mb-1 flex-row items-center">
          <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary-100">
            <FontAwesome name="graduation-cap" size={10} color="#2563eb" />
          </View>
          <Text className="text-xs text-surface-400">Coach</Text>
        </View>
      )}
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-br-sm bg-primary-600'
            : 'rounded-bl-sm bg-white border border-surface-100'
        }`}
      >
        <Text
          className={`text-sm leading-5 ${
            isUser ? 'text-white' : 'text-surface-800'
          }`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}
