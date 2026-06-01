(function(){
  if(!window.__nativeMutationObserverForLegacy){
    window.__nativeMutationObserverForLegacy = window.MutationObserver;
  }

  const NativeMutationObserver = window.__nativeMutationObserverForLegacy;

  window.MutationObserver = class LegacyThrottledMutationObserver {
    constructor(callback){
      this.callback = callback;
      this.pending = false;
      this.records = [];
      this.observer = new NativeMutationObserver((records, observer)=>{
        this.records = this.records.concat(records);
        if(this.pending) return;
        this.pending = true;
        window.requestAnimationFrame(()=>{
          const queued = this.records.splice(0);
          this.pending = false;
          this.callback(queued, observer);
        });
      });
    }

    observe(target, options){
      this.observer.observe(target, options);
    }

    disconnect(){
      this.records = [];
      this.pending = false;
      this.observer.disconnect();
    }

    takeRecords(){
      return this.records.splice(0).concat(this.observer.takeRecords());
    }
  };
})();
