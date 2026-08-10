import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listDbTables, getTableRows, executeQuery, type QueryResult } from '../api';
import type { NavigationProp } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');

// interface Props {
//   navigation: NativeStackScreenProps<'Database'>;
// }
type Props = NativeStackScreenProps<RootStackParamList, 'Database'>;

type Tab = 'browser' | 'query';

type RootStackParamList = {
  Database: { slug: string; name: string } | undefined;
  // ... other screens can be listed here if needed
};

export default function DatabaseScreen({ navigation, route }: Props) {

  const slug = route.params?.slug ?? 'test';
  const name = route.params?.name ?? 'Database Test';

  // ── Navigation header button ────────────────────────────────────────────
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: '#0D0F14' },
      headerTintColor: '#A78BFA',
      headerTitleStyle: { fontWeight: '700', color: '#E9D5FF' },
      title: name || '⬡ H2 Database',
    });
  }, [navigation, name]);

  // ── State ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('browser');

  // Browser tab
  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableResult, setTableResult] = useState<QueryResult | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Query tab
  const [sql, setSql] = useState('SELECT * FROM USERS LIMIT 10');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryTime, setQueryTime] = useState<number | null>(null);

  // ── Load tables on screen focus ─────────────────────────────────────────
  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    setTablesError(null);
    try {
      const data = await listDbTables();
      setTables(data);
    } catch (err: unknown) {
      setTablesError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTables(); }, [loadTables]));

  // ── Browse a table ───────────────────────────────────────────────────────
  async function handleSelectTable(name: string) {
    setSelectedTable(name);
    setTableLoading(true);
    setTableError(null);
    setTableResult(null);
    try {
      const res = await getTableRows(name);
      setTableResult(res);
    } catch (err: unknown) {
      setTableError(err instanceof Error ? err.message : 'Failed to load table');
    } finally {
      setTableLoading(false);
    }
  }

  // ── Execute SQL ──────────────────────────────────────────────────────────
  async function handleRunQuery() {
    if (!sql.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setQueryTime(null);
    const start = Date.now();
    try {
      const res = await executeQuery(sql);
      setQueryResult(res);
      setQueryTime(Date.now() - start);
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'browser' && styles.tabBtnActive]}
          onPress={() => setTab('browser')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'browser' && styles.tabBtnTextActive]}>
            🗄 Browser
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'query' && styles.tabBtnActive]}
          onPress={() => setTab('query')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'query' && styles.tabBtnTextActive]}>
            ⚡ SQL Query
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'browser' ? (
        <BrowserTab
          tables={tables}
          tablesLoading={tablesLoading}
          tablesError={tablesError}
          onReloadTables={loadTables}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          tableResult={tableResult}
          tableLoading={tableLoading}
          tableError={tableError}
        />
      ) : (
        <QueryTab
          sql={sql}
          onChangeSql={setSql}
          onRun={handleRunQuery}
          loading={queryLoading}
          result={queryResult}
          error={queryError}
          queryTime={queryTime}
        />
      )}
    </View>
  );
}

// ─── Browser Tab ─────────────────────────────────────────────────────────────

interface BrowserProps {
  tables: string[];
  tablesLoading: boolean;
  tablesError: string | null;
  onReloadTables: () => void;
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
  tableResult: QueryResult | null;
  tableLoading: boolean;
  tableError: string | null;
}

