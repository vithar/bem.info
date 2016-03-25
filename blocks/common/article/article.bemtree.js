block('article').content()(function() {
    return [
        {
            block: 'article-meta',
        },
        this.data.page.content
    ];
});
