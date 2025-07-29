// Updated mediaUtils.js - Fix your URL construction
const BASE_URL = 'http://localhost:8080';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Remove any leading slashes and normalize the path
  let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Handle different path patterns from backend
  if (cleanPath.startsWith('images/')) {
    cleanPath = cleanPath;
  } else if (!cleanPath.includes('/')) {
    // If it's just a filename, assume it's in images directory
    cleanPath = `images/${cleanPath}`;
  }
  
  const fullUrl = `${BASE_URL}/uploads/${cleanPath}`;
  return fullUrl;
};

export const getVideoUrl = (videoPath) => {
  if (!videoPath) return '';
  
  // Remove any leading slashes and normalize the path
  let cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
  
  // Handle different path patterns from backend
  if (cleanPath.startsWith('videos/')) {
    cleanPath = cleanPath;
  } else if (!cleanPath.includes('/')) {
    // If it's just a filename, assume it's in videos directory
    cleanPath = `videos/${cleanPath}`;
  }
  
  const fullUrl = `${BASE_URL}/uploads/${cleanPath}`;
  return fullUrl;
};

export default { getImageUrl, getVideoUrl };