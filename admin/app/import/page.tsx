'use client';

import { useRef, useState } from 'react';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; inserted: number; skipped: number; errors: string[] }
  | { type: 'error'; message: string };

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus({ type: 'error', message: 'No file selected.' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setStatus({ type: 'error', message: 'Could not parse JSON file.' });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error ?? 'Import failed.' });
        return;
      }

      setStatus({
        type: 'success',
        inserted: data.inserted,
        skipped: data.skipped,
        errors: data.errors ?? [],
      });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
    }
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Import Lessons</h1>

      <div style={styles.row}>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={styles.fileInput}
        />
        <button
          onClick={handleImport}
          disabled={status.type === 'loading'}
          style={styles.button}
        >
          {status.type === 'loading' ? 'Importing…' : 'Import'}
        </button>
      </div>

      {status.type === 'loading' && (
        <p style={styles.info}>Importing — please wait…</p>
      )}

      {status.type === 'success' && (
        <div style={styles.result}>
          <p style={styles.success}>
            ✓ {status.inserted} lesson{status.inserted !== 1 ? 's' : ''} imported,{' '}
            {status.skipped} skipped.
          </p>
          {status.errors.length > 0 && (
            <div style={styles.errorList}>
              <p style={styles.errorHeading}>Errors ({status.errors.length}):</p>
              <ul>
                {status.errors.map((e, i) => (
                  <li key={i} style={styles.errorItem}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status.type === 'error' && (
        <p style={styles.errorText}>✗ {status.message}</p>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: 'monospace',
    padding: '2rem',
    maxWidth: 640,
  },
  heading: {
    marginBottom: '1.5rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  fileInput: {
    flex: 1,
  },
  button: {
    padding: '0.5rem 1.25rem',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '1rem',
  },
  info: {
    color: '#555',
  },
  result: {
    marginTop: '0.5rem',
  },
  success: {
    color: 'green',
    fontWeight: 'bold',
  },
  errorHeading: {
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  errorList: {
    marginTop: '0.5rem',
  },
  errorItem: {
    color: '#c00',
    marginBottom: '0.25rem',
  },
  errorText: {
    color: '#c00',
    fontWeight: 'bold',
  },
};
