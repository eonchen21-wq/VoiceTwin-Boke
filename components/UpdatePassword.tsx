import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api-client';

/**
 * 密码重置页面
 * NOTE: 用户通过邮件链接访问此页面更新密码
 */
const UpdatePassword: React.FC = () => {
    // --- 状态管理 ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [accessToken, setAccessToken] = useState<string>(''); // NOTE: 从 URL 提取的 access_token
    const navigate = useNavigate();

    useEffect(() => {
        // NOTE: 从 URL hash 中提取 access_token
        // Supabase 重置邮件会在 URL 中包含: #access_token=xxx&refresh_token=yyy&...
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // 去掉 # 号
            const token = params.get('access_token');

            if (token) {
                setAccessToken(token);
                console.log('✅ 成功从 URL 提取 access_token');
            } else {
                setError('无效的重置链接，请重新申请密码重置');
                console.error('❌ URL 中未找到 access_token');
            }
        } else {
            setError('无效的重置链接，请重新申请密码重置');
            console.error('❌ URL 中没有 hash 参数');
        }
    }, []);

    // --- 密码更新业务逻辑 ---
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // 1. 检查 access_token
        if (!accessToken) {
            setError('无效的重置链接，请重新申请密码重置');
            return;
        }

        // 2. 基础验证
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError('请输入新密码');
            return;
        }

        // 3. 密码一致性验证
        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        // 4. 密码强度验证
        if (newPassword.length < 6) {
            setError('密码长度至少为 6 个字符');
            return;
        }

        setIsLoading(true);
        try {
            // NOTE: 调用后端 API 而非直接调用 Supabase，解决国内访问超时问题
            await apiClient.post('/auth/update-password', {
                access_token: accessToken,
                new_password: newPassword
            });

            setMessage('密码更新成功！正在跳转...');
            // 2 秒后跳转到首页
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || err.message || '密码更新失败，请稍后重试';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#050508] text-white selection:bg-[#2547f4] selection:text-white font-sans flex items-center justify-center">

            {/* --- 背景光效 --- */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#2547f4]/20 blur-[120px] mix-blend-screen opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#9333ea]/15 blur-[130px] mix-blend-screen opacity-50"></div>
            </div>

            {/* --- 主体卡片区域 --- */}
            <div className="relative z-10 w-full max-w-md px-6">

                {/* 顶部 Logo 与 标题 */}
                <div className="flex flex-col items-center justify-center text-center space-y-6 mb-8">
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2547f4]/80 to-[#9333ea]/80 p-[1px] shadow-[0_0_30px_rgba(37,71,244,0.4)]">
                        <div className="w-full h-full bg-[#12141c]/90 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <span className="material-symbols-outlined text-4xl text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                                lock_reset
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(37,71,244,0.5)]">
                            设置新密码
                        </h1>
                        <h2 className="text-xl font-medium tracking-tight text-white/90">
                            为你的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">声音双胞胎</span> 账号设置新密码
                        </h2>
                    </div>
                </div>

                {/* --- 玻璃拟态表单 --- */}
                <div
                    className="w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl backdrop-blur-xl transition-all duration-500"
                    style={{
                        background: 'rgba(20, 22, 35, 0.6)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)'
                    }}
                >
                    <form onSubmit={handleUpdatePassword} className="space-y-5">

                        {/* 1. 新密码输入框 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 ml-1">新密码</label>
                            <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                    placeholder="请输入新密码（至少 6 个字符）"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="pr-4 pl-2 text-gray-500 hover:text-white transition-colors focus:outline-none flex items-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* 2. 确认密码输入框 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 ml-1">确认新密码</label>
                            <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                    placeholder="请再次输入新密码"
                                />
                            </div>
                        </div>

                        {/* 消息提示区 */}
                        {error && (
                            <div className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-pulse">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="text-green-400 text-xs text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                                {message}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full overflow-hidden rounded-xl group h-14 shadow-[0_4px_20px_rgba(37,71,244,0.3)] hover:shadow-[0_4px_25px_rgba(37,71,244,0.5)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#2547f4] to-[#9333ea] transition-all duration-300 group-hover:scale-105"></div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                            <span className="relative flex items-center justify-center gap-2 text-white font-bold text-base tracking-wide">
                                {isLoading ? '更新中...' : '更新密码'}
                                {!isLoading && (
                                    <span className="material-symbols-outlined text-[18px] mt-[2px]">check</span>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* 底部提示 */}
                    <div className="flex justify-center items-center pt-2">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity cursor-pointer">
                                ← 返回首页
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
