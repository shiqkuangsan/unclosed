// Apply theme before CSS loads to avoid flash (FOUC)
(function(){
  var t = localStorage.getItem('unclosed-theme') || 'auto';
  var d = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
})();
