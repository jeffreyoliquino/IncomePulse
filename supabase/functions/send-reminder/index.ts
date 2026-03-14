// Supabase Edge Function: send-reminder
// Triggered daily via pg_cron to check for upcoming bill reminders
// and send Expo Push Notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  amount: number | null;
  due_date: string;
  remind_days_before: number;
}

interface Profile {
  id: string;
  expo_push_token: string | null;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get reminders that are due within their remind_days_before window
    const today = new Date();
    const { data: reminders, error: remError } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_paid', false)
      .eq('notification_sent', false)
      .gte('due_date', today.toISOString().split('T')[0]);

    if (remError) throw remError;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending reminders' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const notifications: Array<{ to: string; title: string; body: string }> = [];

    for (const reminder of reminders as Reminder[]) {
      const dueDate = new Date(reminder.due_date);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue > reminder.remind_days_before) continue;

      // Get user's push token
      const { data: profile } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', reminder.user_id)
        .single();

      const pushToken = (profile as any)?.expo_push_token;
      if (!pushToken) continue;

      const amountStr = reminder.amount
        ? ` - ₱${reminder.amount.toLocaleString()}`
        : '';
      const dueStr =
        daysUntilDue === 0
          ? 'today'
          : daysUntilDue === 1
          ? 'tomorrow'
          : `in ${daysUntilDue} days`;

      notifications.push({
        to: pushToken,
        title: `Bill Reminder: ${reminder.title}`,
        body: `Due ${dueStr}${amountStr}`,
      });

      // Mark notification as sent
      await supabase
        .from('reminders')
        .update({ notification_sent: true })
        .eq('id', reminder.id);
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
        message: `Sent ${notifications.length} reminder notifications`,
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
