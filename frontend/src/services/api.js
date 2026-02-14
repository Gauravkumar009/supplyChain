import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000, // 5 seconds timeout
});

export const downloadReport = async (url, filename) => {
    try {
        const response = await api.get(url, { responseType: 'blob' });
        const href = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(href);
    } catch (error) {
        console.error("Download failed", error);
        alert("Failed to download report");
    }
};

export default api;
