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
    var _callback;
    var _trigger;

    var ret = {
        metaPath:metaPath,
        containerXML: containerXML,
        registerHolders : registerHolders,
        start : start,
        next : next,
        previous : previous,
        load : load,
        loadSingle : loadSingle,
        resetLoadCount : function(){_loadCount=0},
        setTrigger : function(callback){_trigger=callback}
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
                var metadata = content.find('metadata')
                var items = content.find('item')
                var spine = content.find('itemref')
                // to get elements use chlidren
                // but to get nodes use chlidNodes
                var childs = metadata[0].childNodes
                for(var i in childs) {
                    var child=childs[i]
                    if(child.nodeName=='dc:title') {
                        ret.title = child.textContent
                        break;
                    }
                }

                ret.metadata = metadata
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
        if($(this).hasClass('empty')) {
            var p=$(this).contents().find('#title')
            //console.log(this, p[0])
            p.text(_book.title)
            //$(this).removeClass('empty')
        }
        //$(this).show()
        $(this).addClass('loaded')
        _loadCount++;
        //console.log('frames loaded',_loadCount)
        if(_loadCount==_loadTrigger) {
            //_flip.make('#fb')
            //$('#fb').show()
            if(_trigger) _trigger()
        }
        //console.log('callback',_callback)
        if(_callback) {
            _callback()
        }
    })

    function start(callback) {
        _trigger = callback
        _curPage=1
        var pages=[-2,-1,0,1,2,3]
        load(pages)
    }

    function previous(callback) {
        if(_curPage-2 < 1) return;
        _callback = callback
        var pages=[]
        _curPage-=2; // for two sided
        for (var i=0; i<6; i++) {
            pages.push(i+_curPage-3)
        }
        load(pages)
    }

    function next(callback) {
        if(_curPage+2 > ret.totalPages) return;
        _callback = callback
        var pages=[]
        _curPage+=2; // for two sided
        for (var i=0; i<6; i++) {
            pages.push(i+_curPage-3)
        }
        load(pages)
    }

    function load(pages) {
        // console.log('pages',pages)
        // console.log('page',_curPage)
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
            //_holders[i].hide();
            _holders[i].removeClass('loaded')
            _holders[i].attr('src', fullPath+'?wmode=transparent')
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

    function loadSingle(holder, page, callback) {
        //console.log('callback',callback)
        if(callback) _callback = callback
        holder=(holder.fn)?holder:$(holder)
        var file = _book.toc.eq(page-1)
        var fullPath = 'epub/'+_book.rootFilePath+file.attr('href').replace('content/','')
        if(page <= 0 || page > ret.totalPages) {
            // empty page
            fullPath = 'empty.html'
            holder.addClass('empty')
        }
        else holder.removeClass('empty')

        holder.attr('src',fullPath)
    }
    return { result: ret }
}