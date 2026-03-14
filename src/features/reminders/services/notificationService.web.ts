export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function scheduleLocalReminder(
  _title: string,
  _body: string,
  _triggerDate: Date,
  _data?: Record<string, unknown>
): Promise<string> {
  return '';
}

export async function scheduleBudgetAlert(
  _budgetName: string,
  _percentage: number
): Promise<string> {
  return '';
}

export async function cancelNotification(_id: string): Promise<void> {}

export async function cancelAllNotifications(): Promise<void> {}
