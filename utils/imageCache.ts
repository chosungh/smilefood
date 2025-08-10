import { Image } from 'expo-image';
import { useCallback, useState } from 'react';

// 이미지 프리로딩을 위한 유틸리티
export const preloadImages = (imageUrls: string[]) => {
  const validUrls = imageUrls.filter(url => url && url.trim() !== '');
  
  if (validUrls.length === 0) return;
  
  // expo-image의 prefetch 기능 사용
  validUrls.forEach(url => {
    try {
      Image.prefetch(url);
    } catch (error) {
      console.warn('Failed to prefetch image:', url, error);
    }
  });
};

// 이미지 URL 유효성 검사
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// 이미지 로딩 상태 관리를 위한 훅
export const useImageLoading = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    setLoaded(false);
  }, []);

  const reset = useCallback(() => {
    setLoading(true);
    setError(false);
    setLoaded(false);
  }, []);

  return {
    loading,
    error,
    loaded,
    handleLoad,
    handleError,
    reset,
  };
};
