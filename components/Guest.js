'use client';
import { useState } from 'react';
export default function Guest({ share, initial }) {
  const [name, setName] = useState('');
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState({});
  const send = (l, vote, comment) => {
    if (!name.trim()) return alert('Enter your name first');
    setItems(a => a.map(x => x.id === l.id ? { ...x, feedback: [...x.feedback.filter(f => !(vote && f.name === name && !f.comment)), { name, vote: vote || 0, comment }] } : x));
    fetch('/api/guest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ share, listing_id: l.id, name, vote, comment }) });
    if (comment) setDraft(d => ({ ...d, [l.id]: '' }));
  };
  return (<>
    <div className="box"><label>Your name (no signup needed)</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya" /></div>
    {items.map(l => { const mine = l.feedback.find(f => f.name === name && !f.comment)?.vote;
      return (<div className="box l" key={l.id}>
        {l.photo_url ? <img src={l.photo_url} alt="" loading="lazy" /> : <div className="ph" />}
        <div>
          <div className="addr">{l.address}</div>
          <div className="mute">{[l.price, l.beds && `${l.beds} bd`, l.baths && `${l.baths} ba`, l.area].filter(Boolean).join(' · ')} · {l.status}</div>
          <div className="f"><div className="pc pro">{l.pros}</div><div className="pc con">{l.cons}</div></div>
          {l.source_url && <p><a href={l.source_url} target="_blank" rel="noreferrer">Original listing</a></p>}
          <div className="row">
            <button className={'v' + (mine === 1 ? ' on' : '')} onClick={() => send(l, 1)}>👍 {l.feedback.filter(f => f.vote === 1).length}</button>
            <button className={'v' + (mine === -1 ? ' on' : '')} onClick={() => send(l, -1)}>👎 {l.feedback.filter(f => f.vote === -1).length}</button>
          </div>
          {l.feedback.filter(f => f.comment).map((f, i) => <div className="cm" key={i}><b>{f.name}:</b> {f.comment}</div>)}
          <div className="row" style={{ marginTop: 8 }}>
            <input style={{ flex: 1, borderColor: 'var(--line)' }} placeholder="Add a comment" value={draft[l.id] || ''} onChange={e => setDraft(d => ({ ...d, [l.id]: e.target.value }))} />
            <button className="btn alt" onClick={() => draft[l.id] && send(l, 0, draft[l.id])}>Post</button>
          </div>
        </div>
      </div>); })}
  </>);
}
