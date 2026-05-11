import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Database,
  LineChart,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
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
  {
    month: '2026-04',
    rows: aprilRows,
  },
];

function formatWon(value) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeAmount(value) {
  const numeric = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeOwner(owner) {
  return ownerAliases[owner] || owner;
}

function normalizeRows(rows) {
  return rows.map((row) => ({
    ...row,
    owner: normalizeOwner(row.owner),
  }));
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
  const withoutApril = normalized.filter((snapshot) => snapshot.month !== '2026-04');
  return [...withoutApril, sampleSnapshots[1]].sort((a, b) => a.month.localeCompare(b.month));
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseReady);
  const [month, setMonth] = useState('2026-04');
  const [rows, setRows] = useState(rowsWithIds(aprilRows));
  const [snapshots, setSnapshots] = useState(sampleSnapshots);
  const [newCategory, setNewCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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

  const previousTotal = useMemo(() => {
    if (!previousSnapshot) return 0;
    return snapshotTotal(previousSnapshot);
  }, [previousSnapshot]);

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
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
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

    const loaded = mergeSeedSnapshots(
      data.map((item) => ({
        month: item.month,
        rows: item.rows || [],
      })),
    );
    setSnapshots(loaded.length ? loaded : sampleSnapshots);
    const current = loaded.find((item) => item.month === month);
    if (current) {
      setRows(rowsWithIds(current.rows));
    }
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
      const sorted = [...next, { month, rows: cleanRows }].sort((a, b) =>
        a.month.localeCompare(b.month),
      );
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
          <div className="month-control">
            <CalendarDays size={18} />
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          {session && (
            <button className="secondary-button" onClick={signOut}>
              <LogOut size={17} />
              로그아웃
            </button>
          )}
        </div>
      </section>

      <section className="summary-grid" aria-label="자산 요약">
        <SummaryCard
          icon={<CircleDollarSign />}
          label="합산 자산"
          value={totals.combined}
          ticker
          tone="strong"
        />
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
            <LineChart size={22} />
          </div>

          <MonthlyTrendChart snapshots={snapshots} />

          <div className="bar-list">
            <h3 className="side-section-title">항목별 비중</h3>
            {categoryEntries.length === 0 ? (
              <p className="empty">금액을 입력하면 항목별 비중이 표시됩니다.</p>
            ) : (
              categoryEntries.map(([category, amount]) => (
                <div className="bar-row" key={category}>
                  <div className="bar-meta">
                    <span>{category}</span>
                    <strong>{formatWon(amount)}</strong>
                  </div>
                  <div className="bar-track">
                    <div style={{ width: `${Math.max(6, (amount / maxCategory) * 100)}%` }} />
                  </div>
                </div>
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
    </main>
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
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </span>
        </label>
        <label>
          비밀번호
          <span>
            <Lock size={17} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Supabase Auth 비밀번호"
              required
            />
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
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span className="ticker-number">{formatWon(displayValue)}</span>;
}

function MonthlyTrendChart({ snapshots }) {
  const data = snapshots
    .map((snapshot) => ({
      month: snapshot.month,
      combined: snapshotTotal(snapshot),
      inwoong: snapshotTotal(snapshot, '인웅'),
      woonjung: snapshotTotal(snapshot, '운정'),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const maxValue = Math.max(...data.flatMap((item) => [item.combined, item.inwoong, item.woonjung]), 1);
  const width = 320;
  const height = 178;
  const padding = 22;
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  function point(item, index, key) {
    const x = padding + index * xStep;
    const y = height - padding - (item[key] / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  }

  function polyline(key) {
    return data.map((item, index) => point(item, index, key)).join(' ');
  }

  if (!data.length) {
    return <p className="empty">저장된 월이 생기면 추이가 표시됩니다.</p>;
  }

  return (
    <div className="trend-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="월별 자산 추이 차트">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <polyline className="line combined" points={polyline('combined')} />
        <polyline className="line inwoong" points={polyline('inwoong')} />
        <polyline className="line woonjung" points={polyline('woonjung')} />
        {data.map((item, index) => (
          <g key={item.month}>
            <circle className="dot combined" cx={point(item, index, 'combined').split(',')[0]} cy={point(item, index, 'combined').split(',')[1]} r="3.5" />
            <text x={padding + index * xStep} y={height - 5}>
              {item.month.slice(5)}
            </text>
          </g>
        ))}
      </svg>
      <div className="trend-legend">
        <span><i className="combined" />합산</span>
        <span><i className="inwoong" />인웅</span>
        <span><i className="woonjung" />운정</span>
      </div>
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
            <input
              className="category-input"
              value={row.category}
              onChange={(event) => onUpdate(row.id, 'category', event.target.value)}
              aria-label="항목명"
            />
            <input
              className="amount-input"
              inputMode="numeric"
              value={row.amount}
              onChange={(event) => onUpdate(row.id, 'amount', event.target.value)}
              placeholder="0"
              aria-label="금액"
            />
            <input
              className="memo-input"
              value={row.memo}
              onChange={(event) => onUpdate(row.id, 'memo', event.target.value)}
              placeholder="메모"
              aria-label="메모"
            />
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
