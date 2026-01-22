/**
 * 音频录制工具类
 * 使用 MediaRecorder API 录制音频并保存为 Blob
 */
export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    /**
     * 开始录音
     */
    async start(): Promise<void> {
        try {
            // 请求麦克风权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // 创建 MediaRecorder
            // NOTE: 使用 webm 格式,因为浏览器支持最好
            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType
            });

            this.audioChunks = [];

            // 监听数据可用事件
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // 开始录制
            this.mediaRecorder.start();
            console.log('录音已开始');
        } catch (error) {
            console.error('无法访问麦克风:', error);
            throw new Error('无法访问麦克风，请检查权限设置');
        }
    }

    /**
     * 停止录音
     */
    async stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('录音器未初始化'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                // 合并音频数据
                const mimeType = this.getSupportedMimeType();
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });

                // 清理资源
                this.cleanup();

                console.log(`录音已停止，大小: ${(audioBlob.size / 1024).toFixed(2)} KB`);
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    /**
     * 获取浏览器支持的音频 MIME 类型
     */
    private getSupportedMimeType(): string {
        const types = [
            'audio/webm',
            'audio/ogg',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        // 默认返回 webm
        return 'audio/webm';
    }

    /**
     * 获取文件扩展名
     */
    getFileExtension(): string {
        const mimeType = this.getSupportedMimeType();
        const map: Record<string, string> = {
            'audio/webm': '.webm',
            'audio/ogg': '.ogg',
            'audio/mp4': '.m4a',
            'audio/wav': '.wav'
        };
        return map[mimeType] || '.webm';
    }

    /**
     * 获取当前状态
     */
    get isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }
}
