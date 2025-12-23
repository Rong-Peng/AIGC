
import React, { useEffect, useState } from 'react';
import { PortfolioWork } from '../types';
import { generateCreativeFeedback } from '../services/geminiService';

interface WorkDetailModalProps {
  work: PortfolioWork | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (work: PortfolioWork) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({ work, onClose, onDelete, onEdit }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (work) {
      setLoading(true);
      generateCreativeFeedback(work.description).then(res => {
        setAiInsight(res);
        setLoading(false);
      });
    }
  }, [work]);

  useEffect(() => {
    if (aiInsight) {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(aiInsight.slice(0, i));
        i++;
        if (i > aiInsight.length) clearInterval(timer);
      }, 30);
      return () => clearInterval(timer);
    }
  }, [aiInsight]);

  if (!work) return null;

  // 识别 B站链接并提取 BV 号，优化 embed 地址
  const getBilibiliEmbedUrl = (url: string) => {
    const bvMatch = url.match(/BV[a-zA-Z0-9]+/i);
    if (bvMatch) {
      // 显式添加 https: 协议，并设置 autoplay=0 防止部分浏览器策略拦截
      return `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&page=1&high_quality=1&danmaku=0&autoplay=0`;
    }
    return null;
  };

  const bvidUrl = work.mediaType === 'video' ? getBilibiliEmbedUrl(work.mediaUrl) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 p-0 md:p-10 animate-in fade-in duration-700">
      <div className="bg-[#050505] w-full h-full max-w-[1920px] relative flex flex-col lg:flex-row overflow-hidden border border-white/5">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 lg:top-10 lg:right-10 z-[70] text-white/50 hover:text-white hover:rotate-90 transition-all duration-500"
        >
          <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* 媒体展示区 */}
        <div className="lg:w-3/5 h-1/2 lg:h-full bg-black relative flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:40px_40px]"></div>
          </div>
          
          {work.mediaType === 'image' ? (
            <img src={work.mediaUrl} alt={work.title} className="max-h-full max-w-full object-contain shadow-[0_0_100px_rgba(0,242,255,0.05)]" />
          ) : (
            bvidUrl ? (
              <div className="w-full aspect-video max-w-4xl shadow-2xl border border-white/5 bg-zinc-900">
                <iframe 
                  src={bvidUrl} 
                  className="w-full h-full"
                  scrolling="no" 
                  border="0" 
                  frameBorder="no" 
                  framespacing="0" 
                  allowFullScreen={true}
                  sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
                  referrerPolicy="no-referrer"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            ) : (
              <video src={work.mediaUrl} className="max-h-full max-w-full" controls autoPlay loop playsInline />
            )
          )}
        </div>

        {/* 内容详情区 */}
        <div className="lg:w-2/5 h-1/2 lg:h-full overflow-y-auto p-8 md:p-12 lg:p-24 bg-white/5 backdrop-blur-md flex flex-col">
          <div className="max-w-xl my-auto">
             <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-black tracking-[0.5em] text-[#00f2ff] uppercase">作品识别序列 / SUBJECT_ID</span>
                <div className="h-[1px] flex-grow bg-white/10"></div>
             </div>
             
             <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-8 leading-none">{work.title}</h2>
             
             <div className="space-y-8 md:space-y-12">
                <section>
                   <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">// 创意构思 (CONCEPT)</h4>
                   <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light italic">
                     {work.description}
                   </p>
                </section>

                <section>
                   <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">// 技术工具栈 (TECH_STACK)</h4>
                   <div className="flex flex-wrap gap-2 md:gap-3">
                      {work.tools.map(tool => (
                        <span key={tool} className="px-3 py-1.5 md:px-4 md:py-2 border border-white/10 rounded-sm text-[10px] md:text-xs font-mono text-gray-400">
                          {tool}
                        </span>
                      ))}
                   </div>
                </section>

                <section className="bg-white/5 p-6 md:p-10 border-l-2 border-[#00f2ff]">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-2 h-2 bg-[#00f2ff] rounded-full animate-ping"></div>
                      <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">AI 创作洞察</span>
                   </div>
                   {loading ? (
                     <div className="space-y-2 opacity-20">
                        <div className="h-2 bg-white w-full animate-pulse"></div>
                        <div className="h-2 bg-white w-2/3 animate-pulse"></div>
                     </div>
                   ) : (
                     <p className="text-sm font-mono text-blue-100/70 leading-relaxed">
                       {displayText}
                       <span className="inline-block w-2 h-4 bg-[#00f2ff] ml-1 animate-pulse"></span>
                     </p>
                   )}
                </section>
             </div>

             {onDelete && onEdit && (
                <div className="mt-12 md:mt-20 flex items-center gap-8 border-t border-white/5 pt-8">
                   <button 
                     onClick={() => onEdit(work)}
                     className="text-[#00f2ff] text-[10px] font-black uppercase tracking-[0.5em] transition-colors hover:text-white"
                   >
                     编辑
                   </button>
                   <button 
                     onClick={() => { if(confirm('确认彻底删除？')) { onDelete(work.id); onClose(); } }}
                     className="text-red-500/30 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] transition-colors"
                   >
                     删除
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
