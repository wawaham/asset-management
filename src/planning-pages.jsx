import React, { useEffect, useRef, useState } from 'react';
import { MenuItem, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ArrowUpRight, Check, ChevronDown, ClipboardList, House, Pencil, Plus, Save, Search, Trash2, WalletCards, X } from 'lucide-react';
import { budgetGroups, calculateHomeBudget, parseManwon, sortWeddingGuests, summarizeGuestGifts } from './planning-model';
import { usePlanningDocument } from './use-planning-document';
import './planning.css';

const won = new Intl.NumberFormat('ko-KR');
const money = (value) => `${won.format(value)}원`;
const statuses = {
  uncontacted: '연락 전', invited: '초대 완료', attending: '참석 예정', declined: '불참',
};
const blankGuest = { name: '', relation: '', status: 'uncontacted', expected: '', received: '', memo: '' };
const emptyGuestList = { guests: [] };
const guestOrders = {
  registered: '등록순', name: '이름 가나다순', relation: '관계 가나다순',
  expected: '예상 축의금 높은 순', received: '받은 축의금 높은 순',
};

function MoneyInput({ label, value, onChange, id }) {
  return (
    <span className="plan-money-input">
      <input id={id} type="text" inputMode="decimal" aria-label={label} value={value ?? ''} placeholder="0"
        onChange={(event) => {
          const next = event.target.value.replace(/,/g, '');
          if (/^\d{0,10}(\.\d{0,4})?$/.test(next)) onChange(next);
        }} />
      <span aria-hidden="true">만원</span>
    </span>
  );
}

function PlanningStorage({ document }) {
  const { mode, localError, dirty, saving, message, save, conflict, reloadSaved } = document;
  const status = localError ? '브라우저에 저장하지 못했습니다.' : {
    loading: '계정 기록 확인 중', local: '이 브라우저에 자동 저장',
    offline: '계정 연결 실패 · 이 브라우저에 자동 저장',
    cloud: dirty ? '이 브라우저에 임시 저장 · 계정 저장 대기' : '계정 기록과 동기화됨',
  }[mode];

  return (
    <div className="plan-storage">
      <div role="status"><span>{status}</span>{message && <span>{message}</span>}</div>
      {mode === 'cloud' && (conflict
        ? <button type="button" className="secondary-button" onClick={reloadSaved} disabled={saving}>계정 기록 불러오기</button>
        : <button type="button" className="secondary-button" onClick={save} disabled={!dirty || saving}>
          <Save size={16} /> {saving ? '저장 중' : '계정에 저장'}
        </button>)}
    </div>
  );
}

