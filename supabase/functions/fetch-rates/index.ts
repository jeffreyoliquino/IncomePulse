// Supabase Edge Function: fetch-rates
// Triggered daily via pg_cron to cache exchange rates for offline use

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch latest rates from free API
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/php.json'
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const phpRates = data.php;

    const pairs = [
      { base: 'USD', target: 'PHP', rate: 1 / phpRates.usd },
      { base: 'PHP', target: 'USD', rate: phpRates.usd },
      { base: 'AUD', target: 'PHP', rate: 1 / phpRates.aud },
      { base: 'PHP', target: 'AUD', rate: phpRates.aud },
    ];

    for (const pair of pairs) {
      const { error } = await supabase.from('exchange_rates').upsert(
        {
          base_currency: pair.base,
          target_currency: pair.target,
          rate: pair.rate,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'base_currency,target_currency' }
      );

      if (error) {
        console.error(`Failed to upsert ${pair.base}/${pair.target}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Exchange rates updated',
        rates: pairs.map((p) => `${p.base}/${p.target}: ${p.rate.toFixed(4)}`),
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
