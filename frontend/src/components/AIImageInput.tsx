import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface Props {
  disabled: boolean;
  onAnalyze: (image: string, thumbnail: string) => Promise<void>;
}

export const AIImageInput: React.FC<Props> = ({ disabled, onAnalyze }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{ image: string; thumbnail: string } | null>(null);
  const [error, setError] = useState('');
  const stopCamera = () => {
    requestRef.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setOpening(false);
  };
  const close = () => { stopCamera(); setSelected(null); setError(''); };

  useEffect(() => () => {
    requestRef.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);
  useEffect(() => {
    if (!cameraOpen || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => setError('Không phát được camera. Hãy thử tải ảnh lên.'));
    // The AI page stays mounted when switching tabs; stop any hidden camera.
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) stopCamera();
    });
    observer.observe(videoRef.current);
    const onHidden = () => { if (document.hidden) stopCamera(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onHidden); };
  }, [cameraOpen]);
  useEffect(() => {
    if (selected || cameraOpen || opening) dialogRef.current?.focus();
  }, [selected, cameraOpen, opening]);

  const prepare = (source: CanvasImageSource, width: number, height: number) => {
    if (!width || !height) throw new Error('Chưa nhận được hình ảnh. Hãy thử lại.');
    const render = (maxSide: number, quality: number) => {
      const ratio = Math.min(1, maxSide / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
    };
    const image = render(1600, 0.82);
    if (image.length > 4 * 1024 * 1024) throw new Error('Ảnh còn quá lớn. Hãy chọn ảnh nhỏ hơn.');
    setSelected({ image, thumbnail: render(240, 0.65) });
    setError('');
    stopCamera();
  };
  const selectFile = async (file?: File) => {
    if (!file) return;
    setError(''); setBusy(true);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG và WEBP.');
      if (file.size > 10 * 1024 * 1024) throw new Error('File gốc tối đa 10MB.');
      const bitmap = await createImageBitmap(file);
      try { prepare(bitmap, bitmap.width, bitmap.height); } finally { bitmap.close(); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Không đọc được ảnh.'); }
    finally { setBusy(false); }
  };
  const openCamera = async () => {
    setError(''); setOpening(true);
    const request = ++requestRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera cần HTTPS hoặc localhost. Bạn có thể tải ảnh lên.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1600 } }, audio: false });
      if (request !== requestRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream; setCameraOpen(true);
    } catch (e) {
      if (request === requestRef.current) setError(e instanceof Error && e.name === 'NotAllowedError'
        ? 'Bạn chưa cấp quyền camera. Hãy cấp quyền hoặc tải ảnh lên.' : 'Không mở được camera. Hãy kiểm tra thiết bị, HTTPS và quyền truy cập hoặc tải ảnh lên.');
    } finally { if (request === requestRef.current) setOpening(false); }
  };
  const analyze = async () => {
    if (!selected || disabled || busy) return;
    setBusy(true); setError('');
    try { await onAnalyze(selected.image, selected.thumbnail); close(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không phân tích được ảnh.'); }
    finally { setBusy(false); }
  };

  return <>
    <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2 items-center">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Chọn ảnh để AI phân tích"
        onChange={e => { void selectFile(e.target.files?.[0]); e.target.value = ''; }} />
      <button type="button" disabled={disabled || busy || opening} onClick={() => void openCamera()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs disabled:opacity-40"><Camera className="w-4 h-4" />Chụp ảnh</button>
      <button type="button" disabled={disabled || busy || opening} onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs disabled:opacity-40"><Upload className="w-4 h-4" />Tải ảnh lên</button>
      {error && !selected && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
    {(selected || cameraOpen || opening) && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Ảnh cho Trợ lý AI" tabIndex={-1}
        onKeyDown={e => { if (e.key === 'Escape' && !busy) close(); }}
        className="w-full max-w-lg max-h-[90dvh] overflow-auto bg-white rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center"><h2 className="font-bold">{selected ? 'Xem trước ảnh' : 'Chụp ảnh'}</h2>
          <button disabled={busy} onClick={close} aria-label="Đóng ảnh"><X className="w-5 h-5" /></button></div>
        {opening && <p>Đang chờ quyền camera…</p>}
        {cameraOpen && <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-[50dvh] bg-black rounded-xl" />}
        {selected && <img src={selected.image} alt="Ảnh chuẩn bị gửi cho AI" className="w-full max-h-[50dvh] object-contain rounded-xl" />}
        <p className="text-xs text-stone-600">AI sẽ nhận diện hóa đơn, phong cảnh, đồ ăn hoặc ảnh khác. Ảnh chỉ được gửi tới DeepSeek khi bấm “Phân tích ảnh”. Hãy che thông tin cá nhân trước khi gửi.</p>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        {cameraOpen && <button onClick={() => { try { const v = videoRef.current!; prepare(v, v.videoWidth, v.videoHeight); } catch (e) { setError(e instanceof Error ? e.message : 'Không chụp được ảnh.'); } }}
          className="w-full rounded-xl bg-[#FF385C] text-white py-2.5">Chụp hình</button>}
        {selected && <button disabled={busy || disabled} onClick={() => void analyze()}
          className="w-full rounded-xl bg-[#FF385C] text-white py-2.5 disabled:opacity-50">{busy ? 'Đang phân tích…' : 'Phân tích ảnh'}</button>}
        <button disabled={busy} onClick={close} className="w-full py-2 text-sm">Hủy</button>
      </div>
    </div>}
  </>;
};
