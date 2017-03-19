/**
 * Created by spiel on 2017-03-19.
 */

var Loader = function(epubPath, loaded) {

    var _curPage
    var _holders = []
    var metaPath = epubPath + 'META-INF/'
    var containerXML = metaPath + 'container.xml'
    var _loadCount=0;
    var _loadTrigger=6;
    var _w;
    var _h;

    var ret = {
        metaPath:metaPath,
        containerXML: containerXML,
        registerHolders : registerHolders,
        start : start,
        next : next,
        previous : previous,
        load : load,
    }

    // read epup manifest
    $.ajax({
        url : containerXML,
        dataType : 'xml',
        success : function(content) {
            var fullPath = $(content).find('rootfile').attr('full-path')
            ret.rootFile = fullPath
            ret.rootFilePath = fullPath.substr(0, fullPath.lastIndexOf('/')+1)
            readContentOpf(fullPath)
        }
    })

    function readContentOpf(path) {
        $.ajax({
            url: epubPath+path,
            dataType : 'xml',
            success: function (content) {
                content = $(content)
                var items = content.find('item')
                var spine = content.find('itemref')
                ret.items = items
                ret.spine = spine
                var toc = content.find('#toc').attr('href')
                ret.tocFile = toc
                readTOC(ret.rootFilePath+toc)
            }
        })
    }

    function readTOC(path) {
        $.ajax({
            url: epubPath + path,
            dataType: 'xml',
            success: function (content) {
                content = $(content)
                ret.toc = content.find('#toc a')
                ret.totalPages = ret.toc.length

                if(loaded) loaded()
            }
        })
    }

    function registerHolders(holders) {
        for(var i =0; i<holders.length; i++) {
            var holder = $(holders[i])
            _holders.push(holder)
        }
        console.log('holders',_holders)

    }

    function resizeEmptyDiv() {

    }

    $('iframe').load(function(evt) {
        var body=this.contentDocument.body
        _w = parseInt(body.style.width)
        _h = parseInt(body.style.height)
        var hr = 500/_w
        var vr = 500/_h
        // console.log(hr,vr)
        $(this).width(_w)
        $(this).height(_h)
        //$(this).siblings().width(w)
        //$(this).siblings().height(h)

        _loadCount++;
        //console.log('frames loaded',_loadCount)
        if(_loadCount==_loadTrigger) {
            _flip.make('#fb')
            $('#fb').show()
        }
    })

    function start() {
        _curPage=1
        var pages=[-2,-1,0,1,2,3]
        load(pages)
    }

    function previous() {
        if(_curPage-2 < 1) return;
        var pages=[]
        _curPage-=2; // for two sided
        for (var i=0; i<6; i++) {
            pages.push(i+_curPage-3)
        }
        load(pages)
    }

    function next() {
        if(_curPage+2 > ret.totalPages) return;
        var pages=[]
        _curPage+=2; // for two sided
        for (var i=0; i<6; i++) {
            pages.push(i+_curPage-3)
        }
        load(pages)
    }

    function load(pages) {
        console.log('pages',pages)
        console.log('page',_curPage)
        for(var i=0; i<_book.totalPages && i<pages.length ; i++) {
            var page = pages[i]
            var pageIndex = page-1
            //console.log(page, pageIndex)
            var file = _book.toc.eq(pageIndex)
            var fullPath = 'epub/'+_book.rootFilePath+file.attr('href').replace('content/','')
            if(page <= 0 || page > ret.totalPages) {
                // empty page
                fullPath = 'empty.html'
                _holders[i].addClass('empty')
            }
            //console.log(fullPath);
            _holders[i].attr('src', fullPath)
            _holders[i].data('page',page)

            /*

             (function(i) {

             $.ajax({
             url: fullPath,
             dataType: 'xml',
             success: function (s) {
             //console.log(s.children[0].innerHTML)
             var iframe = $('#page'+(i+1))
             iframe[0].contentDocument.children[0].innerHTML =
             replace(s.children[0].innerHTML, 'epub/OEBPS/content/')
             var w = $(iframe[0].contentDocument.body).width()
             var h = $(iframe[0].contentDocument.body).height()
             iframe.width(w)
             iframe.height(h)

             }
             })

             })(i)
             */

        }
        ret.page = _curPage
    }

    return { result: ret }
}