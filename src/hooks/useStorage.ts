import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StorageAdapterName, SyncQueueItem, Conflict } from '@shared/types';
interface StorageState {
  adapterName: StorageAdapterName;
  syncQueue: SyncQueueItem[];
  conflicts: Conflict[];
  lastSync: number | null;
  isSyncing: boolean;
  autoSync: boolean;
}
interface StorageActions {
  setAdapterName: (name: StorageAdapterName) => void;
  queueSyncItem: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status'>) => void;
  processQueue: () => Promise<void>; // Placeholder for actual sync logic
  setConflicts: (conflicts: Conflict[]) => void;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => void;
  toggleAutoSync: () => void;
  setSyncing: (isSyncing: boolean) => void;
}
export const useStorageStore = create<StorageState & StorageActions>()(
  persist(
    (set, get) => ({
      adapterName: 'do', // Default to Durable Objects
      syncQueue: [],
      conflicts: [],
      lastSync: null,
      isSyncing: false,
      autoSync: true,
      setAdapterName: (name) => set({ adapterName: name }),
      queueSyncItem: (item) => {
        const newItem: SyncQueueItem = {
          ...item,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'pending',
        };
        set((state) => ({ syncQueue: [...state.syncQueue, newItem] }));
      },
      processQueue: async () => {
        // This is a mock process for the demo
        set({ isSyncing: true });
        console.log('Processing sync queue...', get().syncQueue);
        // In a real app, this would call the adapter's sync method
        await new Promise(resolve => setTimeout(resolve, 1500));
        set({
          syncQueue: [], // Clear queue on successful sync
          lastSync: Date.now(),
          isSyncing: false,
        });
      },
      setConflicts: (conflicts) => set({ conflicts }),
      resolveConflict: (conflictId, resolution) => {
        console.log(`Resolving conflict ${conflictId} with ${resolution}`);
        // In a real app, this would update local/remote state
        set((state) => ({
          conflicts: state.conflicts.filter(c => c.queueItemId !== conflictId),
        }));
      },
      toggleAutoSync: () => set((state) => ({ autoSync: !state.autoSync })),
      setSyncing: (isSyncing) => set({ isSyncing }),
    }),
    {
      name: 'arbor-storage-config',
      storage: createJSONStorage(() => localStorage),
    }
  )
);