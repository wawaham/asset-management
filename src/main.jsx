import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorContent, useEditor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleDollarSign,
  Database,
  Edit3,
  Eye,
  FileText,
  Heart,
  Home,
  ImagePlus,
  Landmark,
  LineChart,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  Percent,
  Plus,
  ReceiptText,
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
const deletedMonthsKey = 'couple-asset-deleted-months';
const hundredMillion = 100000000;
const tenThousand = 10000;
const ltvRatio = 0.7;
const ltvMaxLoan = 600000000;
const dsrRatio = 0.4;
const stressRateAdd = 1.5;
const emptyTipContent = '<p></p>';
const tipImageBucket = 'tip-images';

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

function createBlankRows() {
  return partners.flatMap((owner) => defaultCategories.map((category) => ({
    id: crypto.randomUUID(),
    owner,
    category,
    amount: '',
    memo: '',
  })));
}

const initialRows = createBlankRows();

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

function formatCompactWon(value) {
  const amount = Math.round(value || 0);
  if (amount >= hundredMillion) {
    const eok = amount / hundredMillion;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(2)}억`;
  }
  if (amount >= tenThousand) {
    return `${Math.round(amount / tenThousand).toLocaleString('ko-KR')}만`;
  }
  return amount.toLocaleString('ko-KR');
}

function formatSignedWon(value) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatWon(Math.abs(value))}`;
}

function formatPercent(value) {
  if (value === null) return '-';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function getDelta(current, previous) {
  const amount = current - previous;
  return {
    amount,
    percent: previous ? (amount / previous) * 100 : null,
    tone: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat',
  };
}

function parseWonInput(value) {
  return normalizeAmount(value);
}

function monthlyEqualPayment(principal, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / months;
  return principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
}

function annualPaymentFactor(method, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  if (method === 'equal-principal') {
    const principalFactor = 12 / months;
    const interestFactor = Array.from({ length: 12 }, (_, index) => (1 - index / months) * monthlyRate)
      .reduce((sum, value) => sum + value, 0);
    return principalFactor + interestFactor;
  }

  if (method === 'graduated') {
    return (monthlyEqualPayment(1, annualRate, years) * 12) * 0.78;
  }

  return monthlyEqualPayment(1, annualRate, years) * 12;
}

function calculateLoanLimit({ homePrice, annualIncome, annualRate, years, method, stressApplied }) {
  const ltvLimit = Math.min(homePrice * ltvRatio, ltvMaxLoan);
  const dsrAnnualLimit = annualIncome * dsrRatio;
  const dsrRate = annualRate + (stressApplied ? stressRateAdd : 0);
  const factor = annualPaymentFactor(method, dsrRate, years);
  const realFactor = annualPaymentFactor(method, annualRate, years);
  const dsrLimit = factor ? dsrAnnualLimit / factor : ltvLimit;
  const finalLimit = Math.max(0, Math.min(ltvLimit, dsrLimit));
  const realAnnualPayment = finalLimit * realFactor;
  const reviewAnnualPayment = finalLimit * factor;
  const realMonthlyPayment = realAnnualPayment / 12;
  const dsrMonthlyPayment = reviewAnnualPayment / 12;
  const realDsr = annualIncome ? (realAnnualPayment / annualIncome) * 100 : 0;
  const stressDsr = annualIncome ? (reviewAnnualPayment / annualIncome) * 100 : 0;

  return {
    ltvLimit,
    dsrLimit,
    finalLimit,
    neededCash: Math.max(0, homePrice - finalLimit),
    realMonthlyPayment,
    dsrMonthlyPayment,
    realDsr,
    stressDsr,
    bottleneck: ltvLimit <= dsrLimit ? 'LTV' : 'DSR',
    dsrRate,
  };
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function sanitizeEditorHtml(html) {
  const doc = new DOMParser().parseFromString(html || emptyTipContent, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link, style').forEach((node) => node.remove());
  doc.body.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.toLowerCase();
      if (name.startsWith('on') || value.includes('javascript:')) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return doc.body.innerHTML || emptyTipContent;
}

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function safeFileName(name) {
  return String(name || 'image')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
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

function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  const browser = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ].find(([pattern]) => pattern.test(ua));
  const os = [
    [/Windows NT/, 'Windows'],
    [/Mac OS X/, 'macOS'],
    [/Android/, 'Android'],
    [/(iPhone|iPad|iPod)/, 'iOS'],
    [/Linux/, 'Linux'],
  ].find(([pattern]) => pattern.test(ua));
  const device = /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : /iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop';

  return {
    browser: browser ? browser[1] : 'Unknown',
    os: os ? os[1] : 'Unknown',
    device,
  };
}

function getGeoPosition() {
  if (!navigator.geolocation) {
    return Promise.resolve({ status: 'unsupported' });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        status: 'granted',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => resolve({ status: error.code === 1 ? 'denied' : 'unavailable', message: error.message }),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 1200 },
    );
  });
}

async function getLocationSnapshot() {
  if (!navigator.permissions?.query) return getGeoPosition();

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state !== 'granted') return { status: permission.state };
    return getGeoPosition();
  } catch {
    return { status: 'unknown' };
  }
}

