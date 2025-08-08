'use client';

type StandardPdfViewerProps = {
  url: string;
  title?: string;
  height?: number;
  viewer?: 'google' | 'native';
  className?: string;
};

/**
 * Standard HTML PDF viewer.
 * Defaults to Google Docs Viewer to prevent cross-origin frame blocking for raw PDF URLs.
 * Provides "Open in new tab" and "Download" actions as fallbacks.
 */
export default function StandardPdfViewer({
  url,
  title = 'PDF Document',
  height = 640,
  viewer = 'google',
  className,
}: StandardPdfViewerProps) {
  const nativeSrc = url.includes('#')
    ? url
    : `${url}#toolbar=1&navpanes=1&scrollbar=1`;

  const googleSrc = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
    url
  )}`;

  const src = viewer === 'google' ? googleSrc : nativeSrc;

  return (
    <section aria-label="PDF viewer" className={className}>
      <div className="w-full rounded-md border overflow-hidden bg-background">
        <iframe
          src={src}
          title={title}
          className="w-full"
          style={{ height }}
          frameBorder={0}
        />
      </div>
      <div className="mt-2 flex items-center justify-end gap-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
          aria-label="Open PDF in new tab"
        >
          Open in new tab
        </a>
        <a
          href={url}
          download
          className="text-sm underline"
          aria-label="Download PDF"
        >
          Download
        </a>
      </div>
    </section>
  );
}
