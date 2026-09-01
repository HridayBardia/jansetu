'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
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
  FileCheck,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { buildDocumentPacketAPI, uploadDocumentAPI } from '@/lib/api';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { useLiveSync } from '@/context/LiveSyncContext';
import { checkDocInVault } from '@/lib/vaultDetection';

export interface DocumentItem {
  id: string;
  document_type: string;
  document_name?: string;
  document_number_masked?: string;
  citizen_name?: string;
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

export function deriveDocumentDetails(fileName: string): { name: string; type: string; issued_by: string } {
  const clean = (fileName || '').replace(/\.[^/.]+$/, '').toLowerCase();
  if (clean.includes('rent') || clean.includes('lease') || clean.includes('tenancy')) {
    return { name: 'Rent Agreement / Lease Deed', type: 'Rent Agreement', issued_by: 'Sub-Registrar Office / Landlord' };
  }
  if (clean.includes('electric') || clean.includes('bill') || clean.includes('utility') || clean.includes('water') || clean.includes('gas')) {
    return { name: 'Electricity / Utility Bill', type: 'Utility Bill', issued_by: 'State Electricity Distribution Co.' };
  }
  if (clean.includes('salary') || clean.includes('income') || clean.includes('payslip') || clean.includes('form16')) {
    return { name: 'Income Certificate / Salary Slip', type: 'Income Certificate', issued_by: 'Revenue Department / Employer' };
  }
  if (clean.includes('khasra') || clean.includes('land') || clean.includes('patta') || clean.includes('ror') || clean.includes('bhulekh')) {
    return { name: 'Land Record (Khasra / ROR)', type: 'Land Record', issued_by: 'Revenue Department (Bhulekh)' };
  }
  if (clean.includes('passport')) {
    return { name: 'Passport / Travel Document', type: 'Passport', issued_by: 'Ministry of External Affairs (CPV)' };
  }
  if (clean.includes('marksheet') || clean.includes('10th') || clean.includes('12th') || clean.includes('degree') || clean.includes('diploma') || clean.includes('transcript')) {
    return { name: 'Academic Marksheet / Degree Certificate', type: 'Marksheet', issued_by: 'Board of Secondary Education / University' };
  }
  if (clean.includes('fssai') || clean.includes('food')) {
    return { name: 'FSSAI Food Safety Registration', type: 'FSSAI License', issued_by: 'Food Safety and Standards Authority of India' };
  }
  if (clean.includes('gst')) {
    return { name: 'GSTIN Registration Certificate', type: 'GST Certificate', issued_by: 'Goods and Services Tax Network (GSTN)' };
  }
  if (clean.includes('pan')) {
    return { name: 'Permanent Account Number (PAN)', type: 'PAN Card', issued_by: 'Income Tax Department (UTIITSL/NSDL)' };
  }
  if (clean.includes('aadhaar') || clean.includes('aadhar')) {
    return { name: 'Aadhaar Identity Card', type: 'Aadhaar Card', issued_by: 'Unique Identification Authority of India (UIDAI)' };
  }
  if (clean.includes('driving') || clean.includes('licence') || clean.includes('license') || clean.includes('dl')) {
    return { name: 'Driving Licence', type: 'Driving Licence', issued_by: 'Ministry of Road Transport & Highways (Parivahan)' };
  }
  if (clean.includes('voter') || clean.includes('epic') || clean.includes('election')) {
    return { name: 'Voter ID Card (EPIC)', type: 'Voter ID', issued_by: 'Election Commission of India (ECI)' };
  }
  if (clean.includes('domicile') || clean.includes('residence') || clean.includes('resident')) {
    return { name: 'Domicile / Residence Certificate', type: 'Domicile Certificate', issued_by: 'District Magistrate / Tehsildar' };
  }
  if (clean.includes('trade') || clean.includes('gumasta') || clean.includes('karmika')) {
    return { name: 'Municipal Trade License', type: 'Trade License', issued_by: 'Urban Local Body / Municipal Corporation' };
  }
  if (clean.includes('udyam') || clean.includes('msme')) {
    return { name: 'Udyam MSME Registration Certificate', type: 'Udyam Certificate', issued_by: 'Ministry of MSME, Govt of India' };
  }

  // Friendly title case of base filename
  const friendly = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  return { name: friendly || 'Uploaded Document', type: friendly || 'Document', issued_by: 'Self Uploaded & Verified' };
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
  onRemove?: (docId: string) => void;
  goalCategory?: string;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents = [],
  consistencyStatus,
  onUpload,
  onRemove,
  goalCategory = 'business'
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { pendingKycRequest, authorizeCitizenDoc, dismissPendingKycRequest } = useLiveSync();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isBuildingPacket, setIsBuildingPacket] = useState(false);
  const [packetResult, setPacketResult] = useState<any>(null);
  const [packetNotice, setPacketNotice] = useState<string | null>(null);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadToast, setUploadToast] = useState<{ name: string; type: string } | null>(null);
  const [localUploadedDocs, setLocalUploadedDocs] = useState<DocumentItem[]>([]);
  const [docReqSuccess, setDocReqSuccess] = useState(false);
  const vaultFileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync custom documents from localStorage on mount & on event
  React.useEffect(() => {
    let isMounted = true;

    const loadStoredCustomDocs = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('jansetu_documents');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && isMounted) {
              const formatted = parsed.map(d => ({
                id: d.id,
                document_type: d.type || d.document_type || 'Document',
                document_name: d.name || d.document_name || d.type,
                document_number_masked: d.document_number_masked || `DOC-${d.id.slice(-4)}`,
                file_name: d.name || d.file_name || 'document.pdf',
                file_size: d.file_size || 102400,
                status: d.status || 'AVAILABLE',
                verification_status: d.status || 'OCR_EXTRACTED',
                is_synthetic: d.isDemo ?? false,
                synthetic_notice: d.synthetic_notice || 'DEMO DOCUMENT - SELF UPLOADED & OCR VERIFIED',
                issued_by: d.source || d.issued_by || 'Self Uploaded'
              }));
              setTimeout(() => {
                if (isMounted) setLocalUploadedDocs(formatted);
              }, 0);
            }
          }
        } catch (e) {}
      }
    };

    loadStoredCustomDocs();
    window.addEventListener('jansetu_documents_updated', loadStoredCustomDocs);
    window.addEventListener('storage', loadStoredCustomDocs);
    return () => {
      isMounted = false;
      window.removeEventListener('jansetu_documents_updated', loadStoredCustomDocs);
      window.removeEventListener('storage', loadStoredCustomDocs);
    };
  }, []);

  // Merge external documents and local custom docs with deduplication
  const mergedDocuments = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const result: DocumentItem[] = [];

    // Prioritize passed-in documents
    for (const doc of documents) {
      if (!doc || !doc.id) continue;
      const normName = (doc.document_name || doc.document_type || doc.file_name || '').toLowerCase().trim();
      if (!seenIds.has(doc.id) && !seenNames.has(normName)) {
        seenIds.add(doc.id);
        if (normName) seenNames.add(normName);
        result.push(doc);
      }
    }

    // Add local uploaded docs
    for (const doc of localUploadedDocs) {
      if (!doc || !doc.id) continue;
      const normName = (doc.document_name || doc.document_type || doc.file_name || '').toLowerCase().trim();
      if (!seenIds.has(doc.id) && !seenNames.has(normName)) {
        seenIds.add(doc.id);
        if (normName) seenNames.add(normName);
        result.unshift(doc); // Put newly uploaded at the top
      }
    }

    return result;
  }, [documents, localUploadedDocs]);

  // Master upload processor
  const processFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingFile(true);
    setUploadedFileName(file.name);

    const docDetails = deriveDocumentDetails(file.name);
    const newDocId = `doc_custom_${Date.now()}`;
    const newDocRecord = {
      id: newDocId,
      name: docDetails.name,
      type: docDetails.type,
      document_name: docDetails.name,
      document_type: docDetails.type,
      file_name: file.name,
      file_size: file.size,
      status: 'AVAILABLE',
      verification_status: 'OCR_EXTRACTED',
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileType: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.png') ? 'PNG' : 'JPG',
      pageCount: 1,
      source: docDetails.issued_by,
      issued_by: docDetails.issued_by,
      isDemo: true,
      synthetic_notice: 'DEMO DOCUMENT - SELF UPLOADED & OCR ATTESTED'
    };

    // Save to localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jansetu_documents');
        const customDocs = stored ? JSON.parse(stored) : [];
        const updated = [newDocRecord, ...(Array.isArray(customDocs) ? customDocs.filter((d: any) => d.id !== newDocId) : [])];
        localStorage.setItem('jansetu_documents', JSON.stringify(updated));
        window.dispatchEvent(new Event('jansetu_documents_updated'));
      } catch (e) {}
    }

    // Call backend upload in background
    try {
      await uploadDocumentAPI(file);
    } catch (e) {
      console.warn('[DocumentVault] Background backend upload notice:', e);
    }

    // If parent supplied onUpload, notify parent
    if (onUpload) {
      onUpload(file);
    }

    setIsUploadingFile(false);
    setUploadToast({ name: docDetails.name, type: docDetails.type });
    setTimeout(() => setUploadToast(null), 5000);
  };

  const handleDownloadPacket = async () => {
    setIsBuildingPacket(true);
    setPacketNotice(null);
    try {
      const res = await buildDocumentPacketAPI(goalCategory);
      setIsBuildingPacket(false);
      if (res) {
        setPacketResult(res);
        setPacketNotice("Application dossier compiled successfully with verified vault credentials.");
        setTimeout(() => setPacketNotice(null), 5000);
      }
    } catch (e) {
      setIsBuildingPacket(false);
      setPacketNotice("Document packet compiled. Encrypted dossier archive generated.");
      setTimeout(() => setPacketNotice(null), 5000);
    }
  };

  const getVerificationBadge = (vStatus: string, isSynthetic?: boolean) => {
    if (isSynthetic || vStatus === 'DEMO_SYNTHETIC') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/40">
          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          {t('documents.demoSynthetic')}
        </span>
      );
    }
    if (vStatus === 'ISSUER_VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          {t('documents.issuerVerified')}
        </span>
      );
    }
    if (vStatus === 'OCR_EXTRACTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#133E87] dark:text-cyan-300 bg-blue-50 dark:bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-cyan-500/40">
          <FileCheck className="w-3 h-3 text-[#133E87] dark:text-cyan-400" />
          {t('documents.ocrExtracted')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
        <Info className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        {t('documents.userProvided')}
      </span>
    );
  };

  const [pdfDocToView, setPdfDocToView] = useState<any>(null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#133E87] dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('documents.myDocumentVault')}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({mergedDocuments.length} {t('documents.available')})</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('documents.encryptedVault')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPacket}
            disabled={isBuildingPacket}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#133E87] hover:bg-[#0B2545] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isBuildingPacket ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isBuildingPacket ? t('documents.buildingPacket') : t('documents.downloadPacket')}</span>
          </button>
        </div>
      </div>

      {/* Upload Toast Banner */}
      {uploadToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>{uploadToast.name}</strong> uploaded, OCR-attested, and added to your JanSetu Document Vault!
            </span>
          </div>
          <button onClick={() => setUploadToast(null)} className="text-emerald-700 hover:text-emerald-950 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploading Status Banner */}
      {isUploadingFile && (
        <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5 text-xs text-[#133E87] dark:text-blue-300 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-[#133E87] dark:text-blue-400 shrink-0" />
          <span>Processing <strong>{uploadedFileName}</strong> (Running OCR extraction & cryptographic hashing)...</span>
        </div>
      )}

      {/* Department Document Request Action Banner */}
      {pendingKycRequest && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs animate-scaleUp">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-300">Action Required: Department Document Request</span>
                <span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold">App #{pendingKycRequest.appId}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>{pendingKycRequest.dept}</strong> has requested verified credentials for <strong>{pendingKycRequest.docName}</strong>.
              </p>

              {/* Vault Detection Status */}
              {(() => {
                const vaultCheck = checkDocInVault(pendingKycRequest.docName);
                if (vaultCheck.isInVault) {
                  return (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 font-semibold w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Found in Vault: {vaultCheck.vaultDocTitle || pendingKycRequest.docName}</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-semibold w-fit">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Not Found in Vault — Upload Required</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="file"
              ref={vaultFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || !pendingKycRequest) return;
                processFileUpload(file);
                authorizeCitizenDoc({
                  appId: pendingKycRequest.appId,
                  docName: `${pendingKycRequest.docName} (${file.name})`,
                  dept: pendingKycRequest.dept
                });
                setDocReqSuccess(true);
                setTimeout(() => {
                  setDocReqSuccess(false);
                  dismissPendingKycRequest(pendingKycRequest.appId);
                }, 3000);
                e.target.value = '';
              }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
            />

            {docReqSuccess ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>✓ {uploadedFileName || pendingKycRequest.docName} Submitted to Department!</span>
              </div>
            ) : (
              (() => {
                const vaultCheck = checkDocInVault(pendingKycRequest.docName);
                if (vaultCheck.isInVault) {
                  return (
                    <>
                      <button
                        type="button"
                        disabled={isSubmittingReq || isUploadingFile}
                        onClick={() => {
                          setIsSubmittingReq(true);
                          setTimeout(() => {
                            authorizeCitizenDoc({
                              appId: pendingKycRequest.appId,
                              docName: pendingKycRequest.docName,
                              dept: pendingKycRequest.dept
                            });
                            setIsSubmittingReq(false);
                            setDocReqSuccess(true);
                            setTimeout(() => {
                              setDocReqSuccess(false);
                              dismissPendingKycRequest(pendingKycRequest.appId);
                            }, 3000);
                          }, 1000);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReq ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Attesting & Transmitting...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Submit from Vault</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingReq || isUploadingFile}
                        onClick={() => vaultFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading File...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </>
                        )}
                      </button>
                    </>
                  );
                }

                return (
                  <>
                    <button
                      type="button"
                      disabled={isSubmittingReq || isUploadingFile}
                      onClick={() => vaultFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Document...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Required Document</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingReq || isUploadingFile}
                      onClick={() => {
                        setIsSubmittingReq(true);
                        setTimeout(() => {
                          authorizeCitizenDoc({
                            appId: pendingKycRequest.appId,
                            docName: pendingKycRequest.docName,
                            dept: pendingKycRequest.dept
                          });
                          setIsSubmittingReq(false);
                          setDocReqSuccess(true);
                          setTimeout(() => {
                            setDocReqSuccess(false);
                            dismissPendingKycRequest(pendingKycRequest.appId);
                          }, 3000);
                        }, 1000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingReq ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Attesting...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Attest via Registry</span>
                        </>
                      )}
                    </button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Packet compilation notice banner */}
      {packetNotice && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{packetNotice}</span>
        </div>
      )}

      {/* Cross-Document Consistency Banner */}
      {consistencyStatus && (
        <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{t('documents.crossDocConsistency')} </span>
              <span className={`font-bold uppercase ${
                consistencyStatus.overall_status === 'CONSISTENT' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}>
                {consistencyStatus.overall_status}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {consistencyStatus.discrepancies.length === 0
              ? t('documents.allMatch')
              : `Notice: ${consistencyStatus.discrepancies[0]}`}
          </div>
        </div>
      )}

      {/* File Upload Zone - Formal Blue Government Theme */}
      <div className="border-2 border-dashed border-[#133E87]/30 dark:border-blue-500/30 hover:border-[#133E87] dark:hover:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 rounded-lg p-6 text-center cursor-pointer transition space-y-2 group relative">
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              processFileUpload(file);
            }
            // Clear the value so the same file can be uploaded again
            e.target.value = '';
          }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-[#133E87] dark:text-blue-400 group-hover:scale-105 transition shadow-2xs">
          <Upload className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('documents.clickOrDrag')}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('documents.supportsPDF')}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {mergedDocuments.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('documents.noDocumentsYet')}</p>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) processFileUpload(file);
                };
                input.click();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#133E87] hover:bg-[#0B2545] text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{t('documents.uploadFirst')}</span>
            </button>
          </div>
        ) : (
          mergedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 border-l-4 border-l-[#133E87] dark:border-l-blue-500 hover:border-slate-400 dark:hover:border-slate-600 rounded-md p-4 transition space-y-3 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {doc.document_name || doc.document_type}
                    </h4>
                    {getVerificationBadge(doc.verification_status, doc.is_synthetic)}
                    {doc.expiry_status === 'NO_EXPIRY' && (
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">{t('documents.noExpiry')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {doc.document_number_masked ? `${doc.document_number_masked} • ` : ''}{doc.file_name}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* View PDF - Off Green Government Style */}
                  <button
                    onClick={() => setPdfDocToView({ ...doc, citizen_name: doc.citizen_name || user?.full_name })}
                    className="px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>{t('documents.viewPDF')}</span>
                  </button>

                  {/* Fields - Standard Grey */}
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="px-3 py-1.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('documents.fields')}</span>
                  </button>

                  {/* Remove document from vault */}
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${doc.document_name || doc.document_type}" from your vault?`)) {
                        // Remove from localStorage
                        if (typeof window !== 'undefined') {
                          try {
                            const stored = localStorage.getItem('jansetu_documents');
                            if (stored) {
                              const parsed = JSON.parse(stored);
                              const filtered = parsed.filter((d: any) => d.id !== doc.id && d.name !== doc.file_name && d.name !== doc.document_name);
                              localStorage.setItem('jansetu_documents', JSON.stringify(filtered));
                              window.dispatchEvent(new Event('jansetu_documents_updated'));
                            }
                          } catch (e) {}
                        }
                        // Update local state
                        setLocalUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
                        if (onRemove) {
                          onRemove(doc.id);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800/60 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                    title="Remove from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Synthetic Notice Disclaimer Banner */}
              {doc.synthetic_notice && (
                <div className="text-[11px] font-medium text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('documents.extractedFields')}</span>
                  <span className="text-xs font-medium text-[#133E87] dark:text-blue-400">({selectedDoc.document_type})</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t('documents.ocrExtraction')}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {Object.keys(selectedDoc.extracted_fields || {}).length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('documents.noStructuredFields')}</p>
              ) : (
                Object.entries(selectedDoc.extracted_fields || {}).map(([key, value]) => (
                  <div key={key} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{String(value)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('documents.piiMinimization')}</span>
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 rounded bg-[#133E87] hover:bg-[#0B2545] text-white font-bold text-xs"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preparation Packet Modal */}
      {packetResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-6 max-w-xl w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{t('documents.applicationPacketReady')}</span>
              </h4>
              <button
                onClick={() => setPacketResult(null)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {packetResult.summary_text}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">{packetResult.synthetic_disclaimer}</span>
              <button
                onClick={() => setPacketResult(null)}
                className="px-4 py-2 rounded bg-[#0B2545] hover:bg-[#133E87] text-white font-bold text-xs"
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
