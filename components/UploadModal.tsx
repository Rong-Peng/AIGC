
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
  const [prompt, setPrompt] = useState(initialWork?.prompt || "");
  const [tools, setTools] = useState(initialWork?.tools.join(', ') || "");
  const [mediaType, setMediaType] = useState<MediaType>(initialWork?.mediaType || "image");
  
  // 新增：支持直接输入 URL
  const [inputMode, setInputMode] = useState<'upload' | 'url'>(initialWork?.mediaUrl.startsWith('data:') ? 'upload' : 'url');
  const [manualUrl, setManualUrl] = useState(initialWork?.mediaUrl || "");
  const [manualCoverUrl, setManualCoverUrl] = useState(initialWork?.coverUrl || "");

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
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
      let coverUrl = manualCoverUrl;

      if (inputMode === 'upload') {
        if (mainFile) mediaUrl = await readFileAsDataURL(mainFile);
        else if (initialWork) mediaUrl = initialWork.mediaUrl;
        
        if (coverFile) coverUrl = await readFileAsDataURL(coverFile);
        else if (initialWork) coverUrl = initialWork.coverUrl;
      }

      if (!mediaUrl) {
        alert("缺少媒体资源地址");
        setIsSubmitting(false);
        return;
      }

      const updatedWork: PortfolioWork = {
        id: initialWork?.id || Date.now().toString(),
        title,
        description,
        prompt,
        mediaType,
        mediaUrl,
        coverUrl: coverUrl || undefined,
        tools: tools.split(',').map(t => t.trim()).filter(t => t !== ""),
        createdAt: initialWork?.createdAt || Date.now(),
      };

      onUpload(updatedWork);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      alert("解析失败");
      setIsSubmitting(false);
    }
  };

  const handlePolish = async () => {
    if (!title || !description || !prompt) {
      alert("请完整填写标题、描述和提示词");
      return;
    }
    setIsPolishing(true);
    const polished = await polishDescription(title, description, prompt);
    setDescription(polished);
    setIsPolishing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-xl rounded-sm border border-white/10 shadow-2xl flex flex-col my-8">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {initialWork ? '编辑记录' : '发布作品'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">资源类型</label>
            <div className="grid grid-cols-2 gap-4">
              {(['image', 'video'] as const).map(type => (
                <button 
                  key={type} type="button"
                  onClick={() => setMediaType(type)}
                  className={`py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${mediaType === type ? 'bg-[#00f2ff] border-[#00f2ff] text-black' : 'bg-transparent border-white/10 text-gray-500'}`}
                >
                  {type === 'image' ? '图像' : '视频'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">输入模式</label>
            <div className="flex gap-4">
               <button type="button" onClick={() => setInputMode('url')} className={`text-[10px] font-bold pb-1 border-b-2 ${inputMode === 'url' ? 'border-[#00f2ff] text-white' : 'border-transparent text-gray-600'}`}>
                 输入 URL (B站/外链)
               </button>
               <button type="button" onClick={() => setInputMode('upload')} className={`text-[10px] font-bold pb-1 border-b-2 ${inputMode === 'upload' ? 'border-[#00f2ff] text-white' : 'border-transparent text-gray-600'}`}>
                 上传文件 (Base64)
               </button>
            </div>
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
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {mediaType === 'video' ? 'B站链接或视频 URL' : '图片相对路径或 URL'}
                  </label>
                  <input 
                    type="text" required value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder={mediaType === 'video' ? 'https://www.bilibili.com/video/BV...' : './assets/img1.jpg'}
                    className="w-full bg-white/5 border border-white/10 p-3 text-[#00f2ff] focus:border-[#00f2ff] outline-none font-mono text-xs"
                  />
                </div>
                {mediaType === 'video' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">封面图 URL (B站嵌入建议配封面)</label>
                    <input 
                      type="text" value={manualCoverUrl}
                      onChange={(e) => setManualCoverUrl(e.target.value)}
                      placeholder="./assets/cover1.jpg"
                      className="w-full bg-white/5 border border-white/10 p-3 text-white/50 focus:border-[#00f2ff] outline-none font-mono text-xs"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-white/20 p-4 text-center h-24 flex flex-col justify-center relative">
                  <input type="file" onChange={e => setMainFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-[9px] text-gray-500">{mainFile ? mainFile.name : '选择主文件'}</span>
                </div>
                {mediaType === 'video' && (
                  <div className="border border-dashed border-white/20 p-4 text-center h-24 flex flex-col justify-center relative">
                    <input type="file" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-[9px] text-gray-500">{coverFile ? coverFile.name : '选择封面'}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">描述</label>
                <button type="button" onClick={handlePolish} disabled={isPolishing} className="text-[9px] text-[#00f2ff] border border-[#00f2ff]/30 px-2 py-0.5 rounded-sm hover:bg-[#00f2ff]/10">
                  {isPolishing ? '优化中...' : '✨ AI 润色'}
                </button>
              </div>
              <textarea 
                required value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#00f2ff] outline-none h-24 text-sm font-light"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">提示词 (PROMPT)</label>
              <textarea 
                required value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#00f2ff] outline-none h-16 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">工具 (逗号隔开)</label>
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
            {isSubmitting ? '同步中...' : '保存记录'}
          </button>
        </form>
      </div>
    </div>
  );
};