async function captureClientContext() {
  const parsed = parseUserAgent(navigator.userAgent);
  const location = await getLocationSnapshot();

  return {
    location,
    client: {
      ...parsed,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: window.screen?.width,
        height: window.screen?.height,
        pixelRatio: window.devicePixelRatio,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      referrer: document.referrer || null,
      recordedAt: new Date().toISOString(),
    },
  };
}

async function writeActivityLogEntry({ session, action, month = null, total = 0 }) {
  if (!isSupabaseReady || !session) return;

  try {
    const context = await captureClientContext();
    const { error } = await supabase.from('asset_activity_logs').insert({
      action,
      month,
      total,
      user_id: session.user.id,
      user_email: session.user.email,
      client_context: context.client,
      location: context.location,
    });

    if (error) {
      console.warn('Activity log failed:', error.message);
    }
  } catch (error) {
    console.warn('Activity log failed:', error);
  }
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

function getDeletedSnapshotMonths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(deletedMonthsKey) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setDeletedSnapshotMonths(months) {
  localStorage.setItem(deletedMonthsKey, JSON.stringify([...new Set(months)]));
}

function mergeSeedSnapshots(snapshots) {
  const deletedMonths = new Set(getDeletedSnapshotMonths());
  const normalized = snapshots.map((snapshot) => ({
    ...snapshot,
    rows: normalizeRows(snapshot.rows || []),
  }));
  const seedMonths = new Set(['2026-04', '2026-05']);
  const withoutSeedMonths = normalized.filter((snapshot) => !seedMonths.has(snapshot.month));
  const seedSnapshots = sampleSnapshots.filter((snapshot) => seedMonths.has(snapshot.month) && !deletedMonths.has(snapshot.month));
  return [...withoutSeedMonths, ...seedSnapshots].sort((a, b) => a.month.localeCompare(b.month));
}

function App() {
  const [page, setPage] = useState('assets');
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
  const [celebration, setCelebration] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
  const summaryDeltas = useMemo(() => ({
    combined: getDelta(totals.combined, previousTotal),
    inwoong: getDelta(totals.byOwner['인웅'], previousSnapshot ? snapshotTotal(previousSnapshot, '인웅') : 0),
    woonjung: getDelta(totals.byOwner['운정'], previousSnapshot ? snapshotTotal(previousSnapshot, '운정') : 0),
  }), [previousSnapshot, previousTotal, totals]);
  const categoryEntries = Object.entries(totals.byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);
  const maxCategory = Math.max(...categoryEntries.map(([, amount]) => amount), 1);
  const pageTitles = {
    assets: '월별 자산 현황',
    ltv: 'LTV 계산기',
    tips: '부동산 꿀팁',
  };

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
    const celebrationPayload = {
      month,
      total: totals.combined,
      growth: monthlyGrowth,
      previousMonth: previousSnapshot?.month,
    };

    setSnapshots((current) => {
      setDeletedSnapshotMonths(getDeletedSnapshotMonths().filter((deletedMonth) => deletedMonth !== month));
      const next = current.filter((snapshot) => snapshot.month !== month);
      const sorted = [...next, { month, rows: cleanRows }].sort((a, b) => a.month.localeCompare(b.month));
      localStorage.setItem(storageKey, JSON.stringify(sorted));
      return sorted;
    });

    if (!isSupabaseReady) {
      setStatus('Supabase 환경값이 없어서 브라우저에만 임시 저장했습니다.');
      setCelebration(celebrationPayload);
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

    if (error) {
      setStatus(`저장 실패: ${error.message}`);
    } else {
      await writeActivityLog('save', month, totals.combined);
      setStatus(`${month} 자산 기록을 저장했습니다.`);
      setCelebration(celebrationPayload);
    }
    setLoading(false);
  }

  async function deleteSnapshot({ email, password }) {
    if (!isSupabaseReady) {
      setStatus('Supabase 환경값이 없어서 브라우저 기록만 삭제했습니다.');
      removeSnapshotLocally(month);
      setDeleteModalOpen(false);
      return { ok: true };
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      return { ok: false, message: '이메일 또는 비밀번호가 맞지 않습니다.' };
    }

    const { error } = await supabase.from('asset_snapshots').delete().eq('month', month);
    if (error) {
      return { ok: false, message: `삭제 실패: ${error.message}` };
    }

    await writeActivityLog('delete', month, snapshotTotal({ rows }));
    removeSnapshotLocally(month);
    setStatus(`${month} 자산 기록을 삭제했습니다.`);
    setDeleteModalOpen(false);
    return { ok: true };
  }

  async function writeActivityLog(action, targetMonth, total) {
    await writeActivityLogEntry({ session, action, month: targetMonth, total });
  }

  function removeSnapshotLocally(targetMonth) {
    setDeletedSnapshotMonths([...getDeletedSnapshotMonths(), targetMonth]);
    setSnapshots((current) => {
      const next = current.filter((snapshot) => snapshot.month !== targetMonth);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setRows(createBlankRows());
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
          <h1>{pageTitles[page]}</h1>
        </div>
        <div className="top-actions">
          <nav className={`page-tabs ${page}-active`} aria-label="페이지 이동">
            <button className={page === 'assets' ? 'active' : ''} onClick={() => setPage('assets')}>
              <WalletCards size={16} />
              자산 현황
            </button>
            <button className={page === 'ltv' ? 'active' : ''} onClick={() => setPage('ltv')}>
              <Calculator size={16} />
              LTV 계산기
            </button>
            <button className={page === 'tips' ? 'active' : ''} onClick={() => setPage('tips')}>
              <FileText size={16} />
              부동산 꿀팁
            </button>
          </nav>
          {page === 'assets' && <MonthPicker value={month} snapshots={snapshots} onChange={setMonth} />}
          {session && (
            <button className="secondary-button" onClick={signOut}>
              <LogOut size={17} />
              로그아웃
            </button>
          )}
        </div>
      </section>

      {page === 'assets' ? (
        <>
      <section className="summary-grid" aria-label="자산 요약">
        <SummaryCard icon={<CircleDollarSign />} label="합산 자산" value={totals.combined} delta={summaryDeltas.combined} ticker tone="strong" />
        <SummaryCard icon={<Users />} label="인웅 자산" value={totals.byOwner['인웅']} delta={summaryDeltas.inwoong} ticker />
        <SummaryCard icon={<WalletCards />} label="운정 자산" value={totals.byOwner['운정']} delta={summaryDeltas.woonjung} ticker />
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
            <div className="panel-actions">
              <button className="danger-button" onClick={() => setDeleteModalOpen(true)} disabled={loading}>
                <Trash2 size={17} />
                {Number(month.slice(5))}월 기록 삭제
              </button>
              <button className="primary-button" onClick={saveSnapshot} disabled={loading}>
                {loading ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                저장
              </button>
            </div>
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

      {celebration && (
        <CelebrationModal data={celebration} onClose={() => setCelebration(null)} />
      )}

      {deleteModalOpen && (
        <DeleteSnapshotModal month={month} onClose={() => setDeleteModalOpen(false)} onConfirm={deleteSnapshot} />
      )}

        </>
      ) : page === 'ltv' ? (
        <LtvCalculator />
      ) : (
        <TipsBoard session={session} />
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
    } else {
      const { data } = await supabase.auth.getSession();
      await writeActivityLogEntry({ session: data.session, action: 'login' });
    }
    setLoading(false);
  }

  return (
    <main className="app-shell auth-layout">
      <form className="auth-card" onSubmit={signIn}>
        <div className="auth-topline">
          <span>IW UJ</span>
        </div>
        <h1 className="auth-title">
          <Home className="auth-title-icon" size={42} />
          우리집 마련
        </h1>
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

function SummaryCard({ icon, label, value, delta, tone, accent, ticker }) {
  return (
    <article className={`summary-card ${tone || ''} ${accent || ''}`}>
      <div className="card-icon">{icon}</div>
      <span>{label}</span>
      <div className="summary-value-row">
        <strong>{ticker ? <AnimatedWon value={value} /> : formatWon(value)}</strong>
        {delta && (
          <em className={`summary-delta ${delta.tone}`}>
            {formatSignedWon(delta.amount)}
            <small>{formatPercent(delta.percent)}</small>
          </em>
        )}
      </div>
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

function TipsBoard({ session }) {
  const [posts, setPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [checkedPostIds, setCheckedPostIds] = useState([]);
  const [editorPost, setEditorPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null);
  const postsPerPage = 8;
  const totalPostPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const visiblePosts = posts.slice((postPage - 1) * postsPerPage, postPage * postsPerPage);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    setPostPage((current) => Math.min(current, totalPostPages));
  }, [totalPostPages]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  async function loadPosts() {
    if (!isSupabaseReady) {
      setMessage('Supabase 연결 후 게시글을 저장할 수 있습니다.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('real_estate_tips')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage(`게시글을 불러오지 못했습니다. Supabase SQL을 실행했는지 확인해주세요. (${error.message})`);
    } else {
      setPosts(data || []);
      setPostPage(1);
      setMessage(data?.length ? '게시글을 불러왔습니다.' : '아직 작성된 글이 없습니다.');
    }
    setLoading(false);
  }

  async function verifyCredential({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, message: '이메일 또는 비밀번호가 맞지 않습니다.' };
    return { ok: true };
  }

  async function savePost({ post }) {
    const payload = {
      title: post.title.trim(),
      excerpt: stripHtml(post.content).slice(0, 160),
      content: sanitizeEditorHtml(post.content),
      author_email: session?.user?.email || '',
      updated_at: new Date().toISOString(),
    };

    const wasEditing = Boolean(editorPost?.id);
    const query = editorPost?.id
      ? supabase.from('real_estate_tips').update(payload).eq('id', editorPost.id).select().single()
      : supabase.from('real_estate_tips').insert({ ...payload, created_at: new Date().toISOString() }).select().single();

    const { data, error } = await query;
    if (error) return { ok: false, message: `저장 실패: ${error.message}` };

    await loadPosts();
    setSelectedPost(null);
    setEditorPost(null);
    setMessage(wasEditing ? '게시글을 수정했습니다.' : '게시글을 저장했습니다.');
    showToast(wasEditing ? '수정 완료' : '작성 완료', wasEditing ? 'info' : 'success');
    return { ok: true };
  }

  async function togglePinned(post) {
    const { data, error } = await supabase
      .from('real_estate_tips')
      .update({ is_pinned: !post.is_pinned, updated_at: new Date().toISOString() })
      .eq('id', post.id)
      .select()
      .single();
    if (error) {
      showToast(`하트 변경 실패: ${error.message}`, 'error');
      return;
    }
    setPosts((current) => current
      .map((item) => (item.id === data.id ? data : item))
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.updated_at) - new Date(a.updated_at)));
    showToast(data.is_pinned ? '상단 고정했어요' : '상단 고정을 해제했어요', 'info');
  }

  async function removePost({ email, password }) {
    const auth = await verifyCredential({ email, password });
    if (!auth.ok) return auth;

    const { error } = await supabase.from('real_estate_tips').delete().eq('id', deletePost.id);
    if (error) return { ok: false, message: `삭제 실패: ${error.message}` };

    await loadPosts();
    if (selectedPost?.id === deletePost.id) setSelectedPost(null);
    setCheckedPostIds((current) => current.filter((id) => id !== deletePost.id));
    setDeletePost(null);
    setMessage('게시글을 삭제했습니다.');
    showToast('삭제 완료', 'danger');
    return { ok: true };
  }

  async function removeSelectedPosts({ email, password }) {
    const auth = await verifyCredential({ email, password });
    if (!auth.ok) return auth;

    const { error } = await supabase.from('real_estate_tips').delete().in('id', checkedPostIds);
    if (error) {
      return { ok: false, message: `선택 삭제 실패: ${error.message}` };
    }

    await loadPosts();
    if (selectedPost && checkedPostIds.includes(selectedPost.id)) setSelectedPost(null);
    setCheckedPostIds([]);
    setBulkDeleteOpen(false);
    setMessage('선택한 게시글을 삭제했습니다.');
    showToast('선택 삭제 완료', 'danger');
    return { ok: true };
  }

  function toggleCheckedPost(id) {
    setCheckedPostIds((current) => (
      current.includes(id) ? current.filter((postId) => postId !== id) : [...current, id]
    ));
  }

  function openNewPost() {
    setEditorPost({ title: '', content: emptyTipContent });
  }

  if (editorPost) {
    return (
      <TipEditorPage
        session={session}
        post={editorPost}
        onClose={() => setEditorPost(null)}
        onSubmit={savePost}
      />
    );
  }

  return (
    <section className="tips-page">
      <div className="tips-hero">
        <div>
          <p className="section-kicker">Real Estate Notes</p>
          <h2>부동산 꿀팁 보드</h2>
          <p>청약, 대출, 계약, 세금처럼 다시 찾아볼 내용을 사진과 함께 정리해두는 공간입니다.</p>
        </div>
      </div>

      <section className="tips-list-page">
          <div className="tips-list-head">
            <div>
              <p className="section-kicker">Saved Tips</p>
              <h3>작성한 리스트</h3>
              <span className="tips-count">총 {posts.length}개 · {postPage}/{totalPostPages}페이지</span>
            </div>
            {posts.length > 0 && (
              <div className="tips-list-actions">
                <button className="primary-button" onClick={openNewPost}>
                  <Plus size={17} />
                  글 작성
                </button>
                <button className="danger-button" onClick={() => setBulkDeleteOpen(true)} disabled={checkedPostIds.length === 0}>
                  <Trash2 size={17} />
                  선택 삭제 {checkedPostIds.length ? checkedPostIds.length : ''}
                </button>
              </div>
            )}
            {loading && <Loader2 className="spin" size={18} />}
          </div>
          <div className="tips-list">
            {posts.length === 0 ? (
              <TipsEmptyState onCreate={openNewPost} />
            ) : visiblePosts.map((post) => (
              <article
                key={post.id}
                className={`tip-list-card ${selectedPost?.id === post.id ? 'active' : ''}`}
                onClick={() => setSelectedPost(post)}
              >
                <label className="tip-check" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checkedPostIds.includes(post.id)}
                    onChange={() => toggleCheckedPost(post.id)}
                  />
                  <span />
                </label>
                <button
                  type="button"
                  className={`tip-heart ${post.is_pinned ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePinned(post);
                  }}
                  title={post.is_pinned ? '상단 고정 해제' : '상단에 고정'}
                >
                  <Heart size={17} fill={post.is_pinned ? 'currentColor' : 'none'} />
                </button>
                <strong>{post.title}</strong>
                <span>{post.excerpt || '내용 미리보기가 없습니다.'}</span>
                <small>{formatDateTime(post.updated_at)}</small>
              </article>
            ))}
          </div>
          {posts.length > postsPerPage && (
            <div className="tips-pagination">
              <button onClick={() => setPostPage((current) => Math.max(1, current - 1))} disabled={postPage === 1}>
                이전
              </button>
              {Array.from({ length: totalPostPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={page === postPage ? 'active' : ''}
                  onClick={() => setPostPage(page)}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setPostPage((current) => Math.min(totalPostPages, current + 1))} disabled={postPage === totalPostPages}>
                다음
              </button>
            </div>
          )}
          <p className="status-line">
            <Database size={15} />
            {message || `${session?.user?.email || ''} 계정으로 연결되었습니다.`}
          </p>
      </section>

      {selectedPost && (
        <TipDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onEdit={() => setEditorPost(selectedPost)}
          onDelete={() => setDeletePost(selectedPost)}
        />
      )}

      {deletePost && (
        <TipDeleteModal
          post={deletePost}
          onClose={() => setDeletePost(null)}
          onConfirm={removePost}
        />
      )}
      {bulkDeleteOpen && (
        <TipBulkDeleteModal
          count={checkedPostIds.length}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={removeSelectedPosts}
        />
      )}
      {toast && <div className={`app-toast ${toast.type}`}>{toast.message}</div>}
    </section>
  );
}

function TipsEmptyState({ onCreate }) {
  return (
    <div className="tips-empty-card">
      <div className="empty-orbit" aria-hidden="true">
        <span />
        <span />
        <FileText size={42} />
      </div>
      <p className="section-kicker">First Note</p>
      <h3>아직 저장된 꿀팁이 없습니다</h3>
      <p>청약 조건, 대출 메모, 계약 체크리스트처럼 다시 볼 내용을 첫 글로 남겨보세요.</p>
      <button className="empty-create-button" onClick={onCreate}>
        <Sparkles size={18} />
        첫 글 작성
        <ArrowUpRight size={17} />
      </button>
    </div>
  );
}

function TipDetailModal({ post, onClose, onEdit, onDelete }) {
  return (
    <Modal title="" size="tip-detail" onClose={onClose}>
      <div className="tip-detail-head">
        <div>
          <p className="section-kicker">{formatDateTime(post.updated_at)}</p>
          <h2>{post.title}</h2>
          <span>{post.author_email}</span>
        </div>
        <div className="tip-actions">
          <button className="secondary-button" onClick={onEdit}>
            <Edit3 size={16} />
            수정
          </button>
          <button className="danger-button" onClick={onDelete}>
            <Trash2 size={16} />
            삭제
          </button>
        </div>
      </div>
      <article className="tip-content" dangerouslySetInnerHTML={{ __html: sanitizeEditorHtml(post.content) }} />
    </Modal>
  );
}

function TipEditorPage({ session, post, onClose, onSubmit }) {
  const [title, setTitle] = useState(post.title || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef(null);
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false })],
    content: post.content || emptyTipContent,
    editorProps: {
      attributes: {
        class: 'tip-editor-content',
      },
    },
  });

  async function addImage(event) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    if (!session?.user?.id) {
      setMessage('이미지를 올리려면 먼저 로그인되어 있어야 합니다.');
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    setMessage('');
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const path = `${session.user.id}/${Date.now()}-${safeFileName(file.name || `image.${extension}`)}`;
    const { error } = await supabase.storage.from(tipImageBucket).upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      setMessage(`이미지 업로드 실패: ${error.message}. Supabase Storage SQL을 실행했는지 확인해주세요.`);
    } else {
      const { data } = supabase.storage.from(tipImageBucket).getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl, alt: file.name }).run();
    }
    setUploadingImage(false);
    event.target.value = '';
  }

  async function submit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setMessage('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setMessage('');
    const result = await onSubmit({
      post: { title, content: editor?.getHTML() || emptyTipContent },
    });
    if (!result.ok) setMessage(result.message);
    setSaving(false);
  }

  return (
    <section className="tip-editor-page">
      <div className="tip-editor-page-head">
        <div>
          <p className="section-kicker">Real Estate Editor</p>
          <h2>{post.id ? '게시글 수정' : '게시글 작성'}</h2>
        </div>
        <button className="secondary-button" onClick={onClose} type="button">
          <X size={17} />
          목록으로
        </button>
      </div>
      <form className="tip-editor-form" onSubmit={submit}>
        <label>
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 신혼부부 특공 체크리스트" />
        </label>

        <div className="tip-editor-toolbar">
          <button type="button" className={editor?.isActive('bold') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={editor?.isActive('italic') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>목록</button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            {uploadingImage ? <Loader2 className="spin" size={16} /> : <ImagePlus size={16} />}
            사진
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={addImage} hidden />
        </div>

        <div className="tip-editor-shell">
          <EditorContent editor={editor} />
        </div>
        {message && <p className="auth-message">{message}</p>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>취소</button>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            저장
          </button>
        </div>
      </form>
    </section>
  );
}

function TipDeleteModal({ post, onClose, onConfirm }) {
  return (
    <CredentialDeleteModal
      title="게시글 삭제"
      headline={post.title}
      description="삭제하려면 등록된 계정의 이메일과 비밀번호를 입력해주세요."
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function TipBulkDeleteModal({ count, onClose, onConfirm }) {
  return (
    <CredentialDeleteModal
      title="선택 게시글 삭제"
      headline={`선택한 게시글 ${count}개를 삭제합니다.`}
      description="삭제하려면 등록된 계정의 이메일과 비밀번호를 입력해주세요."
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function CredentialDeleteModal({ title, headline, description, onClose, onConfirm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await onConfirm({ email, password });
    if (!result.ok) setMessage(result.message);
    setLoading(false);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="delete-confirm-form" onSubmit={submit}>
        <div className="delete-warning">
          <Trash2 size={20} />
          <strong>{headline}</strong>
          <p>{description}</p>
        </div>
        <label>
          이메일
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required />
        </label>
        {message && <p className="auth-message">{message}</p>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>취소</button>
          <button className="danger-button solid" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
            삭제
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function selectOption(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className={`filter-select ${open ? 'open' : ''}`} ref={selectRef}>
      <button type="button" className="filter-select-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{label}</span>
        <strong>{selected.label}</strong>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="filter-select-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? 'active' : ''}
              onClick={() => selectOption(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LtvCalculator() {
  const [homePrice, setHomePrice] = useState(formatAmountInput(950000000));
  const [annualIncome, setAnnualIncome] = useState(formatAmountInput(95000000));
  const [customRate, setCustomRate] = useState('4.5');
  const [scenarioView, setScenarioView] = useState('grouped');
  const [methodFilter, setMethodFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [stressFilter, setStressFilter] = useState('all');
  const [rateFilter, setRateFilter] = useState('all');
  const repaymentMethods = [
    { key: 'equal-payment', label: '원리금 균등', description: '매월 같은 원리금을 내는 방식' },
    { key: 'equal-principal', label: '원금 균등', description: '원금을 균등하게 갚아 초반 부담이 큰 방식' },
    { key: 'graduated', label: '체증식', description: '초기 상환액을 낮게 잡는 간편 추정' },
  ];
  const terms = [30, 40];
  const baseRates = [4, 4.5, 5];
  const numericHomePrice = parseWonInput(homePrice);
  const numericIncome = parseWonInput(annualIncome);
  const numericCustomRate = Number(customRate);
  const rates = [...new Set([...baseRates, ...(Number.isFinite(numericCustomRate) && numericCustomRate > 0 ? [numericCustomRate] : [])])]
    .sort((a, b) => a - b);
  const ltvLimit = Math.min(numericHomePrice * ltvRatio, ltvMaxLoan);
  const scenarios = rates.flatMap((rate) => terms.flatMap((years) => repaymentMethods.flatMap((method) => [false, true].map((stressApplied) => ({
    rate,
    years,
    method,
    stressApplied,
    result: calculateLoanLimit({
      homePrice: numericHomePrice,
      annualIncome: numericIncome,
      annualRate: rate,
      years,
      method: method.key,
      stressApplied,
    }),
  })))));
  const bestScenario = scenarios.reduce((best, scenario) => (
    !best || scenario.result.finalLimit > best.result.finalLimit ? scenario : best
  ), null);
  const filteredScenarios = scenarios
    .filter((scenario) => methodFilter === 'all' || scenario.method.key === methodFilter)
    .filter((scenario) => termFilter === 'all' || String(scenario.years) === termFilter)
    .filter((scenario) => stressFilter === 'all' || String(scenario.stressApplied) === stressFilter)
    .filter((scenario) => rateFilter === 'all' || String(scenario.rate) === rateFilter)
    .sort((a, b) => {
      if (scenarioView === 'price') return b.result.finalLimit - a.result.finalLimit;
      return a.rate - b.rate
        || a.years - b.years
        || a.method.label.localeCompare(b.method.label, 'ko-KR')
        || Number(a.stressApplied) - Number(b.stressApplied);
    });
  const filterOptions = {
    rates: [{ value: 'all', label: '전체' }, ...rates.map((rate) => ({ value: String(rate), label: `${rate}%` }))],
    terms: [{ value: 'all', label: '전체' }, ...terms.map((years) => ({ value: String(years), label: `${years}년` }))],
    methods: [{ value: 'all', label: '전체' }, ...repaymentMethods.map((method) => ({ value: method.key, label: method.label }))],
    stress: [
      { value: 'all', label: '전체' },
      { value: 'false', label: '미적용' },
      { value: 'true', label: '적용' },
    ],
  };

  function updateMoney(setter, value) {
    setter(formatAmountInput(value));
  }

  function resetFilters() {
    setScenarioView('grouped');
    setMethodFilter('all');
    setTermFilter('all');
    setStressFilter('all');
    setRateFilter('all');
  }

  return (
    <section className="ltv-page">
      <div className="ltv-hero">
        <div>
          <p className="section-kicker">Housing Loan Simulator</p>
          <h2>생애최초 주담대 한도 비교</h2>
          <p>
            수도권 생애최초 기준 LTV 70%, 최대 6억, DSR 40%를 기준으로 금리와 만기,
            상환방식, 스트레스 DSR 적용 여부를 한 번에 비교합니다.
          </p>
        </div>
        <div className="ltv-rule-grid">
          <div><strong>70%</strong><span>LTV</span></div>
          <div><strong>6억</strong><span>최대 한도</span></div>
          <div><strong>40%</strong><span>DSR</span></div>
          <div><strong>+1.5%</strong><span>스트레스</span></div>
        </div>
      </div>

      <div className="ltv-layout">
        <section className="ltv-controls">
          <div className="ltv-card-head">
            <Landmark size={22} />
            <div>
              <p className="section-kicker">Inputs</p>
              <h3>기본 조건</h3>
            </div>
          </div>
          <label>
            주택금액
            <span>
              <input value={homePrice} onChange={(event) => updateMoney(setHomePrice, event.target.value)} inputMode="numeric" />
              <small>원</small>
            </span>
          </label>
          <label>
            합산 연봉
            <span>
              <input value={annualIncome} onChange={(event) => updateMoney(setAnnualIncome, event.target.value)} inputMode="numeric" />
              <small>원</small>
            </span>
          </label>
          <label>
            직접 설정 금리
            <span>
              <input value={customRate} onChange={(event) => setCustomRate(event.target.value)} inputMode="decimal" />
              <small>%</small>
            </span>
          </label>
          <div className="ltv-note">
            체증식은 상품별 실제 산식이 다르기 때문에 초기 상환액을 낮게 잡은 간편 추정값입니다.
            실제 심사는 은행별 기준과 기존 대출에 따라 달라질 수 있습니다.
          </div>
        </section>

        <section className="ltv-results">
          <div className="ltv-summary-grid">
            <article className="ltv-summary-card strong">
              <Calculator size={21} />
              <span>최대 가능 한도</span>
              <strong><AnimatedWon value={bestScenario?.result.finalLimit || 0} /></strong>
              <small>{bestScenario ? `${bestScenario.method.label} · ${bestScenario.years}년 · ${bestScenario.rate}%` : '-'}</small>
            </article>
            <article className="ltv-summary-card">
              <Percent size={21} />
              <span>LTV 기준 한도</span>
              <strong><AnimatedWon value={ltvLimit} /></strong>
              <small>주택금액 70%, 최대 6억</small>
            </article>
            <article className="ltv-summary-card">
              <ReceiptText size={21} />
              <span>DSR 연간 한도</span>
              <strong><AnimatedWon value={numericIncome * dsrRatio} /></strong>
              <small>합산 연봉의 40%</small>
            </article>
          </div>

          <div className="scenario-toolbar">
            <div className="scenario-view-toggle" aria-label="보기 방식">
              <button
                className={scenarioView === 'grouped' ? 'active' : ''}
                onClick={() => setScenarioView('grouped')}
              >
                묶음 보기
                <span className="help-tooltip" aria-label="묶음 보기 설명">
                  <CircleHelp size={14} />
                  <span>금리, 만기, 상환방식, 스트레스 적용 여부 순서로 조건을 묶어서 보여줍니다.</span>
                </span>
              </button>
              <button
                className={scenarioView === 'price' ? 'active' : ''}
                onClick={() => setScenarioView('price')}
              >
                한도 높은순
                <span className="help-tooltip" aria-label="한도 높은순 설명">
                  <CircleHelp size={14} />
                  <span>최종 대출 한도가 큰 조건부터 정렬합니다.</span>
                </span>
              </button>
            </div>
            <div className="scenario-filters">
              <FilterSelect label="금리" value={rateFilter} options={filterOptions.rates} onChange={setRateFilter} />
              <FilterSelect label="만기" value={termFilter} options={filterOptions.terms} onChange={setTermFilter} />
              <FilterSelect label="상환" value={methodFilter} options={filterOptions.methods} onChange={setMethodFilter} />
              <FilterSelect label="DSR" value={stressFilter} options={filterOptions.stress} onChange={setStressFilter} />
              <button className="filter-reset" onClick={resetFilters}>초기화</button>
            </div>
          </div>

          <div className="scenario-table-wrap">
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>금리</th>
                  <th>만기</th>
                  <th>상환방식</th>
                  <th>스트레스</th>
                  <th>최종 한도</th>
                  <th>월상환</th>
                  <th>필요 현금</th>
                  <th>
                    <span className="table-help">
                      제한
                      <span className="help-tooltip" aria-label="제한 설명">
                        <CircleHelp size={14} />
                        <span>LTV는 주택가격 대비 한도에 걸린 경우, DSR은 소득 대비 상환능력 한도에 걸린 경우입니다.</span>
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map(({ rate, years, method, stressApplied, result }) => (
                  <tr key={`${rate}-${years}-${method.key}-${stressApplied}`}>
                    <td>{rate}%</td>
                    <td>{years}년</td>
                    <td>
                      <strong>{method.label}</strong>
                      <span>{method.description}</span>
                    </td>
                    <td>
                      <i className={stressApplied ? 'stress-on' : 'stress-off'}>
                        {stressApplied ? `적용 ${result.dsrRate}%` : '미적용'}
                      </i>
                    </td>
                    <td><b>{formatCompactWon(result.finalLimit)}</b></td>
                    <td>
                      {formatCompactWon(result.realMonthlyPayment)}
                      <small>실제 DSR {result.realDsr.toFixed(1)}%</small>
                      <small>심사 DSR {result.stressDsr.toFixed(1)}%</small>
                      <small>DSR 월상환 {formatCompactWon(result.dsrMonthlyPayment)}</small>
                    </td>
                    <td>{formatCompactWon(result.neededCash)}</td>
                    <td>
                      <em
                        className={result.bottleneck === 'DSR' ? 'limit-dsr' : 'limit-ltv'}
                        title={result.bottleneck === 'DSR' ? '소득 대비 상환능력 한도에 걸린 조건입니다.' : '주택가격 대비 LTV 한도에 걸린 조건입니다.'}
                      >
                        {result.bottleneck}
                      </em>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function MonthlyTrendChart({ snapshots, large = false }) {
  const [hover, setHover] = useState(null);
  const [isMobileChart, setIsMobileChart] = useState(false);

  useEffect(() => {
    function syncChartSize() {
      setIsMobileChart(window.matchMedia('(max-width: 760px)').matches);
    }

    syncChartSize();
    window.addEventListener('resize', syncChartSize);
    return () => window.removeEventListener('resize', syncChartSize);
  }, []);

  const data = snapshots
    .map((snapshot) => ({
      month: snapshot.month,
      combined: snapshotTotal(snapshot),
      inwoong: snapshotTotal(snapshot, '인웅'),
      woonjung: snapshotTotal(snapshot, '운정'),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const maxValue = Math.max(...data.flatMap((item) => [item.combined, item.inwoong, item.woonjung]), 1);
  const largeMobile = large && isMobileChart;
  const width = largeMobile ? 360 : large ? 760 : 320;
  const height = largeMobile ? 320 : large ? 340 : 178;
  const padding = largeMobile
    ? { top: 28, right: 16, bottom: 38, left: 64 }
    : large
      ? { top: 28, right: 24, bottom: 36, left: 74 }
      : { top: 18, right: 14, bottom: 30, left: 54 };
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

function CelebrationModal({ data, onClose }) {
  const isGrowth = data.growth > 0;

  return (
    <Modal title={`${data.month} 저장 완료`} size="celebration" onClose={onClose}>
      <div className={`celebration-card ${isGrowth ? 'growth' : 'encourage'}`}>
        {isGrowth ? <ConfettiBurst /> : <ClappingHands />}
        <p className="celebration-kicker">
          {isGrowth ? '전월보다 자산이 늘었어요.' : '이번 달 기록도 잘 남겼어요.'}
        </p>
        <h3>{isGrowth ? '좋은 흐름입니다.' : '괜찮아요. 다음 달에 더 힘내봐요.'}</h3>
        <div className="celebration-total">
          <span>현재 합산 자산</span>
          <strong><AnimatedWon value={data.total} /></strong>
        </div>
        <div className="celebration-delta">
          <span>{data.previousMonth ? `${data.previousMonth} 대비` : '전월 대비'}</span>
          <strong className={isGrowth ? 'up' : 'down'}>{formatWon(data.growth)}</strong>
        </div>
        <button className="primary-button" onClick={onClose}>확인</button>
      </div>
    </Modal>
  );
}

function ConfettiBurst() {
  const pieces = [
    [-86, -52], [-72, -18], [-58, 20], [-44, -74], [-28, -38], [-18, 16],
    [-6, -62], [10, -24], [22, 28], [36, -82], [48, -42], [62, 12],
    [78, -56], [88, -8], [-96, 8], [-70, -86], [-36, 44], [4, -94],
    [30, 54], [66, -88], [96, 24], [-12, 58], [52, 42], [84, -36],
  ];

  return (
    <div className="confetti-burst" aria-hidden="true">
      {pieces.map(([x, y], index) => (
        <i key={index} style={{ '--i': index, '--x': `${x}px`, '--y': `${y}px`, '--r': `${index * 29}deg` }} />
      ))}
    </div>
  );
}

function ClappingHands() {
  return (
    <div className="encourage-badge" aria-hidden="true">
      <span className="encourage-ring" />
      <span className="encourage-ring second" />
      <strong>👏</strong>
      <i />
      <i />
      <i />
    </div>
  );
}

function DeleteSnapshotModal({ month, onClose, onConfirm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await onConfirm({ email, password });
    if (!result.ok) {
      setMessage(result.message || '삭제에 실패했습니다.');
    }
    setLoading(false);
  }

  return (
    <Modal title={`${month} 기록 삭제`} onClose={onClose}>
      <form className="delete-confirm-form" onSubmit={submit}>
        <div className="delete-warning">
          <Trash2 size={22} />
          <div>
            <strong>{Number(month.slice(5))}월의 자산 기록을 완전히 삭제합니다.</strong>
            <p>삭제하려면 인웅 또는 운정 계정의 이메일과 비밀번호를 입력하세요.</p>
          </div>
        </div>
        <label>
          이메일
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required />
        </label>
        {message && <p className="auth-message">{message}</p>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>취소</button>
          <button className="danger-button solid" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
            삭제
          </button>
        </div>
      </form>
    </Modal>
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
