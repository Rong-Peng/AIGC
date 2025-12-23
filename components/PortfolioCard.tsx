
import React, { useState, useRef, useEffect } from 'react';
import { PortfolioWork } from '../types';

interface PortfolioCardProps {
  work: PortfolioWork;
  onClick: (work: PortfolioWork) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ work, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group cursor-pointer transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      onClick={() => onClick(work)}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
      }}
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 group-hover:border-[#00f2ff]/40 transition-all duration-300 rounded-br-[40px] md:rounded-br-[60px]"></div>
      
      <div className="relative p-0.5">
        <div className="aspect-[4/5] overflow-hidden rounded-sm mb-4 md:mb-6 relative bg-black/40">
          {work.mediaType === 'image' ? (
            <img 
              src={work.mediaUrl} 
              alt={work.title} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full relative">
               {/* 视频处理：非 B站视频可自动预览，B站视频仅展示纯黑或占位 */}
               {work.mediaUrl.includes('bilibili.com') || work.mediaUrl.includes('BV') ? (
                 <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Video Link</span>
                 </div>
               ) : (
                 <video 
                   src={work.mediaUrl} 
                   className="w-full h-full object-cover"
                   muted loop playsInline autoPlay
                 />
               )}
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/95 to-transparent">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-bold tracking-[0.2em] text-[#00f2ff] uppercase opacity-80">NODE_{work.id.slice(-4)}</span>
             </div>
             <h3 className="text-lg md:text-xl font-black italic tracking-tighter uppercase group-hover:text-[#00f2ff] transition-colors">{work.title}</h3>
          </div>
        </div>
        
        <div className="px-4 pb-6 md:pb-8">
           <p className="text-gray-400 text-[11px] leading-relaxed mb-4 line-clamp-2 font-light">
             {work.description}
           </p>
           <div className="flex flex-wrap gap-1.5">
              {work.tools.slice(0, 3).map(t => (
                <span key={t} className="text-[8px] font-mono text-white/20 border border-white/5 px-1.5 py-0.5 uppercase">{t}</span>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
