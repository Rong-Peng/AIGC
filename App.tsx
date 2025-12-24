
import React, { useState, useEffect, useRef } from 'react';
import { PortfolioWork, UserProfile } from './types';
import { PortfolioCard } from './components/PortfolioCard';
import { WorkDetailModal } from './components/WorkDetailModal';
import { UploadModal } from './components/UploadModal';
import { getAllWorksFromDB, saveWorkToDB, deleteWorkFromDB } from './services/dbService';
import { PRESET_WORKS } from './services/staticData';

const ADMIN_PASSWORD = "admin";

const INITIAL_PROFILE: UserProfile = {
  name: "智感先行者",
  role: "神经策展人",
  bio: "以算法为笔，在机器智慧与人类情感的交汇处，构建超越现实的视觉奇观。",
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Art"
};

const App: React.FC = () => {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [selectedWork, setSelectedWork] = useState<PortfolioWork | null>(null);
  const [editingWork, setEditingWork] = useState<PortfolioWork | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showSyncGuide, setShowSyncGuide] = useState(false);

  useEffect(() => {
    const loadWorks = async () => {
      setIsLoading(true);
      try {
        const allWorksMap = new Map<string, PortfolioWork>();
        
        // 1. 加载硬编码的静态预设
        PRESET_WORKS.forEach(w => allWorksMap.set(w.id, w));

        // 2. 加载外部 JSON 文件 (增加时间戳防止缓存)
        try {
          const response = await fetch(`/portfolio.json?v=${Date.now()}`);
          if (response.ok) {
            const remoteData: PortfolioWork[] = await response.json();
            remoteData.forEach(w => allWorksMap.set(w.id, w));
          }
        } catch (e) {
          console.warn("未找到 portfolio.json 或解析失败", e);
        }

        // 3. 加载本地 IndexedDB (管理员浏览器特有)
        const localData = await getAllWorksFromDB();
        localData.forEach(w => allWorksMap.set(w.id, w));
        
        const combined = Array.from(allWorksMap.values())
          .sort((a, b) => b.createdAt - a.createdAt);
          
        setWorks(combined);
      } catch (err) {
        console.error("加载异常:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorks();
    
    const adminSession = localStorage.getItem('ultra_portfolio_admin') === 'true';
    setIsAdmin(adminSession);
  }, []);

  const handleUploadOrUpdate = async (work: PortfolioWork) => {
    try {
      await saveWorkToDB(work);
      setWorks(prev => {
        const index = prev.findIndex(w => w.id === work.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = work;
          return updated;
        }
        return [work, ...prev];
      });
      if (selectedWork?.id === work.id) setSelectedWork(work);
    } catch (err) {
      alert("保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkFromDB(id);
      setWorks(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      alert("删除失败");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(works, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio.json`;
    link.click();
    setShowSyncGuide(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('ultra_portfolio_admin', 'true');
      setShowLogin(false);
      setPasswordInput("");
    } else { 
      alert("密码错误"); 
    }
  };

  const filteredWorks = works.filter(w => filter === 'all' || w.mediaType === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#00f2ff] border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[#050505]">
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 md:w-12 h-0.5 bg-white shadow-[0_0_10px_white]"></div>
           <span className="font-black text-xl md:text-2xl tracking-tighter italic uppercase">Neural Canvas</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={handleExport}
                className="text-[10px] font-black text-[#00f2ff] border border-[#00f2ff]/30 tracking-widest px-4 py-1.5 rounded-sm hover:bg-[#00f2ff]/10"
              >
                导出数据
              </button>
              <button 
                onClick={() => setIsUploadOpen(true)} 
                className="text-[10px] font-black text-black bg-[#00f2ff] tracking-widest px-4 py-1.5 rounded-sm"
              >
                + 添加
              </button>
            </div>
          )}
          <div 
            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 p-0.5 rounded-sm overflow-hidden cursor-pointer flex items-center justify-center"
            onClick={() => isAdmin ? (setIsAdmin(false), localStorage.removeItem('ultra_portfolio_admin')) : setShowLogin(true)}
          >
            <img src={profile.avatar} className={`w-full h-full object-cover transition-opacity ${isAdmin ? 'opacity-100' : 'opacity-20 hover:opacity-40'}`} />
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-20 px-6 md:px-10 max-w-[1800px] mx-auto w-full">
        <section className="mb-20 md:mb-32">
          <h1 className="text-[15vw] md:text-[8vw] font-black leading-[0.85] tracking-tighter uppercase italic mb-10">
            智感 <br /> <span className="text-white/20">策展</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-400 font-light leading-relaxed max-w-lg border-l border-white/10 pl-6">
            {profile.bio}
          </p>
        </section>

        <div className="flex items-center gap-8 mb-12 md:mb-20 sticky top-24 z-40 bg-[#050505]/80 backdrop-blur-md py-4">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative ${filter === type ? 'text-[#00f2ff]' : 'text-gray-600'}`}
            >
              {type === 'all' ? '全部' : type === 'image' ? '图像' : '视频'}
              {filter === type && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#00f2ff]"></div>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {filteredWorks.map((work) => (
            <PortfolioCard key={work.id} work={work} onClick={setSelectedWork} />
          ))}
          {filteredWorks.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10">
              <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">暂无记录 / NO_DATA_FOUND</p>
            </div>
          )}
        </div>
      </main>

      {showSyncGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
           <div className="w-full max-w-2xl border border-[#00f2ff]/30 p-8 md:p-12 bg-[#0a0a0a]">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 text-[#00f2ff]">同步指南</h2>
              <div className="space-y-4 text-gray-300 text-sm mb-10">
                <p>1. 已下载最新的 <code className="text-[#00f2ff]">portfolio.json</code>。</p>
                <p>2. 请将此文件放入你的 GitHub 仓库根目录覆盖旧文件。</p>
                <p>3. 重新 Push 代码。由于浏览器缓存，部署后可能需要 **强刷网页** (Ctrl+F5) 才能看到新内容。</p>
              </div>
              <button 
                onClick={() => setShowSyncGuide(false)}
                className="w-full py-4 bg-white text-black font-black uppercase text-xs hover:bg-[#00f2ff]"
              >
                了解并关闭
              </button>
           </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
           <div className="w-full max-w-sm border border-[#00f2ff]/20 p-8 bg-black">
              <h2 className="text-xl font-black italic uppercase mb-8">管理员登录</h2>
              <form onSubmit={handleLogin}>
                <input 
                  type="password" autoFocus placeholder="默认密码: admin"
                  className="w-full bg-transparent border-b border-white/20 py-4 text-2xl outline-none mb-8 focus:border-[#00f2ff]"
                  value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                />
                <button type="submit" className="w-full bg-[#00f2ff] text-black py-3 text-xs font-black uppercase tracking-widest">验证</button>
              </form>
           </div>
        </div>
      )}

      {selectedWork && (
        <WorkDetailModal 
          work={selectedWork} 
          onClose={() => setSelectedWork(null)} 
          onDelete={isAdmin ? handleDelete : undefined}
          onEdit={isAdmin ? (w) => { setEditingWork(w); } : undefined}
        />
      )}
      
      {(isUploadOpen || editingWork) && (
        <UploadModal 
          initialWork={editingWork || undefined}
          onUpload={handleUploadOrUpdate} 
          onClose={() => { setIsUploadOpen(false); setEditingWork(null); }} 
        />
      )}
    </div>
  );
};

export default App;
