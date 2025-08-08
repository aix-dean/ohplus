'use client';

type StandardPdfViewerProps = {
  url: string;
  title?: string;
  height?: number;
};

/**
 * Standard HTML PDF viewer that embeds a PDF via an <iframe>.
 * - Adds common PDF toolbar options.
 * - Provides "Open in new tab" and "Download" actions.
 */
export default function StandardPdfViewer({
  url,
  title = 'PDF Document',
  height = 640,
}: StandardPdfViewerProps) {
  // Ensure toolbar and navigation controls are enabled in the native browser viewer
  const src = url.includes('#')
    ? url
    : `${url}#toolbar=1&navpanes=1&scrollbar=1`;

  return (
    <section aria-label="PDF viewer" className="w-full">
      <div className="w-full rounded-md border overflow-hidden">
        <iframe
          src={src}
          title={title}
          className="w-full"
          style={{ height }}
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
