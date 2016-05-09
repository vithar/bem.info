var vm = require('vm');

block('articles').content()(function() {
    var data = this.data,
        page = data.page;

    return vm.runInNewContext(page.content).map(function(article) {
        return [
            {
                elem: 'title',
                content: [
                    {
                        elem: 'link',
                        attrs: { href: article.url },
                        content: [
                            {
                                elem: 'photo',
                                src: article.photo,
                                alt: article.author
                            },
                            ' ',
                            article.title
                        ]
                    },
                    ' ',
                    {
                        elem: 'date',
                        content: article.date
                    }
                ]
            },
            {
                elem: 'author',
                content: article.author
            },
            article.position && {
                elem: 'position',
                content: article.position
            },
            {
                elem: 'text',
                content: article.text
            }
        ];
    });
});
