"use client"

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ViewPDFPage() {
  const { id } = useParams();
  const router = useRouter();
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPreview = id === 'preview';

  useEffect(() => {
    const loadPDF = () => {
      try {
        const generatedPDF = sessionStorage.getItem('generatedPDF');
        if (generatedPDF) {
          setPdfData(generatedPDF);
        } else {
          setError('PDF not found in session storage');
        }
      } catch (err) {
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, []);

  const handleConfirmAndCreate = async () => {
    setCreatingAssignment(true);
    // Add your logic here
    setCreatingAssignment(false);
  };

  return (
    <section className="p-8 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 pb-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 ">
          Create Service Assignment
        </h1>
      </div>

      <div className="relative w-full h-screen">
        {isPreview && (
        <div
          style={{
            display: 'flex',
            position: 'fixed',
            bottom: '20px',
            left: '60%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '67px',
            flexShrink: 0,
            borderRadius: '50px',
            border: '1.5px solid var(--GREY, #C4C4C4)',
            background: '#FFF',
            boxShadow: '-2px 4px 10.5px -2px rgba(0, 0, 0, 0.25)',
            zIndex: 10,
          }}
        >
          <div className="flex justify-center items-center" style={{ width: '100%', gap: '10px' }}>
            <Button
              variant="ghost"
              onClick={() => router.push("/logistics/assignments/create")}
              disabled={creatingAssignment}
              style={{
                height: '27px',
                color: 'var(--Standard-Font-Color, #333)',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '100%',
                textDecorationLine: 'underline',
                textDecorationStyle: 'solid',
                textDecorationSkipInk: 'auto',
                textDecorationThickness: 'auto',
                textUnderlineOffset: 'auto',
                textUnderlinePosition: 'from-font',
                padding: 0
              }}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleConfirmAndCreate}
              disabled={creatingAssignment}
              style={{
                width: '126px',
                height: '27px',
                flexShrink: 0,
                borderRadius: '10px',
                background: '#1D0BEB',
                color: 'var(--Color, #FFF)',
                textAlign: 'center',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '100%'
              }}
            >
              {creatingAssignment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {creatingAssignment ? "Creating SA..." : "Send SA"}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="w-full h-screen">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading PDF...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        ) : pdfData ? (
            <iframe
              src={`data:application/pdf;base64,${pdfData}#toolbar=0#zoom=page-fit`}
              style={{ width: '100%', height: '100%' }}
              className="shadow-lg"
              title="PDF Viewer"
            />
          ) : null}
      </div>
    </div>
    </section>
  );
}