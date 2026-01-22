import apiClient from '../api-client';

export interface AnalysisData {
    score: number;
    clarity: string;
    stability: string;
    radarData: { subject: string; A: number; B: number; fullMark: number }[];
    matchedSinger: {
        name: string;
        description: string;
        avatarUrl: string;
    };
    userAvatarUrl: string;
}

/**
 * 声音分析服务
 * 处理音频上传和分析请求
 */
class AnalysisService {
    /**
     * 上传音频文件并进行分析
     */
    async analyzeVoice(audioBlob: Blob, filename: string): Promise<AnalysisData> {
        // 创建 FormData
        const formData = new FormData();
        formData.append('audio_file', audioBlob, filename);

        // 发送请求（注意：Content-Type 会被自动设置为 multipart/form-data）
        const response = await apiClient.post('/api/analysis/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // 转换后端响应格式为前端格式
        const backendData = response.data;

        return {
            score: backendData.score,
            clarity: backendData.clarity,
            stability: backendData.stability,
            radarData: backendData.radar_data.map((point: any) => ({
                subject: point.subject,
                A: point.A,
                B: point.B,
                fullMark: point.fullMark
            })),
            matchedSinger: {
                name: backendData.matched_singer.name,
                description: backendData.matched_singer.description,
                avatarUrl: backendData.matched_singer.avatar_url
            },
            userAvatarUrl: backendData.user_avatar_url || localStorage.getItem('user_avatar') || ''
        };
    }

    /**
     * 获取分析结果
     */
    async getAnalysis(analysisId: string): Promise<AnalysisData> {
        const response = await apiClient.get(`/api/analysis/${analysisId}`);

        const backendData = response.data;
        return {
            score: backendData.score,
            clarity: backendData.clarity,
            stability: backendData.stability,
            radarData: backendData.radar_data.map((point: any) => ({
                subject: point.subject,
                A: point.A,
                B: point.B,
                fullMark: point.fullMark
            })),
            matchedSinger: {
                name: backendData.matched_singer.name,
                description: backendData.matched_singer.description,
                avatarUrl: backendData.matched_singer.avatar_url
            },
            userAvatarUrl: backendData.user_avatar_url || ''
        };
    }

    /**
     * 获取用户分析历史
     */
    async getUserAnalysisHistory(userId: string, limit: number = 10) {
        const response = await apiClient.get(`/api/analysis/user/${userId}/history`, {
            params: { limit }
        });
        return response.data;
    }
}

export default new AnalysisService();
