(function () {
  'use strict';

  // ---- Mobile sidebar toggle ------------------------------------------
  var toggle = document.querySelector('.docs-menu-toggle');
  var sidebar = document.querySelector('.docs-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });
    document.addEventListener('click', function (event) {
      if (!sidebar.classList.contains('is-open')) return;
      if (sidebar.contains(event.target) || toggle.contains(event.target)) return;
      sidebar.classList.remove('is-open');
    });
  }

  // ---- Search -----------------------------------------------------------
  var input = document.querySelector('.docs-search input');
  var results = document.querySelector('.docs-search-results');
  if (!input || !results) return;

  var root = document.body.getAttribute('data-root') || '.';
  var index = null;
  var activeIndex = -1;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch(root + '/search-index.json')
      .then(function (response) { return response.json(); })
      .then(function (data) { index = data; return data; })
      .catch(function () { index = []; return index; });
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function render(matches, query) {
    activeIndex = -1;
    if (!matches.length) {
      results.innerHTML = '<div class="docs-search-empty">No results for &ldquo;' + escapeHtml(query) + '&rdquo;.</div>';
      results.classList.add('is-open');
      return;
    }
    results.innerHTML = matches.slice(0, 12).map(function (page) {
      return '<a href="' + root + '/' + page.url + '">' +
        '<span class="result-group">' + escapeHtml(page.group) + '</span>' +
        '<span class="result-title">' + escapeHtml(page.title) + '</span>' +
        '<span class="result-excerpt">' + escapeHtml(page.excerpt) + '</span>' +
        '</a>';
    }).join('');
    results.classList.add('is-open');
  }

  function search(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.classList.remove('is-open'); return; }
    var scored = index.map(function (page) {
      var haystack = (page.title + ' ' + page.text).toLowerCase();
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        if (haystack.indexOf(terms[i]) === -1) return null;
        score += page.title.toLowerCase().indexOf(terms[i]) !== -1 ? 3 : 1;
      }
      return { page: page, score: score };
    }).filter(Boolean);
    scored.sort(function (a, b) { return b.score - a.score; });
    render(scored.map(function (s) { return s.page; }), query);
  }

  input.addEventListener('input', function () {
    var query = input.value.trim();
    if (!query) { results.classList.remove('is-open'); return; }
    loadIndex().then(function () { search(query); });
  });

  input.addEventListener('keydown', function (event) {
    var items = results.querySelectorAll('a');
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) { window.location = items[activeIndex].href; }
      return;
    } else if (event.key === 'Escape') {
      results.classList.remove('is-open');
      return;
    } else {
      return;
    }
    items.forEach(function (item, i) { item.classList.toggle('is-active', i === activeIndex); });
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('click', function (event) {
    if (!results.contains(event.target) && event.target !== input) {
      results.classList.remove('is-open');
    }
  });
})();
