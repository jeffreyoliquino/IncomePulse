// Supabase Edge Function: budget-alert
// Triggered daily via pg_cron to check if any budgets have exceeded their threshold
// and send Expo Push Notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active budgets
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('is_active', true);

    if (budgetError) throw budgetError;
    if (!budgets || budgets.length === 0) {
      return new Response(JSON.stringify({ message: 'No active budgets' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    const notifications: Array<{ to: string; title: string; body: string }> = [];
    const checkedUsers = new Set<string>();

    for (const budget of budgets) {
      // Get expenses for this budget's period
      let query = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', budget.user_id)
        .eq('type', 'expense')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (budget.category_id) {
        query = query.eq('category_id', budget.category_id);
      }

      const { data: transactions } = await query;
      const totalSpent = (transactions ?? []).reduce(
        (sum: number, t: { amount: number }) => sum + t.amount,
        0
      );

      const percentage = budget.amount > 0 ? totalSpent / budget.amount : 0;

      if (percentage >= budget.alert_threshold) {
        // Get user's push token (only fetch once per user)
        if (!checkedUsers.has(budget.user_id)) {
          checkedUsers.add(budget.user_id);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('id', budget.user_id)
          .single();

        const pushToken = (profile as any)?.expo_push_token;
        if (!pushToken) continue;

        const percentStr = Math.round(percentage * 100);
        const isOver = percentage >= 1;

        notifications.push({
          to: pushToken,
          title: isOver ? 'Budget Exceeded!' : 'Budget Warning',
          body: isOver
            ? `You've exceeded your "${budget.name}" budget (${percentStr}%). ₱${totalSpent.toLocaleString()} of ₱${budget.amount.toLocaleString()}`
            : `Your "${budget.name}" budget is at ${percentStr}%. ₱${totalSpent.toLocaleString()} of ₱${budget.amount.toLocaleString()}`,
        });
      }
    }

    // Send via Expo Push API
    if (notifications.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(notifications),
      });
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${notifications.length} budget alert notifications`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
