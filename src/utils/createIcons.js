
// This is a utility to help create the icons - you can run this separately if needed
function createMusicIcon(size) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Dark background with border
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, size, size);
  
  // Border
  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size-2, size-2);
  
  // Music note
  ctx.fillStyle = '#ffffff';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♪', size/2, size/2);
  
  return canvas.toDataURL();
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = createMusicIcon;
}
