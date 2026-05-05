import React from 'react';
import type { KeyValuePair } from '../../shared/types';
import { createEmptyKV } from '../store/app-store';

interface Props {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
}

export const KeyValueEditor: React.FC<Props> = ({ pairs, onChange }) => {
  const updatePair = (index: number, updates: Partial<KeyValuePair>) => {
    const newPairs = pairs.map((p, i) => (i === index ? { ...p, ...updates } : p));
    onChange(newPairs);
  };

  const deletePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const addPair = () => {
    onChange([...pairs, createEmptyKV()]);
  };

  return (
    <div className="kv-editor">
      {pairs.map((pair, i) => (
        <div key={pair.id} className="kv-row">
          <input type="checkbox" className="kv-row__check" checked={pair.enabled}
            onChange={(e) => updatePair(i, { enabled: e.target.checked })} />
          <input className="kv-row__input" placeholder="Key" value={pair.key}
            onChange={(e) => updatePair(i, { key: e.target.value })} />
          <input className="kv-row__input" placeholder="Value" value={pair.value}
            onChange={(e) => updatePair(i, { value: e.target.value })} />
          <button className="kv-row__delete" onClick={() => deletePair(i)}>✕</button>
        </div>
      ))}
      <button className="kv-add" onClick={addPair}>+ Add</button>
    </div>
  );
};
