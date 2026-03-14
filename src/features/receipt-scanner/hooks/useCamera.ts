import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
    });
    if (photo) {
      setCapturedUri(photo.uri);
      return photo.uri;
    }
    return null;
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedUri(null);
  }, []);

  return {
    cameraRef,
    permission,
    requestPermission,
    capturedUri,
    capturePhoto,
    resetCapture,
  };
}
