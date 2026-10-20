<?php
// FAQS
$faqs = [
    ['How should I segregate my household waste?',
     'Keep four groups apart: biodegradable (food scraps, leaves), recyclable (clean paper, cardboard, glass, plastic bottles, cans), residual (soiled wrappers, used tissue) and special waste (batteries, bulbs, electronics). Use separate, labeled bins and follow the color code used in your community.'],
    ['When is garbage collected in my area?',
     'Open Upcoming Schedule on your dashboard to see the collection days for your area. Put your bins out only on collection day so they do not block the road or attract pests.'],
    ['What can go in the recycling bin?',
     'Clean and dry paper, cardboard, glass bottles and jars, plastic bottles and containers, and metal cans. Flatten boxes to save space.'],
    ['Do I need to wash recyclables first?',
     'Yes, a quick rinse is enough. Food residue and grease can spoil a whole batch of recyclables, so keep them clean and dry.'],
    ['How do I dispose of batteries, bulbs and old electronics?',
     'Never throw them in the regular trash. They contain harmful materials, so bring them to a designated drop-off point or ask the community office about special waste collection.'],
    ['What should I do with food scraps?',
     'Put them in the biodegradable bin or start a small compost pile. Drain liquids first and keep meat and oily food out of home compost.'],
    ['How do I get rid of bulky items like furniture or appliances?',
     'Bulky items are not part of the regular collection. Contact the community office to arrange a special pickup, or donate items that still work.'],
    ['My garbage was not collected. What should I do?',
     'Keep the waste securely bagged and check the Announcements section for delays caused by weather or holidays. If there is no notice, report it to the community office.'],
    ['Is it okay to burn my trash?',
     'No. Open burning of solid waste is prohibited and releases toxic smoke that harms your family and neighbors. Segregate and use the scheduled collection instead.'],
    ['How can I reduce the waste I produce?',
     'Bring your own bag and bottle, say no to single-use plastics, buy only what you need, repair before replacing, and reuse containers before they reach the bin.'],
];
?>
<div class="faq-assistant" id="faqAssistant">

    <section class="faq-panel" id="faqPanel" role="dialog" aria-labelledby="faqTitle" aria-hidden="true">
        <header class="faq-head">
            <div>
                <h2 id="faqTitle" class="montFont">Waste Management FAQS</h2>
                <p>Quick answers to common questions</p>
            </div>
            <button type="button" class="faq-close" aria-label="Close FAQ">&times;</button>
        </header>

        <div class="faq-body">
            <input type="search" class="faq-search" placeholder="Search questions…" aria-label="Search questions">

            <div class="faq-list">
                <?php foreach ($faqs as [$q, $a]): ?>
                    <details class="faq-item" name="faq">
                        <summary><?= htmlspecialchars($q) ?></summary>
                        <p><?= htmlspecialchars($a) ?></p>
                    </details>
                <?php endforeach; ?>
                <p class="faq-empty" hidden>No matching questions. Try a different word.</p>
            </div>
        </div>
    </section>

    <button type="button" class="faq-orb" aria-label="Open waste management FAQ"
            aria-expanded="false" aria-controls="faqPanel">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 2l2.2 6.3L20.5 10l-6.3 1.7L12 18l-2.2-6.3L3.5 10l6.3-1.7L12 2z"/>
            <path fill="currentColor" opacity=".7" d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>
        </svg>
        <span class="faq-orb-tip">Ask me</span>
    </button>

</div>