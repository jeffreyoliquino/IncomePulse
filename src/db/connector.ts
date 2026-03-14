import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';
import { supabase } from '../lib/supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '';

    return {
      endpoint: powersyncUrl,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        await this.applyOperation(op);
      }
      await transaction.complete();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  private async applyOperation(op: CrudEntry): Promise<void> {
    const table = op.table;
    const id = op.id;
    const data = op.opData;

    switch (op.op) {
      case UpdateType.PUT: {
        const { error } = await supabase
          .from(table)
          .upsert({ ...data, id });
        if (error) throw error;
        break;
      }
      case UpdateType.PATCH: {
        const { error } = await supabase
          .from(table)
          .update(data!)
          .eq('id', id);
        if (error) throw error;
        break;
      }
      case UpdateType.DELETE: {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        break;
      }
    }
  }
}
