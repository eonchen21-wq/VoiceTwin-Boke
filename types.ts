
export enum AppView {
    LOGIN = 'login',
    RECORDING = 'recording',
    RESULT = 'result',
    PLAYLIST = 'playlist',
    PROFILE = 'profile'
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    album: string;
    coverUrl: string;
    songUrl?: string; // NOTE: 歌曲音频文件 URL（可选）
    tag: 'comfort' | 'challenge';
    tagLabel: string;
}

export interface UserStats {
    level: number;
    analysisCount: number;
    savedSongs: number;
    uid: string;
    avatarUrl: string;
}

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
