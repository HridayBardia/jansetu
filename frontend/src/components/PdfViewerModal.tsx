'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ShieldCheck, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PdfViewerModalProps {
  documentData: {
    id: string;
    document_type: string;
    document_name: string;
    document_number_masked?: string;
    citizen_name?: string;
    issued_by?: string;
    extracted_fields?: Record<string, any>;
    synthetic_notice?: string;
    created_at?: string;
  } | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ documentData, onClose }) => {
  const [zoom, setZoom] = useState(100);

  if (!documentData) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoom(100);

  const handleDownload = () => {
    const textContent = `
=================================================================
DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED RECORD — FOR DEMO ONLY
=================================================================
Document Title: ${documentData.document_name}
Document Type: ${documentData.document_type}
Document Number: ${documentData.document_number_masked || 'XXXX XXXX 1234'}
Citizen Name: ${documentData.citizen_name || 'Citizen'}
Issued By: ${documentData.issued_by || 'Government Authority'}
Extracted Fields: ${JSON.stringify(documentData.extracted_fields || {}, null, 2)}
Notice: ${documentData.synthetic_notice || 'FOR DEMONSTRATION PURPOSES ONLY'}
=================================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentData.document_type.toLowerCase()}_demo_document.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fields = documentData.extracted_fields || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {documentData.document_name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                  DEMO DATA
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {documentData.document_number_masked || 'XXXX XXXX 1234'} • {documentData.issued_by || 'Govt Department'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 75}
                title="Zoom Out"
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-300 w-10 text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Zoom In"
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="p-1 text-slate-400 hover:text-white rounded transition ml-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Watermark Banner Top */}
        <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 flex items-center justify-center gap-2 text-center text-rose-300 text-xs font-black uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY</span>
        </div>

        {/* PDF Viewer Canvas Container */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-auto flex items-center justify-center min-h-[360px]">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Background Diagonal Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-30deg] opacity-10 select-none">
              <div className="text-center text-red-500 font-black tracking-widest text-3xl sm:text-5xl leading-tight uppercase">
                DEMO DOCUMENT <br />
                NOT A GOVT RECORD <br />
                FOR DEMO ONLY
              </div>
            </div>

            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-sm">
                  GOV
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {documentData.document_name.toUpperCase()}
                  </h4>
                  <p className="text-xs text-amber-400 font-semibold">
                    {documentData.issued_by || 'Government of India'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Demo</span>
              </span>
            </div>

            {/* Document Fields Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Document Holder</span>
                <span className="text-sm font-bold text-white block">
                  {fields.full_name || fields.account_holder || documentData.citizen_name || 'Hriday Bardia'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Document Number</span>
                <span className="text-sm font-mono font-bold text-amber-300 block">
                  {documentData.document_number_masked || fields.aadhaar_number || fields.pan_number || 'DEMO-DOC-0001'}
                </span>
              </div>

              {fields.date_of_birth && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Date of Birth</span>
                  <span className="text-slate-200 font-semibold block">{fields.date_of_birth}</span>
                </div>
              )}

              {fields.gender && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Gender</span>
                  <span className="text-slate-200 font-semibold block">{fields.gender}</span>
                </div>
              )}

              {fields.address && (
                <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-medium block">Address</span>
                  <span className="text-slate-200 font-medium block leading-relaxed">{fields.address}</span>
                </div>
              )}

              {fields.degree && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Qualification / Degree</span>
                  <span className="text-slate-200 font-semibold block">{fields.degree}</span>
                </div>
              )}

              {fields.valid_until && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Validity Date</span>
                  <span className="text-slate-200 font-semibold block">{fields.valid_until}</span>
                </div>
              )}
            </div>

            {/* Synthetic Document Footer Watermark */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 text-center space-y-1 relative z-10">
              <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">
                DEMO DOCUMENT — NOT A GOVERNMENT-ISSUED DOCUMENT — FOR DEMONSTRATION ONLY
              </p>
              <p className="text-[10px] text-slate-500">
                Generated by AI Citizen Journey Engine Sandbox • Issued for Demonstration Purposes
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
