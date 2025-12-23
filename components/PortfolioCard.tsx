
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
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
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

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

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
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 group-hover:border-[#00f2ff]/40 group-active:border-[#00f2ff]/80 transition-all duration-300 rounded-br-[40px] md:rounded-br-[60px]"></div>
      
      <div className="relative p-0.5">
        <div className="aspect-[4/5] overflow-hidden rounded-sm mb-4 md:mb-6 relative bg-black/40">
          {work.mediaType === 'image' ? (
            <img 
              src={work.mediaUrl} 
              alt={work.title} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-95"
            />
          ) : (
            <video 
              src={work.mediaUrl} 
              poster={work.coverUrl}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              muted loop playsInline
              autoPlay
            />
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-[#00f2ff] uppercase opacity-80">节点 {work.id.slice(-4)}</span>
                {work.mediaType === 'video' && <span className="bg-[#7000ff]/80 text-[7px] px-1 font-black rounded-sm">动态</span>}
             </div>
             <h3 className="text-lg md:text-xl font-black italic tracking-tighter uppercase leading-tight group-active:text-glow transition-all">{work.title}</h3>
          </div>
        </div>
        
        <div className="px-4 pb-6 md:pb-8">
           <p className="text-gray-400 text-[11px] md:text-xs leading-relaxed mb-4 line-clamp-2 font-light">
             {work.description}
           </p>
           <div className="flex justify-between items-center">
              <div className="flex gap-1.5 md:gap-2">
                 {work.tools.slice(0, 2).map(t => (
                   <span key={t} className="text-[8px] md:text-[9px] font-mono text-white/30 border border-white/5 px-1.5 py-0.5">{t}</span>
                 ))}
              </div>
              <div className="w-6 h-[1px] bg-white/10 group-hover:w-10 group-hover:bg-[#00f2ff] group-active:bg-[#00f2ff] transition-all duration-300"></div>
           </div>
        </div>
      </div>
    </div>
  );
};
