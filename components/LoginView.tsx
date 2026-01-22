import React, { useState } from 'react';
import authService from '../services/auth-service';

interface LoginViewProps {
    onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetError, setResetError] = useState('');

    const handleAuth = async () => {
        setMessage('');
        setError('');
        
        if (!email.trim() || !password.trim()) {
            setError('请输入账号和密码');
            return;
        }

        if (isRegistering && !username.trim()) {
            setError('请输入用户名');
            return;
        }

        if (isRegistering && !confirmPassword.trim()) {
            setError('请确认密码');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             setError('请输入有效的邮箱地址');
             return;
        }

        if (isRegistering) {
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                return;
            }
            
            setIsLoading(true);
            try {
                await authService.register(email, password, username);
                setMessage('注册成功！正在为您自动登录...');
                setTimeout(() => { onLogin(); }, 1500);
            } catch (err: any) {
                setError(err.message || '注册失败，请稍后重试');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        setIsLoading(true);
        try {
            await authService.login(email, password);
            onLogin();
        } catch (err: any) {
            setError(err.message || '登录失败，请检查账号密码');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
        setUsername('');
        setConfirmPassword('');
    };

    const openResetModal = () => {
        setResetEmail('');
        setResetError('');
        setShowResetModal(true);
    };

    const handleResetSubmit = () => {
        if (!resetEmail.trim()) {
            setResetError('请输入邮箱地址');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resetEmail)) {
            setResetError('请输入有效的邮箱地址');
            return;
        }
        setShowResetModal(false);
        setMessage(`重置密码链接已发送至 ${resetEmail}`);
        setError('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { handleAuth(); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {isRegistering ? '创建账号' : '欢迎回来'}
                    </h1>
                    <p className="text-gray-400">发现你的声音之旅</p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 space-y-6 border border-gray-700">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
                            {message}
                        </div>
                    )}

                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">用户名</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="请输入用户名"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="请输入邮箱"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">密码</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="请输入密码"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? '隐藏' : '显示'}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">确认密码</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="请再次输入密码"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                        {isLoading ? '处理中...' : (isRegistering ? '立即注册' : '登录')}
                    </button>

                    <div className="text-center">
                        <button onClick={toggleMode} className="text-gray-400 hover:text-white text-sm">
                            {isRegistering ? '已有账号？立即登录' : '还没有账号？立即免费注册'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
