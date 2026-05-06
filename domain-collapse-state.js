(function (global) {
  function createDomainCollapseState() {
    const collapsedDomains = new Set();

    return {
      isCollapsed(domainKey) {
        return collapsedDomains.has(String(domainKey));
      },

      toggle(domainKey) {
        const key = String(domainKey);

        if (collapsedDomains.has(key)) {
          collapsedDomains.delete(key);
          return false;
        }

        collapsedDomains.add(key);
        return true;
      },
    };
  }

  global.createDomainCollapseState = createDomainCollapseState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createDomainCollapseState };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
