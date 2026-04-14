import api from './axios'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const refresh = (data) => api.post('/auth/refresh', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)
export const logout = (data) => api.post('/auth/logout', data)
export const me = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/me', data)
export const changePassword = (data) => api.put('/auth/me/password', data)
