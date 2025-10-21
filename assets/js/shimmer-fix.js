// Fix shimmer effect for home page images
document.addEventListener('DOMContentLoaded', function() {
  // Find all images with shimmer effect
  const shimmerImages = document.querySelectorAll('.preview-img.shimmer img');
  
  shimmerImages.forEach(function(img) {
    // Remove shimmer when image loads
    img.addEventListener('load', function() {
      const shimmerContainer = this.closest('.preview-img.shimmer');
      if (shimmerContainer) {
        shimmerContainer.classList.remove('shimmer');
      }
    });
    
    // If image is already loaded (from cache), remove shimmer immediately
    if (img.complete) {
      const shimmerContainer = img.closest('.preview-img.shimmer');
      if (shimmerContainer) {
        shimmerContainer.classList.remove('shimmer');
      }
    }
  });
});
