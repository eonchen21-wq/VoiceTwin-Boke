import React, { useState } from 'react';
import authService from '../services/auth-service';
// 删除掉了原来的 lucide-react 引用，因为不再需要了

interface LoginViewProps {
    onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    // --- 状态管理 ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- 核心业务逻辑 ---
    const handleAuth = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setMessage('');
        setError('');

        // 1. 基础验证
        if (!email.trim() || !password.trim()) {
            setError('请输入账号和密码');
            return;
        }

        // 2. 注册特有的验证
        if (isRegistering) {
            if (!username.trim()) {
                setError('请输入用户名');
                return;
            }
            if (!confirmPassword.trim()) {
                setError('请确认密码');
                return;
            }
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                return;
            }
        }

        // 3. 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('请输入有效的邮箱地址');
            return;
        }

        setIsLoading(true);

        try {
            if (isRegistering) {
                await authService.register(email, password, username);
                setMessage('注册成功！正在为您自动登录...');
                setTimeout(() => { onLogin(); }, 1500);
            } else {
                await authService.login(email, password);
                onLogin();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || (isRegistering ? '注册失败，请稍后重试' : '登录失败，请检查账号密码'));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setMessage('');
        setPassword('');
        setConfirmPassword('');
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
                            {/*这下面是新的 Google Material Icon (带渐变填充) */}
                            <span className="material-symbols-outlined text-4xl text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                                graphic_eq
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(37,71,244,0.5)]">
                            {isRegistering ? '创建账号' : '欢迎回来'}
                        </h1>
                        <h2 className="text-xl font-medium tracking-tight text-white/90">
                            {isRegistering ? '开启你的' : '发现你的'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">声音双胞胎</span>
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
                    <form onSubmit={handleAuth} className="space-y-5">

                        {/* 1. 用户名输入框 */}
                        {isRegistering && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="text-xs font-medium text-gray-400 ml-1">用户名</label>
                                <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                    <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                        placeholder="请输入用户名"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. 邮箱输入框 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 ml-1">账号 (邮箱)</label>
                            <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        {/* 3. 密码输入框 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 ml-1">密码</label>
                            <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                    placeholder="请输入密码"
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

                        {/* 4. 确认密码 */}
                        {isRegistering && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="text-xs font-medium text-gray-400 ml-1">确认密码</label>
                                <div className="group flex items-center w-full rounded-xl bg-[#1a1d2d]/80 border border-white/5 focus-within:border-[#2547f4]/60 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.3)] transition-all duration-300">
                                    <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-[#2547f4] transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-transparent border-none text-white placeholder-gray-500/80 focus:ring-0 h-12 py-3 pl-0 pr-4 text-sm outline-none"
                                        placeholder="请再次输入密码"
                                    />
                                </div>
                            </div>
                        )}

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
                                {isLoading ? '处理中...' : (isRegistering ? '立即注册' : '登录')}
                                {!isLoading && (
                                    <span className="material-symbols-outlined text-[18px] mt-[2px]">arrow_forward</span>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* 底部切换链接 */}
                    <div className="flex justify-center items-center pt-2">
                        <button
                            onClick={toggleMode}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            {isRegistering ? '已有账号？' : '还没有账号？'}
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity ml-1 cursor-pointer">
                                {isRegistering ? '立即登录' : '立即免费注册'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;