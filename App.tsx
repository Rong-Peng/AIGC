
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
  const [scrollY, setScrollY] = useState(0);
  const [showSyncGuide, setShowSyncGuide] = useState(false);
  
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    const loadWorks = async () => {
      try {
        const allWorksMap = new Map<string, PortfolioWork>();
        
        // 1. 加载代码内置的预设作品 (Fallback)
        PRESET_WORKS.forEach(w => allWorksMap.set(w.id, w));

        // 2. 尝试抓取仓库中的 portfolio.json (方案1：全网同步核心)
        try {
          const response = await fetch('./portfolio.json');
          if (response.ok) {
            const remoteData: PortfolioWork[] = await response.json();
            remoteData.forEach(w => allWorksMap.set(w.id, w));
            console.log("已同步远程作品集数据");
          }
        } catch (e) {
          console.warn("未检测到外部 portfolio.json 或读取失败，将使用内置及本地数据");
        }

        // 3. 加载浏览器本地数据库中的作品 (当前正在编辑的)
        const localData = await getAllWorksFromDB();
        localData.forEach(w => allWorksMap.set(w.id, w));
        
        const combined = Array.from(allWorksMap.values())
          .sort((a, b) => b.createdAt - a.createdAt);
          
        setWorks(combined);
      } catch (err) {
        console.error("数据加载流程异常:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorks();
    
    const adminSession = localStorage.getItem('ultra_portfolio_admin') === 'true';
    setIsAdmin(adminSession);

    return () => window.removeEventListener('scroll', handleScroll);
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
      if (selectedWork?.id === work.id) {
        setSelectedWork(work);
      }
    } catch (err) {
      alert("数据持久化失败");
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
      alert("密码错误 / 访问被拒绝"); 
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('ultra_portfolio_admin');
  };

  const startLongPress = () => {
    longPressTimer.current = window.setTimeout(() => {
      setShowLogin(true);
    }, 2000);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const filteredWorks = works.filter(w => filter === 'all' || w.mediaType === filter);

  const filterMap = {
    all: "全部作品",
    image: "静态图像",
    video: "动态视频"
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#050505]">
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 md:w-12 h-0.5 bg-white shadow-[0_0_10px_white]"></div>
           <span className="font-black text-xl md:text-2xl tracking-tighter italic">NC.实验室</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={handleExport}
                className="text-[10px] font-black text-[#00f2ff] border border-[#00f2ff]/30 tracking-widest px-4 py-1.5 rounded-sm hover:bg-[#00f2ff]/10 transition-all flex items-center gap-2"
              >
                <span className="animate-pulse">●</span> 同步全网
              </button>
              <button 
                onClick={() => setIsUploadOpen(true)} 
                className="text-[10px] font-black text-black bg-[#00f2ff] tracking-widest px-4 py-1.5 rounded-sm shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-transform active:scale-90"
              >
                添加新作品
              </button>
            </div>
          )}
          <div 
            className="w-10 h-10 md:w-14 md:h-14 bg-white/5 border border-white/10 p-0.5 rounded-sm overflow-hidden active:opacity-50 transition-opacity cursor-pointer"
            onClick={() => isAdmin ? logout() : setShowLogin(true)}
            title={isAdmin ? "退出管理模式" : "登录管理员"}
          >
            <img src={profile.avatar} className={`w-full h-full object-cover ${isAdmin ? 'opacity-100' : 'opacity-40'}`} />
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-20 px-6 md:px-10 max-w-[1800px] mx-auto w-full">
        <section className="mb-24 md:mb-40">
           <div style={{ transform: `translateY(${scrollY * -0.1}px)` }} className="transition-transform duration-75">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="inline-block px-3 py-1 border border-[#7000ff]/30 bg-[#7000ff]/5 text-[#7000ff] text-[8px] md:text-[10px] font-bold tracking-[0.4em] uppercase">
                  当前状态: {isAdmin ? '管理员模式' : '公共访问模式'}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-gray-500 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></span>
                  核心引擎: {isAdmin ? 'RW_NODE (读写节点)' : 'RO_NODE (展示节点)'}
                </div>
              </div>
              <h1 
                className="text-[18vw] md:text-[10vw] font-black leading-[0.85] tracking-tighter uppercase italic select-none mb-10 cursor-pointer"
                onDoubleClick={() => setShowLogin(true)}
                onTouchStart={startLongPress}
                onTouchEnd={cancelLongPress}
              >
                智感 <br />
                <span className="text-white/20">画布</span>
              </h1>
              <p className="text-base md:text-xl text-gray-400 font-light leading-relaxed max-w-lg border-l border-white/10 pl-6 mb-12">
                {profile.bio}
              </p>
           </div>
        </section>

        <div className="flex items-center gap-8 md:gap-12 mb-12 md:mb-20 overflow-x-auto no-scrollbar pb-4 sticky top-24 z-40 bg-[#050505]/80 backdrop-blur-md -mx-6 px-6">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] transition-all relative whitespace-nowrap ${filter === type ? 'text-[#00f2ff]' : 'text-gray-600'}`}
            >
              {filterMap[type]}
              {filter === type && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]"></div>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
             <div className="w-12 h-12 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-6"></div>
             <div className="text-[10px] font-black tracking-[0.5em] uppercase">正在同步神经元数据...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {filteredWorks.length > 0 ? (
              filteredWorks.map((work) => (
                <PortfolioCard key={work.id} work={work} onClick={setSelectedWork} />
              ))
            ) : (
              <div className="col-span-full py-20 border border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
                 <div className="text-[10px] font-bold tracking-[0.5em] uppercase mb-4">未检测到任何作品记录</div>
                 {isAdmin && <button onClick={() => setIsUploadOpen(true)} className="text-[#00f2ff] text-xs underline">初始化首个作品上传</button>}
              </div>
            )}
          </div>
        )}
      </main>

      {showSyncGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
           <div className="w-full max-w-2xl border border-[#00f2ff]/30 p-8 md:p-12 bg-[#0a0a0a] relative shadow-[0_0_100px_rgba(0,242,255,0.15)]">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 text-[#00f2ff]">同步操作指引 (SYNC_LOG)</h2>
              <div className="space-y-6 text-gray-300 font-light leading-relaxed text-sm md:text-base mb-10">
                <div className="p-4 bg-white/5 border-l-2 border-white/20">
                  <p className="text-xs font-mono text-gray-500 mb-2">STEP_01</p>
                  <p>将刚下载的 <code className="text-[#00f2ff]">portfolio.json</code> 放置在你的项目根目录中。</p>
                </div>
                <div className="p-4 bg-white/5 border-l-2 border-white/20">
                  <p className="text-xs font-mono text-gray-500 mb-2">STEP_02</p>
                  <p>提交该文件变更并重新推送代码（GitHub Push 或 Vercel Deploy）。</p>
                </div>
                <div className="p-4 bg-[#00f2ff]/5 border-l-2 border-[#00f2ff]">
                  <p className="text-xs font-mono text-[#00f2ff] mb-2">DONE</p>
                  <p>部署完成后，所有人访问该链接都能看到你刚刚发布的媒体作品。</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSyncGuide(false)}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.5em] text-xs hover:bg-[#00f2ff] transition-colors"
              >
                确认并继续
              </button>
           </div>
        </div>
      )}

      <footer className="p-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="text-[10px] font-mono text-gray-600 tracking-widest flex items-center gap-4">
           <span>© 2024 智感画布 (NEURAL_CANVAS)</span>
           <button 
             onClick={() => setShowLogin(true)} 
             className="opacity-10 hover:opacity-100 transition-opacity cursor-help"
           >
             [系统控制台]
           </button>
         </div>
         <div className="flex gap-8">
            <span className="text-[10px] font-bold text-white/10 uppercase italic">架构方案: DATA_HYBRID (JSON + INDEXED_DB)</span>
         </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
           <div className="w-full max-sm border border-[#00f2ff]/20 p-8 bg-black relative shadow-[0_0_50px_rgba(0,242,255,0.1)]">
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-white text-2xl"
              >
                &times;
              </button>
              <div className="text-[#00f2ff] font-mono text-[10px] mb-4 animate-pulse">&gt;&gt;&gt; 身份认证序列已初始化...</div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">管理员登录</h2>
              <form onSubmit={handleLogin}>
                <input 
                  type="password" autoFocus
                  placeholder="输入访问代码"
                  className="w-full bg-transparent border-b border-white/20 py-4 text-2xl font-mono tracking-widest outline-none mb-8 focus:border-[#00f2ff] transition-colors"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <div className="flex justify-between items-center">
                   <button type="button" onClick={() => setShowLogin(false)} className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white">取消</button>
                   <button type="submit" className="bg-[#00f2ff] text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">验证</button>
                </div>
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
