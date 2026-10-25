(function () {
    var root = document.getElementById('faqAssistant');
    if (!root) return;

    var orb = root.querySelector('.faq-orb');
    var panel = root.querySelector('.faq-panel');
    var closeBtn = root.querySelector('.faq-close');
    var search = root.querySelector('.faq-search');
    var items = Array.prototype.slice.call(root.querySelectorAll('.faq-item'));
    var empty = root.querySelector('.faq-empty');

    function open() {
        root.classList.add('is-open');
        orb.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
        setTimeout(function () { search.focus(); }, 200);
    }

    function close(returnFocus) {
        root.classList.remove('is-open');
        orb.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
        if (returnFocus) orb.focus();
    }

    orb.addEventListener('click', function () {
        root.classList.contains('is-open') ? close(false) : open();
    });

    closeBtn.addEventListener('click', function () { close(true); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('is-open')) close(true);
    });

    document.addEventListener('click', function (e) {
        if (root.classList.contains('is-open') && !root.contains(e.target)) close(false);
    });

    // Live search: hide questions that do not match (plural-friendly: battery finds batteries)
    function norm(text) {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
            .map(function (w) { return w.replace(/ies$/, 'y').replace(/s$/, ''); });
    }

    var index = items.map(function (item) { return norm(item.textContent).join(' '); });

    search.addEventListener('input', function () {
        var tokens = norm(search.value);
        var shown = 0;
        items.forEach(function (item, i) {
            var match = tokens.every(function (t) { return index[i].indexOf(t) !== -1; });
            item.hidden = !match;
            if (match) shown++;
        });
        empty.hidden = shown > 0;
    });
})();