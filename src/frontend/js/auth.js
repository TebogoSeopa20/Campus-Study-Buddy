// src/auth.js
const auth = {
    isLoggedIn: function() {
        return sessionStorage.getItem('user') !== null;
    },

    getCurrentUser: function() {
        const userData = sessionStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    getUserRole: function() {
        const user = this.getCurrentUser();
        return user?.role || null;
    },

    getAccessToken: function() {
        return sessionStorage.getItem('access_token');
    },

    getRefreshToken: function() {
        return sessionStorage.getItem('refresh_token');
    },

    handleLogin: function(userData) {
        try {
            sessionStorage.setItem('user', JSON.stringify({
                id: userData.id,
                email: userData.email,
                role: userData.user_metadata?.role || 'researcher',
                name: userData.user_metadata?.name || '',
                picture: userData.user_metadata?.picture || ''
            }));

            if (userData.session) {
                sessionStorage.setItem('access_token', userData.session.access_token);
                sessionStorage.setItem('refresh_token', userData.session.refresh_token);
            }

            return true;
        } catch (error) {
            console.error('Login handling error:', error);
            return false;
        }
    },

    parseJwt: function(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to parse JWT:', error);
            return null;
        }
    }
};

module.exports = auth;