function BrowserTab({
  tables, tablesLoading, tablesError, onReloadTables,
  selectedTable, onSelectTable, tableResult, tableLoading, tableError,
}: BrowserProps) {
  return (
    <View style={styles.browserRoot}>
      {/* Left sidebar — table list */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Tables</Text>
          <TouchableOpacity onPress={onReloadTables} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.refreshIcon}>↺</Text>
          </TouchableOpacity>
        </View>

        {tablesLoading ? (
          <ActivityIndicator color="#7C3AED" size="small" style={{ marginTop: 20 }} />
        ) : tablesError ? (
          <View style={styles.sidebarError}>
            <Text style={styles.errorSmall}>{tablesError}</Text>
            <TouchableOpacity onPress={onReloadTables}>
              <Text style={styles.retrySmall}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tables}
            keyExtractor={(t) => t}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tableItem, selectedTable === item && styles.tableItemActive]}
                onPress={() => onSelectTable(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tableItemText, selectedTable === item && styles.tableItemTextActive]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
                {selectedTable === item && (
                  <View style={styles.tableItemDot} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptySmall}>No tables found</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Right panel — table data grid */}
      <View style={styles.gridPanel}>
        {!selectedTable ? (
          <View style={styles.noSelection}>
            <Text style={styles.noSelectionIcon}>◫</Text>
            <Text style={styles.noSelectionText}>Select a table</Text>
            <Text style={styles.noSelectionSub}>Choose a table from the left to browse its rows</Text>
          </View>
        ) : tableLoading ? (
          <View style={styles.gridCenter}>
            <ActivityIndicator color="#7C3AED" size="large" />
            <Text style={styles.loadingText}>Loading {selectedTable}…</Text>
          </View>
        ) : tableError ? (
          <View style={styles.gridCenter}>
            <Text style={styles.errorText}>⚠ {tableError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => onSelectTable(selectedTable)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tableResult ? (
          <ResultGrid result={tableResult} tableName={selectedTable} />
        ) : null}
      </View>
    </View>
  );
}

// ─── Query Tab ────────────────────────────────────────────────────────────────

interface QueryProps {
  sql: string;
  onChangeSql: (s: string) => void;
  onRun: () => void;
  loading: boolean;
  result: QueryResult | null;
  error: string | null;
  queryTime: number | null;
}

function QueryTab({ sql, onChangeSql, onRun, loading, result, error, queryTime }: QueryProps) {
  return (
    <View style={styles.queryRoot}>
      {/* SQL editor */}
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorLabel}>SQL Editor</Text>
          <View style={styles.editorDots}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          </View>
        </View>
        <TextInput
          style={styles.sqlInput}
          value={sql}
          onChangeText={onChangeSql}
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          placeholder="SELECT * FROM users LIMIT 10"
          placeholderTextColor="#4B5563"
          scrollEnabled
        />
        <View style={styles.editorFooter}>
          {queryTime !== null && (
            <Text style={styles.queryTimeBadge}>⏱ {queryTime}ms</Text>
          )}
          <TouchableOpacity
            style={[styles.runBtn, loading && styles.runBtnDisabled]}
            onPress={onRun}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.runBtnText}>▶ Run</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerIcon}>✕</Text>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : result ? (
        <View style={styles.queryResultContainer}>
          <ResultGrid result={result} />
        </View>
      ) : (
        <View style={styles.queryHint}>
          <Text style={styles.queryHintText}>Run a query to see results here</Text>
        </View>
      )}
    </View>
  );
}

// ─── Result Grid ──────────────────────────────────────────────────────────────

const MIN_COL_W = 110;
const MAX_COL_W = 220;
const ROW_H = 36;

interface ResultGridProps {
  result: QueryResult;
  tableName?: string;
}

