
import React, { useState, useEffect } from 'react';
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
    
    // 如果是新建，必须有文件；如果是编辑，文件可选
    if (!initialWork && !mainFile) {
      alert("请选择主媒体文件");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = initialWork?.mediaUrl || "";
      let coverUrl = initialWork?.coverUrl;

      // 如果选择了新文件，则转换新文件
      if (mainFile) {
        mediaUrl = await readFileAsDataURL(mainFile);
      }
      if (coverFile) {
        coverUrl = await readFileAsDataURL(coverFile);
      }

      const updatedWork: PortfolioWork = {
        id: initialWork?.id || Date.now().toString(),
        title,
        description,
        prompt,
        mediaType,
        mediaUrl,
        coverUrl,
        tools: tools.split(',').map(t => t.trim()).filter(t => t !== ""),
        createdAt: initialWork?.createdAt || Date.now(),
      };

      onUpload(updatedWork);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      alert("文件解析失败，请检查文件格式。");
      setIsSubmitting(false);
    }
  };

  const handlePolish = async () => {
    if (!title || !description || !prompt) {
      alert("请先填写标题、作品描述和提示词序列。");
      return;
    }
    setIsPolishing(true);
    const polished = await polishDescription(title, description, prompt);
    setDescription(polished);
    setIsPolishing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-xl rounded-sm border border-white/10 shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <span className="text-[#00f2ff] text-[8px] font-bold tracking-widest uppercase mb-1">
              {initialWork ? '数据修改序列 (UPDATE_SEQ)' : '神经系统集成 (NEURAL_INT)'}
            </span>
            <h2 className="text-xl font-black italic tracking-tighter uppercase">
              {initialWork ? '编辑作品记录' : '发布作品记录'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {!initialWork && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">核心媒介 (MODALITY)</label>
              <div className="grid grid-cols-2 gap-4">
                {(['image', 'video'] as const).map(type => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => { setMediaType(type); setCoverFile(null); }}
                    className={`py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${mediaType === type ? 'bg-[#00f2ff] border-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-transparent border-white/10 text-gray-500'}`}
                  >
                    {type === 'image' ? '静态图像' : '动态视频'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">作品标题</label>
                <input 
                  type="text" required value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm p-3 text-white focus:border-[#00f2ff] outline-none transition-colors font-mono"
                  placeholder="请输入作品名称..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">使用工具 (Kling, Midjourney...)</label>
                <input 
                  type="text" value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm p-3 text-white focus:border-[#00f2ff] outline-none transition-colors font-mono text-xs"
                  placeholder="使用英文逗号分隔"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">提示词序列 (PROMPT_SEQ)</label>
              <textarea 
                required value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm p-3 text-white focus:border-[#00f2ff] outline-none h-20 transition-colors font-mono text-xs"
                placeholder="在此粘贴生成作品所用的提示词..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">创作背景描述</label>
                <button 
                  type="button" onClick={handlePolish}
                  disabled={isPolishing || isSubmitting}
                  className="text-[9px] font-black text-[#00f2ff] border border-[#00f2ff]/30 px-2 py-0.5 rounded-sm hover:bg-[#00f2ff]/10 disabled:opacity-30 transition-all"
                >
                  {isPolishing ? 'AI 优化中...' : '✨ GEMINI 润色'}
                </button>
              </div>
              <textarea 
                required value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm p-3 text-white focus:border-[#00f2ff] outline-none h-24 transition-colors font-light text-sm"
                placeholder="描述作品的创作意图和艺术愿景..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {initialWork ? '重注主媒体 (可选)' : '主媒体注入'}
                  </label>
                  <div className="border border-dashed border-white/20 rounded-sm p-6 text-center hover:border-[#00f2ff]/50 transition-colors relative h-32 flex flex-col items-center justify-center">
                    <input 
                      type="file" 
                      accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => setMainFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-[#00f2ff] text-xl mb-1">↑</div>
                    <div className="text-[9px] text-gray-500 font-mono truncate max-w-full px-2">
                      {mainFile ? mainFile.name.toUpperCase() : (initialWork ? '点击更改媒体文件' : `选择${mediaType === 'image' ? '图片' : '视频'}文件`)}
                    </div>
                  </div>
               </div>

               {mediaType === 'video' && (
                 <div className="animate-in slide-in-from-right-4 duration-300">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {initialWork ? '重注视频封面 (可选)' : '视频封面图 (可选)'}
                    </label>
                    <div className="border border-dashed border-white/20 rounded-sm p-6 text-center hover:border-[#7000ff]/50 transition-colors relative h-32 flex flex-col items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="text-[#7000ff] text-xl mb-1">🖼</div>
                      <div className="text-[9px] text-gray-500 font-mono truncate max-w-full px-2">
                        {coverFile ? coverFile.name.toUpperCase() : (initialWork ? '点击更改封面图' : '选择封面图像')}
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 font-black uppercase tracking-[0.5em] text-xs transition-all ${isSubmitting ? 'bg-white/5 text-gray-700 cursor-not-allowed' : 'bg-white text-black hover:bg-[#00f2ff] active:scale-[0.98]'}`}
            >
              {isSubmitting ? '数据同步中...' : (initialWork ? '提交修改更改' : '开始发布作品')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
