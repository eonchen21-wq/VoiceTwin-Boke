import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { AnalysisData, Song } from '../types';

interface MatchResultViewProps {
    onBack: () => void;
    data: AnalysisData | null;
    favoriteSongs: Song[];
    allSongs: Song[]; // NOTE: 从后端动态获取的所有歌曲列表
    onToggleFavorite: (song: Song) => void;
    userAvatarUrl: string;
}

// Demo audio URL for preview functionality
const DEMO_AUDIO_URL = "https://p.scdn.co/mp3-preview/3eb16018c2a700232a929cd09deb8e81fb19aa6d?cid=774b29d4f13844c495f206cafdad9c86";

const MatchResultView: React.FC<MatchResultViewProps> = ({ onBack, data, favoriteSongs, allSongs, onToggleFavorite, userAvatarUrl }) => {
    // NOTE: 动态搜索跳转到网易云音乐（规避版权风险，无需手动维护链接）
    const handleOpenInNetease = (song: Song) => {
        // 优先使用 artist 和 title 拼接搜索关键词
        let searchKeyword = '';

        if (song.artist && song.title) {
            searchKeyword = `${song.artist} ${song.title}`;
        } else if (song.title) {
            // 如果只有 title，直接使用（可能是从 filename 提取的）
            // 去除可能的文件后缀
            searchKeyword = song.title.replace(/\.(mp3|flac|wav|m4a)$/i, '');
        } else {
            console.warn('歌曲信息不完整:', song);
            alert('歌曲信息不完整，无法搜索');
            return;
        }

        // 构建网易云搜索链接（URL encode 确保中文和特殊字符正确编码）
        const searchUrl = `https://music.163.com/#/search/m/?s=${encodeURIComponent(searchKeyword)}`;
        window.open(searchUrl, '_blank');
    };

    // Fallback if data is null (shouldn't happen with correct App.tsx logic, but safe to handle)
    if (!data) return null;

    const handleShare = async () => {
        // Ensure URL is valid for sharing (fix for preview environments)
        let shareUrl = window.location.href;
        try {
            const urlObj = new URL(shareUrl);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                shareUrl = 'https://voicetwin.app';
            }
        } catch {
            shareUrl = 'https://voicetwin.app';
        }

        const shareData = {
            title: 'Voice Twin - 声音分析报告',
            text: `我的声音与${data.matchedSinger.name}契合度高达${data.score}%！快来看看你的灵魂歌手是谁？`,
            url: shareUrl
        };

        const copyToClipboard = async () => {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('分享内容已复制到剪贴板！');
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('复制失败，请尝试截图分享');
            }
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                // If the user cancelled the share, do nothing
                if (err.name === 'AbortError') return;

                // For other errors (like Invalid URL), fallback to clipboard
                console.warn('Share API failed, falling back to clipboard:', err);
                await copyToClipboard();
            }
        } else {
            await copyToClipboard();
        }
    };

    const analysisText = useMemo(() => {
        const { radarData, matchedSinger } = data;

        // Find strongest trait (highest A value)
        const strongest = radarData.reduce((prev, current) => (prev.A > current.A) ? prev : current);

        // Find closest match to singer (smallest difference between A and B)
        const closest = radarData.reduce((prev, current) =>
            (Math.abs(prev.A - prev.B) < Math.abs(current.A - current.B)) ? prev : current
        );

        let text = "";

        // Intro based on strongest trait
        if (strongest.subject === '温暖度') {
            text += "您的声线醇厚温暖，中低频的共鸣极具磁性，给人一种稳重而深情的听感。";
        } else if (strongest.subject === '明亮度') {
            text += "您的音色清脆明亮，高频泛音丰富，具有极强的穿透力和辨识度。";
        } else if (strongest.subject === '力量感') {
            text += "您的嗓音结实有力，核心发力点稳固，在爆发段落能展现出惊人的声压级。";
        } else if (strongest.subject === '音域') {
            text += "您拥有开阔的音域宽度，无论是低音下潜还是高音延展都游刃有余。";
        } else { // 气息感
            text += "您对气息的掌控炉火纯青，声音线条流畅细腻，情感表达丝丝入扣。";
        }

        // Comparison
        text += ` 数据分析显示，您在“${closest.subject}”维度上与${matchedSinger.name}几乎如出一辙。`;

        // Suggestion based on strongest trait
        if (strongest.subject === '温暖度' || strongest.subject === '气息感') {
            text += "非常适合演绎深情叙事型的慢板情歌，能够直击人心。";
        } else if (strongest.subject === '力量感') {
            text += "尝试律动感强或需要爆发力的作品，会让您的舞台魅力倍增。";
        } else {
            text += "技巧性强、旋律跨度大的歌曲将是您展示实力的最佳舞台。";
        }

        return text;
    }, [data]);

    const isFavorite = (songId: string) => favoriteSongs.some(s => s.id === songId);

    // Use passed prop userAvatarUrl first, fallback to data.userAvatarUrl, then placeholder
    const displayAvatar = userAvatarUrl || data.userAvatarUrl;

    return (
        <div className="relative flex min-h-screen w-full flex-col pb-32 bg-background-dark overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[500px] bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmHL-GSoaAVR2nfJdU3RF-yq_vzzGNqzdiMnQCWMZiRI-MeK70WSrgfb2O8KbrJgxOAgdCJ6_-Anh7UHo_0pOPVq77dOMLwJlg8pl3inEdd6gDhEAUlw_F1IfTlkD88gxn_uJf6ld3h7dq2f3jkVAxg46l2hann6dAhAzDlCATAkkXo2P-lkot_SOS1y4fOF6Vs9G9AQcQe6teCtWcPEdlD-TRJvT3A9xYIE8Sb_4qoEMadS9L-Tp69dahOLYjeT3b0VQXDk0tCNdd')] bg-cover bg-center opacity-20 blur-3xl" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}></div>
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-background-dark/0 via-background-dark/80 to-background-dark"></div>
            </div>

            <header className="relative z-20 flex items-center justify-between p-4 pt-6">
                <button
                    onClick={onBack}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button
                    onClick={handleShare}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5"
                >
                    <span className="material-symbols-outlined">share</span>
                </button>
            </header>

            <main className="relative z-10 flex-1 flex flex-col">
                <div className="px-6 pt-2 pb-8">
                    {/* Badge */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(59,96,255,0.3)]">
                            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                            <span className="text-xs font-bold text-primary tracking-wide font-body">找到你的灵魂歌手</span>
                        </div>
                    </div>

                    {/* Comparison Avatars */}
                    <div className="flex items-center justify-between relative mt-4">
                        <div className="flex flex-col items-center gap-3 w-[100px]">
                            <div className="relative size-20 md:size-24 rounded-full p-0.5 bg-gradient-to-b from-slate-500 to-slate-800">
                                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative">
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-700 to-slate-600"></div>
                                            <span className="relative text-3xl font-bold text-slate-400 font-body">你</span>
                                        </>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-bold uppercase tracking-wider font-display">User</span>
                                </div>
                            </div>
                        </div>

                        {/* Match Score */}
                        <div className="flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[2px] bg-gradient-to-r from-slate-700 via-primary to-primary-glow -z-10 opacity-30"></div>
                                <div className="size-[84px] rounded-full bg-background-dark/80 backdrop-blur-xl border border-primary flex flex-col items-center justify-center shadow-neon relative">
                                    <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse"></div>
                                    <span className="text-[10px] text-primary-glow font-bold uppercase tracking-wider mb-0.5 font-body">匹配度</span>
                                    <span className="text-3xl font-black text-white leading-none italic font-display">{data.score}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 w-[100px]">
                            <div className="relative size-20 md:size-24 rounded-full p-0.5 bg-gradient-to-b from-primary-glow to-primary shadow-neon">
                                <img alt={data.matchedSinger.name} className="w-full h-full object-cover rounded-full" src={data.matchedSinger.avatarUrl} />
                                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full border border-primary-glow font-bold uppercase tracking-wider font-display">Singer</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8 text-center px-2">
                        <div className="w-[80px] flex flex-col items-center opacity-60">
                            <span className="text-xs text-slate-400 mb-1">稳定性</span>
                            <span className="text-sm font-bold text-white font-display">{data.stability}</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] font-body">{data.matchedSinger.name}</h1>
                            <p className="text-slate-400 text-xs mt-1 font-body">{data.matchedSinger.description}</p>
                        </div>
                        <div className="w-[80px] flex flex-col items-center opacity-60">
                            <span className="text-xs text-slate-400 mb-1">清晰度</span>
                            <span className="text-sm font-bold text-white font-body">{data.clarity}</span>
                        </div>
                    </div>
                </div>

                {/* Radar Chart Section */}
                <div className="px-5">
                    <div className="bg-[#1e2436]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-white font-body">
                                <span className="w-1 h-5 bg-primary rounded-full"></span>
                                声纹蓝图
                            </h2>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    <span className="text-slate-400 font-body">你</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,96,255,0.8)]"></div>
                                    <span className="text-primary-glow font-body">{data.matchedSinger.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[240px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: 'Noto Sans SC' }} />
                                    <Radar name="User" dataKey="A" stroke="#94a3b8" strokeDasharray="4 2" fill="#94a3b8" fillOpacity={0.1} />
                                    <Radar name="Singer" dataKey="B" stroke="#3B60FF" strokeWidth={2} fill="#3B60FF" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <p className="text-center text-sm text-slate-300 mt-2 leading-relaxed px-2 font-body">
                            {analysisText}
                        </p>
                    </div>
                </div>

                {/* Song Recommendations */}
                <div className="px-5 space-y-8">
                    {/* Comfort Zone */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center size-8 rounded bg-accent-success/20">
                                    <span className="material-symbols-outlined text-accent-success text-[20px]">verified</span>
                                </div>
                                <h3 className="text-lg font-bold text-white font-body">舒适区</h3>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide font-display">COMFORT ZONE</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {allSongs.filter(s => s.tag === 'comfort').map(song => (
                                <div key={song.id} className="group relative flex items-center gap-4 bg-surface-dark p-3 rounded-xl border-l-4 border-l-accent-success border-y border-r border-y-white/5 border-r-white/5 hover:bg-[#1E2436] transition-all cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-md">
                                        <img alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={song.coverUrl} />
                                    </div>
                                    <div className="flex-1 min-w-0 z-10">
                                        <h4 className="font-bold truncate text-sm font-body text-white">{song.title}</h4>
                                        <p className="text-slate-400 text-xs truncate mt-0.5 font-body">{song.artist} • {song.album}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 z-10">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-body ${song.tagLabel === '完美契合' ? 'text-accent-success bg-accent-success/10' : 'text-primary-glow bg-primary/10'}`}>
                                            {song.tagLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleFavorite(song);
                                                }}
                                                className={`size-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ${isFavorite(song.id) ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                <span
                                                    className="material-symbols-outlined text-[16px]"
                                                    style={{ fontVariationSettings: isFavorite(song.id) ? "'FILL' 1" : "'FILL' 0" }}
                                                >
                                                    favorite
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenInNetease(song);
                                                }}
                                                className="size-7 rounded-full flex items-center justify-center transition-colors bg-white/5 hover:bg-accent-success hover:text-black text-slate-400"
                                                title="去网易云收听"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    open_in_new
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Challenge Zone */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center size-8 rounded bg-accent-warning/20">
                                    <span className="material-symbols-outlined text-accent-warning text-[20px]">local_fire_department</span>
                                </div>
                                <h3 className="text-lg font-bold text-white font-body">挑战区</h3>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide font-display">CHALLENGE MODE</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {allSongs.filter(s => s.tag === 'challenge').map(song => (
                                <div key={song.id} className="group relative flex items-center gap-4 bg-surface-dark p-3 rounded-xl border-l-4 border-l-accent-warning border-y border-r border-y-white/5 border-r-white/5 hover:bg-[#1E2436] transition-all cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-md">
                                        <img alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={song.coverUrl} />
                                    </div>
                                    <div className="flex-1 min-w-0 z-10">
                                        <h4 className="font-bold truncate text-sm font-body text-white">{song.title}</h4>
                                        <p className="text-slate-400 text-xs truncate mt-0.5 font-body">{song.artist} • {song.album}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 z-10">
                                        <span className="text-[10px] font-bold uppercase text-accent-warning bg-accent-warning/10 px-2 py-0.5 rounded font-body">
                                            {song.tagLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleFavorite(song);
                                                }}
                                                className={`size-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ${isFavorite(song.id) ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                <span
                                                    className="material-symbols-outlined text-[16px]"
                                                    style={{ fontVariationSettings: isFavorite(song.id) ? "'FILL' 1" : "'FILL' 0" }}
                                                >
                                                    favorite
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenInNetease(song);
                                                }}
                                                className="size-7 rounded-full flex items-center justify-center transition-colors bg-white/5 hover:bg-accent-warning hover:text-black text-slate-400"
                                                title="去网易云收听"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    open_in_new
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MatchResultView;