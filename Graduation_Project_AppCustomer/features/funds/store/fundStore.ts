import { useSyncExternalStore } from 'react';
import { Fund } from '../types';
import { fundService } from '../../../shared/api/services/fundService';

let funds: Fund[] = [];
let loading = false;
let error: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const upsertFund = (fund: Fund) => {
  const idx = funds.findIndex((f) => f.id === fund.id);
  if (idx >= 0) {
    const next = [...funds];
    next[idx] = { ...next[idx], ...fund };
    funds = next;
  } else {
    funds = [fund, ...funds];
  }
};

const getErrorMessage = (err: any, fallback: string) =>
  err?.message || err?.data?.message || fallback;

export const fundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot() {
    return funds;
  },

  getLoading() {
    return loading;
  },

  getError() {
    return error;
  },

  getFund(id: number) {
    return funds.find((f) => f.id === id);
  },

  async refreshFunds() {
    loading = true;
    error = null;
    emit();
    try {
      const list = await fundService.listMyFunds();
      // Giữ lại chi tiết (members/transactions) đã tải nếu còn trong list
      funds = list.map((summary) => {
        const prev = funds.find((f) => f.id === summary.id);
        if (prev && (prev.members.length > 0 || prev.transactions.length > 0)) {
          return {
            ...summary,
            members: prev.members,
            transactions: prev.transactions,
          };
        }
        return summary;
      });
    } catch (err: any) {
      error = getErrorMessage(err, 'Không tải được danh sách quỹ');
      funds = [];
      throw err;
    } finally {
      loading = false;
      emit();
    }
  },

  async refreshFund(id: number) {
    loading = true;
    error = null;
    emit();
    try {
      const detail = await fundService.getFundDetail(id);
      upsertFund(detail);
      return detail;
    } catch (err: any) {
      error = getErrorMessage(err, 'Không tải được chi tiết quỹ');
      throw err;
    } finally {
      loading = false;
      emit();
    }
  },

  async addFund(input: { name: string; targetAmount: number; coverColorSeed: number }): Promise<Fund> {
    const created = await fundService.createFund(input);
    upsertFund(created);
    emit();
    return created;
  },

  async deposit(id: number, amount: number, pinCode: string, note?: string) {
    const updated = await fundService.deposit(id, { amount, pinCode, note });
    upsertFund(updated);
    emit();
    return updated;
  },

  async withdraw(id: number, amount: number, pinCode: string, note?: string) {
    const updated = await fundService.withdraw(id, { amount, pinCode, note });
    upsertFund(updated);
    emit();
    return updated;
  },

  async deleteFund(id: number): Promise<{ ok: true } | { ok: false; reason: string; message: string }> {
    try {
      await fundService.deleteFund(id);
      funds = funds.filter((f) => f.id !== id);
      emit();
      return { ok: true };
    } catch (err: any) {
      const message = getErrorMessage(err, 'Không thể xóa quỹ');
      const code = err?.code || '';
      if (code === 'FUND_8006' || message.includes('rút hết')) {
        return { ok: false, reason: 'HAS_BALANCE', message };
      }
      if (code === 'FUND_8005') {
        return { ok: false, reason: 'NOT_OWNER', message };
      }
      return { ok: false, reason: 'ERROR', message };
    }
  },

  async updateTransactionNote(fundId: number, txId: number, note: string) {
    const updatedTx = await fundService.updateTransactionNote(fundId, txId, note);
    funds = funds.map((f) => {
      if (f.id !== fundId) return f;
      return {
        ...f,
        transactions: f.transactions.map((t) =>
          t.id === txId ? { ...t, note: updatedTx.note } : t
        ),
      };
    });
    emit();
  },

  async inviteMember(fundId: number, userId: number) {
    const updated = await fundService.inviteMember(fundId, userId);
    upsertFund(updated);
    emit();
    return updated;
  },

  async leaveFund(id: number): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      await fundService.leaveFund(id);
      funds = funds.filter((f) => f.id !== id);
      emit();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: getErrorMessage(err, 'Không thể rời quỹ') };
    }
  },
};

export function useFunds(): Fund[] {
  return useSyncExternalStore(fundStore.subscribe, fundStore.getSnapshot, fundStore.getSnapshot);
}

export function useFund(id: number): Fund | undefined {
  const all = useFunds();
  return all.find((f) => f.id === id);
}
