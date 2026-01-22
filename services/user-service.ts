import apiClient from '../api-client';

export interface UserStats {
    level: number;
    analysisCount: number;
    savedSongs: number;
    uid: string;
    avatarUrl: string;
}

/**
 * 用户服务
 * 处理用户信息管理
 */
class UserService {
    /**
     * 获取用户信息
     */
    async getUser(userId: string) {
        const response = await apiClient.get(`/api/users/${userId}`);
        return response.data;
    }

    /**
     * 更新用户信息
     */
    async updateUser(userId: string, data: { username?: string; avatar_url?: string }) {
        const response = await apiClient.put(`/api/users/${userId}`, data);
        return response.data;
    }

    /**
     * 更新用户头像
     */
    async updateAvatar(userId: string, avatarUrl: string) {
        const response = await apiClient.put(`/api/users/${userId}/avatar`, null, {
            params: { avatar_url: avatarUrl }
        });

        // 更新本地缓存
        localStorage.setItem('user_avatar', avatarUrl);

        return response.data;
    }

    /**
     * 获取用户统计信息
     */
    async getUserStats(userId: string): Promise<UserStats> {
        const response = await apiClient.get(`/api/users/${userId}/stats`);

        const data = response.data;
        return {
            level: data.level,
            analysisCount: data.analysis_count,
            savedSongs: data.saved_songs_count,
            uid: data.user_id,
            avatarUrl: '' // 需要从用户信息中获取
        };
    }
}

export default new UserService();
