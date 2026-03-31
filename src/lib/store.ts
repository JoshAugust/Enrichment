import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomColumn {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'url' | 'email' | 'phone' | 'dropdown';
  options?: string[];
  aiEnrichable: boolean;
  width: number;
  created_at: string;
}

const DEFAULT_ANTHROPIC_KEY = // Set in Settings page
  '';

interface SettingsState {
  // DealFlow
  dealflowUrl: string;
  apiKey: string;
  lastSyncTime?: string;
  lastSyncCount?: number;
  // Display
  columnWidths: Record<string, number>;
  columnOrder: string[];
  visibleColumns: string[];
  // AI integrations
  anthropicKey: string;
  apolloApiKey: string;
  insightEngineUrl: string;
  // Custom columns
  customColumns: CustomColumn[];
  // Setters
  setDealflowUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setLastSync: (time: string, count: number) => void;
  setColumnWidths: (widths: Record<string, number>) => void;
  setVisibleColumns: (cols: string[]) => void;
  setColumnOrder: (order: string[]) => void;
  updateColumnWidth: (col: string, width: number) => void;
  setOpenaiKey: (key: string) => void;
  setApolloApiKey: (key: string) => void;
  setInsightEngineUrl: (url: string) => void;
  setCustomColumns: (cols: CustomColumn[]) => void;
  addCustomColumn: (col: CustomColumn) => void;
  deleteCustomColumn: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dealflowUrl: 'https://dealflowa9.netlify.app',
      apiKey: '',
      lastSyncTime: undefined,
      lastSyncCount: undefined,
      columnWidths: {},
      columnOrder: [],
      visibleColumns: [],
      anthropicKey: DEFAULT_ANTHROPIC_KEY,
      apolloApiKey: 'REPLACE_WITH_APOLLO_KEY',
      insightEngineUrl: 'https://insighta9.netlify.app',
      setDealflowUrl: (url) => set({ dealflowUrl: url }),
      setApiKey: (key) => set({ apiKey: key }),
      setLastSync: (time, count) => set({ lastSyncTime: time, lastSyncCount: count }),
      setColumnWidths: (widths) => set({ columnWidths: widths }),
      setVisibleColumns: (cols) => set({ visibleColumns: cols }),
      setColumnOrder: (order) => set({ columnOrder: order }),
      updateColumnWidth: (col, width) =>
        set((state) => ({
          columnWidths: { ...state.columnWidths, [col]: width },
        })),
      customColumns: [],
      setOpenaiKey: (key) => set({ anthropicKey: key }),
      setApolloApiKey: (key) => set({ apolloApiKey: key }),
      setInsightEngineUrl: (url) => set({ insightEngineUrl: url }),
      setCustomColumns: (cols) => set({ customColumns: cols }),
      addCustomColumn: (col) => set((state) => ({ customColumns: [...state.customColumns, col] })),
      deleteCustomColumn: (id) =>
        set((state) => ({ customColumns: state.customColumns.filter(c => c.id !== id) })),
    }),
    { name: 'corgi-settings-v3' }
  )
);
