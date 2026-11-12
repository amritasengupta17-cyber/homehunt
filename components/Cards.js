'use client';
import { useState } from 'react';
const STATUS = ['New', 'Viewing booked', 'Visited', 'Offer made', 'Rejected'];
const tally = fb => fb.reduce((n, f) => n + (f.vote || 0), 0);

function Field({ label, value, onSave, area }) {
  const [v, setV] = useState(value ?? '');
  const T = area ? 'textarea' : 'input';
  return <div><label>{label}</label><T rows={area ? 3 : undefined} value={v} onChange={e => setV(e.target.value)} onBlur={() => v !== (value ?? '') && onSave(v)} /></div>;
}

export default function Cards({ initial }) {
  const [items, setItems] = useState(initial);
  const save = (id, patch) => { // optimistic: UI updates instantly, save happens in background
    setItems(a => a.map(x => x.id === id ? { ...x, ...patch } : x));
    fetch(`/api/listings/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
  };
  const del = id => { if (!confirm('Remove this listing?')) return; setItems(a => a.filter(x => x.id !== id)); fetch(`/api/listings/${id}`, { method: 'DELETE' }); };
  if (!items.length) return <p className="mute">No listings yet. Ask Claude to add some.</p>;
  return items.map(l => (
    <div className="box l" key={l.id}>
      {l.photo_url ? <img src={l.photo_url} alt="" loading="lazy" /> : <div className="ph" />}
      <div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Field label="Address" value={l.address} onSave={v => save(l.id, { address: v })} />
          <span className="sc">{l.score}/100 · 👍 {tally(l.feedback)}</span>
        </div>
        <div className="f">
          <Field label="Price" value={l.price} onSave={v => save(l.id, { price: v })} />
          <Field label="Beds" value={l.beds} onSave={v => save(l.id, { beds: v })} />
          <Field label="Baths" value={l.baths} onSave={v => save(l.id, { baths: v })} />
          <Field label="Area" value={l.area} onSave={v => save(l.id, { area: v })} />
          <div><label>Status</label><select value={l.status} onChange={e => save(l.id, { status: e.target.value })}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="f">
          <Field area label="Pros" value={l.pros} onSave={v => save(l.id, { pros: v })} />
          <Field area label="Cons" value={l.cons} onSave={v => save(l.id, { cons: v })} />
          <Field area label="My notes" value={l.notes} onSave={v => save(l.id, { notes: v })} />
        </div>
        {l.feedback.filter(f => f.comment).map((f, i) => <div className="cm" key={i}><b>{f.name}:</b> {f.comment}</div>)}
        <div className="row" style={{ marginTop: 8 }}>
          {l.source_url && <a href={l.source_url} target="_blank" rel="noreferrer">Original listing</a>}
          <button className="v" onClick={() => del(l.id)}>Remove</button>
        </div>
      </div>
    </div>));
}
