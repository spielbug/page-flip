define(['jquery', 'log', 'browser', 'params', 'xml2json', 'loading', 'responsiveUI', 'bookmark', 'zoom', 'draw', 'link'], function ($, log, browser, params, xml2json, loading, responsiveUI, bookmark, zoom, draw, link) {
    'use strict';
    log("\n @ import page.js ... \n");

    if (params.Params.paramIns == 'none') {
        params.paramsInit();
    }

    if (browser.ie8 || ViewerManager.openError == true) {
        return;
    }

    var loadingTimer = null, svg = null;

    // 프레임에 HTML 소스를 직접 입력하여 렌더링하게 한다.
    var writeFrameDocument = function (pageFrameElement, pageNumber) {
            //console.log(ViewerManager.pageHTMLData[writePage][1]);
            //$(pageFrameElement.contentDocument).text(ViewerManager.pageHTMLData[writePage][1]);
            $(pageFrameElement).css('background', '#ffffff');
            pageFrameElement.contentDocument.open('text/html', 'replace');
            pageFrameElement.contentDocument.write(ViewerManager.pageHTMLData[pageNumber][1]);
            pageFrameElement.contentDocument.close();
            log("[Function writeFrameDocument] : inserted page data");
            log(ViewerManager.pageHTMLData[pageNumber][1]);

        },

        // 아래 함수의 비동기식 처리버전
        getPageHTMLData2 = function(PAGE_CURRENT_NUMBER, callback) {
            switch (ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][0]) {
                case "NotCache" : {
                    log("@@ leftPageFrame ============================= NotCache!");
                    $.ajax({
                        url: ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + "" + ViewerManager.ePub.ops_name[0] + "/" + ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][1],
                        dataType: 'html',
                        async: false,
                        success: function (data) {
                            var tempPath = ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][1].split("/"), replaceData, lastPath = "";
                            log("===tempPath================================================================================");
                            log(tempPath);
                            for (var i = 0; i < tempPath.length - 1; i++) {
                                lastPath = lastPath + tempPath[i] + "/";
                            }

                            if (data.indexOf('href="../') !== -1) {
                                replaceData = data.replace(/ href="..\//gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                            } else {
                                if (data.indexOf('" href="') !== -1) replaceData = data.replace(/" href="/gi, '" href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                else if (data.indexOf(' href="') !== -1) replaceData = data.replace(/ href="/gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            }

                            if (data.indexOf('src="../') !== -1) {
                                replaceData = replaceData.replace(/src="..\//gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                            } else {
                                replaceData = replaceData.replace(/src="/gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            }

                            replaceData = replaceData.replace(/url\(/gi, 'url(' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            replaceData = replaceData.replace(/poster="./gi, 'poster="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);

                            if (replaceData.indexOf(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http") !== -1) {
                                var patten = new RegExp(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http", "gi");
                                replaceData = replaceData.replace(patten, "http");
                            }

                            // 배경 경로가 안맞는 경우를 위해서 수정
                            if (replaceData.indexOf("background") && replaceData.indexOf("url")) {
                                var url_start = replaceData.indexOf("(");
                                var url_end = replaceData.indexOf(")");
                                var prev_data = replaceData.substr(url_start, url_end);

                                var change_data = prev_data.replace(/"/gi, "");
                                change_data = prev_data.replace(/'/gi, "");
                                //console.log(url_start, url_end, prev_data, change_data);
                                replaceData = replaceData.replace(prev_data, change_data);
                            }

                            ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][0] = "Cached";
                            ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][1] = replaceData;

                            //showPageOrShowCover('leftPageFrame', PAGE_CURRENT_NUMBER);
                            callback(replaceData)

                        },
                        error: function (err) {
                            log("@ getPageHTMLData ajax error : " + err);
                        },
                        complete: function () {
                            log("@ getPageHTMLData ajax complete...");
                        }
                    });
                    break;
                }
                case "Cached" : {
                    log("@@ leftPageFrame ============================= Cached!");
                    //showPageOrShowCover('leftPageFrame', PAGE_CURRENT_NUMBER);
                    callback(ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER)][1])

                    break;
                }
            }
        },

        // 보여줄 페이지의 HTML 데이터를 가져온다.
        // 만약 캐싱되지 않은 컨텐트라면 링크, 소스등의 경로를 수정해서 캐시에 저장한다.
        // 만약 캐싱된 컨텐트라면 캐시에서 가져온다.
        getPageHTMLData = function (pageMODE, PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER, callback) {
            var pageCtlNum = pageMODE === "SINGLE" ? 0 : 1;
            var leftPageframeDocument, rightPageframeDocument, leftframeTimer, rightframeTimer;

            // 좌측 페이지 데이터
            switch (ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum][0]) {
                case "NotCache" : {
                    log("@@ leftPageFrame ============================= NotCache!");
                    $.ajax({
                        url: ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + "" + ViewerManager.ePub.ops_name[0] + "/" + ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum][1],
                        dataType: 'html',
                        async: false,
                        success: function (data) {
                            var tempPath = ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum][1].split("/"), replaceData, lastPath = "";
                            log("===tempPath================================================================================");
                            log(tempPath);
                            for (var i = 0; i < tempPath.length - 1; i++) {
                                lastPath = lastPath + tempPath[i] + "/";
                            }

                            if (data.indexOf('href="../') !== -1) {
                                replaceData = data.replace(/ href="..\//gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                            } else {
                                if (data.indexOf('" href="') !== -1) replaceData = data.replace(/" href="/gi, '" href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                else if (data.indexOf(' href="') !== -1) replaceData = data.replace(/ href="/gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            }

                            if (data.indexOf('src="../') !== -1) {
                                replaceData = replaceData.replace(/src="..\//gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                            } else {
                                replaceData = replaceData.replace(/src="/gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            }

                            replaceData = replaceData.replace(/url\(/gi, 'url(' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                            replaceData = replaceData.replace(/poster="./gi, 'poster="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);

                            if (replaceData.indexOf(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http") !== -1) {
                                var patten = new RegExp(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http", "gi");
                                replaceData = replaceData.replace(patten, "http");
                            }

                            // 배경 경로가 안맞는 경우를 위해서 수정
                            if (replaceData.indexOf("background") && replaceData.indexOf("url")) {
                                var url_start = replaceData.indexOf("(");
                                var url_end = replaceData.indexOf(")");
                                var prev_data = replaceData.substr(url_start, url_end);

                                var change_data = prev_data.replace(/"/gi, "");
                                change_data = prev_data.replace(/'/gi, "");
                                //console.log(url_start, url_end, prev_data, change_data);
                                replaceData = replaceData.replace(prev_data, change_data);
                            }

                            ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum][0] = "Cached";
                            ViewerManager.pageHTMLData[parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum][1] = replaceData;

                            showPageOrShowCover('leftPageFrame', PAGE_CURRENT_NUMBER, callback);
                        },
                        error: function (err) {
                            log("@ getPageHTMLData ajax error : " + err);
                        },
                        complete: function () {
                            log("@ getPageHTMLData ajax complete...");
                        }
                    });
                    break;
                }
                case "Cached" : {
                    log("@@ leftPageFrame ============================= Cached!");
                    showPageOrShowCover('leftPageFrame', PAGE_CURRENT_NUMBER, callback);

                    break;
                }
            }

            // 우측 페이지 데이터
            if (pageMODE === "DOUBLE") {
                switch (ViewerManager.pageHTMLData[PAGE_CURRENT_NUMBER][0]) {
                    case "NotCache" :
                        log("@@ rightPageFrame ============================= NotCache!");
                        $.ajax({
                            url: ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + "" + ViewerManager.ePub.ops_name[0] + "/" + ViewerManager.pageHTMLData[PAGE_CURRENT_NUMBER][1],
                            dataType: 'html',
                            async: false,
                            success: function (data) {

                                if ((PAGE_CURRENT_NUMBER == 1 || ViewerManager.urlPage != '1') && (ViewerManager.iframeContentsWidth == '0' || ViewerManager.iframeContentsHeight == '0')) {
                                    var container_xml2json = $.xml2json(data);
                                    for (var i = 0; i < container_xml2json['head']['meta'].length; i++) {
                                        if (container_xml2json['head']['meta'][i]['name'] && container_xml2json['head']['meta'][i]['name'] == 'viewport') {
                                            var attr = container_xml2json['head']['meta'][i]['content'].split(',');
                                            if (attr[0].indexOf('width') != -1) {
                                                ViewerManager.iframeContentsWidth = attr[0].split('=')[1];
                                                ViewerManager.iframeContentsHeight = attr[1].split('=')[1];
                                            }
                                            else if (attr[0].indexOf('height') != -1) {
                                                ViewerManager.iframeContentsWidth = attr[1].split('=')[1];
                                                ViewerManager.iframeContentsHeight = attr[0].split('=')[1];
                                            }
                                        }
                                    }
                                }

                                var tempPath = ViewerManager.pageHTMLData[PAGE_CURRENT_NUMBER][1].split("/"), replaceData, lastPath = "";
                                for (var i = 0; i < tempPath.length - 1; i++) {
                                    lastPath = lastPath + tempPath[i] + "/";
                                }

                                if (data.indexOf('href="../') !== -1) {
                                    replaceData = data.replace(/ href="..\//gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                                } else {
                                    if (data.indexOf('" href="') !== -1) replaceData = data.replace(/" href="/gi, '" href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                    else if (data.indexOf(' href="') !== -1) replaceData = data.replace(/ href="/gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                }
                                if (data.indexOf('src="../') !== -1) {
                                    replaceData = replaceData.replace(/src="..\//gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
                                } else {
                                    replaceData = replaceData.replace(/src="/gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                }

                                replaceData = replaceData.replace(/url\(/gi, 'url(' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
                                replaceData = replaceData.replace(/poster="./gi, 'poster="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);

                                if (replaceData.indexOf(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http") !== -1) {
                                    var patten = new RegExp(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http", "gi");
                                    replaceData = replaceData.replace(patten, "http");
                                }
                                // 배경 경로가 안맞는 경우를 위해서 수정
                                if (replaceData.indexOf("background") && replaceData.indexOf("url")) {
                                    var url_start = replaceData.indexOf("(");
                                    var url_end = replaceData.indexOf(")");
                                    var prev_data = replaceData.substr(url_start, url_end);

                                    var change_data = prev_data.replace(/"/gi, "");
                                    change_data = prev_data.replace(/'/gi, "");
                                    //console.log(url_start, url_end, prev_data, change_data);
                                    replaceData = replaceData.replace(prev_data, change_data);
                                }

                                ViewerManager.pageHTMLData[PAGE_CURRENT_NUMBER][0] = "Cached";
                                ViewerManager.pageHTMLData[PAGE_CURRENT_NUMBER][1] = replaceData;

                                showPageOrShowCover('rightPageFrame', PAGE_CURRENT_NUMBER);
                            },
                            error: function (err) {
                                log("@ createSearchData ajax error : " + err);
                            },
                            complete: function () {
                                log("@ createSearchData ajax complete...");
                            }
                        });
                        break;
                    case "Cached" : {
                        log("@@ rightPageFrame ============================= Cached!");
                        showPageOrShowCover('rightPageFrame', PAGE_CURRENT_NUMBER);
                        break;
                    }
                }
            }
        },
        checkDomRendered = function(jq, callback) {
            if($(jq)[0]) {
                callback($(jq)[0]);
            }
            else {
                setTimeout(function() {checkDomRendered(jq)}, 10000)
            }
        },
        // 2017-3-14 elinsoft
        // 페이지터닝 이펙트를 구현하기 위해서는 최대 6페이지가 화면에 상주해 있어야 한다.
        // 이를 위해 로직을 변경
        // 사실상의 entry point 로 간주함
        appendFrameDocument2 = function (PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER,strPageContainer,callback) {
            //console.log(PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER)
            var pageContainer = $('#'+strPageContainer)
            var parent = pageContainer.parent()
            if(parent.attr('class')!='fb-wrapper') {
                var wrapper=$('<DIV>').addClass('fb-wrapper')
                wrapper.attr('id','wrapper-'+strPageContainer)
                wrapper.css({
                    position : 'absolute',
                })
                var grad=$('<div>').addClass('gradient')
                grad.css({
                    position : 'absolute',
                })
                wrapper.appendTo(parent)
                pageContainer.appendTo(wrapper)
                grad.appendTo(wrapper)
            }
            if(PAGE_CURRENT_NUMBER <0 || PAGE_CURRENT_NUMBER > PAGE_TOTAL_NUMBER) return;
            getPageHTMLData2(PAGE_CURRENT_NUMBER, function(str) {
                showPageOrShowCover(strPageContainer, PAGE_CURRENT_NUMBER, callback);
                //writeFrameDocument($('#leftPageFrame')[0], parseInt(PAGE_CURRENT_NUMBER))
                //responsiveUI.setResponsiveScale('#leftPageFrame', PageframeDocument)
            })
        },
        appendFrameDocument = function (PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER) {

            var callback = function(arg) {
                if(arg.query === 'visible') {
                    return false
                }
            }

            // get current page
            // console.log(ViewerManager.PAGE_CURRENT_NUMBER +'/'+ ViewerManager.PAGE_TOTAL_NUMBER)
            // 홀더에 들어갈 페이지들은
            // 페이번호 - 3 ~ 페이지번호 + 2
            // 없는 페이지는 로딩하지 않는다.
            var holder=0
            for(var i=PAGE_CURRENT_NUMBER-3; i<PAGE_CURRENT_NUMBER+3; i++) {
                appendFrameDocument2(i, PAGE_TOTAL_NUMBER, 'page'+(++holder), function(arg) {
                    if(arg.query === 'visible') {
                        if(holder==3 || holder==4) return true
                    }
                })
            }

            // 이하 사용 안함
            return;
            log("@ appendFrameDocument...");


            document.querySelector('#components').innerHTML = "";

            switch (ViewerManager.pageMODE) {
                case "SINGLE":
                    if (document.getElementById('rightPageFrame') != null) {
                        $('#rightPageFrame').remove();
                    }
                    getPageHTMLData("SINGLE", PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER);

                    break;
                case "DOUBLE": {
                    if (document.getElementById('rightPageFrame') == null) {
                        $("<iframe id='rightPageFrame' frameborder='0' scrolling='no' style='visibility: hidden; overflow: hidden;'></iframe>").insertAfter($('#leftPageFrame'));
                    }

                    getPageHTMLData("DOUBLE", PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER);

                    break;
                }
            }
        },
        // 최초와 마지막의 빈 페이지를 만든다.
        // 최초 커버 페이지는 페이지 번호 0
        // 마지막 커버 페이ㅈ는 총페이지수 + 1
        setCoverPage = function (PAGE_CURRENT_NUMBER) {
            if (parseInt(PAGE_CURRENT_NUMBER) == 1) {
                // 첫번째
                ViewerManager.pageHTMLData[0][1] = "<div style='background-color : #ffffff;width:" + ViewerManager.iframeContentsWidth + "px; height:" + ViewerManager.iframeContentsHeight + "px; overflow: hidden;'></div>";
            } else {
                // 마지막
                if (ViewerManager.Settings.logoURL.length > 0) {
                    ViewerManager.pageHTMLData[ViewerManager.PAGE_TOTAL_NUMBER + 1][1] =
                        "<div style='background-color:#ffffff;width:" + ViewerManager.iframeContentsWidth + "px; height:" + ViewerManager.iframeContentsHeight + "px; overflow: hidden;'>" +
                        "<img  style='font-size: 52px; color: #333333; letter-spacing:-2px; padding-top: " + (ViewerManager.iframeContentsHeight / 2 - 100) + "px; padding-left: " + (ViewerManager.iframeContentsWidth / 2 - 100) + "px;' src='" + ViewerManager.Settings.logoURL + "' width='200' height='200' alt='logo' title='logo' />" +
                        "</div>";
                }
                else {
                    ViewerManager.pageHTMLData[ViewerManager.PAGE_TOTAL_NUMBER + 1][1] = "<html><head><meta http-equiv='content-type' content='text/html;charset=UTF-8' /></head><body style='width:" + ViewerManager.iframeContentsWidth + "px; height:" + ViewerManager.iframeContentsHeight + "px; overflow: hidden;'></body></html>";
                }
            }
        },
        // 페이지 혹은 커버를 보여준다.
        // 페이지를 보여주기 위해 writeFrameDocument 호출
        showPageOrShowCover = function (pageFrame, PAGE_CURRENT_NUMBER, callback) {
            var pageCtlNum = ViewerManager.pageMODE === "SINGLE" ? 0 : 1;
            var PageframeDocument = document.getElementById(String(pageFrame));

            if (pageFrame == "leftPageFrame") {
                if (parseInt(PAGE_CURRENT_NUMBER) - 1 == 0 && ViewerManager.pageMODE == "DOUBLE") {
                    setCoverPage(PAGE_CURRENT_NUMBER);
                }
                writeFrameDocument(PageframeDocument, parseInt(PAGE_CURRENT_NUMBER) - pageCtlNum);
            } else if (pageFrame == "rightPageFrame") {
                if (parseInt(PAGE_CURRENT_NUMBER) - 1 == parseInt(ViewerManager.PAGE_TOTAL_NUMBER) && ViewerManager.pageMODE == "DOUBLE") {
                    setCoverPage(PAGE_CURRENT_NUMBER);
                }
                writeFrameDocument(PageframeDocument, parseInt(PAGE_CURRENT_NUMBER));
            } else if(PAGE_CURRENT_NUMBER==0) {
                setCoverPage(PAGE_CURRENT_NUMBER);
            } else {
                writeFrameDocument(PageframeDocument, parseInt(PAGE_CURRENT_NUMBER));
            }

            // 렌더링 대신 편의상 바로 UI에 띄운다.
            renderPageFrame('#' + pageFrame, PageframeDocument, PAGE_CURRENT_NUMBER, ViewerManager.PAGE_TOTAL_NUMBER, callback);
            //responsiveUI.setResponsiveScale('#' + pageframe, PageframeDocument)
        },
/*
        showPageOrShowCover2 = function (pageframe, PAGE_CURRENT_NUMBER) {
            var PageframeDocument = document.getElementById(String(pageframe));
            writeFrameDocument(PageframeDocument, parseInt(PAGE_CURRENT_NUMBER));
            responsiveUI.setResponsiveScale('#' + pageframe, PageframeDocument)
        },
*/
        initPageHTMLData = function () {
            log("@ initPageHTMLData...");
            var arrPageData = new Array(ViewerManager.ePub.opf_xml2json_data_Array.length), firstPage, lastPage;

            for (var i = 0; i < ViewerManager.ePub.opf_xml2json_data_Array.length; i++) {
                arrPageData[i] = new Array(1);
                arrPageData[i][0] = "NotCache",
                    arrPageData[i][1] = ViewerManager.ePub.opf_xml2json_data_Array[i];
            }

            firstPage = new Array(1);
            firstPage[0] = "Cached";
            firstPage[1] = "";
            arrPageData.unshift(firstPage);

            lastPage = new Array(1);
            lastPage[0] = "Cached";
            lastPage[1] = "";
            arrPageData.push(lastPage);

            ViewerManager.pageHTMLData = arrPageData;
        },
        // 프레임 내의 컨텐트를 활성화시키는 역할?
        // 프레임의 크기도 정하는 듯
        renderPageFrame = function (frameName, pageFrameElement, PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER, callback) {
            log("@ renderPageFrame...");

            function callAjax() {
                if (String(location.href).match('titanbooks.co.kr') || ViewerManager.CustomizeType == "DEFAULT") {
                    jQuery.ajax({
                        type: "GET",
                        url: "/include/lib/Ajax/sviwer_page_log.php"
                    });
                }
            }

            try {
                //프레임의 컨텐트가 로드 되지 않았을 경우, 1 milesecond 후에 다시 재 호출한다.
                if (pageFrameElement.contentWindow.document != null && (pageFrameElement.contentWindow.document.body == undefined || pageFrameElement.contentWindow.document.body == null)) {
                    var frameTimer = setTimeout(function () {
                        renderPageFrame(frameName, pageFrameElement, PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER, callback);
                        clearTimeout(frameTimer);
                    }, 1);
                }
                //프레임의 컨텐트가 로드 된 경우
                else {
                    // 자동 재생 설정
                    var frameN = frameName.replace('#', '');
                    var _iframe = document.getElementById(frameN);
                    var _ifWin = _iframe.contentWindow;
                    //var _iframe = document.frames ? document.frames[frameN] : document.getElementById(frameN);
                    //var _ifWin = _iframe.contentWindow || _iframe;
                    _iframe.focus();

                    var autoFrame = ViewerManager.pageMODE == 'SINGLE' ? 'leftPageFrame' : parseInt(ViewerManager.PAGE_CURRENT_NUMBER) == 1 ? 'rightPageFrame' : 'leftPageFrame';

                    if (_iframe.onload != null && _iframe.onload != undefined) {
                        if (frameN == autoFrame) {
                            _iframe.onload = function () {
                                if (_ifWin.fromNative == undefined || _ifWin.fromNative == null) {
                                    return;
                                }
                                if (_ifWin.playAudio == undefined || _ifWin.playVideo == undefined) {
                                    return;
                                }
                                ViewerManager.iframePlay = setTimeout(function () {
                                    _ifWin.fromNative();
                                }, 1000);
                            }
                        }
                    } else {
                        if (frameN == autoFrame) {
                            function ieOnloadIframe() {
                                if (_ifWin.document.readyState == 'complete') {
                                    if (_ifWin.fromNative == undefined || _ifWin.fromNative == null) {
                                        return;
                                    }
                                    if (_ifWin.playAudio == undefined || _ifWin.playVideo == undefined) {
                                        return;
                                    }
                                    ViewerManager.iframePlay = setTimeout(function () {
                                        _ifWin.fromNative();
                                    }, 1500);
                                } else {
                                    setTimeout(function () {
                                        ieOnloadIframe();
                                    }, 500);
                                }
                            }

                            ieOnloadIframe();
                        }
                    }

                    // 프레임 바디 컨트롤
                    var pageContent = $(frameName).contents();
                    pageContent.find('body').on("contextmenu", function (e) {
                        //return false;
                    });
                    callAjax();

                    // 페이지 영역 swipe 등록
                    ViewerManager.swipeReg($(frameName).contents().find('body'), true);

                    if (ViewerManager.CustomizeType == '6MENU1' || ViewerManager.CustomizeType == 'MAINAGE') {
                        $(frameName).contents().find('body').on("mousemove", function (e) {
                            if ($('#header').css('display') == 'block') {
                                $('#header').slideUp(ViewerManager.Settings.menuSpeed)
                            }
                            if ($('#footer_container').css('display') == 'block') {
                                $('#footer_container').slideUp(ViewerManager.Settings.menuSpeed)
                            }
                        });
                    }
                    // end

                    // 페이지 찾아야함
                    $(frameName).contents().find('body').css({
                        "position": "absolute",
                        "background": ((PAGE_CURRENT_NUMBER - 1) === 0 && frameName === "#leftPageFrame" && ViewerManager.pageMODE === "DOUBLE" || (PAGE_CURRENT_NUMBER - 1) === PAGE_TOTAL_NUMBER && frameName === "#rightPageFrame" ? "#FFFFFF" : "#FFFFFF"),
                        "padding": "0px",
                        "margin": "0px"
                    });

                    responsiveUI.setResponsiveScale(frameName, pageFrameElement);
                    //$(frameName).css("visibility", "visible");

                    log("p_userid=" + ViewerManager.userInfo.userId + "&p_contsid=" + ViewerManager.userInfo.cntsId + "&p_itemid=" + ViewerManager.userInfo.itemId);
                    // GetMultiInfo 전체 조회 API [판서, 메모, 링크]
                    log("@ No Memo data in server db => loading local memo!");
                    log("@ No link data in server db => loading local link!");
                    switch (ViewerManager.pageMODE) {
                        case "SINGLE":
                            //memo.loadLocalStorageMemo(PAGE_CURRENT_NUMBER);
                            link.loadLocalStorageLink(PAGE_CURRENT_NUMBER);
                            break;
                        case "DOUBLE":
                            if (frameName === "#leftPageFrame") {
                                //memo.loadLocalStorageMemo(parseInt(PAGE_CURRENT_NUMBER) - 1);
                                link.loadLocalStorageLink(parseInt(PAGE_CURRENT_NUMBER) - 1);
                            } else if (frameName === "#rightPageFrame") {
                                //memo.loadLocalStorageMemo(PAGE_CURRENT_NUMBER);
                                link.loadLocalStorageLink(PAGE_CURRENT_NUMBER);
                            }
                            break;
                    }

                    bookmark.initBookmarkIcon(frameName, PAGE_CURRENT_NUMBER);

                    if (frameName == "#leftPageFrame") {
                        //draw.initCanvas();
                        CONTROL.loadComplete();
                    }
                    //ViewerManager.UInormal('show');
                }

                // resize wrapper and gradient
                var el = $(pageFrameElement)
                el.parent().width(el.width())
                el.parent().height(el.height())
                el.siblings().width(el.width())
                el.siblings().height(el.height())


            } catch (e) {
                log("@ iFrame contents null error : " + e);
            }

            if(callback) {
                var visible = false;
                if(callback) visible = callback({query:'visible'})
                if(visible) $(frameName).css("visibility", "visible");
            }
        },

        pageLoading = function (PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER) {
            log("@ pageLoading...");
            log("@ CURRENT_NUMBER=" + PAGE_CURRENT_NUMBER + " / TOTAL_NUMBER=" + PAGE_TOTAL_NUMBER);

            //if (ViewerManager.Settings.uiHold == "0") {
            //menuBarHide(ViewerManager.Settings.menuSpeed);
            //}

            if ($("#indexListTemplet").css("display") === "block") {
                $("#indexListTemplet").fadeOut("fast");
                $(".indexList").attr("src", "images/titan_topMenu/topMenu_indexList_btn_01.png");
            }

            if ($("#searchListTemplet").css("display") === "block") {
                $("#searchListTemplet").fadeOut("fast");
                $(".searchList").attr("src", "images/titan_topMenu/topMenu_search_btn_01.png");
            }

            if ($("#morePopupTemplet").css("display") === "block") $("#morePopupTemplet").fadeOut("fast");
            document.getElementById("bookmark_container").innerHTML = "";

            ViewerManager.PAGE_CURRENT_NUMBER = PAGE_CURRENT_NUMBER;

            zoom.clearZoom();

            // 페이지 불러오기
            // 마지막으로 순서 바꾸기
            //appendFrameDocument(PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER);

            if (parseInt(PAGE_CURRENT_NUMBER) === 1) {
                $('#btnSlideLeft').hide();
            } else {
                $('#btnSlideLeft').show();
            }

            if (parseInt(PAGE_TOTAL_NUMBER) === parseInt(PAGE_CURRENT_NUMBER) || (parseInt(PAGE_CURRENT_NUMBER) - 1) === parseInt(PAGE_TOTAL_NUMBER)) {
                $('#btnSlideRight').hide();
            } else {
                $('#btnSlideRight').show();
            }

            ViewerManager.pageHistory.push(parseInt(PAGE_CURRENT_NUMBER));

            var currentPageNumberType, currentPageNumberWidth;
            switch (ViewerManager.pageMODE) {
                case "SINGLE":
                    currentPageNumberType = (parseInt(PAGE_CURRENT_NUMBER) > parseInt(PAGE_TOTAL_NUMBER) ? parseInt(PAGE_CURRENT_NUMBER) - 1 : parseInt(PAGE_CURRENT_NUMBER));
                    currentPageNumberType = ViewerManager.transRealToVirtualPageIndex(currentPageNumberType);
                    currentPageNumberWidth = "width: 43px;";
                    /*if (browser.isMobile.iPhone || browser.isMobile.iPad || browser.isMobile.iPod) {
                     currentPageNumberWidth = "width: 43px;";
                     }*/
                    break;
                case "DOUBLE":
                    currentPageNumberType = (parseInt(PAGE_CURRENT_NUMBER) > parseInt(PAGE_TOTAL_NUMBER) ?
                        ViewerManager.transRealToVirtualPageIndex(parseInt(PAGE_CURRENT_NUMBER) - 1) :
                        ViewerManager.transRealToVirtualPageIndex((parseInt(PAGE_CURRENT_NUMBER) - 1)) + " - " + ViewerManager.transRealToVirtualPageIndex(parseInt(PAGE_CURRENT_NUMBER)));
                    currentPageNumberWidth = "width: 71px;";
                    /*if (browser.isMobile.iPhone || browser.isMobile.iPad || browser.isMobile.iPod) {
                     currentPageNumberWidth = "width: 71px;";
                     }*/
                    break;
            }

            //currentPageNumberWidth = "100px;"

            $('#CURRENT_PAGE').empty().append("<input id='currentPageTextInput' style='" + currentPageNumberWidth + "' type='text' value='" + currentPageNumberType + "'>");
            /*$("#currentPageTextInput").on("focus", function (e) {
             $(this).select();
             });*/
            $("#currentPageTextInput").on("click", function (e) {
                $("#currentPageTextInput").focus();
                $("#currentPageTextInput").select();
            });

            $("#currentPageTextInput").on("keydown", function (e) {
                var e = e || window.event,
                    key = e.keyCode || e.which;

                if (!e.shiftKey && !e.altKey && !e.ctrlKey &&
                    // numbers
                    key >= 48 && key <= 57 ||
                    // Numeric keypad
                    key >= 96 && key <= 105 ||
                    // Backspace and Tab and Enter
                    key === 8 || key === 9 || key === 13 ||
                    // Home and End
                    key === 35 || key === 36 ||
                    // left and right arrows
                    key === 37 || key === 39 ||
                    // Del and Ins
                    key === 46 || key === 45 || key === 109 || key === 189) {
                    // input is VALID
                } else {
                    // input is INVALID
                    e.returnValue = false;
                    if (e.preventDefault) e.preventDefault();
                }
            });
            $("#currentPageTextInput").on("keyup", function (e) {
                var thisPage = ViewerManager.transVirtualToRealPageIndex(parseInt(this.value));
                if (e.keyCode === 13) {
                    if (thisPage > PAGE_TOTAL_NUMBER) thisPage = PAGE_TOTAL_NUMBER;
                    if (thisPage < 1) thisPage = 1;
                    if (ViewerManager.progressType === "0" && ViewerManager.progressComplete === "N") {
                        $("#currentModeNotice").text(ViewerManager.Local.indexListLinkAlert).fadeIn(300, function () {
                            var noticeTimer = setTimeout(function () {
                                $("#currentModeNotice").fadeOut(500);
                                clearTimeout(noticeTimer);
                            }, 1000);
                        });
                    } else {
                        if ($('#drawing_container').css("display") === "block") {
                            //draw.saveCanvasData(ViewerManager.PAGE_CURRENT_NUMBER);
                            //draw.offDrawMode();
                            //draw.hideDrawMenu();
                        }
                        ViewerManager.PAGE_CURRENT_NUMBER = parseInt(thisPage);
                        ViewerManager.sliderValue = ViewerManager.PAGE_CURRENT_NUMBER;

                        if (ViewerManager.pageMODE === "DOUBLE" && ViewerManager.isOddCheck(ViewerManager.PAGE_CURRENT_NUMBER)) {
                            ViewerManager.PAGE_CURRENT_NUMBER = parseInt(ViewerManager.PAGE_CURRENT_NUMBER) + 1;
                            ViewerManager.sliderValue = ViewerManager.PAGE_CURRENT_NUMBER + 1;
                        }

                        if (ViewerManager.PAGE_CURRENT_NUMBER == 0 || ViewerManager.PAGE_CURRENT_NUMBER == '0') {
                            ViewerManager.PAGE_CURRENT_NUMBER = 1;
                        }
                        ViewerManager.pageLoading(ViewerManager.PAGE_CURRENT_NUMBER, ViewerManager.PAGE_TOTAL_NUMBER);
                    }
                }
            });

            $('#TOTAL_PAGE').text("   " + PAGE_TOTAL_NUMBER + " pages");

            $("#slider-range").slider({
                range: "min",
                value: PAGE_CURRENT_NUMBER,
                min: 1,
                max: PAGE_TOTAL_NUMBER,
                slide: function (event, ui) {
                    if ($('#drawing_container').css("display") == "block") {
                        //draw.saveCanvasData(ViewerManager.PAGE_CURRENT_NUMBER);
                        //draw.offDrawMode();
                        //draw.hideDrawMenu();
                    }
                    ViewerManager.PAGE_CURRENT_NUMBER = ui.value;
                    ViewerManager.sliderValue = ui.value;
                    ViewerManager.isPageSlider = true;
                }
            });
            if (ViewerManager.progressType === "0" && ViewerManager.PAGE_CURRENT_NUMBER === ViewerManager.PAGE_TOTAL_NUMBER) {
                ViewerManager.progressComplete = "Y";
            }
            if (ViewerManager.progressType === "1") {
                updateProgressCompletePage();
            }
            log("@@ ViewerManager.progressComplete  : " + ViewerManager.progressComplete);

            appendFrameDocument(PAGE_CURRENT_NUMBER, PAGE_TOTAL_NUMBER);

            var nextPageNumber = parseInt(PAGE_CURRENT_NUMBER) + 1;

            if (ViewerManager.pageMODE == "DOUBLE") {
                if (parseInt(PAGE_CURRENT_NUMBER) % 2 == 0) {
                    return;
                }
            }

            // if (nextPageNumber < parseInt(PAGE_TOTAL_NUMBER)) {
            // 	// 프리로드 설정
            // 	callPreLoad('preloader1', nextPageNumber);

            // 	if (nextPageNumber + 1 < parseInt(PAGE_TOTAL_NUMBER)) {
            // 		callPreLoad('preloader2', nextPageNumber + 1);
            // 	}

            // 	function callPreLoad(frameName, pageNumber) {
            // 		switch (ViewerManager.pageHTMLData[pageNumber][0]) {
            // 			case "NotCache" : {
            // 				log("@@ leftPageFrame ============================= NotCache!");
            // 				$.ajax({
            // 					url: ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + "" + ViewerManager.ePub.ops_name[0] + "/" + ViewerManager.pageHTMLData[pageNumber][1],
            // 					dataType: 'html',
            // 					async: false,
            // 					success: function (data) {
            // 						var tempPath = ViewerManager.pageHTMLData[pageNumber][1].split("/"), replaceData, lastPath = "";
            // 						log("===tempPath================================================================================");
            // 						log(tempPath);
            // 						for (var i = 0; i < tempPath.length - 1; i++) {
            // 							lastPath = lastPath + tempPath[i] + "/";
            // 						}

            // 						if (data.indexOf('href="../') !== -1) {
            // 							replaceData = data.replace(/ href="..\//gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
            // 						} else {
            // 							if (data.indexOf('" href="') !== -1) replaceData = data.replace(/" href="/gi, '" href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
            // 							else if (data.indexOf(' href="') !== -1) replaceData = data.replace(/ href="/gi, ' href="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
            // 						}

            // 						if (data.indexOf('src="../') !== -1) {
            // 							replaceData = replaceData.replace(/src="..\//gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/');
            // 						} else {
            // 							replaceData = replaceData.replace(/src="/gi, 'src="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
            // 						}

            // 						replaceData = replaceData.replace(/url\(/gi, 'url(' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);
            // 						replaceData = replaceData.replace(/poster="./gi, 'poster="' + ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath);

            // 						if (replaceData.indexOf(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http") !== -1) {
            // 							var patten = new RegExp(ViewerManager.Path.cntsDirPath + ViewerManager.Path.cntsFilePath + ViewerManager.ePub.ops_name[0] + '/' + lastPath + "http", "gi");
            // 							replaceData = replaceData.replace(patten, "http");
            // 						}

            // 						// 배경 경로가 안맞는 경우를 위해서 수정
            // 						if (replaceData.indexOf("background") && replaceData.indexOf("url"))
            // 						{
            // 							var url_start = replaceData.indexOf("(");
            // 							var url_end = replaceData.indexOf(")");
            // 							var prev_data = replaceData.substr(url_start, url_end);

            // 							var change_data = prev_data.replace(/"/gi, "");
            // 							change_data = prev_data.replace(/'/gi, "");
            // 							//console.log(url_start, url_end, prev_data, change_data);
            // 							replaceData = replaceData.replace(prev_data, change_data);
            // 						}

            // 						replaceData = replaceData.replace(/autoplay="autoplay"/g, 'autoplay="false"');

            // 						ViewerManager.pageHTMLData[pageNumber][0] = "Cached";
            // 						ViewerManager.pageHTMLData[pageNumber][1] = replaceData;

            // 						//viewPage(String(frameName), pageNumber);
            // 						var PageframeDocument = document.getElementById(String(frameName));
            // 						PageframeDocument.contentDocument.open('text/html', 'replace');
            // 						PageframeDocument.contentDocument.write(ViewerManager.pageHTMLData[pageNumber][1]);
            // 						PageframeDocument.contentDocument.close();
            // 					},
            // 					error: function (err) {
            // 						log("@ getPageHTMLData ajax error : " + err);
            // 					},
            // 					complete: function () {
            // 						log("@ getPageHTMLData ajax complete...");
            // 						//console.log('nextpage loaded', pageNumber);
            // 					}
            // 				});
            // 				break;
            // 			}
            // 			case "Cached" : {
            // 				log("@@ leftPageFrame ============================= Cached!");
            // 				//viewPage(String(frameName), pageNumber);
            // 				var PageframeDocument = document.getElementById(String(frameName));
            // 				PageframeDocument.contentDocument.open('text/html', 'replace');
            // 				PageframeDocument.contentDocument.write('');
            // 				PageframeDocument.contentDocument.close();

            // 				break;
            // 			}
            // 		}
            // 	}
            // }
            log("@ pageLoading end");
        }, // end pageLoading

        nextPage = function (currentPageNumber, totalPageNumber) {
            // menuBarHide(500);
            //log('nextPage >> currentPageNumber : ' + currentPageNumber + " : totalPageNumber " + totalPageNumber)
            if (parseInt(currentPageNumber) < parseInt(totalPageNumber)) {
                //draw.detachCanvasEvent();
                //draw.saveCanvasData(currentPageNumber);
                //draw.offDrawMode();
                //draw.hideDrawMenu();

                ViewerManager.PAGE_CURRENT_NUMBER = parseInt(currentPageNumber) + (ViewerManager.pageMODE === "SINGLE" ? 1 : 2);
                //log('ViewerManager.PAGE_CURRENT_NUMBER' + ViewerManager.PAGE_CURRENT_NUMBER);
                ViewerManager.sliderValue = ViewerManager.PAGE_CURRENT_NUMBER;
                ViewerManager.pageLoading(ViewerManager.PAGE_CURRENT_NUMBER, totalPageNumber);
            }
        },

        previousPage = function (currentPageNumber, totalPageNumber) {
            // menuBarHide(500);
            //log('prevPage >> currentPageNumber : ' + currentPageNumber + " : totalPageNumber " + totalPageNumber)
            if (parseInt(currentPageNumber) > 1) {
                //draw.detachCanvasEvent();
                //draw.saveCanvasData(currentPageNumber);
                //draw.offDrawMode();
                //draw.hideDrawMenu();

                ViewerManager.PAGE_CURRENT_NUMBER = parseInt(currentPageNumber) - (ViewerManager.pageMODE === "SINGLE" ? 1 : (currentPageNumber === 2 ? 1 : 2));
                ViewerManager.sliderValue = ViewerManager.PAGE_CURRENT_NUMBER;
                ViewerManager.pageLoading(ViewerManager.PAGE_CURRENT_NUMBER, totalPageNumber);
            }
        },

        getURLParameter = function (sParam) {
            var sPageURL = window.location.search.substring(1),
                sURLVariables = sPageURL.split('&');

            for (var i = 0; i < sURLVariables.length; i++) {
                var sParameterName = sURLVariables[i].split('=');
                if (sParameterName[0] == sParam) {
                    return sParameterName[1];
                }
            }
        },

        initProgressCompletePage = function () {
            log("@ initProgressCompletePage...");

            var defaultValue = "N";

            for (var i = 0; i < ViewerManager.PAGE_TOTAL_NUMBER - 1; i++) {
                defaultValue = defaultValue + "N";
            }
            ViewerManager.prpgressCompletePage = defaultValue;

            log("@ ViewerManager.prpgressCompletePage : " + ViewerManager.prpgressCompletePage);
        },

        updateProgressCompletePage = function () {
            log("@ updateProgressCompletePage...");

            var updateProgressCompletePageValue = ViewerManager.prpgressCompletePage.replaceAt(ViewerManager.PAGE_CURRENT_NUMBER - 1, "Y");

            ViewerManager.prpgressCompletePage = updateProgressCompletePageValue;

            log("@ ViewerManager.prpgressCompletePage : " + ViewerManager.prpgressCompletePage);

            if (ViewerManager.prpgressCompletePage.indexOf("N") === -1) ViewerManager.progressComplete = "Y";
        },

        menuBarHide = function (delay) {
            var menuButtonTimer = setTimeout(function () {
                if ($("#header").css("display") === "block") $("#btn_menu").trigger("click");
                clearTimeout(menuButtonTimer);
            }, delay);
        },

        _init = function () {

        },

        _loadStart = function () {

        },

        _resize = function () {

        };

    var exportPage = {
        pageLoading: pageLoading,
        nextPage: nextPage,
        previousPage: previousPage,
        getURLParameter: getURLParameter,
        initPageHTMLData: initPageHTMLData,
        initProgressCompletePage: initProgressCompletePage,
        menuBarHide: menuBarHide,
        _init: _init
    };

    CONTROL.page = exportPage;

    return exportPage;
});
