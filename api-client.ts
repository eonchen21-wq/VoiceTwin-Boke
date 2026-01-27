import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API 基础配置
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://voicetwin-boke.onrender.com';

/**
 * 创建 Axios 实例
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // NOTE: 音频分析是 CPU 密集型操作（特征提取+相似度计算），设置 120 秒超时
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * 请求拦截器
 * 自动添加认证 token
 */
apiClient.interceptors.request.use(
    (config) => {
        // 从 localStorage 获取用户 token
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * 响应拦截器
 * 统一处理错误
 */
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        // 统一错误处理
        if (error.response) {
            // 服务器返回错误响应
            const status = error.response.status;

            switch (status) {
                case 401:
                    // 未授权，清除 token 并跳转登录
                    localStorage.removeItem('auth_token');
                    console.error('认证失败，请重新登录');
                    break;
                case 403:
                    console.error('无权限访问');
                    break;
                case 404:
                    console.error('请求的资源不存在');
                    break;
                case 500:
                    console.error('服务器错误');
                    break;
                default:
                    console.error(`请求失败: ${status}`);
            }
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('网络错误，请检查网络连接');
        } else {
            // 其他错误
            console.error('请求配置错误');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
