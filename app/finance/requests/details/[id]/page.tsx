'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type RequestDoc = {
  id?: string;
  attachments?: string;     // preferred (lowercase)
  Attachments?: string;     // alternative (uppercase)
  attachment?: string;      // extra safety
  pdfUrl?: string;          // optional alias
  [key: string]: unknown;
};

function extractPdfUrl(data: RequestDoc | null): string | null {
  if (!data) return null;
  // Prefer common fields and fall back to alternates
  const raw =
    (typeof data.attachments === 'string' && data.attachments) ||
    (typeof data.Attachments === 'string' && data.Attachments) ||
    (typeof data.attachment === 'string' && data.attachment) ||
    (typeof data.pdfUrl === 'string' && data.pdfUrl) ||
    null;

  if (!raw) return null;

  // Allow direct Firebase Storage media URLs as-is (no blob or file readers)
  return raw;
}

export default function FinanceRequestPdfPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [requestDoc, setRequestDoc] = useState<RequestDoc | null>(null);

  // iframe state
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeTimedOut, setIframeTimedOut] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const pdfUrl = useMemo(() => extractPdfUrl(requestDoc), [requestDoc]);

  useEffect(() => {
    let active = true;

    async function fetchDoc() {
      setLoading(true);
      setDocError(null);
      try {
        if (!id) {
          throw new Error('Missing request id.');
        }
        const ref = doc(db, 'request', id);
        const snap = await getDoc(ref);

        if (!active) return;

        if (!snap.exists()) {
          setDocError('Request not found.');
          setRequestDoc(null);
        } else {
          const data = snap.data() as RequestDoc;
          setRequestDoc({ id: snap.id, ...data });
        }
      } catch (err: unknown) {
        console.error('Failed to fetch request:', err);
        setDocError('Failed to fetch the finance request. Please try again.');
        setRequestDoc(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDoc();
    return () => {
      active = false;
    };
  }, [id]);

  // Manage iframe loading/fallback
  useEffect(() => {
    setIframeLoaded(false);
    setIframeTimedOut(false);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (pdfUrl) {
      // If the iframe hasn't loaded within 10 seconds, show a gentle fallback.
      timeoutRef.current = window.setTimeout(() => {
        setIframeTimedOut(true);
      }, 10000);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pdfUrl]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Basic UI (kept minimal to avoid altering other page behaviors)
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Finance Request PDF</h1>
        <button
          type="button"
          onClick={() => router.push('/finance/requests')}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          aria-label="Back to Requests"
        >
          Back to Requests
        </button>
      </div>

      {loading && (
        <div className="rounded border p-4">
          <p className="text-sm text-gray-600">Loading request details…</p>
        </div>
      )}

      {!loading && docError && (
        <div className="rounded border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-700">{docError}</p>
        </div>
      )}

      {!loading && !docError && !pdfUrl && (
        <div className="rounded border p-4">
          <p className="text-sm">
            No PDF attachment was found for this request.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Ensure the "attachments" field contains a public Firebase Storage PDF URL.
          </p>
          <div className="mt-4">
            <a
              href="https://firebasestorage.googleapis.com/v0/b/oh-app-bcf24.appspot.com/o/finance-requests%2FmlQu3MEGrcdhWVEAJZPYBGSFLbx1%2Fattachments%2F1754624984068_service-assignment-725159-1754285270938.pdf?alt=media&token=e93f65bd-4fe2-4102-b16a-fdbcd03aff4b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Open example PDF in new tab
            </a>
          </div>
        </div>
      )}

      {!loading && !docError && pdfUrl && (
        <section aria-label="PDF Viewer" className="mt-4 space-y-3">
          <div className="rounded border">
            <iframe
              key={pdfUrl} // ensures refresh if URL changes
              src={pdfUrl}
              title="Finance Request PDF"
              width="100%"
              height="600"
              sandbox="allow-same-origin allow-scripts"
              loading="lazy"
              onLoad={handleIframeLoad}
              // onError is not consistently supported for iframes; we handle via timeout fallback
              style={{ border: 0, display: 'block' }}
            />
          </div>

          {/* Fallback and helper actions */}
          {!iframeLoaded && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Attempting to load the PDF…
            </div>
          )}

          {iframeTimedOut && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              The PDF may be blocked by the browser or failed to load. You can try opening it directly:
              <div className="mt-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-red-100"
                >
                  Open PDF in new tab
                </a>
              </div>
              <p className="mt-2 text-xs text-red-700">
                If you still cannot view it, ensure the file is public in Firebase Storage and the URL is correct.
              </p>
            </div>
          )}

          <noscript>
            <p>
              JavaScript is required to view the PDF here. You can{" "}
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                open it in a new tab
              </a>.
            </p>
          </noscript>
        </section>
      )}
    </main>
  );
}
