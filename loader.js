/**
 * Created by spiel on 2017-03-19.
 */

var Loader = function(epubPath, loaded) {
    var metaPath = epubPath + 'META-INF/'
    var containerXML = metaPath + 'container.xml'
    var ret = {metaPath:metaPath, containerXML: containerXML}

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
    return { result: ret }
}