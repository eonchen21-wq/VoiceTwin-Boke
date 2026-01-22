import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoginView from './components/LoginView';
import RecordingView from './components/RecordingView';
import MatchResultView from './components/MatchResultView';
import FavoritesView from './components/FavoritesView';
import ProfileView from './components/ProfileView';
import { AppView, AnalysisData, Song } from './types';
import { CURRENT_USER } from './constants';
import authService from './services/auth-service';
import songService from './services/song-service';
import userService from './services/user-service';


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
    const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
    const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
    const [allSongs, setAllSongs] = useState<Song[]>([]); // NOTE: 存储所有歌曲列表（从后端获取）
    const [userAvatar, setUserAvatar] = useState<string>(CURRENT_USER.avatarUrl);
    const [analysisCount, setAnalysisCount] = useState<number>(0);
    const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);

    // NOTE: 从后端 API 加载用户数据，确保前端状态与后端同步
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setIsLoadingUserData(true);

                // 检查用户是否已登录
                const isAuthenticated = await authService.isAuthenticated();
                if (!isAuthenticated) {
                    return;
                }

                // 从 localStorage 获取 user_id（登录时保存的）
                const userId = localStorage.getItem('user_id');
                if (!userId) {
                    return;
                }

                // 并行加载所有歌曲、收藏和统计数据
                const [allSongsData, favorites, stats] = await Promise.all([
                    songService.getAllSongs().catch(() => []),
                    songService.getUserFavorites().catch(() => []),
                    userService.getUserStats(userId).catch(() => null)
                ]);

                // 更新状态
                setAllSongs(allSongsData);
                setFavoriteSongs(favorites);
                if (stats) {
                    setAnalysisCount(stats.analysisCount);
                }

                logger.info('用户数据加载成功');
            } catch (error) {
                console.error('加载用户数据失败:', error);
                // NOTE: 加载失败不影响应用使用，只是数据为空
            } finally {
                setIsLoadingUserData(false);
            }
        };

        // 只在组件挂载时加载一次
        loadUserData();
    }, []);

    // 辅助日志函数
    const logger = {
        info: (msg: string) => console.log(`[App] ${msg}`)
    };


    // Intercept tab changes. 
    // If user clicks "Home/Recording" (AppView.RECORDING) and we have a result, show Result.
    const handleNavigation = (view: AppView) => {
        if (view === AppView.RECORDING && analysisResult) {
            setCurrentView(AppView.RESULT);
        } else {
            setCurrentView(view);
        }
    };

    const handleAnalysisComplete = (data: AnalysisData) => {
        setAnalysisResult(data);
        setAnalysisCount(prev => prev + 1);
        setCurrentView(AppView.RESULT);
    };

    const handleRetake = () => {
        setAnalysisResult(null);
        setCurrentView(AppView.RECORDING);
    };

    const handleToggleFavorite = async (song: Song) => {
        try {
            // NOTE: 调用后端 API 切换收藏状态
            const result = await songService.toggleFavorite(song.id);

            // 根据后端返回结果更新前端状态
            setFavoriteSongs(prev => {
                if (result.isFavorited) {
                    // 添加到收藏
                    return prev.some(s => s.id === song.id) ? prev : [...prev, song];
                } else {
                    // 从收藏中移除
                    return prev.filter(s => s.id !== song.id);
                }
            });

            logger.info(`收藏状态更新: ${song.title} - ${result.isFavorited ? '已收藏' : '已取消'}`);
        } catch (error) {
            console.error('切换收藏状态失败:', error);
            // TODO: 可以显示错误提示给用户
        }
    };

    const handleLogin = async () => {
        // 登录成功后切换到录音界面并加载用户数据
        setCurrentView(AppView.RECORDING);

        try {
            const userId = localStorage.getItem('user_id');
            if (userId) {
                // 重新加载用户数据
                const [allSongsData, favorites, stats] = await Promise.all([
                    songService.getAllSongs().catch(() => []),
                    songService.getUserFavorites().catch(() => []),
                    userService.getUserStats(userId).catch(() => null)
                ]);

                setAllSongs(allSongsData);
                setFavoriteSongs(favorites);
                if (stats) {
                    setAnalysisCount(stats.analysisCount);
                }
                logger.info('登录后用户数据加载成功');
            }
        } catch (error) {
            console.error('登录后加载用户数据失败:', error);
        }
    };

    const handleUpdateAvatar = (newUrl: string) => {
        setUserAvatar(newUrl);
    };

    const renderView = () => {
        switch (currentView) {
            case AppView.LOGIN:
                return <LoginView onLogin={handleLogin} />;
            case AppView.RECORDING:
                // If we somehow land on RECORDING but have data, decide whether to show Result
                // (Usually handled by handleNavigation, but safe to check here or just render recording)
                return (
                    <RecordingView
                        onAnalysisComplete={handleAnalysisComplete}
                        userAvatarUrl={userAvatar}
                    />
                );
            case AppView.RESULT:
                return (
                    <MatchResultView
                        data={analysisResult}
                        onBack={handleRetake}
                        favoriteSongs={favoriteSongs}
                        allSongs={allSongs}
                        onToggleFavorite={handleToggleFavorite}
                        userAvatarUrl={userAvatar}
                    />
                );
            case AppView.PLAYLIST:
                return <FavoritesView songs={favoriteSongs} onToggleFavorite={handleToggleFavorite} />;
            case AppView.PROFILE:
                return (
                    <ProfileView
                        onNavigate={handleNavigation}
                        avatarUrl={userAvatar}
                        onUpdateAvatar={handleUpdateAvatar}
                        analysisCount={analysisCount}
                        savedSongsCount={favoriteSongs.length}
                    />
                );
            default:
                return <LoginView onLogin={() => setCurrentView(AppView.RECORDING)} />;
        }
    };

    return (
        <Layout currentView={currentView} onNavigate={handleNavigation}>
            {renderView()}
        </Layout>
    );
};

export default App;