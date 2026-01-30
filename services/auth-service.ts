import apiClient from '../api-client';
import { createClient } from '@supabase/supabase-js';

// NOTE: 强制从环境变量读取配置，避免凭证泄露
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('缺少必要的 Supabase 配置，请检查 .env.local 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

/**
 * Supabase 客户端
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 用户认证服务
 * 使用 Supabase Auth 进行身份认证
 */
class AuthService {
    /**
     * 用户注册
     */
    async register(email: string, password: string, username: string) {
        // 使用 Supabase Auth 注册
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error('注册失败');
        }

        // 创建用户资料
        try {
            const response = await apiClient.post('/api/auth/create-profile', {
                auth_id: authData.user.id,
                email: authData.user.email,
                username: username
            });

            // NOTE: 保存 JWT token 而非 user.id，确保认证安全
            if (authData.session?.access_token) {
                localStorage.setItem('auth_token', authData.session.access_token);
                // 同时保存用户 ID 用于其他用途
                localStorage.setItem('user_id', authData.user.id);
            } else {
                throw new Error('注册成功但未获取到 session token');
            }

            return response.data;
        } catch (error) {
            console.error('创建用户资料失败:', error);
            throw error;
        }
    }

    /**
     * 用户登录
     */
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (!data.user) {
            throw new Error('登录失败');
        }

        // NOTE: 保存真实的 JWT token 确保安全性
        if (data.session?.access_token) {
            localStorage.setItem('auth_token', data.session.access_token);
            // 同时保存用户 ID 用于前端显示等用途
            localStorage.setItem('user_id', data.user.id);
        } else {
            throw new Error('登录成功但未获取到 session token');
        }

        return data.user;
    }

    /**
     * 退出登录
     */
    async logout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw new Error(error.message);
        }

        // 清除所有认证信息
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
    }

    /**
     * 获取当前用户
     */
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    /**
     * 检查是否已登录
     */
    async isAuthenticated(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    }

    /**
     * 获取用户信息
     */
    async getUserProfile(userId: string) {
        const response = await apiClient.get(`/api/users/${userId}`);
        return response.data;
    }

    /**
     * 获取当前用户信息
     */
    async getMe() {
        const response = await apiClient.get('/api/auth/me');
        return response.data;
    }

    /**
     * 发送密码重置邮件
     * NOTE: redirectTo 必须是生产环境的完整 URL
     */
    async resetPasswordForEmail(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://www.voicetwin-boke.xyz/update-password'
        });

        if (error) {
            throw new Error(error.message);
        }
    }

    /**
     * 更新用户密码
     * NOTE: 此方法需要在用户点击重置邮件链接后调用
     */
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw new Error(error.message);
        }
    }
}

export default new AuthService();
