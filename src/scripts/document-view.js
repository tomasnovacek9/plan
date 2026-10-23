/* Show the complete desktop document on a small touch screen; allow normal pinch zoom. */
(() => {
  if (window.matchMedia('(pointer: coarse) and (max-width: 1000px)').matches) {
    document.querySelector('meta[name="viewport"]').content = 'width=1040';
  }
})();
