import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  Eye,
  LineChart,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { supabase, isSupabaseReady } from './supabase';
import './styles.css';

const partners = ['인웅', '운정'];
const ownerAliases = {
  나: '인웅',
  여자친구: '운정',
};

const defaultCategories = [
  '청년도약계좌',
  '주택청약',
  'ISA',
  'NH CMA',
  '미래에셋 CMA',
  '전세보증금',
  '코인',
  '연금저축펀드',
  '현금자산',
];

const storageKey = 'couple-asset-snapshots';
const hundredMillion = 100000000;
const tenThousand = 10000;

const aprilRows = [
  { owner: '인웅', category: '청년도약계좌', amount: 0.077 * hundredMillion },
  { owner: '인웅', category: '주택청약', amount: 0.175 * hundredMillion },
  { owner: '인웅', category: 'ISA', amount: 0.894 * hundredMillion },
  { owner: '인웅', category: 'NH CMA', amount: 0.405 * hundredMillion },
  { owner: '인웅', category: '미래에셋 CMA', amount: 0.1 * hundredMillion },
  { owner: '인웅', category: '전세보증금', amount: 0.98 * hundredMillion },
  { owner: '인웅', category: '코인(이더리움)', amount: 0.123 * hundredMillion },
  { owner: '인웅', category: '연금저축펀드', amount: 0.055 * hundredMillion },
  { owner: '인웅', category: '아빠 증여', amount: 0.5 * hundredMillion },
  { owner: '운정', category: '주택청약', amount: 1080 * tenThousand },
  { owner: '운정', category: '청년도약계좌', amount: 880 * tenThousand },
  { owner: '운정', category: '국장 CMA', amount: 400 * tenThousand },
  { owner: '운정', category: 'ISA', amount: 200 * tenThousand },
];

const mayRows = [
  { owner: '인웅', category: '청년도약계좌', amount: 0.084 * hundredMillion },
  { owner: '인웅', category: '주택청약', amount: 0.178 * hundredMillion },
  { owner: '인웅', category: 'ISA', amount: 1.13 * hundredMillion },
  { owner: '인웅', category: 'NH CMA', amount: 0.469 * hundredMillion },
  { owner: '인웅', category: '미래에셋 CMA', amount: 0.1 * hundredMillion },
  { owner: '인웅', category: '전세보증금', amount: 0.98 * hundredMillion },
  { owner: '인웅', category: '코인(이더리움)', amount: 0.127 * hundredMillion },
  { owner: '인웅', category: '연금저축펀드', amount: 0.059 * hundredMillion },
  { owner: '인웅', category: '아빠 증여', amount: 0.5 * hundredMillion },
  { owner: '운정', category: '주택청약', amount: 1080 * tenThousand },
  { owner: '운정', category: '청년도약계좌', amount: 950 * tenThousand },
  { owner: '운정', category: '국장 CMA', amount: 513 * tenThousand },
  { owner: '운정', category: 'ISA', amount: 218 * tenThousand },
];

const initialRows = partners.flatMap((owner) =>
  defaultCategories.map((category) => ({
    id: crypto.randomUUID(),
    owner,
    category,
    amount: '',
    memo: '',
  })),
);

const sampleSnapshots = [
  {
    month: '2026-03',
    rows: [
      { owner: '인웅', category: '청년도약계좌', amount: 7000000 },
      { owner: '인웅', category: '주택청약', amount: 17000000 },
      { owner: '인웅', category: 'ISA', amount: 85000000 },
      { owner: '인웅', category: 'NH CMA', amount: 33000000 },
      { owner: '인웅', category: '미래에셋 CMA', amount: 8000000 },
      { owner: '인웅', category: '전세보증금', amount: 98000000 },
      { owner: '인웅', category: '코인(이더리움)', amount: 10000000 },
      { owner: '인웅', category: '연금저축펀드', amount: 5000000 },
      { owner: '운정', category: '주택청약', amount: 10600000 },
      { owner: '운정', category: '청년도약계좌', amount: 8300000 },
      { owner: '운정', category: '국장 CMA', amount: 3600000 },
      { owner: '운정', category: 'ISA', amount: 1800000 },
    ],
  },
  { month: '2026-04', rows: aprilRows },
  { month: '2026-05', rows: mayRows },
];

