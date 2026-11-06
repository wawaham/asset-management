import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function usePlanningDocument(kind, userId, initialData, { readOnly = false } = {}) {
  const storageKey = `asset-planning:${userId || 'local'}:${kind}`;
  const [record, setRecord] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.data && typeof saved.data === 'object') return saved;
    } catch { /* Use the empty document if storage is unavailable. */ }
    return { data: initialData, revision: null, dirty: false };
  });
  const [mode, setMode] = useState(userId && supabase ? 'loading' : 'local');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [localError, setLocalError] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase.from('planning_documents').select('data, revision')
          .eq('user_id', userId).eq('kind', kind).maybeSingle();
        if (!active) return;
        if (error) {
          const missing = ['42P01', 'PGRST205'].includes(error.code);
          setMode(missing ? 'local' : 'offline');
          return;
        }
        if (data) setRecord((current) => current.dirty ? current : { ...data, dirty: false });
        setMode('cloud');
      } catch {
        if (active) setMode('offline');
      }
    }
    load();
    return () => { active = false; };
  }, [kind, userId]);

  useEffect(() => {
    if (readOnly) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
      setLocalError(false);
    } catch {
      setLocalError(true);
    }
  }, [record, storageKey, readOnly]);

  function update(updater) {
    setMessage('');
    setRecord((current) => ({ ...current, data: updater(current.data), dirty: true }));
  }

  async function save() {
    if (mode !== 'cloud' || saving || !record.dirty) return;
    setSaving(true);
    setMessage('');
    try {
      const query = supabase.from('planning_documents');
      const payload = { data: record.data, revision: (record.revision ?? 0) + 1 };
      const { data, error } = await (record.revision === null
        ? query.insert({ user_id: userId, kind, ...payload })
        : query.update(payload).eq('user_id', userId).eq('kind', kind).eq('revision', record.revision))
        .select('revision').maybeSingle();
      if (error && error.code !== '23505') throw error;
      if (!data) {
        setConflict(true);
        setMessage('다른 기기에서 저장한 내용이 있어 덮어쓰지 않았습니다. 현재 수정본은 이 브라우저에 남아 있습니다.');
        return;
      }
      setRecord((current) => ({ ...current, revision: data.revision, dirty: current.data !== record.data }));
      setMessage('계정에 저장했습니다.');
    } catch {
      setMessage('계정에 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  async function reloadSaved() {
    if (!window.confirm('이 브라우저의 수정본을 버리고 계정에 저장된 기록을 불러올까요?')) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('planning_documents').select('data, revision')
        .eq('user_id', userId).eq('kind', kind).single();
      if (error) throw error;
      setRecord({ ...data, dirty: false });
      setConflict(false);
      setMessage('계정 기록을 불러왔습니다.');
    } catch {
      setMessage('계정 기록을 다시 불러오지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return { data: record.data, dirty: record.dirty, mode, saving, message, conflict, localError, update, save, reloadSaved };
}
