const IMAGE_BASE_URL = 'http://localhost:8080/uploads/images';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // Use the full imagePath as returned by the backend, assuming /images/ is part of the path
  return `${IMAGE_BASE_URL}${imagePath.replace('/images', '')}`;
};

export default { getImageUrl };