import React, { useRef, useState, useEffect } from 'react';
import { CURRENT_USER } from '../constants';
import { AppView } from '../types';
import { supabase } from '../services/auth-service';
import authService from '../services/auth-service';

interface ProfileViewProps {
    onNavigate: (view: AppView) => void;
    avatarUrl: string;
    onUpdateAvatar: (url: string) => void;
    analysisCount: number;
    savedSongsCount: number;
}

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'system' | 'analysis' | 'achievement' | 'match' | 'security';
    unread: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, avatarUrl, onUpdateAvatar, analysisCount: initialAnalysisCount, savedSongsCount: initialSavedSongsCount }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [username, setUsername] = useState('声音探索者');
    const [tempUsername, setTempUsername] = useState('');
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [cacheSize, setCacheSize] = useState('128.5 MB');
    const [uidCopied, setUidCopied] = useState(false);

    // 实时统计数据状态
    const [analysisCount, setAnalysisCount] = useState(initialAnalysisCount);
    const [savedSongsCount, setSavedSongsCount] = useState(initialSavedSongsCount);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

    // Password Change State
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Agreements Modal State
    const [showAgreements, setShowAgreements] = useState(false);
    const [viewingPolicyDetail, setViewingPolicyDetail] = useState(false);

    // Help & Feedback State
    const [showHelp, setShowHelp] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);

    // Notification Center State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: '1',
            title: '系统维护提醒',
            description: '今晚 23:30 - 00:30 将进行例行维护，期间部分功能可能不可用。',
            time: '2分钟前',
            type: 'system',
            unread: true
        },
        {
            id: '2',
            title: '分析报告已生成',
            description: '你的最新一次声音分析结果已生成，快去查看匹配歌手与雷达图吧。',
            time: '12分钟前',
            type: 'analysis',
            unread: true
        },
        {
            id: '3',
            title: '成就解锁：初次探索',
            description: '恭喜完成第一次声音分析！你已点亮「初次探索」徽章。',
            time: '1小时前',
            type: 'achievement',
            unread: false
        },
        {
            id: '4',
            title: '匹配成功提示',
            description: '你与「霓虹歌手」的匹配度提升了，尝试再录一次看看能否突破 90 分。',
            time: '昨天',
            type: 'match',
            unread: false
        },
        {
            id: '5',
            title: '安全提示',
            description: '请定期修改密码并开启通知，以确保账号安全。',
            time: '2天前',
            type: 'security',
            unread: false
        },
        {
            id: '6',
            title: '成就解锁：收藏达人',
            description: '你已收藏 10 首歌曲，继续保持！',
            time: '3天前',
            type: 'achievement',
            unread: true
        }
    ]);

    const unreadCount = notifications.filter(n => n.unread).length;

    // 实时获取用户统计数据
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // 1. 优先从Supabase Auth获取用户信息 (避免闪烁)
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.warn('⚠️ 未找到登录用户');
                    return;
                }

                const userId = user.id;
                console.log('📊 开始加载用户数据, userId:', userId);

                // 2. 立即显示user_metadata中的昵称和头像 (避免闪烁)
                if (user.user_metadata) {
                    if (user.user_metadata.full_name) {
                        setUsername(user.user_metadata.full_name);
                        setTempUsername(user.user_metadata.full_name);
                        console.log('✅ 昵称(缓存):', user.user_metadata.full_name);
                    }
                    if (user.user_metadata.avatar_url) {
                        const avatarWithTimestamp = `${user.user_metadata.avatar_url}?t=${Date.now()}`;
                        setCurrentAvatarUrl(avatarWithTimestamp);
                        onUpdateAvatar(avatarWithTimestamp);
                        console.log('✅ 头像(缓存)已加载');
                    }
                }

                // 3. 后台静默查询最新的统计数据
                setIsLoadingStats(true);

                const [analysesResult, favoritesResult] = await Promise.all([
                    // 查询voice_analyses表统计分析次数
                    supabase
                        .from('voice_analyses')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .throwOnError(),

                    // 查询user_favorites表统计收藏数
                    supabase
                        .from('user_favorites')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .throwOnError()
                ]);

                // 4. 平滑更新统计数据
                if (analysesResult.count !== null) {
                    setAnalysisCount(analysesResult.count);
                    console.log('✅ 分析次数:', analysesResult.count);
                } else {
                    console.warn('⚠️ 未获取到分析次数');
                }

                if (favoritesResult.count !== null) {
                    setSavedSongsCount(favoritesResult.count);
                    console.log('✅ 收藏数:', favoritesResult.count);
                } else {
                    console.warn('⚠️ 未获取到收藏数');
                }

                console.log('✅ 用户数据加载完成');

            } catch (error: any) {
                console.error('❌ 加载用户数据失败:', error);

                // 详细的错误信息,帮助诊断RLS权限问题
                if (error.code) {
                    console.error('错误代码:', error.code);
                }
                if (error.message) {
                    console.error('错误信息:', error.message);
                }
                if (error.details) {
                    console.error('错误详情:', error.details);
                }
                if (error.hint) {
                    console.error('错误提示:', error.hint);
                }
            } finally {
                setIsLoadingStats(false);
            }
        };

        // 组件挂载时加载数据
        loadUserData();
    }, []); // 空依赖数组,只在组件挂载时执行一次

    // 监听avatarUrl prop变化,同步更新本地状态
    useEffect(() => {
        if (avatarUrl) {
            // 添加时间戳防止缓存
            const avatarWithTimestamp = `${avatarUrl}?t=${Date.now()}`;
            setCurrentAvatarUrl(avatarWithTimestamp);
        }
    }, [avatarUrl]);

    const faqs = [
        {
            question: "如何提高匹配准确度?",
            answer: "请在安静环境下录音，尽量贴近麦克风保持稳定音量，避免环境噪声和回声。建议录制 10 秒以上且有完整句子的语音，以便模型更好地分析声纹特征。"
        },
        {
            question: "录音没有声音怎么办?",
            answer: "请检查您的设备是否已授权麦克风权限。您可以尝试在系统设置中允许浏览器或应用访问麦克风，或者尝试重新插拔耳机/麦克风设备。"
        },
        {
            question: "什么是声纹雷达?",
            answer: "声纹雷达是我们独创的声音分析图表，通过温暖度、明亮度、力量感、音域和气息感五个维度，直观地展示您的声音特色和属性。"
        },
        {
            question: "匹配的歌手是谁?",
            answer: "匹配的歌手是根据您的声纹特征，在我们的专业歌手数据库中找到声音特质最接近的艺人。这能帮助您找到适合自己声线的歌曲风格。"
        }
    ];

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }

        // 验证文件大小 (限制5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }

        try {
            console.log('📤 开始上传头像到Supabase Storage...');

            // 获取当前用户ID
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                throw new Error('未找到用户ID');
            }

            // 1. 生成唯一文件名 (使用时间戳避免重复)
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 2. 上传到Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')  // bucket名称
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true  // 如果文件已存在则覆盖
                });

            if (uploadError) {
                throw uploadError;
            }

            console.log('✅ 文件上传成功:', uploadData.path);

            // 3. 获取公开URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            console.log('✅ 获取公开URL:', publicUrl);

            // 验证URL长度 (必须是短URL,不是Base64)
            if (publicUrl.length > 500) {
                throw new Error('URL异常,长度超过500字符');
            }

            // 4. 更新用户资料 (只存储publicUrl,不是Base64!)
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    avatar_url: publicUrl  // 只存储短URL
                }
            });

            if (updateError) {
                throw updateError;
            }

            console.log('✅ 头像URL保存到Supabase成功');

            // 5. 更新前端显示 (添加时间戳防止缓存)
            const avatarWithTimestamp = `${publicUrl}?t=${Date.now()}`;
            setCurrentAvatarUrl(avatarWithTimestamp);
            onUpdateAvatar(avatarWithTimestamp);

            alert('头像上传成功!');

        } catch (error: any) {
            console.error('❌ 头像上传失败:', error);

            // 详细错误信息
            if (error.message) {
                alert(`头像上传失败: ${error.message}`);
            } else {
                alert('头像上传失败,请重试');
            }
        }
    };

    const handleOpenSettings = () => {
        setTempUsername(username);
        setShowSettings(true);
    };

    const handleSaveSettings = async () => {
        if (!tempUsername.trim()) {
            setShowSettings(false);
            return;
        }

        try {
            console.log('💾 开始保存用户资料...');

            // 调用Supabase Auth更新用户昵称 (关键步骤!)
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: tempUsername.trim()  // 保存到user_metadata
                }
            });

            if (error) {
                throw error;
            }

            console.log('✅ 昵称保存到Supabase成功');

            // 只有保存成功后才更新前端显示
            setUsername(tempUsername.trim());
            setShowSettings(false);

        } catch (error) {
            console.error('❌ 保存用户资料失败:', error);
            alert('保存失败,请重试: ' + (error as Error).message);
        }
    };

    const handleClearCache = () => {
        setCacheSize('0 B');
    };

    const handleCopyUid = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(CURRENT_USER.uid);
            setUidCopied(true);
            setTimeout(() => setUidCopied(false), 2000);
        }
    };

    const handleOpenChangePassword = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess('');
        setShowChangePassword(true);
    };

    const handleOpenAgreements = () => {
        setShowAgreements(true);
        setViewingPolicyDetail(false);
    };

    const handleOpenHelp = () => {
        setShowHelp(true);
        setExpandedFaq(0);
        setFeedbackText('');
        setFeedbackSuccess(false);
    };

    const handleOpenNotifications = () => {
        setShowNotifications(true);
    };

    const handleClearNotifications = () => {
        setNotifications([]);
    };

    const handleSubmitFeedback = () => {
        if (!feedbackText.trim()) return;
        setFeedbackSuccess(true);
        // Simulate API call
        setTimeout(() => {
            setFeedbackSuccess(false);
            setFeedbackText('');
            setShowHelp(false);
        }, 1500);
    };

    const handleSubmitPassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('请填写所有字段');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('新密码与确认密码不一致');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('新密码长度至少需要6位');
            return;
        }

        // Simulate success
        setPasswordError('');
        setPasswordSuccess('密码修改成功');
        setTimeout(() => {
            setShowChangePassword(false);
            setPasswordSuccess('');
        }, 1500);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'system': return 'notifications';
            case 'analysis': return 'graphic_eq';
            case 'achievement': return 'emoji_events';
            case 'match': return 'graphic_eq';
            case 'security': return 'notifications';
            default: return 'notifications';
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-[#050508]">
            {/* Background Light Leak */}
            <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px]"></div>
            </div>

            {/* Notification Center Modal */}
            {showNotifications && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#151926] border border-white/10 rounded-3xl p-0 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                            <button onClick={() => setShowNotifications(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h3 className="text-xl font-bold text-white font-body">通知中心</h3>
                            <button
                                onClick={handleClearNotifications}
                                className="h-10 px-4 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                清空
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                                    <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl opacity-50">notifications_off</span>
                                    </div>
                                    <p className="text-sm font-body">暂无新通知</p>
                                </div>
                            ) : (
                                notifications.map((item) => (
                                    <div key={item.id} className="relative p-4 rounded-2xl bg-[#050508]/60 border border-white/5 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="shrink-0 relative">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${item.unread ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(37,71,244,0.2)]' : 'bg-white/5 text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-xl">
                                                    {getNotificationIcon(item.type)}
                                                </span>
                                            </div>
                                            {item.unread && (
                                                <div className="absolute -top-0.5 -right-0.5 size-2.5 bg-red-500 rounded-full border-2 border-[#151926]"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className={`text-sm font-bold truncate ${item.unread ? 'text-white' : 'text-slate-300'}`}>{item.title}</h4>
                                                <span className="text-[10px] text-slate-500 font-display shrink-0">{item.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Help & Feedback Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#151926] border border-white/10 rounded-3xl p-0 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                            <button onClick={() => setShowHelp(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h3 className="text-xl font-bold text-white font-body">帮助与反馈</h3>
                            <div className="size-10"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                            {/* FAQ Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-white/90">常见问题</h4>
                                <div className="space-y-2">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="rounded-xl bg-[#050508]/50 border border-white/5 overflow-hidden transition-all duration-300">
                                            <button
                                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                className="flex items-center justify-between w-full p-4 text-left"
                                            >
                                                <span className="text-sm font-medium text-white/90">{faq.question}</span>
                                                <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${expandedFaq === index ? 'rotate-180' : ''}`}>expand_more</span>
                                            </button>
                                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <p className="px-4 pb-4 text-xs text-slate-400 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-white/90">发送反馈</h4>
                                <div className="relative">
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="请描述您遇到的问题、期望的功能或任何想对我们要说的话..."
                                        className="w-full h-32 rounded-xl bg-[#050508]/50 border border-white/10 p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 resize-none font-body transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="p-6 pt-2 shrink-0 bg-gradient-to-t from-[#151926] to-transparent">
                            <button
                                onClick={handleSubmitFeedback}
                                disabled={!feedbackText.trim() || feedbackSuccess}
                                className={`w-full h-12 rounded-xl font-bold font-body transition-all flex items-center justify-center gap-2 ${feedbackSuccess ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'}`}
                            >
                                {feedbackSuccess ? (
                                    <>
                                        <span className="material-symbols-outlined">check</span>
                                        提交成功
                                    </>
                                ) : '提交反馈'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Agreements Modal */}
            {showAgreements && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#151926] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 h-[75vh]">
                        <div className="flex items-center justify-between shrink-0">
                            {viewingPolicyDetail ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setViewingPolicyDetail(false)} className="text-slate-400 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <h3 className="text-xl font-bold text-white font-body">隐私政策详情</h3>
                                </div>
                            ) : (
                                <h3 className="text-xl font-bold text-white font-body">用户协议与隐私政策</h3>
                            )}
                            <button onClick={() => { setShowAgreements(false); setViewingPolicyDetail(false); }} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 text-slate-300 text-sm leading-relaxed font-body">
                            {viewingPolicyDetail ? (
                                <div className="space-y-4 p-1 animate-in fade-in slide-in-from-right-4 duration-300 text-slate-300">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-white text-base">《波可隐私政策》</h4>
                                        <p className="text-xs text-slate-500">更新日期：2026年1月14日</p>
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        波可深知个人信息安全的重要性，并致力于按照法律法规的要求保护您的个人信息。本政策旨在清晰地说明我们如何收集、使用、存储、共享和保护您的信息，以及您享有的权利。
                                    </p>

                                    <h5 className="font-bold text-white mt-4 text-sm">1. 我们如何收集信息</h5>
                                    <p className="text-sm leading-relaxed mb-2">为向您提供核心服务并保障账户安全，我们会在您使用服务过程中收集以下必要信息：</p>
                                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                                        <li><strong>账户信息：</strong>您注册时提供的用户名、UID。</li>
                                        <li><strong>声音内容：</strong>您主动上传、进行分析的声音文件及其关联的标签、描述信息。</li>
                                        <li><strong>设备与日志信息：</strong>为保障服务安全运行，我们会收集您的设备型号、操作系统版本、唯一设备标识符（如IDFA/Android ID）、IP地址、应用崩溃日志、操作时间及使用行为记录。</li>
                                        <li><strong>权限申请：</strong>部分功能可能需要您授权访问麦克风（用于录音）、本地存储（用于读取/保存音频文件）。每一项权限都对应明确的功能，您可以在设备设置中随时关闭授权。</li>
                                    </ul>

                                    <h5 className="font-bold text-white mt-4 text-sm">2. 我们如何使用信息</h5>
                                    <p className="text-sm leading-relaxed mb-2">我们严格遵守“合法、正当、必要”的原则使用您的信息，主要用于以下目的：</p>
                                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                                        <li>提供、维护和优化声音分析、匹配、收藏等核心功能。</li>
                                        <li>进行产品内数据分析、故障诊断及安全防范。</li>
                                        <li>通过分析匿名化的使用趋势，改进产品功能与用户体验。</li>
                                        <li>在法律要求时，用于配合监管或司法程序。</li>
                                    </ul>

                                    <h5 className="font-bold text-white mt-4 text-sm">3. 我们如何存储与保护信息</h5>
                                    <p className="text-sm leading-relaxed text-slate-400">
                                        我们将在实现本政策所述目的所必需的期限内保留您的个人信息，法律另有规定或您另行授权延长保留期的除外。您的数据存储于境内的安全服务器，我们采取了符合行业标准的技术与管理措施（如加密传输、访问控制）来防止数据丢失、滥用及未授权访问。但请注意，任何互联网传输与存储方式都无法做到100%绝对安全。
                                    </p>

                                    <h5 className="font-bold text-white mt-4 text-sm">4. 我们如何共享信息</h5>
                                    <p className="text-sm leading-relaxed mb-2">我们不会将您的个人信息出售给任何第三方。仅在以下情形，我们可能会共享必要信息：</p>
                                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                                        <li>获取您的单独同意。</li>
                                        <li>为履行法定职责：应司法或行政机关的法律文书要求。</li>
                                        <li>委托处理：仅为实现本政策目的，委托可信赖的合作伙伴（如云服务器提供商、数据分析服务商）进行处理。我们将通过合同约束其严格遵守保密义务，并禁止其将信息用于任何其他目的。</li>
                                    </ul>

                                    <h5 className="font-bold text-white mt-4 text-sm">5. 您的权利</h5>
                                    <p className="text-sm leading-relaxed mb-2">您对自己的个人信息享有以下权利，您可以通过应用内“设置-意见反馈”或下文提供的联系方式行使：</p>
                                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                                        <li>访问、更正、删除您的个人信息。</li>
                                        <li>改变您已同意的授权范围（例如关闭麦克风权限）。</li>
                                        <li>注销您的波可账户。注销后，我们将按法律规定删除或匿名化处理您的个人信息。</li>
                                    </ul>

                                    <h5 className="font-bold text-white mt-4 text-sm">6. Cookie与同类技术</h5>
                                    <p className="text-sm leading-relaxed text-slate-400">
                                        我们使用Cookie等技术来识别用户身份、记录偏好，以提升您的浏览体验和分析服务使用情况。您可以通过浏览器设置管理Cookie，但请注意，禁用部分Cookie可能会影响服务的正常功能。
                                    </p>

                                    <h5 className="font-bold text-white mt-4 text-sm">7. 未成年人保护</h5>
                                    <p className="text-sm leading-relaxed text-slate-400">
                                        波可主要面向成年人。若您是14周岁以下的未成年人，请在监护人的陪同下阅读本政策，并在监护人明确同意和指导下使用我们的服务。若您是14周岁以上但未满18周岁的未成年人，建议在监护人指导下使用。
                                    </p>

                                    <h5 className="font-bold text-white mt-4 text-sm">8. 政策更新</h5>
                                    <p className="text-sm leading-relaxed text-slate-400">
                                        我们可能会适时更新本政策。如更新导致您的权利发生实质性变化，我们将在变更生效前，通过应用内推送通知或官网公告等显著方式提醒您。若您在本政策更新后继续使用波可服务，即表示您同意接受更新后的政策。
                                    </p>

                                    <h5 className="font-bold text-white mt-4 text-sm">9. 联系我们</h5>
                                    <p className="text-sm leading-relaxed mb-2">如您对本政策或您的个人信息处理有任何疑问、意见或投诉，请通过以下方式联系我们：</p>
                                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-400">
                                        <li>客服邮箱：C2678479061@163.com</li>
                                        <li>应用内反馈：在“波可”应用内，“我的”-“设置”-“意见反馈”中提交。</li>
                                    </ul>

                                    <div className="h-4"></div>
                                </div>
                            ) : (
                                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div
                                        onClick={() => setViewingPolicyDetail(true)}
                                        className="p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all group active:scale-[0.99]"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-white font-bold group-hover:text-primary transition-colors">
                                                《波可隐私政策》
                                            </h4>
                                            <span className="material-symbols-outlined text-slate-500 text-lg group-hover:translate-x-1 transition-transform group-hover:text-primary">chevron_right</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            波可深知个人信息安全的重要性，并致力于按照法律法规的要求保护您的个人信息。本政策...
                                        </p>
                                    </div>

                                    <p className="text-xs text-slate-500 text-center pt-2">
                                        更新日期：2026年1月14日
                                    </p>
                                </div>
                            )}
                        </div>

                        {!viewingPolicyDetail && (
                            <button
                                onClick={() => setShowAgreements(false)}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold font-body shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] shrink-0"
                            >
                                我已阅读并同意
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#151926] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-white font-body">修改密码</h3>
                            <button onClick={() => setShowChangePassword(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {passwordSuccess ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-3 animate-in fade-in zoom-in duration-300">
                                <div className="size-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <span className="material-symbols-outlined text-3xl">check</span>
                                </div>
                                <p className="text-white font-medium font-body">{passwordSuccess}</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {passwordError && (
                                        <div className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            {passwordError}
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">当前密码</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full rounded-xl bg-[#050508]/50 border border-white/10 focus:border-primary/60 focus:shadow-[0_0_15px_rgba(37,71,244,0.15)] text-white text-sm h-12 px-4 outline-none transition-all placeholder:text-gray-600 font-body"
                                            placeholder="请输入当前使用的密码"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">新密码</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full rounded-xl bg-[#050508]/50 border border-white/10 focus:border-primary/60 focus:shadow-[0_0_15px_rgba(37,71,244,0.15)] text-white text-sm h-12 px-4 outline-none transition-all placeholder:text-gray-600 font-body"
                                            placeholder="设置新密码（至少6位）"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">确认新密码</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full rounded-xl bg-[#050508]/50 border border-white/10 focus:border-primary/60 focus:shadow-[0_0_15px_rgba(37,71,244,0.15)] text-white text-sm h-12 px-4 outline-none transition-all placeholder:text-gray-600 font-body"
                                            placeholder="请再次输入新密码"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmitPassword}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold font-body shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] mt-2"
                                >
                                    确认修改
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#151926] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-white font-body">账号设置</h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-1">
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">基本信息</label>

                                <div className="space-y-1">
                                    <div className="flex items-center w-full rounded-xl bg-[#050508]/50 border border-white/10 focus-within:border-primary/60 transition-colors h-12 px-4 focus-within:shadow-[0_0_15px_rgba(37,71,244,0.2)]">
                                        <input
                                            type="text"
                                            value={tempUsername}
                                            onChange={(e) => setTempUsername(e.target.value)}
                                            className="bg-transparent border-none text-white w-full text-sm font-body focus:ring-0 p-0 placeholder-gray-600"
                                            placeholder="请输入昵称"
                                        />
                                        <span className="material-symbols-outlined text-slate-500 text-[18px]">edit</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full rounded-xl bg-[#050508]/30 border border-white/5 h-12 px-4 select-none">
                                    <span className="text-slate-500 text-sm font-display">UID: {CURRENT_USER.uid}</span>
                                    <button
                                        onClick={handleCopyUid}
                                        className="flex items-center justify-center size-8 rounded-full hover:bg-white/10 transition-colors"
                                        title="复制UID"
                                    >
                                        <span className={`material-symbols-outlined text-[18px] transition-colors ${uidCopied ? 'text-green-500' : 'text-slate-500'}`}>
                                            {uidCopied ? 'check' : 'content_copy'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">安全与隐私</label>
                                <button
                                    onClick={handleOpenChangePassword}
                                    className="flex items-center justify-between w-full rounded-xl bg-[#050508]/50 border border-white/10 h-12 px-4 hover:bg-[#050508] transition-colors group"
                                >
                                    <span className="text-white text-sm font-body">修改密码</span>
                                    <span className="material-symbols-outlined text-slate-500 text-[20px] group-hover:text-white transition-colors">chevron_right</span>
                                </button>
                                <button
                                    onClick={handleOpenAgreements}
                                    className="flex items-center justify-between w-full rounded-xl bg-[#050508]/50 border border-white/10 h-12 px-4 hover:bg-[#050508] transition-colors group"
                                >
                                    <span className="text-white text-sm font-body">用户协议与隐私政策</span>
                                    <span className="material-symbols-outlined text-slate-500 text-[20px] group-hover:text-white transition-colors">chevron_right</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">通用</label>

                                <div className="flex items-center justify-between w-full rounded-xl bg-[#050508]/50 border border-white/10 h-12 px-4">
                                    <span className="text-white text-sm font-body">接收推送通知</span>
                                    <button
                                        onClick={() => setNotificationEnabled(!notificationEnabled)}
                                        className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${notificationEnabled ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${notificationEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>

                                <button
                                    onClick={handleClearCache}
                                    className="flex items-center justify-between w-full rounded-xl bg-[#050508]/50 border border-white/10 h-12 px-4 hover:bg-[#050508] transition-colors active:scale-[0.99]"
                                >
                                    <span className="text-white text-sm font-body">清理缓存</span>
                                    <span className="text-xs text-slate-500 font-display">{cacheSize}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 pt-2">
                            <button
                                onClick={handleSaveSettings}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold font-body shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                            >
                                保存修改
                            </button>
                            <button
                                className="w-full h-12 rounded-xl text-red-500 text-sm font-medium hover:bg-red-500/5 transition-colors"
                            >
                                注销账号
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="relative z-10 flex items-center p-4 pt-6 justify-between">
                <div className="size-10"></div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-wide font-body">个人中心</h2>
                <div className="size-10"></div>
            </header>

            <section className="relative z-10 flex flex-col items-center mt-4 mb-8">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-primary to-transparent opacity-70 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg"></div>
                    <div
                        className="relative h-32 w-32 rounded-full border-[3px] border-primary bg-surface-dark bg-center bg-cover shadow-neon overflow-hidden"
                        style={{ backgroundImage: `url("${currentAvatarUrl}")` }}
                    >
                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center px-3 py-1 rounded-full bg-[#050505] border border-primary shadow-lg z-10">
                        <span className="text-primary text-xs font-bold font-display tracking-wider">HZ</span>
                    </div>
                </div>
                <div className="mt-6 flex flex-col items-center gap-1">
                    <h1 className="text-2xl font-bold text-white tracking-wide font-body">{username}</h1>
                    <p className="text-slate-400 text-sm font-light font-display">UID: {CURRENT_USER.uid}</p>
                </div>
            </section>

            <section className="relative z-10 px-6 mb-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-surface-dark/50 backdrop-blur-sm border border-white/5 shadow-lg">
                        <p className="text-4xl font-bold text-white font-display drop-shadow-[0_0_10px_rgba(37,71,244,0.6)]">{analysisCount}</p>
                        <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide font-body">已分析次数</p>
                    </div>
                    <div className="h-12 w-[1px] bg-white/10"></div>
                    <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-surface-dark/50 backdrop-blur-sm border border-white/5 shadow-lg">
                        <p className="text-4xl font-bold text-white font-display drop-shadow-[0_0_10px_rgba(37,71,244,0.6)]">{savedSongsCount}</p>
                        <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide font-body">已收藏歌曲数</p>
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-4 flex flex-col gap-3">
                {[
                    { icon: 'settings', label: '账号设置', action: handleOpenSettings },
                    { icon: 'notifications', label: '通知中心', action: handleOpenNotifications, badge: unreadCount > 0 },
                    { icon: 'help', label: '帮助与反馈', action: handleOpenHelp }
                ].map((item, idx) => (
                    <button
                        key={idx}
                        onClick={item.action}
                        className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-surface-dark/40 border border-white/5 backdrop-blur-md active:scale-[0.98] transition-all hover:bg-surface-dark/60"
                    >
                        <div className="flex items-center justify-center shrink-0 size-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        </div>
                        <div className="flex flex-1 flex-col items-start gap-0.5">
                            <span className="text-white text-base font-medium font-body">{item.label}</span>
                        </div>
                        {item.badge && <div className="size-2 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>}
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">chevron_right</span>
                    </button>
                ))}

                <button
                    onClick={() => onNavigate(AppView.LOGIN)}
                    className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-surface-dark/40 border border-white/5 backdrop-blur-md active:scale-[0.98] transition-all hover:bg-surface-dark/60 mt-2"
                >
                    <div className="flex items-center justify-center shrink-0 size-10 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="text-white text-base font-medium font-body">退出登录</span>
                    </div>
                </button>
            </section>
        </div>
    );
};

export default ProfileView;