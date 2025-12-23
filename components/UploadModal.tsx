
import React, { useState } from 'react';
import { MediaType, PortfolioWork } from '../types';
import { polishDescription } from '../services/geminiService';

interface UploadModalProps {
  onUpload: (work: PortfolioWork) => void;
  onClose: () => void;
  initialWork?: PortfolioWork;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onUpload, onClose, initialWork }) => {
  const [title, setTitle] = useState(initialWork?.title || "");
  const [description, setDescription] = useState(initialWork?.description || "");
  const [tools, setTools] = useState(initialWork?.tools.join(', ') || "");
  const [mediaType, setMediaType] = useState<MediaType>(initialWork?.mediaType || "image");
  
  const [inputMode, setInputMode] = useState<'upload' | 'url'>(initialWork?.mediaUrl.startsWith('data:') ? 'upload' : 'url');
  const [manualUrl, setManualUrl] = useState(initialWork?.mediaUrl || "");

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let mediaUrl = manualUrl;
      if (inputMode === 'upload' && mainFile) {
        mediaUrl = await readFileAsDataURL(mainFile);
      } else if (inputMode === 'upload' && initialWork) {
        mediaUrl = initialWork.mediaUrl;
      }

      if (!mediaUrl) {
        alert("请输入路径或上传资源");
        setIsSubmitting(false);
        return;
      }

      const updatedWork: PortfolioWork = {
        id: initialWork?.id || Date.now().toString(),
        title,
        description,
        mediaType,
        mediaUrl,
        tools: tools.split(',').map(t => t.trim()).filter(t => t !== ""),
        createdAt: initialWork?.createdAt || Date.now(),
      };

      onUpload(updatedWork);
      onClose();
    } catch (err) {
      alert("保存失败");
      setIsSubmitting(false);
    }
  };

  const handlePolish = async () => {
    if (!title || !description) {
      alert("请填写标题和描述以便 AI 优化");
      return;
    }
    setIsPolishing(true);
    const polished = await polishDescription(title, description);
    setDescription(polished);
    setIsPolishing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-sm border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {initialWork ? '修改记录' : '新增作品'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {(['image', 'video'] as const).map(type => (
              <button 
                key={type} type="button"
                onClick={() => setMediaType(type)}
                className={`py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${mediaType === type ? 'bg-[#00f2ff] border-[#00f2ff] text-black' : 'bg-transparent border-white/10 text-gray-500'}`}
              >
                {type === 'image' ? '静态图' : '视频'}
              </button>
            ))}
          </div>

          <div className="flex gap-6 border-b border-white/5 pb-2">
             <button type="button" onClick={() => setInputMode('url')} className={`text-[10px] font-bold uppercase ${inputMode === 'url' ? 'text-[#00f2ff]' : 'text-gray-600'}`}>
               URL / 相对路径
             </button>
             <button type="button" onClick={() => setInputMode('upload')} className={`text-[10px] font-bold uppercase ${inputMode === 'upload' ? 'text-[#00f2ff]' : 'text-gray-600'}`}>
               直接上传
             </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">标题</label>
              <input 
                type="text" required value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#00f2ff] outline-none font-mono text-sm"
              />
            </div>

            {inputMode === 'url' ? (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {mediaType === 'video' ? 'B站链接' : '图片路径 (例如: ./assets/1.jpg)'}
                </label>
                <input 
                  type="text" required value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder={mediaType === 'video' ? 'https://www.bilibili.com/video/BV...' : './assets/image.jpg'}
                  className="w-full bg-white/5 border border-white/10 p-3 text-[#00f2ff] focus:border-[#00f2ff] outline-none font-mono text-xs"
                />
              </div>
            ) : (
              <div className="border border-dashed border-white/20 p-8 text-center relative hover:border-[#00f2ff]/50 transition-colors">
                <input type="file" onChange={e => setMainFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-[10px] text-gray-500 font-mono">{mainFile ? mainFile.name : '点击选择文件'}</span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">描述</label>
                <button type="button" onClick={handlePolish} disabled={isPolishing} className="text-[9px] text-[#00f2ff] uppercase font-black hover:opacity-70 transition-opacity">
                  {isPolishing ? '[ 优化中... ]' : '[ AI 润色 ]'}
                </button>
              </div>
              <textarea 
                required value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#00f2ff] outline-none h-28 text-sm font-light leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">工具 (逗号分隔)</label>
              <input 
                type="text" value={tools}
                onChange={(e) => setTools(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#00f2ff] outline-none font-mono text-xs"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.5em] text-xs hover:bg-[#00f2ff] transition-all"
          >
            {isSubmitting ? '保存中...' : '确认并同步'}
          </button>
        </form>
      </div>
    </div>
  );
};
