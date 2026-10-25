"use client";

import { useCallback, useState } from "react";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";

export function useAdminAction() {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (action: () => Promise<unknown>, ok?: string) => {
      setBusy(true);
      try {
        await action();
        if (ok) showToast(ok);
        return true;
      } catch {
        showToast(t.admin.common.actionFailed);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t],
  );
  return { busy, run };
}
