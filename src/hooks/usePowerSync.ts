import { useEffect, useState } from 'react';
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from '../db/schema';
import { SupabaseConnector } from '../db/connector';
import { supabase } from '../lib/supabase';

let powerSyncDb: PowerSyncDatabase | null = null;

export function usePowerSyncInstance() {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);

  useEffect(() => {
    async function init() {
      if (powerSyncDb) {
        setDb(powerSyncDb);
        setIsReady(true);
        return;
      }

      const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL;
      if (!powersyncUrl) {
        console.warn('PowerSync URL not configured, running in local-only mode');
        const database = new PowerSyncDatabase({
          schema: AppSchema,
          database: { dbFilename: 'incomepulse.db' },
        });
        await database.init();
        powerSyncDb = database;
        setDb(database);
        setIsReady(true);
        return;
      }

      const database = new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: 'incomepulse.db' },
      });

      await database.init();

      const connector = new SupabaseConnector();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await database.connect(connector);
      }

      supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN') {
          await database.connect(connector);
        } else if (event === 'SIGNED_OUT') {
          await database.disconnectAndClear();
        }
      });

      powerSyncDb = database;
      setDb(database);
      setIsReady(true);
    }

    init().catch(console.error);
  }, []);

  return { db, isReady };
}

export function getPowerSyncDb(): PowerSyncDatabase | null {
  return powerSyncDb;
}
