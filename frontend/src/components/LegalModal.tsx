import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, ShieldCheck, Info, AlertTriangle } from 'lucide-react';
import { LEGAL_DOCUMENTS, LEGAL_INFO, LegalBlock } from '../data/legalContent';

export type LegalDocId = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  initialDoc?: LegalDocId;
  onClose: () => void;
}

// Tô vàng các chỗ [cần điền] để dễ phát hiện trước khi phát hành
const renderText = (text: string) =>
  text.split(/(\[[^\]]+\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={i} className="bg-amber-100 text-amber-900 rounded px-1 font-semibold">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );

const Block: React.FC<{ block: LegalBlock }> = ({ block }) => {
  if (typeof block === 'string') {
    return <p className="text-sm leading-relaxed text-[#3F3F3F]">{renderText(block)}</p>;
  }
  if (block.type === 'list') {
    return (
      <ul className="space-y-2 pl-1">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#3F3F3F]">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#FF385C] shrink-0" />
            <span>{renderText(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === 'note') {
    const isWarning = block.tone === 'warning';
    const Icon = isWarning ? AlertTriangle : Info;
    return (
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 text-sm leading-relaxed ${
          isWarning ? 'bg-rose-50 border-rose-200 text-rose-900 font-semibold' : 'bg-sky-50 border-sky-100 text-sky-900'
        }`}
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isWarning ? 'text-rose-600' : 'text-sky-600'}`} />
        <span>{renderText(block.text)}</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E5E5]">
      <table className="w-full text-xs sm:text-sm text-left">
        <thead className="bg-[#F7F7F7] text-[#222222]">
          <tr>
            {block.head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-extrabold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i} className="border-t border-[#E5E5E5] align-top">
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2.5 leading-relaxed ${j === 0 ? 'font-bold text-[#222222] min-w-[120px]' : 'text-[#3F3F3F]'}`}>
                  {renderText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, initialDoc = 'terms', onClose }) => {
  const [docId, setDocId] = useState<LegalDocId>(initialDoc);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setDocId(initialDoc);
  }, [isOpen, initialDoc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [docId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const doc = LEGAL_DOCUMENTS[docId];

  const scrollToSection = (id: string) => {
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(`#legal-${id}`);
    if (container && target) container.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
      >
        {/* Header + tab chuyển tài liệu */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-full flex-1 sm:flex-none sm:w-[420px]">
            {(['terms', 'privacy'] as LegalDocId[]).map((id) => {
              const Icon = id === 'terms' ? FileText : ShieldCheck;
              return (
                <button
                  key={id}
                  onClick={() => setDocId(id)}
                  className={`py-2 px-2 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    docId === id ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${docId === id ? 'text-[#FF385C]' : ''}`} />
                  <span className="truncate">{LEGAL_DOCUMENTS[id].title}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Mục lục (desktop) */}
          <nav className="hidden md:block w-64 shrink-0 border-r border-[#E5E5E5] overflow-y-auto p-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#717171] px-3 pb-2">Mục lục</div>
            {doc.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#3F3F3F] hover:bg-[#F7F7F7] hover:text-[#222222] cursor-pointer transition-colors"
              >
                {s.heading}
              </button>
            ))}
          </nav>

          {/* Nội dung */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
            <article className="max-w-3xl mx-auto p-5 sm:p-8 space-y-8">
              <header className="space-y-3 pb-6 border-b border-[#E5E5E5]">
                <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">{doc.title}</h1>
                <p className="text-sm text-[#717171] leading-relaxed">{doc.summary}</p>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-[#FF385C]/10 text-[#FF385C]">
                    Hiệu lực từ {LEGAL_INFO.effectiveDate}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[#717171]">
                    Phiên bản {LEGAL_INFO.version}
                  </span>
                </div>
              </header>

              {doc.sections.map((section) => (
                <section key={section.id} id={`legal-${section.id}`} className="space-y-3 scroll-mt-4">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#222222]">{section.heading}</h2>
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </section>
              ))}

              <footer className="pt-6 border-t border-[#E5E5E5] text-xs text-[#717171]">
                © 2026 VietGo. Nếu có câu hỏi về {docId === 'terms' ? 'điều khoản' : 'quyền riêng tư'}, vui lòng liên hệ{' '}
                {renderText(docId === 'terms' ? LEGAL_INFO.supportEmail : LEGAL_INFO.privacyEmail)}.
              </footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};
