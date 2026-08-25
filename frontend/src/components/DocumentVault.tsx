'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Download,
  Sparkles,
  Info,
  Lock,
  FileCheck
} from 'lucide-react';
import { buildDocumentPacketAPI } from '@/lib/api';
import { PdfViewerModal } from '@/components/PdfViewerModal';


export interface DocumentItem {
  id: string;
  document_type: string;
  document_name?: string;
  document_number_masked?: string;
  file_name: string;
  file_size?: number;
  status: string;
  verification_status: string;
  is_synthetic?: boolean;
  synthetic_notice?: string;
  issued_by?: string;
  extracted_fields?: Record<string, any>;
  field_confidence?: Record<string, number>;
  overall_confidence?: number;
  expiry_status?: string;
}


interface DocumentVaultProps {
  documents?: DocumentItem[];
  consistencyStatus?: {
    identity_status: string;
    dob_status: string;
    overall_status: string;
    discrepancies: string[];
  };
  onUpload?: (file?: File) => void;
  goalCategory?: string;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents = [],
  consistencyStatus,
  onUpload,
  goalCategory = 'business'
}) => {
  const { t } = useLanguage();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isBuildingPacket, setIsBuildingPacket] = useState(false);
  const [packetResult, setPacketResult] = useState<any>(null);

  const handleDownloadPacket = async () => {
    setIsBuildingPacket(true);
    const res = await buildDocumentPacketAPI(goalCategory);
    setIsBuildingPacket(false);
    if (res) {
      setPacketResult(res);
    }
  };

  const getVerificationBadge = (vStatus: string, isSynthetic?: boolean) => {
    if (isSynthetic || vStatus === 'DEMO_SYNTHETIC') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {t('documents.demoSynthetic')}
        </span>
      );
    }
    if (vStatus === 'ISSUER_VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {t('documents.issuerVerified')}
        </span>
      );
    }
    if (vStatus === 'OCR_EXTRACTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
          <FileCheck className="w-3 h-3 text-cyan-400" />
          {t('documents.ocrExtracted')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
        <Info className="w-3 h-3 text-slate-400" />
        {t('documents.userProvided')}
      </span>
    );
  };

  const [pdfDocToView, setPdfDocToView] = useState<any>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{t('documents.myDocumentVault')}</span>
              <span className="text-xs font-normal text-slate-400">({documents.length} {t('documents.available')})</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('documents.encryptedVault')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPacket}
            disabled={isBuildingPacket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBuildingPacket ? t('documents.buildingPacket') : t('documents.downloadPacket')}</span>
          </button>
        </div>
      </div>

      {/* Cross-Document Consistency Banner */}
      {consistencyStatus && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">{t('documents.crossDocConsistency')} </span>
              <span className={`font-bold uppercase ${
                consistencyStatus.overall_status === 'CONSISTENT' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {consistencyStatus.overall_status}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            {consistencyStatus.discrepancies.length === 0
              ? t('documents.allMatch')
              : `⚠️ ${consistencyStatus.discrepancies[0]}`}
          </div>
        </div>
      )}

      {/* File Upload Zone */}
      <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl p-5 text-center cursor-pointer transition bg-slate-950/40 space-y-2 group relative">
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUpload) {
              onUpload(file);
            }
          }}
        />
        <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition">
          <Upload className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-300">{t('documents.clickOrDrag')}</p>
          <p className="text-[10px] text-slate-500">{t('documents.supportsPDF')}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400">{t('documents.noDocumentsYet')}</p>
            {onUpload && (
              <button
                onClick={() => onUpload()}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow"
              >
                <Upload className="w-4 h-4" />
                <span>{t('documents.uploadFirst')}</span>
              </button>
            )}
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-100">
                      {doc.document_name || doc.document_type}
                    </h4>
                    {getVerificationBadge(doc.verification_status, doc.is_synthetic)}
                    {doc.expiry_status === 'NO_EXPIRY' && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{t('documents.noExpiry')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {doc.document_number_masked ? `${doc.document_number_masked} • ` : ''}{doc.file_name}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPdfDocToView(doc)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('documents.viewPDF')}</span>
                  </button>

                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('documents.fields')}</span>
                  </button>
                </div>
              </div>

              {/* Synthetic Notice Disclaimer Banner */}
              {doc.synthetic_notice && (
                <div className="text-[11px] font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{doc.synthetic_notice}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* PDF Viewer Modal */}
      {pdfDocToView && (
        <PdfViewerModal
          documentData={pdfDocToView}
          onClose={() => setPdfDocToView(null)}
        />
      )}


      {/* Extracted Fields Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{t('documents.extractedFields')}</span>
                  <span className="text-xs font-medium text-amber-400">({selectedDoc.document_type})</span>
                </h4>
                <p className="text-xs text-slate-400">{t('documents.ocrExtraction')}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {Object.keys(selectedDoc.extracted_fields || {}).length === 0 ? (
                <p className="text-xs text-slate-400 italic">{t('documents.noStructuredFields')}</p>
              ) : (
                Object.entries(selectedDoc.extracted_fields || {}).map(([key, value]) => (
                  <div key={key} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-slate-100 font-mono">{String(value)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('documents.piiMinimization')}</span>
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preparation Packet Modal */}
      {packetResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('documents.applicationPacketReady')}</span>
              </h4>
              <button
                onClick={() => setPacketResult(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {packetResult.summary_text}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-semibold">{packetResult.synthetic_disclaimer}</span>
              <button
                onClick={() => setPacketResult(null)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
              >
                {t('common.download')} (.PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
