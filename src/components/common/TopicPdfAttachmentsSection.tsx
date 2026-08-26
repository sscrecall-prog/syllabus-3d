import React, { useState } from 'react';
import {
  FileText,
  Upload,
  ExternalLink,
  Eye,
  Trash2,
  Download,
  Plus,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Clock,
  HardDrive
} from 'lucide-react';
import { TopicPdfAttachment } from '../../types/syllabus';
import { savePdfToStorage, getPdfBlobUrl, deletePdfFromStorage, openPdfInNewTab } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';

interface TopicPdfAttachmentsSectionProps {
  topicId: string;
  topicName: string;
  attachments?: TopicPdfAttachment[];
  onAddAttachment: (attachment: TopicPdfAttachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

export const TopicPdfAttachmentsSection: React.FC<TopicPdfAttachmentsSectionProps> = ({
  topicId,
  topicName,
  attachments = [],
  onAddAttachment,
  onDeleteAttachment
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlName, setUrlName] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'PDF Document';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setIsUploading(true);
      const attachmentId = 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      // Save file to IndexedDB
      await savePdfToStorage(attachmentId, file, file.name);

      const newAttachment: TopicPdfAttachment = {
        id: attachmentId,
        name: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        storageKey: attachmentId
      };

      onAddAttachment(newAttachment);
      soundManager.playCompleteChime();
      setSuccessNotice(`Added "${file.name}" to topic PDF notes!`);
      setTimeout(() => setSuccessNotice(null), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload PDF:', err);
      setErrorMessage('Failed to save PDF. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddUrlLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlLink.trim()) return;

    const attachmentId = 'pdf_link_' + Date.now();
    const newAttachment: TopicPdfAttachment = {
      id: attachmentId,
      name: urlName.trim() || `${topicName} Study PDF`,
      fileSize: 0,
      uploadedAt: new Date().toISOString(),
      url: urlLink.trim()
    };

    onAddAttachment(newAttachment);
    soundManager.playCompleteChime();
    setUrlName('');
    setUrlLink('');
    setShowUrlInput(false);
    setSuccessNotice('PDF link attached successfully!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleOpenPdf = async (attachment: TopicPdfAttachment) => {
    soundManager.playClick();
    if (attachment.url) {
      openPdfInNewTab(attachment.url, attachment.name);
      return;
    }

    if (attachment.storageKey || attachment.id) {
      const id = attachment.storageKey || attachment.id;
      const blobUrl = await getPdfBlobUrl(id);
      if (blobUrl) {
        openPdfInNewTab(blobUrl, attachment.name);
      } else {
        setErrorMessage('PDF file not found in local storage.');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleDownloadPdf = async (attachment: TopicPdfAttachment) => {
    soundManager.playCompleteChime();
    const fileName = attachment.name.endsWith('.pdf') ? attachment.name : `${attachment.name}.pdf`;

    if (attachment.url) {
      const a = document.createElement('a');
      a.href = attachment.url;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (attachment.storageKey || attachment.id) {
      const id = attachment.storageKey || attachment.id;
      const blobUrl = await getPdfBlobUrl(id);
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setErrorMessage('PDF file not found in local storage.');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleDelete = async (attachment: TopicPdfAttachment) => {
    soundManager.playClick();
    if (attachment.storageKey || attachment.id) {
      await deletePdfFromStorage(attachment.storageKey || attachment.id);
    }
    onDeleteAttachment(attachment.id);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-2 font-serif">
              <span>Attached Topic PDFs & Materials</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                {attachments.length}
              </span>
            </h4>
            <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
              Attach coaching notes, formulas, or textbook PDFs to open in a new Chrome tab.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Saving...' : '+ Upload PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            title="Attach PDF via link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link URL</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Check className="w-4 h-4 stroke-[3] shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* URL Input Form (when toggled) */}
      {showUrlInput && (
        <form onSubmit={handleAddUrlLink} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono block">
            Attach PDF via Web Link (Google Drive / Telegram / Web URL)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={urlName}
              onChange={e => setUrlName(e.target.value)}
              placeholder="PDF Name (e.g. Percentage Class Notes)"
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
            />
            <input
              type="url"
              value={urlLink}
              onChange={e => setUrlLink(e.target.value)}
              placeholder="https://.../notes.pdf"
              required
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              Attach Link
            </button>
          </div>
        </form>
      )}

      {/* PDF List */}
      {attachments.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No PDFs attached for this topic yet. Click <strong>+ Upload PDF</strong> to attach your study notes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-rose-500/30 transition-all group"
            >
              {/* File details */}
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-500 transition-colors">
                    {att.name}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{formatFileSize(att.fileSize)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(att.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {att.url && <span className="text-blue-400">(Web Link)</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {/* 1. View PDF Button (Icon + Label) */}
                <button
                  type="button"
                  onClick={() => handleOpenPdf(att)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="View PDF in new Chrome Tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                {/* 2. Download PDF Button (Icon + Label) */}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(att)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Download PDF to device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {/* 3. Delete PDF Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(att)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Remove PDF"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
