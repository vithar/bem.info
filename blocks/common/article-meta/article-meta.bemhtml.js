block('article-meta')(
    tag()('dl'),

    elem('modified').tag()('dt'),
    elem('authors').tag()('dt'),
    elem('tags').tag()('dt'),

    elem('modified-date').tag()('dd'),
    elem('author').tag()('dd'),
    elem('tag').tag()('dd')
);
