'use client';

// Pick a Chum: Checkpoint 1 walking skeleton. Deliberately UNSTYLED. It proves
// the state flow only: pick a dog, silent wait, type, get a classified response
// with working destination links. Styling is Checkpoint 2 and is not started
// here. The classification readout (layer / bucket / action) is shown so the
// routing can be reviewed in the browser.

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CHUM_DATA } from './lib/data';
import { submit, Turn } from './lib/engine';
import { newSession, Session } from './lib/session';
import { Dog } from './lib/types';
import { openDiscountPopup } from './data/discount-popup';

const DOGS: { id: Dog; label: string }[] = [
  { id: 'collie', label: 'Border Collie' },
  { id: 'labrador', label: 'Labrador' },
  { id: 'terrier', label: 'Border Terrier' },
  { id: 'boxer', label: 'Boxer' },
];

function destinationLabel(id?: string): string {
  if (!id) return '';
  const d = CHUM_DATA.destinations.find((x) => x.destinationId === id);
  if (d) return d.name;
  const a = CHUM_DATA.articles.find((x) => x.articleId === id);
  return a ? a.title : id;
}

export default function PickAChumPage() {
  const sessionRef = useRef<Session | null>(null);
  const [activeDog, setActiveDog] = useState<Dog | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [input, setInput] = useState('');
  const [closed, setClosed] = useState(false);

  function selectDog(dog: Dog) {
    sessionRef.current = newSession(dog);
    setActiveDog(dog);
    setTurn(null); // silent opening: the dog says nothing until the visitor types
    setClosed(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const session = sessionRef.current;
    if (!session || !input.trim() || session.closed) return;
    const result = submit(CHUM_DATA, session, input.trim());
    setTurn(result);
    setActiveDog(session.activeDog);
    setInput('');
    if (result.response.closed) setClosed(true);
  }

  // ---- Selection screen ----
  if (!activeDog) {
    return (
      <main>
        <h1>Pick a Chum</h1>
        <p>Choose a chum. (Skeleton build: classification proof, no styling.)</p>
        <ul>
          {DOGS.map((d) => (
            <li key={d.id}>
              <button onClick={() => selectDog(d.id)}>{d.label}</button>
              {d.id !== 'collie' ? ' (MVP: responds as the Collie for now)' : ''}
            </li>
          ))}
          <li>
            <button onClick={() => selectDog('collie')}>Random</button> (placeholder: assigns the Collie)
          </li>
        </ul>
      </main>
    );
  }

  // ---- Conversation screen ----
  const res = turn?.resolution;
  const resp = turn?.response;
  const url = resp?.url ?? null;
  const isExternal = !!url && (/^https?:/.test(url) || url.startsWith('mailto:'));

  return (
    <main>
      <h1>Pick a Chum</h1>
      <p>
        Active: <strong>{activeDog}</strong>{' '}
        <button onClick={() => setActiveDog(null)}>change chum</button>
      </p>

      {/* Silent opening: nothing from the dog until the visitor submits. */}
      {!turn && <p><em>(waiting: the dog says nothing until you type)</em></p>}

      {turn && resp && (
        <div>
          <p>
            <strong>{resp.dog}:</strong> {resp.text}
          </p>

          {resp.openPopup && (
            <p>
              <button onClick={openDiscountPopup}>Open the pre-order / discount form</button>
            </p>
          )}

          {url && !resp.openPopup && (
            <p>
              {isExternal ? (
                <a href={url}>{destinationLabel(resp.destinationId) || 'Go'}</a>
              ) : (
                <Link href={url}>{destinationLabel(resp.destinationId) || 'Go'}</Link>
              )}
            </p>
          )}

          {resp.destinationId && !url && !resp.openPopup && (
            <p><em>(in-chat destination: {destinationLabel(resp.destinationId)})</em></p>
          )}

          {/* Classification readout for review. */}
          {res && (
            <p>
              <small>
                layer {res.layer} ({res.layerName}) | bucket {res.bucket ?? '-'} | action {res.action}
                {res.transferTo ? ` | to ${res.transferTo}` : ''}
              </small>
            </p>
          )}
        </div>
      )}

      {closed ? (
        <p><em>The Boxer closed the chat.</em> <button onClick={() => selectDog(activeDog)}>start again</button></p>
      ) : (
        <form onSubmit={onSubmit}>
          <input
            aria-label="Type something here"
            placeholder="Type something here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      )}
    </main>
  );
}
