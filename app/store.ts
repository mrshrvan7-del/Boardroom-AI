import { create } from 'zustand';

export interface KPI {
  name: string;
  value: string;
  raw_value: number;
  column: string;
  format: string;
  trend: 'up' | 'down' | 'flat';
  icon: string;
  color: string;
  insight: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  filtered_data?: any[];
  chart_config?: any;
}

interface AppState {
  // Session details
  sessionId: string | null;
  filename: string | null;
  fileSize: string | null;
  rowsCount: number;
  colsCount: number;
  columnNames: string[];
  dtypes: Record<string, string>;
  previewRows: any[];

  // Dataset classification & KPIs
  datasetType: string | null;
  confidence: number;
  domainContext: string | null;
  detectedEntities: string[];
  timeSeries: boolean;
  geographic: boolean;
  primaryMetric: string | null;
  kpis: KPI[];

  // Data processing reports
  cleaningReport: any | null;
  profile: any | null;

  // Analysis and Insights
  analysis: any | null;
  insights: any | null;

  // UI state
  isDarkMode: boolean;
  isMeetingMode: boolean;
  chatHistory: Message[];

  // Actions
  setSessionInfo: (info: {
    session_id: string;
    filename: string;
    file_size: string;
    rows: number;
    columns: number;
    column_names: string[];
    dtypes: Record<string, string>;
    preview_rows: any[];
  }) => void;
  
  setProcessingInfo: (data: {
    cleaning_report: any;
    profile: any;
  }) => void;
  
  setUnderstandingInfo: (data: {
    dataset_type: string;
    confidence: number;
    domain_context: string;
    kpis: KPI[];
    primary_metric: string;
    time_series: boolean;
    geographic: boolean;
  }) => void;
  
  setAnalysisInfo: (analysis: any) => void;
  setInsightsInfo: (insights: any) => void;
  
  addChatMessage: (msg: Message) => void;
  clearChatHistory: () => void;
  
  toggleDarkMode: () => void;
  toggleMeetingMode: (val?: boolean) => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sessionId: null,
  filename: null,
  fileSize: null,
  rowsCount: 0,
  colsCount: 0,
  columnNames: [],
  dtypes: {},
  previewRows: [],

  datasetType: null,
  confidence: 0,
  domainContext: null,
  detectedEntities: [],
  timeSeries: false,
  geographic: false,
  primaryMetric: null,
  kpis: [],

  cleaningReport: null,
  profile: null,
  analysis: null,
  insights: null,

  isDarkMode: false,
  isMeetingMode: false,
  chatHistory: [],

  setSessionInfo: (info) => set({
    sessionId: info.session_id,
    filename: info.filename,
    fileSize: info.file_size,
    rowsCount: info.rows,
    colsCount: info.columns,
    columnNames: info.column_names,
    dtypes: info.dtypes,
    previewRows: info.preview_rows
  }),

  setProcessingInfo: (data) => set({
    cleaningReport: data.cleaning_report,
    profile: data.profile
  }),

  setUnderstandingInfo: (data) => set({
    datasetType: data.dataset_type,
    confidence: data.confidence,
    domainContext: data.domain_context,
    kpis: data.kpis,
    primaryMetric: data.primary_metric,
    timeSeries: data.time_series,
    geographic: data.geographic
  }),

  setAnalysisInfo: (analysis) => set({ analysis }),
  setInsightsInfo: (insights) => set({ insights }),

  addChatMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, msg]
  })),

  clearChatHistory: () => set({ chatHistory: [] }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  toggleMeetingMode: (val) => set((state) => ({
    isMeetingMode: val !== undefined ? val : !state.isMeetingMode
  })),

  resetStore: () => set({
    sessionId: null,
    filename: null,
    fileSize: null,
    rowsCount: 0,
    colsCount: 0,
    columnNames: [],
    dtypes: {},
    previewRows: [],
    datasetType: null,
    confidence: 0,
    domainContext: null,
    detectedEntities: [],
    timeSeries: false,
    geographic: false,
    primaryMetric: null,
    kpis: [],
    cleaningReport: null,
    profile: null,
    analysis: null,
    insights: null,
    isMeetingMode: false,
    chatHistory: []
  })
}));
