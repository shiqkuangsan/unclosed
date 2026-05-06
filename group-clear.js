(function (global) {
  function getClearableGroupTabIds(tabs) {
    return tabs
      .filter(tab => !tab.pinned)
      .map(tab => tab.id);
  }

  global.getClearableGroupTabIds = getClearableGroupTabIds;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getClearableGroupTabIds };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
