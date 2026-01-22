import React, { useState, useMemo } from 'react';
import { Song } from '../types';

interface FavoritesViewProps {
    songs: Song[];
    onToggleFavorite: (song: Song) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ songs, onToggleFavorite }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) return songs;
        const query = searchQuery.toLowerCase();
        return songs.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );
    }, [songs, searchQuery]);

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative z-10 flex flex-col min-h-screen pb-24 bg-background-dark">
             <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-secondary/15 rounded-full blur-[100px]"></div>
            </div>

            <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-background-dark/80 backdrop-blur-md border-b border-white/5 pt-6 min-h-[80px]">
                {isSearchOpen ? (
                    <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="relative flex-1 group">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                             <input 
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索歌名或歌手..."
                                className="w-full bg-surface-card border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-surface-card/80 focus:ring-1 focus:ring-primary/50 transition-all font-body placeholder:text-slate-600"
                             />
                        </div>
                        <button 
                            onClick={handleCloseSearch}
                            className="text-slate-400 hover:text-white transition-colors text-sm font-medium whitespace-nowrap px-1 active:scale-95 transform"
                        >
                            取消
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-10"></div>
                        <h1 className="text-xl font-bold tracking-wide text-white font-body">我的收藏</h1>
                        <div className="w-10 flex justify-end">
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-colors active:scale-95"
                            >
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </div>
                    </>
                )}
            </header>

            <main className="flex-1 px-4 py-6 flex flex-col gap-4 z-10">
                {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 gap-4">
                        <span className="material-symbols-outlined text-5xl opacity-50">library_music</span>
                        <p className="text-sm font-body">暂无收藏歌曲</p>
                    </div>
                ) : filteredSongs.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-[40vh] text-slate-500 gap-3 animate-in fade-in zoom-in-95 duration-300">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl opacity-50">search_off</span>
                        </div>
                        <p className="text-sm font-body text-slate-400">未找到 “{searchQuery}” 相关歌曲</p>
                    </div>
                ) : (
                    filteredSongs.map(song => (
                        <div key={song.id} className="group flex items-center gap-4 bg-surface-dark border border-white/5 p-3 rounded-lg hover:border-primary/40 hover:shadow-neon transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                            <div className="relative shrink-0">
                                <div 
                                    className="size-[70px] rounded-lg bg-center bg-cover shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                                    style={{ backgroundImage: `url('${song.coverUrl}')` }}
                                >
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white text-base font-bold truncate font-body">
                                        {/* Highlight matching text if searching */}
                                        {isSearchOpen && searchQuery ? (
                                            <>
                                                {song.title.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                                    part.toLowerCase() === searchQuery.toLowerCase() ? <span key={i} className="text-primary">{part}</span> : part
                                                )}
                                            </>
                                        ) : song.title}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-sm truncate font-body">
                                     {isSearchOpen && searchQuery ? (
                                            <>
                                                {song.artist.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                                    part.toLowerCase() === searchQuery.toLowerCase() ? <span key={i} className="text-primary">{part}</span> : part
                                                )}
                                            </>
                                        ) : song.artist}
                                </p>
                                <div className="flex mt-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${song.tag === 'challenge' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        <span className={`w-1 h-1 rounded-full ${song.tag === 'challenge' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                        {song.tagLabel}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => onToggleFavorite(song)}
                                className="shrink-0 size-10 flex items-center justify-center rounded-full text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default FavoritesView;