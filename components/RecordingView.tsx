import React, { useEffect, useState, useRef } from 'react';
import { AnalysisData } from '../types';
import { CURRENT_USER } from '../constants';
import { AudioRecorder } from '../utils/audio-recorder';

interface RecordingViewProps {
    onAnalysisComplete: (data: AnalysisData) => void;
    userAvatarUrl: string;
}

const RecordingView: React.FC<RecordingViewProps> = ({ onAnalysisComplete, userAvatarUrl }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);

    // Audio Recorder for actual recording
    const mediaRecorderRef = useRef<AudioRecorder | null>(null);

    // Audio Context Refs for visualization
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Visual Element Refs
    const orbRef = useRef<HTMLDivElement>(null);
    const clarityBarRef = useRef<HTMLDivElement>(null);
    const stabilityBarRef = useRef<HTMLDivElement>(null);
    const clarityValueRef = useRef<HTMLDivElement>(null);
    const stabilityValueRef = useRef<HTMLDivElement>(null);

    // Analysis State Refs to capture final values
    const lastVolumeRef = useRef<number>(0);
    const currentStabilityRef = useRef<number>(0);
    const finalClarityRef = useRef<string>("High");
    const finalStabilityRef = useRef<string>("92%");

    // Cleanup function
    const cleanupAudio = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Reset visuals to neutral state
        if (orbRef.current) orbRef.current.style.transform = 'scale(1)';
        if (clarityBarRef.current) clarityBarRef.current.style.width = '0%';
        if (stabilityBarRef.current) stabilityBarRef.current.style.width = '0%';
        if (clarityValueRef.current) clarityValueRef.current.innerText = '准备中';
        if (stabilityValueRef.current) stabilityValueRef.current.innerText = '0%';
    };

    const updateVisuals = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // 1. Orb Effect: Scale based on volume
        if (orbRef.current) {
            // High sensitivity: (average / 255) * 1.5
            const scale = 1 + (average / 255) * 1.5;
            orbRef.current.style.transform = `scale(${scale})`;
        }

        // 2. Clarity: Map real-time volume
        const volumePercent = Math.min(100, (average / 120) * 100);

        if (clarityBarRef.current) {
            clarityBarRef.current.style.width = `${Math.max(5, volumePercent)}%`;
        }
        if (clarityValueRef.current) {
            let text = '低';
            if (volumePercent > 85) text = '极高';
            else if (volumePercent > 60) text = '高';
            else if (volumePercent > 30) text = '中';

            clarityValueRef.current.innerText = text;
            finalClarityRef.current = text; // Update ref for final capture
        }

        // 3. Stability: Based on volume consistency
        const diff = Math.abs(average - lastVolumeRef.current);
        lastVolumeRef.current = average;

        let targetStability = 0;
        if (average > 10) {
            const instability = diff * 5;
            targetStability = Math.max(0, 100 - instability);
        }

        const lerpFactor = 0.1;
        currentStabilityRef.current = currentStabilityRef.current + (targetStability - currentStabilityRef.current) * lerpFactor;
        const displayStability = Math.round(currentStabilityRef.current);

        if (stabilityBarRef.current) {
            stabilityBarRef.current.style.width = `${Math.max(5, displayStability)}%`;
        }
        if (stabilityValueRef.current) {
            stabilityValueRef.current.innerText = `${displayStability}%`;
            finalStabilityRef.current = `${displayStability}%`; // Update ref for final capture
        }

        animationFrameRef.current = requestAnimationFrame(updateVisuals);
    };

    const startRecordingSession = async () => {
        try {
            // 初始化 AudioRecorder 用于实际录音
            mediaRecorderRef.current = new AudioRecorder();
            await mediaRecorderRef.current.start();

            // 同时获取音频流用于可视化
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.5;
            analyserRef.current = analyser;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            updateVisuals();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("无法访问麦克风，请检查权限设置");
            setIsRecording(false);
        }
    };

    const generateRadarData = () => {
        const stabilityVal = parseInt(finalStabilityRef.current.replace('%', '')) || 0;
        // Map clarity text to a base value
        let clarityBase = 60;
        if (finalClarityRef.current === '极高') clarityBase = 95;
        else if (finalClarityRef.current === '高') clarityBase = 85;
        else if (finalClarityRef.current === '中') clarityBase = 70;
        else clarityBase = 50;

        const randomOffset = (range: number) => Math.floor(Math.random() * range) - range / 2;
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

        return [
            // Warmth correlates with stability
            {
                subject: '温暖度',
                A: clamp(stabilityVal + randomOffset(15), 40, 100),
                B: 95,
                fullMark: 150
            },
            // Brightness correlates with clarity
            {
                subject: '明亮度',
                A: clamp(clarityBase + randomOffset(10), 40, 100),
                B: 90,
                fullMark: 150
            },
            // Power correlates with clarity
            {
                subject: '力量感',
                A: clamp(clarityBase - 5 + randomOffset(15), 40, 100),
                B: 85,
                fullMark: 150
            },
            // Range is somewhat random as we don't do pitch detection here
            {
                subject: '音域',
                A: clamp(70 + randomOffset(30), 50, 100),
                B: 80,
                fullMark: 150
            },
            // Breathiness: usually inverse of stability, but high breathiness can be stylistic. 
            // Let's make it random but influenced by stability (less stable might mean more uncontrolled breath)
            {
                subject: '气息感',
                A: clamp(80 + randomOffset(20), 50, 100),
                B: 80,
                fullMark: 150
            },
        ];
    };

    const generateAndComplete = async () => {
        try {
            // 停止录音并获取音频 Blob
            if (mediaRecorderRef.current) {
                const audioBlob = await mediaRecorderRef.current.stop();

                // 上传并分析音频
                const analysisService = (await import('../services/analysis-service')).default;
                const fileExt = mediaRecorderRef.current.getFileExtension();
                const filename = `recording_${Date.now()}${fileExt}`;

                console.log('上传音频文件进行分析...');
                const result = await analysisService.analyzeVoice(audioBlob, filename);

                // 调用父组件的回调
                onAnalysisComplete(result);
            } else {
                // 如果录音器不存在，使用模拟数据（降级方案）
                console.warn('录音器未初始化，使用模拟数据');
                const result: AnalysisData = {
                    score: Math.floor(Math.random() * (99 - 85 + 1)) + 85,
                    clarity: finalClarityRef.current === '准备中' ? 'High' : (finalClarityRef.current === '低' ? 'Low' : 'High'),
                    stability: finalStabilityRef.current === '0%' ? '92%' : finalStabilityRef.current,
                    radarData: generateRadarData(),
                    matchedSinger: {
                        name: "阿黛尔",
                        description: "女中音 • 灵魂乐 • 流行",
                        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmHL-GSoaAVR2nfJdU3RF-yq_vzzGNqzdiMnQCWMZiRI-MeK70WSrgfb2O8KbrJgxOAgdCJ6_-Anh7UHo_0pOPVq77dOMLwJlg8pl3inEdd6gDhEAUlw_F1IfTlkD88gxn_uJf6ld3h7dq2f3jkVAxg46l2hann6dAhAzDlCATAkkXo2P-lkot_SOS1y4fOF6Vs9G9AQcQe6teCtWcPEdlD-TRJvT3A9xYIE8Sb_4qoEMadS9L-Tp69dahOLYjeT3b0VQXDk0tCNdd"
                    },
                    userAvatarUrl: userAvatarUrl
                };
                onAnalysisComplete(result);
            }
        } catch (error) {
            console.error('音频分析失败:', error);
            alert('音频分析失败，请重试');
        }
    };

    const stopRecordingSession = () => {
        setIsRecording(false);
        cleanupAudio();
        // Delay slightly for effect, then finish
        setTimeout(() => generateAndComplete(), 1000);
    };

    const handleClose = () => {
        setIsRecording(false);
        cleanupAudio();
        // Even on close, we generate a result for this demo flow
        generateAndComplete();
    };

    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRecording) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev >= 10) {
                        clearInterval(interval);
                        stopRecordingSession();
                        return 10;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecordingSession();
        } else {
            startRecordingSession();
        }
    };

    useEffect(() => {
        return () => cleanupAudio();
    }, []);

    const formatTime = (time: number) => {
        return `00:${time.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-6 pb-28 relative pt-6 h-full overflow-hidden">
            {/* Background Image Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay z-0"
                style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDBHVez2D6ZIz1NZioyPjwxy5yRlkIiYGKJUUVEKhtmKtqDbkIEWcVEWmOT5-BCYTlNGOtzDXVq0hieJZCfDLnnFOPLhgvYLXyLchtd73FaCEuC4fqGzsK_TjJN1pdW7GrNCXNmPphCf_XBlqe6FC2oo47Ged9EpC2x_LH-gWpCd54e6E3xtOJHtUKIQaiwi1-OkjyTHAyQxj6TagVVln87cvvPEtINLVR58LTFTgtZaOpchSnhYfwQKYhCp_ux2_1JrNU2qSV_4WPF')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            <header className="flex items-center justify-between w-full z-10">
                <button
                    onClick={handleClose}
                    className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
                >
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
                <h1 className="text-base font-bold tracking-wide text-white/80 font-body">声音分析</h1>
                <div className="size-10"></div>
            </header>

            <main className="w-full flex-1 flex flex-col items-center justify-between relative z-10">
                <div className="mt-8 text-center space-y-2">
                    <h2 className="text-[28px] font-bold leading-tight tracking-tight text-white drop-shadow-lg font-body">
                        {isRecording ? "正在聆听..." : "请唱歌或说话10秒"}
                    </h2>
                    <p className="text-white/60 text-sm font-light font-body">
                        正在分析您独特的声纹特征
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold tracking-tighter text-white tabular-nums font-display">{formatTime(timer)}</span>
                        <span className="text-sm font-medium text-white/50 font-display">s</span>
                    </div>
                </div>

                {/* Orb Container */}
                <div className="relative w-full flex-1 flex items-center justify-center min-h-[350px]">
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                        <div className={`w-80 h-80 rounded-full bg-primary/20 blur-[100px] ${isRecording ? 'animate-pulse' : ''}`}></div>
                    </div>

                    {/* Central Orb */}
                    <div className="relative w-64 h-64 flex items-center justify-center z-10">
                        <div className="absolute inset-0 fluid-orb-glow rounded-full"></div>
                        <div
                            ref={orbRef}
                            className="fluid-orb-core w-48 h-48 rounded-full z-20 transition-transform duration-75 ease-out will-change-transform"
                        ></div>
                        <div className="absolute w-32 h-32 border border-white/10 rounded-full animate-[spin_10s_linear_infinite] z-20 opacity-50"></div>
                        <div className="absolute w-40 h-40 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] z-20 opacity-30"></div>
                    </div>

                    {/* Floating Tags */}
                    <div className="absolute top-1/4 left-4 animate-float">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/15 transition-colors cursor-default">
                            <span className="material-symbols-outlined text-primary-light text-[18px]">graphic_eq</span>
                            <span className="text-xs font-medium tracking-wide text-white">音高</span>
                        </div>
                    </div>
                    <div className="absolute bottom-1/4 right-4 animate-float-delay-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/15 transition-colors cursor-default">
                            <span className="material-symbols-outlined text-purple-400 text-[18px]">audiotrack</span>
                            <span className="text-xs font-medium tracking-wide text-white">音色</span>
                        </div>
                    </div>
                    <div className="absolute top-1/3 right-8 animate-float-delay-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/15 transition-colors cursor-default">
                            <span className="material-symbols-outlined text-cyan-400 text-[18px]">height</span>
                            <span className="text-xs font-medium tracking-wide text-white">音域</span>
                        </div>
                    </div>
                </div>

                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                        <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 font-body">清晰度</div>
                        <div ref={clarityValueRef} className="text-white text-2xl font-bold font-body mb-3">准备中</div>
                        <div className="w-full bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-full h-2 overflow-hidden">
                            <div
                                ref={clarityBarRef}
                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full w-0 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-[width] duration-100 ease-linear"
                            ></div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                        <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 font-body">稳定性</div>
                        <div ref={stabilityValueRef} className="text-white text-2xl font-bold font-display mb-3">0%</div>
                        <div className="w-full bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-full h-2 overflow-hidden">
                            <div
                                ref={stabilityBarRef}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full w-0 shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-[width] duration-100 ease-linear"
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Record Button */}
                <div className="flex flex-col items-center gap-6 w-full">
                    <button
                        onClick={handleToggleRecording}
                        className={`group relative flex items-center justify-center size-24 rounded-full bg-white/5 transition-all active:scale-95 btn-halo border border-white/10 ${isRecording ? 'border-red-500/30' : ''}`}
                    >
                        <div className={`absolute inset-2 rounded-full border opacity-100 transition-colors ${isRecording ? 'border-red-500/60' : 'border-primary/30 group-hover:border-primary/60'}`}></div>
                        <div className={`size-8 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(37,71,244,0.8)] ${isRecording ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] rounded-sm' : 'bg-primary group-hover:rounded-sm'}`}></div>
                    </button>
                    <p className="text-sm font-medium text-white/70 uppercase tracking-widest animate-pulse font-body">
                        {isRecording ? "录制中..." : "点击开始"}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default RecordingView;