export function HomeBudgetPage({ userId, assetTotal, assetMonth, assetLoading }) {
  const document = usePlanningDocument('home_budget', userId, {});
  const guestDocument = usePlanningDocument('wedding_guests', userId, emptyGuestList, { readOnly: true });
  const plan = document.data;
  const updateAmount = (key, value) => document.update((current) => ({ ...current, [key]: value }));
  const guestGifts = summarizeGuestGifts(guestDocument.data.guests);
  const budget = calculateHomeBudget(assetTotal ?? 0, plan, guestGifts);
  const unfilled = budgetGroups.flatMap(({ items }) => items).filter(([id]) => !plan[id] || plan[id] === '.').length;
  const sourceAvailable = assetTotal !== null;
  const metrics = [
    ['매수 부대비용', budget.groupTotals[0], 'fees'],
    ['결혼 · 신혼여행', budget.groupTotals[1], 'wedding'],
    ['입주 · 신혼 살림', budget.groupTotals[2], 'move'],
    ['비상금', budget.reserve, 'reserve'],
    ['집값에 쓸 자기자금', budget.ownBudget, 'cash'],
  ];
  const barTotal = metrics.reduce((total, [, value]) => total + value, 0);

  function field(id, label, note, href) {
    return <div className="plan-field" key={id}>
      <div><label htmlFor={`budget-${id}`}>{label}</label>{note && <small>{note}</small>}
        {href && <a href={href} target="_blank" rel="noreferrer" aria-label={`${label} 공식 안내 (새 탭)`}>공식 안내 <ArrowUpRight size={13} /></a>}
      </div>
      <MoneyInput id={`budget-${id}`} label={label} value={plan[id]} onChange={(value) => updateAmount(id, value)} />
    </div>;
  }

  return (
    <section className="planning-view" aria-label="내 집 예산">
      <div className="plan-layout">
        <div className="plan-editor">
          <section className="plan-section">
            <div className="plan-section-head"><h2><WalletCards size={19} /> 자금 계획</h2><span>단위: 만원</span></div>
            {field('excluded', '당장 쓸 수 없는 자산', '돌려받기 전 보증금, 유지할 연금 등')}
            {field('reserve', '따로 남길 비상금')}
            {field('loan', '예상 주택담보대출', '실제로 사용할 예정인 금액')}
            {field('target', '비교할 아파트 매매가')}
          </section>
          {budgetGroups.map((group, index) => (
            <details className="plan-section plan-expenses" key={group.id} open>
              <summary className="plan-section-head"><h2>{group.label}</h2><span>{money(budget.groupTotals[index])} <ChevronDown size={16} /></span></summary>
              {group.items.map(([id, label, note, href]) => field(id, label, note, href))}
              {group.id === 'wedding' && <div className="plan-gifts">
                <div className="plan-field">
                  <div><h3>축의 명단에서 가져온 금액</h3>
                    <small>인웅·운정 합산 · 받은 {money(guestGifts.received)} + 아직 받지 않은 예상액 {money(guestGifts.expected)}</small>
                    {guestDocument.mode === 'loading' && <small role="status">계정 명단 확인 중</small>}
                    {guestDocument.mode === 'offline' && <small role="status">계정 연결 실패 · 이 브라우저의 명단 기준</small>}
                  </div><strong>{money(budget.listedGifts)}</strong>
                </div>
                {field('extraGifts', '추가 예상 축의금', '아직 명단에 없는 금액만 입력')}
                {guestGifts.received > 0 && field('giftsInAssets', '자산에 이미 포함한 축의금', '명단에 기록한 받은 금액 중 자산 현황에 반영한 금액')}
                <div className="plan-field plan-gift-total"><h3>예산에 더할 축의금</h3><strong>+{money(budget.giftContribution)}</strong></div>
              </div>}
            </details>
          ))}
          <PlanningStorage document={document} />
        </div>
        <aside className="plan-results" aria-label="예산 결과">
          <section className="plan-result-main">
            <p><House size={18} /> 매매가 예산 상한</p>
            <strong>{sourceAvailable ? money(budget.maxPrice) : '—'}</strong>
            <small>{!sourceAvailable
              ? (assetLoading ? '자산 기록을 불러오는 중입니다.' : '불러온 자산 기록이 없습니다.')
              : budget.outlayGap > 0
                ? '비용과 비상금을 충당할 자기자금이 부족합니다.'
                : `자기자금 ${money(budget.ownBudget)} + 예상 대출 ${money(budget.loan)}`}</small>
            {unfilled > 0 && <span className="plan-result-tag">비용 {unfilled}개 미입력 · 빈칸은 0원</span>}
          </section>
          <section className="plan-section plan-breakdown">
            <div className="plan-section-head"><h2>자금 배분</h2>{assetMonth && <span>{assetMonth} 저장 기록</span>}</div>
            <dl className="plan-source">
              <div><dt>합산 자산</dt><dd>{sourceAvailable ? money(assetTotal) : '—'}</dd></div>
              <div><dt>사용 제외 자산</dt><dd>{budget.excluded ? `−${money(budget.excluded)}` : money(0)}</dd></div>
              <div><dt>축의금 (중복 제외)</dt><dd>+{money(budget.giftContribution)}</dd></div>
              <div><dt>쓸 수 있는 자기자금</dt><dd>{sourceAvailable ? money(budget.cash) : '—'}</dd></div>
            </dl>
            {sourceAvailable && barTotal > 0 && <div className="plan-allocation" aria-hidden="true">
              {metrics.filter(([, value]) => value > 0).map(([label, value, tone]) => <i key={label} data-tone={tone} style={{ flexGrow: value / barTotal }} />)}
            </div>}
            <dl className="plan-legend">
              {metrics.map(([label, value, tone]) => <div key={label}><dt><i data-tone={tone} />{label}</dt><dd>{tone === 'cash' && !sourceAvailable ? '—' : money(value)}</dd></div>)}
            </dl>
            {sourceAvailable && budget.outlayGap > 0 && <p className="plan-warning">집값을 빼고도 비용·비상금에 쓸 자기자금이 {money(budget.outlayGap)} 부족합니다.</p>}
          </section>
          {sourceAvailable && budget.target > 0 && <section className="plan-section plan-breakdown">
            <div className="plan-section-head"><h2>목표 매매가 비교</h2></div>
            <dl className="plan-source">
              <div><dt>목표 매매가</dt><dd>{money(budget.target)}</dd></div>
              <div><dt>비용·비상금 포함 필요액</dt><dd>{money(budget.target + budget.outlays)}</dd></div>
              <div data-negative={budget.targetBalance < 0}><dt>{budget.targetBalance < 0 ? '부족한 자금' : '남는 자금'}</dt><dd>{money(Math.abs(budget.targetBalance))}</dd></div>
            </dl>
          </section>}
          <p className="plan-footnote">예상 축의금까지 포함한 예산입니다. 실제로 받을 금액과 매수 비용이 달라지면 예산도 달라집니다.</p>
        </aside>
      </div>
    </section>
  );
}

