import React, { useEffect, useState } from 'react';

interface AIReplyTextProps {
  text: string;
  animate: boolean;
  onComplete: () => void;
}

export const AIReplyText: React.FC<AIReplyTextProps> = ({ text, animate, onComplete }) => {
  const [visibleLength, setVisibleLength] = useState(0);
  const characters = Array.from(text);

  useEffect(() => {
    if (!animate) return;
    setVisibleLength(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !text) {
      onComplete();
      return;
    }
    const total = Array.from(text).length;
    // Reveal smoothly, but keep long replies from taking more than ~12 seconds.
    const step = Math.max(2, Math.ceil(total / 400));
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed = Math.min(total, revealed + step);
      setVisibleLength(revealed);
      if (revealed === total) {
        window.clearInterval(timer);
        onComplete();
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, [text, animate, onComplete]);

  const typing = animate && visibleLength < characters.length;
  return (
    <span aria-busy={typing}>
      {animate ? characters.slice(0, visibleLength).join('') : text}
      {typing && <span aria-hidden="true" className="inline-block ml-0.5 text-[#FF385C] animate-pulse">▍</span>}
    </span>
  );
};
