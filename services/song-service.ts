import apiClient from '../api-client';
import { Song } from '../types';

/**
 * 歌曲服务
 * 处理歌曲查询、推荐和收藏功能
 */
class SongService {
    /**
     * 获取所有歌曲
     */
    async getAllSongs(limit: number = 100): Promise<Song[]> {
        const response = await apiClient.get('/api/songs', {
            params: { limit }
        });

        return response.data.map(this.convertToFrontendFormat);
    }

    /**
     * 基于分析结果获取推荐歌曲
     */
    async getRecommendedSongs(analysisId: string): Promise<Song[]> {
        const response = await apiClient.get(`/api/songs/recommended/${analysisId}`);
        return response.data.map(this.convertToFrontendFormat);
    }

    /**
     * 切换收藏状态
     */
    async toggleFavorite(songId: string): Promise<{ isFavorited: boolean; message: string }> {
        const response = await apiClient.post('/api/songs/favorites/toggle', {
            song_id: songId
        });

        return {
            isFavorited: response.data.is_favorited,
            message: response.data.message
        };
    }

    /**
     * 获取用户收藏列表
     */
    async getUserFavorites(): Promise<Song[]> {
        const response = await apiClient.get('/api/songs/favorites');
        return response.data.map(this.convertToFrontendFormat);
    }

    /**
     * 转换后端数据格式为前端格式
     */
    private convertToFrontendFormat(backendSong: any): Song {
        return {
            id: backendSong.id,
            title: backendSong.title,
            artist: backendSong.artist,
            album: backendSong.album || '',
            coverUrl: backendSong.cover_url || '',
            songUrl: backendSong.song_url, // NOTE: 添加音频 URL
            tag: backendSong.tag as 'comfort' | 'challenge',
            tagLabel: backendSong.tag_label
        };
    }
}

export default new SongService();
