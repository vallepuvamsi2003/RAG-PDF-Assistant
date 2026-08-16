import axios from 'axios';

// Create custom Axios instance
const api = axios.create({
  // baseURL is blank because the Vite dev server proxy redirects '/api' calls to Flask (http://localhost:5000/api)
  baseURL: '', 
});

// Request Interceptor: Attach Authorization Bearer Token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Capture HTTP errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Automatically clear local session and redirect on 401 Unauthorized (token expired/tampered)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
