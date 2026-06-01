(function(){
  if(window.__nativeMutationObserverForLegacy){
    window.MutationObserver = window.__nativeMutationObserverForLegacy;
  }
})();
