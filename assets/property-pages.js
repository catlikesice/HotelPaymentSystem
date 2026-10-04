/**
 * Hotel HTML files that contain their own booking screen.
 * A city-card link to any other file opens the trip page, including links
 * whose target is not on disk.
 */
(function (root) {
  var pages = {
    'basecamp-hotel-svalbard.html': true,
    'bauska-castle-hotel.html': true,
    'funken-lodge.html': true,
    'grand-hotel-kempinski-riga.html': true,
    'hotel-bauska.html': true,
    'hotel-dangleterre-copenhagen.html': true,
    'radisson-blu-polar-spitsbergen.html': true,
    'scandic-copenhagen.html': true,
    'wakeup-copenhagen.html': true,
    'wellton-riverside-riga.html': true
  };

  function fileName(href) {
    var path = String(href || '').split('#')[0].split('?')[0];
    var parts = path.split('/');
    return (parts[parts.length - 1] || '').toLowerCase();
  }

  root.BorealPropertyPages = {
    isPropertyPage: function (href) {
      return Boolean(pages[fileName(href)]);
    }
  };
})(typeof window !== 'undefined' ? window : this);
