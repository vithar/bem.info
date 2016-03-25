block('article-meta').content()(function() {
    var data = this.data,
        page = data.page;
        
console.log(JSON.stringify(page.head, null, 4));        

    return [
        {
            elem: 'heading',
            content: page.head.title    
        },
        {
            elem: 'modified',
            content: 'Modified:' //TODO: i18n
        },
        {
            elem: 'modified-date',
            content: '10 September 2015' //TOOD: actual info
        },            

        {
            elem: 'authors',
            content: 'Authors:' //TODO: i18n
        },
        // TOOD: actual info
        // TODO: ask tadatuta@: мы точно хотим показывать авторов?
        [
            'Vitaly Harisov',
            'Vladimir Grinenko'
        ].map(function(author) {
            return {
                elem: 'author',
                content: author
            }                
        }),

        {
            elem: 'tags',
            content: 'Tags:' //TODO: i18n
        },
        page.tags.map(function(author) {
            return {
                elem: 'tag',
                content: author
            }                
        })
    ];
});