function GuestDialog({ guest, onClose, onSave }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(guest);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  function submit(event) {
    event.preventDefault();
    const name = draft.name.trim();
    if (name) onSave({ ...draft, name, relation: draft.relation.trim(), memo: draft.memo.trim() });
  }

  return <dialog ref={dialog} className="plan-dialog" aria-labelledby="guest-dialog-title"
    onClose={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <form onSubmit={submit}>
      <div className="guest-dialog-head"><h2 id="guest-dialog-title">{guest.id ? '명단 수정' : '명단 추가'}</h2>
        <button type="button" className="icon-button" title="닫기" aria-label="닫기" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="guest-form-grid">
        <label>이름<input autoFocus required maxLength={60} value={draft.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label>관계 · 소속<input placeholder="예: 대학 친구, 직장" maxLength={60} value={draft.relation} onChange={(event) => update('relation', event.target.value)} /></label>
        <fieldset className="guest-status-field"><legend>초대 상태</legend><div>
          {Object.entries(statuses).map(([key, label]) => <label key={key}>
            <input type="radio" name="guest-status" value={key} checked={draft.status === key} onChange={() => update('status', key)} /><span>{label}</span>
          </label>)}
        </div></fieldset>
        <label>예상 축의금<MoneyInput label="예상 축의금 (만원)" value={draft.expected} onChange={(value) => update('expected', value)} /></label>
        <label>받은 축의금<MoneyInput label="받은 축의금 (만원)" value={draft.received} onChange={(value) => update('received', value)} /></label>
        <label className="guest-full">메모<textarea rows={3} maxLength={400} value={draft.memo} onChange={(event) => update('memo', event.target.value)} /></label>
      </div>
      <div className="guest-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>취소</button>
        <button className="primary-button" disabled={!draft.name.trim()}><Check size={16} /> {guest.id ? '수정 완료' : '추가'}</button>
      </div>
    </form>
  </dialog>;
}

export function WeddingGuestsPage({ userId, owners }) {
  const document = usePlanningDocument('wedding_guests', userId, emptyGuestList);
  const [owner, setOwner] = useState(owners[0]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [order, setOrder] = useState('registered');
  const [editing, setEditing] = useState(null);
  const [removed, setRemoved] = useState(null);
  const guests = Array.isArray(document.data.guests) ? document.data.guests : [];
  const owned = guests.filter((guest) => guest.owner === owner);
  const query = search.trim().toLocaleLowerCase();
  const visible = sortWeddingGuests(owned.filter((guest) => (filter === 'all' || guest.status === filter) &&
    [guest.name, guest.relation, guest.memo].some((value) => String(value || '').toLocaleLowerCase().includes(query))), order);
  const updateGuests = (updater) => document.update((current) => ({ ...current, guests: updater(current.guests || []) }));

  function saveGuest(guest) {
    if (guest.id) updateGuests((list) => list.map((item) => item.id === guest.id ? guest : item));
    else {
      const entry = { ...guest, id: crypto.randomUUID(), owner };
      updateGuests((list) => [...list, entry]);
      setSearch('');
      setFilter('all');
    }
    setEditing(null);
  }

  return <section className="planning-view guest-view" aria-label="축의 명단">
    <div className="guest-toolbar">
      <ToggleButtonGroup exclusive size="small" value={owner} aria-label="축의 명단 소유자"
        onChange={(_event, value) => { if (value) { setOwner(value); setSearch(''); setFilter('all'); } }}>
        {owners.map((name) => <ToggleButton value={name} key={name}>{name} <span>{guests.filter((guest) => guest.owner === name).length}</span></ToggleButton>)}
      </ToggleButtonGroup>
      <button className="primary-button" onClick={() => setEditing(blankGuest)}><Plus size={17} /> 명단 추가</button>
    </div>
    <dl className="guest-stats">
      <div><dt>전체 명단</dt><dd>{owned.length}명</dd></div>
      <div><dt>참석 예정</dt><dd>{owned.filter((guest) => guest.status === 'attending').length}명</dd></div>
      <div><dt>예상 축의금</dt><dd>{money(owned.reduce((sum, guest) => sum + parseManwon(guest.expected), 0))}</dd></div>
      <div><dt>받은 축의금</dt><dd>{money(owned.reduce((sum, guest) => sum + parseManwon(guest.received), 0))}</dd></div>
    </dl>
    <div className="guest-filters">
      <label className="guest-search"><Search size={17} /><input type="search" aria-label="명단 검색" placeholder="이름, 관계, 메모 검색" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <TextField select size="small" label="초대 상태" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <MenuItem value="all">전체</MenuItem>{Object.entries(statuses).map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}
      </TextField>
      <TextField select size="small" className="guest-sort" label="정렬" value={order} onChange={(event) => setOrder(event.target.value)}>
        {Object.entries(guestOrders).map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}
      </TextField>
    </div>
    {removed && <div className="guest-undo" role="status"><span>{removed.name} 님을 명단에서 삭제했습니다.</span>
      <button className="text-button" onClick={() => { updateGuests((list) => [...list, removed]); setRemoved(null); }}>되돌리기</button></div>}
    {visible.length ? <div className="guest-table-wrap"><table className="guest-table">
      <thead><tr><th scope="col">이름 · 관계</th><th scope="col">초대 상태</th><th scope="col">예상 / 받은 금액</th><th scope="col">메모</th><th scope="col">관리</th></tr></thead>
      <tbody>{visible.map((guest) => <tr key={guest.id}>
        <th scope="row">{guest.name}{guest.relation && <small>{guest.relation}</small>}</th>
        <td><span className="guest-status" data-status={guest.status}>{statuses[guest.status]}</span></td>
        <td className="guest-amounts"><span><i>예상</i>{guest.expected ? money(parseManwon(guest.expected)) : '—'}</span><small><i>받은 금액</i>{guest.received ? money(parseManwon(guest.received)) : '—'}</small></td>
        <td className="guest-memo" data-empty={!guest.memo}>{guest.memo || '—'}</td>
        <td><div className="guest-row-actions">
          <button className="icon-button" title="수정" aria-label={`${guest.name} 수정`} onClick={() => setEditing(guest)}><Pencil size={16} /></button>
          <button className="icon-button guest-delete" title="삭제" aria-label={`${guest.name} 삭제`} onClick={() => { updateGuests((list) => list.filter((item) => item.id !== guest.id)); setRemoved(guest); }}><Trash2 size={16} /></button>
        </div></td>
      </tr>)}</tbody>
    </table></div> : <div className="guest-empty"><ClipboardList size={30} /><h2>{owned.length ? '검색 결과가 없습니다' : `${owner} 님의 명단이 비어 있어요`}</h2></div>}
    <PlanningStorage document={document} />
    {editing && <GuestDialog guest={editing} onClose={() => setEditing(null)} onSave={saveGuest} />}
  </section>;
}
