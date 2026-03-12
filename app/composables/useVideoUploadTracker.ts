// composables/useVideoUploadTracker.ts
export function useVideoUploadTracker() {
  const uploadedUrls = ref<string[]>([]);

  function trackUpload(url: string) {
    uploadedUrls.value.push(url);
  }

  function clearTracker() {
    uploadedUrls.value = [];
  }

  function getUploadedUrls(): string[] {
    return [...uploadedUrls.value];
  }

  return {
    uploadedUrls: readonly(uploadedUrls),
    trackUpload,
    clearTracker,
    getUploadedUrls,
  };
}