function formatWon(value) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatAxisAmount(value) {
  if (value >= 100000000) {
    const amount = value / 100000000;
    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString('ko-KR')}만`;
  }
  return Math.round(value).toLocaleString('ko-KR');
}

function normalizeAmount(value) {
  const numeric = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatAmountInput(value) {
  const rawValue = String(value ?? '').replaceAll(',', '').trim();
  if (!rawValue) return '';
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return String(value ?? '');
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(numeric);
}

function normalizeOwner(owner) {
  return ownerAliases[owner] || owner;
}

function normalizeRows(rows) {
  return rows.map((row) => ({ ...row, owner: normalizeOwner(row.owner) }));
}

function rowsWithIds(rows) {
  return normalizeRows(rows).map((row) => ({
    id: crypto.randomUUID(),
    owner: row.owner,
    category: row.category,
    amount: row.amount,
    memo: row.memo || '',
  }));
}

function snapshotTotal(snapshot, owner) {
  return normalizeRows(snapshot.rows || []).reduce((sum, row) => {
    if (owner && normalizeOwner(row.owner) !== owner) return sum;
    return sum + normalizeAmount(row.amount);
  }, 0);
}

function mergeSeedSnapshots(snapshots) {
  const normalized = snapshots.map((snapshot) => ({
    ...snapshot,
    rows: normalizeRows(snapshot.rows || []),
  }));
  const seedMonths = new Set(['2026-04', '2026-05']);
  const withoutSeedMonths = normalized.filter((snapshot) => !seedMonths.has(snapshot.month));
  return [...withoutSeedMonths, sampleSnapshots[1], sampleSnapshots[2]].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseReady);
  const [month, setMonth] = useState('2026-05');
  const [rows, setRows] = useState(rowsWithIds(mayRows));
  const [snapshots, setSnapshots] = useState(sampleSnapshots);
  const [newCategory, setNewCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [trendModalOpen, setTrendModalOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady) {
      loadLocalSnapshots();
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        loadSnapshots();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const selected = snapshots.find((snapshot) => snapshot.month === month);
    if (selected) {
      setRows(rowsWithIds(selected.rows));
    }
  }, [month, snapshots]);

  const totals = useMemo(() => {
    const byOwner = partners.reduce((acc, owner) => ({ ...acc, [owner]: 0 }), {});
    const byCategory = {};
    rows.forEach((row) => {
      const owner = normalizeOwner(row.owner);
      const amount = normalizeAmount(row.amount);
      byOwner[owner] = (byOwner[owner] || 0) + amount;
      byCategory[row.category] = (byCategory[row.category] || 0) + amount;
    });
    const combined = Object.values(byOwner).reduce((sum, value) => sum + value, 0);
    return { byOwner, byCategory, combined };
  }, [rows]);

  const previousSnapshot = useMemo(() => {
    return [...snapshots].reverse().find((snapshot) => snapshot.month < month);
  }, [month, snapshots]);

  const previousTotal = useMemo(() => (previousSnapshot ? snapshotTotal(previousSnapshot) : 0), [previousSnapshot]);
  const monthlyGrowth = totals.combined - previousTotal;
  const categoryEntries = Object.entries(totals.byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);
  const maxCategory = Math.max(...categoryEntries.map(([, amount]) => amount), 1);

  function loadLocalSnapshots() {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        setSnapshots(mergeSeedSnapshots(parsed));
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  function updateRow(id, key, value) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addCategory() {
    const category = newCategory.trim();
    if (!category) return;
    setRows((current) => [
      ...current,
      ...partners.map((owner) => ({
        id: crypto.randomUUID(),
        owner,
        category,
        amount: '',
        memo: '',
      })),
    ]);
    setNewCategory('');
  }

  function addManualRow(owner) {
    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        owner,
        category: '새 항목',
        amount: '',
        memo: '',
      },
    ]);
  }

  function removeRow(id) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  async function loadSnapshots() {
    if (!isSupabaseReady || !supabase.auth) return;

    setLoading(true);
    setStatus('Supabase에서 기록을 불러오는 중입니다.');
    const { data, error } = await supabase
      .from('asset_snapshots')
      .select('*')
      .order('month', { ascending: true });

    if (error) {
      setStatus(`불러오기 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    const loaded = mergeSeedSnapshots(data.map((item) => ({ month: item.month, rows: item.rows || [] })));
    setSnapshots(loaded.length ? loaded : sampleSnapshots);
    const current = loaded.find((item) => item.month === month);
    if (current) setRows(rowsWithIds(current.rows));
    setStatus('Supabase 기록을 불러왔습니다.');
    setLoading(false);
  }

  async function saveSnapshot() {
    const cleanRows = normalizeRows(rows).map(({ owner, category, amount, memo }) => ({
      owner,
      category,
      amount: normalizeAmount(amount),
      memo,
    }));

    setSnapshots((current) => {
      const next = current.filter((snapshot) => snapshot.month !== month);
      const sorted = [...next, { month, rows: cleanRows }].sort((a, b) => a.month.localeCompare(b.month));
      localStorage.setItem(storageKey, JSON.stringify(sorted));
      return sorted;
    });

    if (!isSupabaseReady) {
      setStatus('Supabase 환경값이 없어서 브라우저에만 임시 저장했습니다.');
      return;
    }

    if (!session) {
      setStatus('로그인 후 Supabase에 저장할 수 있습니다.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('asset_snapshots').upsert({
      month,
      rows: cleanRows,
      total: totals.combined,
      updated_at: new Date().toISOString(),
    });

    setStatus(error ? `저장 실패: ${error.message}` : `${month} 자산 기록을 저장했습니다.`);
    setLoading(false);
  }

  function applySnapshot(snapshot) {
    setMonth(snapshot.month);
    setRows(rowsWithIds(snapshot.rows));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStatus('로그아웃되었습니다.');
  }

  if (!authReady) {
    return (
      <main className="app-shell auth-layout">
        <div className="auth-card">
          <Loader2 className="spin" size={24} />
          <h1>보안 세션을 확인하는 중입니다.</h1>
        </div>
      </main>
    );
  }

  if (isSupabaseReady && !session) {
    return <AuthScreen />;
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">
            <Sparkles size={15} /> 인웅 · 운정
          </p>
          <h1>월별 자산 현황</h1>
        </div>
        <div className="top-actions">
          <MonthPicker value={month} snapshots={snapshots} onChange={setMonth} />
          {session && (
            <button className="secondary-button" onClick={signOut}>
              <LogOut size={17} />
              로그아웃
            </button>
          )}
        </div>
      </section>

      <section className="summary-grid" aria-label="자산 요약">
        <SummaryCard icon={<CircleDollarSign />} label="합산 자산" value={totals.combined} ticker tone="strong" />
        <SummaryCard icon={<Users />} label="인웅 자산" value={totals.byOwner['인웅']} ticker />
        <SummaryCard icon={<WalletCards />} label="운정 자산" value={totals.byOwner['운정']} ticker />
        <SummaryCard
          icon={monthlyGrowth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
          label={previousSnapshot ? `${previousSnapshot.month} 대비` : '전월 대비'}
          value={monthlyGrowth}
          ticker
          accent={monthlyGrowth >= 0 ? 'up' : 'down'}
        />
      </section>

      <section className="workspace">
        <div className="editor-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Asset Input</p>
              <h2>항목별 금액 입력</h2>
            </div>
            <button className="primary-button" onClick={saveSnapshot} disabled={loading}>
              {loading ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              저장
            </button>
          </div>

          <div className="category-add">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addCategory()}
              placeholder="예: 금, 적금, 국내주식"
            />
            <button onClick={addCategory}>
              <Plus size={17} />
              항목 추가
            </button>
          </div>

          <div className="partner-columns">
            {partners.map((owner) => (
              <AssetColumn
                key={owner}
                owner={owner}
                rows={rows.filter((row) => normalizeOwner(row.owner) === owner)}
                onUpdate={updateRow}
                onRemove={removeRow}
                onAdd={() => addManualRow(owner)}
              />
            ))}
          </div>

          <p className="status-line">
            <Database size={15} />
            {status ||
              (session
                ? `${session.user.email} 계정으로 Supabase에 연결되었습니다.`
                : 'Supabase 환경값을 넣으면 저장소와 연결됩니다.')}
          </p>
        </div>

        <aside className="insight-panel">
          <div className="panel-head compact">
            <div>
              <p className="section-kicker">Trend</p>
              <h2>월별 자산 추이</h2>
            </div>
            <button className="icon-button" onClick={() => setTrendModalOpen(true)} title="월별 자산 추이 크게 보기">
              <Maximize2 size={18} />
            </button>
          </div>

          <MonthlyTrendChart snapshots={snapshots} />

          <div className="bar-list">
            <div className="side-section-head">
              <h3 className="side-section-title">항목별 비중</h3>
              <button className="text-button" onClick={() => setCategoryModalOpen(true)}>
                <Eye size={15} />
                전체보기
              </button>
            </div>
            {categoryEntries.length === 0 ? (
              <p className="empty">금액을 입력하면 항목별 비중이 표시됩니다.</p>
            ) : (
              categoryEntries.slice(0, 6).map(([category, amount]) => (
                <CategoryBar key={category} category={category} amount={amount} maxAmount={maxCategory} />
              ))
            )}
          </div>

          <div className="history-list">
            <h3>저장된 월</h3>
            {snapshots.map((snapshot) => {
              const total = snapshotTotal(snapshot);
              return (
                <button key={snapshot.month} onClick={() => applySnapshot(snapshot)}>
                  <span>{snapshot.month}</span>
                  <strong>{formatWon(total)}</strong>
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      {categoryModalOpen && (
        <Modal title={`${month} 항목별 비중`} onClose={() => setCategoryModalOpen(false)}>
          <div className="category-modal-list">
            {categoryEntries.map(([category, amount]) => (
              <CategoryBar key={category} category={category} amount={amount} maxAmount={maxCategory} showPercent total={totals.combined} />
            ))}
          </div>
        </Modal>
      )}

      {trendModalOpen && (
        <Modal title="월별 자산 추이" size="wide" onClose={() => setTrendModalOpen(false)}>
          <MonthlyTrendChart snapshots={snapshots} large />
        </Modal>
      )}
    </main>
  );
}

function MonthPicker({ value, snapshots, onChange }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const pickerRef = useRef(null);
  const availableMonths = new Set(snapshots.map((snapshot) => snapshot.month));
  const monthLabel = value.replace('-', '.');

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function selectMonth(monthIndex) {
    onChange(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
    setOpen(false);
  }

  return (
    <div className="month-picker" ref={pickerRef}>
      <button className="month-trigger" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={18} />
        <span>{monthLabel}</span>
      </button>
      {open && (
        <div className="month-popover">
          <div className="month-popover-head">
            <button onClick={() => setYear((current) => current - 1)} title="이전 연도">
              <ChevronLeft size={16} />
            </button>
            <strong>{year}</strong>
            <button onClick={() => setYear((current) => current + 1)} title="다음 연도">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="month-grid">
            {Array.from({ length: 12 }, (_, index) => {
              const option = `${year}-${String(index + 1).padStart(2, '0')}`;
              return (
                <button
                  key={option}
                  className={`${option === value ? 'active' : ''} ${availableMonths.has(option) ? 'has-data' : ''}`}
                  onClick={() => selectMonth(index)}
                >
                  {index + 1}월
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage('로그인에 실패했습니다. 이메일과 비밀번호를 다시 확인해주세요.');
    }
    setLoading(false);
  }

  return (
    <main className="app-shell auth-layout">
      <form className="auth-card" onSubmit={signIn}>
        <div className="auth-topline">
          <div className="auth-icon">
            <Lock size={24} />
          </div>
          <span>IW WJ</span>
        </div>
        <p className="eyebrow">Asset Management</p>
        <h1>로그인</h1>
        <p className="auth-copy">등록된 계정으로 월별 자산 현황을 확인하세요.</p>
        <label>
          이메일
          <span>
            <Mail size={17} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </span>
        </label>
        <label>
          비밀번호
          <span>
            <Lock size={17} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Supabase Auth 비밀번호" required />
          </span>
        </label>
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={17} /> : <Lock size={17} />}
          로그인
        </button>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </main>
  );
}

function SummaryCard({ icon, label, value, tone, accent, ticker }) {
  return (
    <article className={`summary-card ${tone || ''} ${accent || ''}`}>
      <div className="card-icon">{icon}</div>
      <span>{label}</span>
      <strong>{ticker ? <AnimatedWon value={value} /> : formatWon(value)}</strong>
    </article>
  );
}

function AnimatedWon({ value }) {
  const [displayValue, setDisplayValue] = useState(value || 0);

  useEffect(() => {
    const start = displayValue;
    const end = value || 0;
    const duration = 650;
    let frameId;
    let startTime;

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (end - start) * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span className="ticker-number">{formatWon(displayValue)}</span>;
}

function MonthlyTrendChart({ snapshots, large = false }) {
  const [hover, setHover] = useState(null);
  const data = snapshots
    .map((snapshot) => ({
      month: snapshot.month,
      combined: snapshotTotal(snapshot),
      inwoong: snapshotTotal(snapshot, '인웅'),
      woonjung: snapshotTotal(snapshot, '운정'),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const maxValue = Math.max(...data.flatMap((item) => [item.combined, item.inwoong, item.woonjung]), 1);
  const width = large ? 760 : 320;
  const height = large ? 340 : 178;
  const padding = large ? { top: 28, right: 24, bottom: 36, left: 74 } : { top: 18, right: 14, bottom: 30, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  const series = [
    { key: 'combined', label: '합산' },
    { key: 'inwoong', label: '인웅' },
    { key: 'woonjung', label: '운정' },
  ];

  function point(item, index, key) {
    const x = padding.left + index * xStep;
    const y = padding.top + plotHeight - (item[key] / maxValue) * plotHeight;
    return { x, y };
  }

  function polyline(key) {
    return data.map((item, index) => {
      const { x, y } = point(item, index, key);
      return `${x},${y}`;
    }).join(' ');
  }

  if (!data.length) return <p className="empty">저장된 월이 생기면 추이가 표시됩니다.</p>;

  return (
    <div className={`trend-card ${large ? 'large' : ''}`} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="월별 자산 추이 차트">
        {yTicks.map((ratio) => {
          const y = padding.top + plotHeight * (1 - ratio);
          const value = maxValue * ratio;
          return (
            <g className="axis-row" key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="axis-label" x={padding.left - 8} y={y + 4}>{formatAxisAmount(value)}</text>
            </g>
          );
        })}
        {series.map(({ key }) => (
          <polyline key={key} className={`line ${key}`} points={polyline(key)} />
        ))}
        {data.map((item, index) => (
          <g key={item.month}>
            {series.map(({ key, label }) => {
              const { x, y } = point(item, index, key);
              return (
                <circle
                  key={key}
                  className={`dot ${key}`}
                  cx={x}
                  cy={y}
                  r={large ? 5 : 3.5}
                  onMouseEnter={() => setHover({ x, y, month: item.month, label, value: item[key] })}
                />
              );
            })}
            <text className="month-label" x={padding.left + index * xStep} y={height - 8}>{item.month.slice(5)}</text>
          </g>
        ))}
      </svg>
      {hover && (
        <div className="chart-tooltip" style={{ left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%` }}>
          <span>{hover.month} · {hover.label}</span>
          <strong>{formatWon(hover.value)}</strong>
        </div>
      )}
      <div className="trend-legend">
        <span><i className="combined" />합산</span>
        <span><i className="inwoong" />인웅</span>
        <span><i className="woonjung" />운정</span>
      </div>
    </div>
  );
}

function CategoryBar({ category, amount, maxAmount, total, showPercent = false }) {
  const percent = total ? (amount / total) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-meta">
        <span>{category}</span>
        <strong>{formatWon(amount)}{showPercent ? ` · ${percent.toFixed(1)}%` : ''}</strong>
      </div>
      <div className="bar-track">
        <div style={{ width: `${Math.max(6, (amount / maxAmount) * 100)}%` }} />
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, size = 'normal' }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal-panel ${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} title="닫기">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AssetColumn({ owner, rows, onUpdate, onRemove, onAdd }) {
  const ownerTotal = rows.reduce((sum, row) => sum + normalizeAmount(row.amount), 0);

  return (
    <section className="asset-column">
      <div className="column-head">
        <div>
          <h3>{owner}</h3>
          <p>{formatWon(ownerTotal)}</p>
        </div>
        <button className="icon-button" onClick={onAdd} title={`${owner} 항목 추가`}>
          <Plus size={18} />
        </button>
      </div>

      <div className="asset-rows">
        {rows.map((row) => (
          <div className="asset-row" key={row.id}>
            <input className="category-input" value={row.category} onChange={(event) => onUpdate(row.id, 'category', event.target.value)} aria-label="항목명" />
            <input
              className="amount-input"
              inputMode="numeric"
              value={formatAmountInput(row.amount)}
              onChange={(event) => onUpdate(row.id, 'amount', event.target.value)}
              placeholder="0"
              aria-label="금액"
            />
            <input className="memo-input" value={row.memo} onChange={(event) => onUpdate(row.id, 'memo', event.target.value)} placeholder="메모" aria-label="메모" />
            <button className="delete-button" onClick={() => onRemove(row.id)} title="삭제">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