function ResultGrid({ result, tableName }: ResultGridProps) {
  const { columns, rows, rowCount } = result;

  if (columns.length === 0) {
    return (
      <View style={styles.gridCenter}>
        <Text style={styles.emptyGridText}>Query returned 0 columns.</Text>
      </View>
    );
  }

  // Dynamic column widths — clamp between min/max
  const colW = Math.max(MIN_COL_W, Math.min(MAX_COL_W, Math.floor((SCREEN_W * 0.62) / columns.length)));
  const totalW = colW * columns.length;

  return (
    <View style={styles.gridWrapper}>
      {/* Row count bar */}
      <View style={styles.gridMeta}>
        {tableName && <Text style={styles.gridTableName}>{tableName}</Text>}
        <View style={styles.rowCountBadge}>
          <Text style={styles.rowCountText}>{rowCount} row{rowCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Horizontally scrollable grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: totalW }}>
        <View>
          {/* Header row */}
          <View style={[styles.gridHeaderRow, { width: totalW }]}>
            {columns.map((col, i) => (
              <View key={i} style={[styles.gridHeaderCell, { width: colW }]}>
                <Text style={styles.gridHeaderText} numberOfLines={1}>{col}</Text>
              </View>
            ))}
          </View>

          {/* Data rows */}
          <ScrollView
            showsVerticalScrollIndicator
            style={styles.gridScrollY}
            nestedScrollEnabled
          >
            {rows.length === 0 ? (
              <View style={[styles.gridEmptyRow, { width: totalW }]}>
                <Text style={styles.gridEmptyText}>No rows</Text>
              </View>
            ) : (
              rows.map((row, rIdx) => (
                <View
                  key={rIdx}
                  style={[
                    styles.gridRow,
                    { width: totalW },
                    rIdx % 2 === 1 && styles.gridRowAlt,
                  ]}
                >
                  {row.map((cell, cIdx) => {
                    const isNull = cell === null || cell === undefined;
                    return (
                      <View key={cIdx} style={[styles.gridCell, { width: colW }]}>
                        <Text
                          style={[styles.gridCellText, isNull && styles.gridCellNull]}
                          numberOfLines={1}
                        >
                          {isNull ? 'NULL' : String(cell)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#0D0F14',
  surface: '#161A23',
  surface2: '#1E2332',
  border: '#252D3D',
  purple: '#7C3AED',
  purpleLight: '#A78BFA',
  purpleDim: '#312E81',
  accent: '#6EE7B7',   // neon green for positive states
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  textDim: '#4B5563',
  error: '#F87171',
  errorBg: '#1F0F0F',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  tabBtnActive: {
    backgroundColor: C.purpleDim,
  },
  tabBtnText: { color: C.textMuted, fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: C.purpleLight },

  // ── Browser tab
  browserRoot: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 130,
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingTop: 4,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sidebarTitle: { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  refreshIcon: { color: C.purple, fontSize: 18, fontWeight: '700' },
  sidebarError: { padding: 12, alignItems: 'center', gap: 6 },
  errorSmall: { color: C.error, fontSize: 11, textAlign: 'center' },
  retrySmall: { color: C.purple, fontSize: 12, fontWeight: '600' },

  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableItemActive: { backgroundColor: C.purpleDim },
  tableItemText: { color: C.textMuted, fontSize: 12, flex: 1 },
  tableItemTextActive: { color: C.purpleLight, fontWeight: '700' },
  tableItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.purpleLight,
    marginLeft: 4,
  },
  emptySmall: { color: C.textDim, fontSize: 12, padding: 12 },

  // Grid panel
  gridPanel: { flex: 1 },
  noSelection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  noSelectionIcon: { fontSize: 40, color: C.textDim },
  noSelectionText: { color: C.text, fontSize: 16, fontWeight: '700' },
  noSelectionSub: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  gridCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: C.textMuted, fontSize: 13 },
  errorText: { color: C.error, fontSize: 13, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.purple,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Query tab
  queryRoot: { flex: 1, padding: 14, gap: 12 },

  editorCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.surface2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  editorLabel: { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  editorDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sqlInput: {
    color: C.accent,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    minHeight: 130,
    maxHeight: 220,
    padding: 14,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  editorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  queryTimeBadge: {
    color: C.textMuted,
    fontSize: 12,
    backgroundColor: C.surface2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  runBtn: {
    backgroundColor: C.purple,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    padding: 12,
    gap: 8,
  },
  errorBannerIcon: { color: C.error, fontWeight: '700', fontSize: 14, marginTop: 1 },
  errorBannerText: { color: C.error, fontSize: 13, flex: 1, lineHeight: 20 },

  queryHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryHintText: { color: C.textDim, fontSize: 14 },

  queryResultContainer: { flex: 1 },

  // ── Result grid
  gridWrapper: { flex: 1, backgroundColor: C.surface, borderRadius: 10, overflow: 'hidden', margin: 4 },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface2,
  },
  gridTableName: { color: C.purpleLight, fontWeight: '700', fontSize: 13 },
  rowCountBadge: {
    backgroundColor: C.purpleDim,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  rowCountText: { color: C.purpleLight, fontSize: 11, fontWeight: '700' },

  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.surface2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  gridHeaderCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'center',
  },
  gridHeaderText: {
    color: C.purpleLight,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  gridScrollY: { maxHeight: 400 },

  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    height: ROW_H,
  },
  gridRowAlt: { backgroundColor: '#12151E' },
  gridEmptyRow: { padding: 20, alignItems: 'center' },
  gridEmptyText: { color: C.textMuted, fontSize: 13 },

  gridCell: {
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'center',
    height: ROW_H,
  },
  gridCellText: { color: C.text, fontSize: 12 },
  gridCellNull: { color: C.textDim, fontStyle: 'italic' },
  emptyGridText: { color: C.textMuted, fontSize: 13 },
});
