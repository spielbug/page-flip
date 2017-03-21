/**
 * Created by spiel on 2017-03-18.
 */


const _pathPrefix = 'epub/OEBPS/content/';

var Flip = function(){
    var _w, _h, _flipper, _left, _right, _made, _container;
    var _edge=0.1, _edgeShown = false
    var _startPoint
    var _edgeAngle
    var _edgeSize
    var _clickedEdge
    var _easing
    var _zoom=1
    var _timerID

    // make each side (left, right) holder and call makeFlipper
    function make(container) {
        // metric
        container = (container.fn)? container : $(container)
        _container = container
        var metricDiv = $('#page4')
        _w = metricDiv.width()
        _h = metricDiv.height()
        container.width(_w*2)
        container.height(_h)


        // make edge (to receive event)
        var edgeLeft = makeDiv(_w*_edge,_h,'edge-left')
        edgeLeft.css ({
            position:'absolute',
            left:'0px',
            top:'0px',
        })
        var edgeRight = makeDiv(_w*_edge,_h,'edge-left')
        edgeRight.css ({
            position:'absolute',
            left:(_w*(2-0.1))+'px',
            top:'0px',
        })
        container.append(edgeLeft)
        container.append(edgeRight)

        // page move triggers load event
        // so add new trigger
        _book.resetLoadCount();
        _book.setTrigger(loadFlipPage)

        // make child to have their wrapper and gradient
        var childs = container.children()
        var len=childs.length
        for(var i = 0; i<len; i++) {
            var child = $(childs[i])
            //console.log(child,child.attr('class'))
            if(!child.hasClass('page')) {
                //console.log('this div will be ignored')
                continue

            }

            // make wrapper
            var wrapper = makeWrapper(child)

            // add wrapper to container
            container.prepend(wrapper)
        }

        // make side
        if(!_left) {
            _left = makeDiv(_w, _h, 'side-left')
            _left.addClass('side-left')
            _left.css({
                position:'absolute',
            })
            _right = makeDiv(_w, _h, 'side-right')
            _right.addClass('side-right')
            _right.css({
                position:'absolute',
                left:(_w)+'px',
            })
            container.prepend(_left)
            container.prepend(_right)
            makeFlipper(container)
            _made = true
        }

        // move to side
        $('#page4,#page5,#page6').parent().css({
            'left' : _w
        })
        //$('#page1,#page2,#page3').parent().appendTo('#side-left')
        $('#page1,#page2').parent().hide()
        //$('#page6,#page5,#page4').parent().appendTo('#side-right')
        $('#page5,#page6').parent().hide()

        // hide all gradient
        $('.gradient').hide()

        // hide flipper
        $('.flipper').hide()

        $(window).trigger('resize');
    }

    // make wrapper and wrap chlid
    // put gradient into wrapper
    function makeWrapper(child) {
        var wrapper=$('<DIV>').addClass('fb-wrapper')
        wrapper.css({
            position : 'absolute',
            left:'0px',
            top:'0px',
            width:_w,
            height:_h,
        })
        //_right.append(wrapper)
        child.appendTo(wrapper)

        // make gradient
        var gradient = $('<DIV>').addClass('gradient')
        gradient.css({
            position : 'absolute',
            left:'0px',
            top:'0px',
            width:_w,
            height:_h,
            //'z-index':3,
        })
        gradient.appendTo(wrapper)
        return wrapper
    }

    function made() {
        return _made
    }

    // make flipper
    // flipper is div that include flipping div (flip-top) and flipped div (flip-bottom)
    function makeFlipper(container) {
        if(!container.fn) container = $(container)
        // div for flipping
        _flipper = makeDiv(_w, _h, 'flipper')
        _flipper.addClass('flipper')
        _flipper.css({
            'position':'absolute',
            //'left' : _w,
            'overflow':'hidden',
            //'z-index' : 3
        })
        container.append(_flipper)

        var fbr = makeDiv(_w, _h, 'flip-bottom-right', 'flip-bottom-right')
        var wrapper = makeWrapper(fbr)
        var fbl = makeDiv(_w, _h, 'flip-bottom-left', 'flip-bottom-left')
        wrapper.prepend(fbl)
        //wrapper.css('z-index','9')
        wrapper.appendTo(_flipper)

        var ftr = makeDiv(_w, _h, 'flip-top-right','flip-top-right')
        wrapper = makeWrapper(ftr)
        var ftl = makeDiv(_w, _h, 'flip-top-left','flip-top-left')
        wrapper.prepend(ftl)
        //wrapper.css('z-index','9')
        wrapper.appendTo(_flipper)

        fbr.addClass('flip-page').css('position','absolute')
        fbl.addClass('flip-page').css('position','absolute')
        ftr.addClass('flip-page').css('position','absolute')
        ftl.addClass('flip-page').css('position','absolute')

    }

    function getFrameHtml(src, target) {
        if(src[0].contentDocument.head==null||src[0].contentDocument.body==null) return ''
        src.data('stat','loading')
        return src[0].contentDocument.head.innerHTML+src[0].contentDocument.body.innerHTML
            +"<script>$('"+target+"').addClass('loaded')</script>"
    }
    function loadFlipPage() {

        $('.flip-bottom-left').html(replace(
            getFrameHtml($('#page3'),'.flip-bottom-left'),
            _pathPrefix)
        )
        $('.flip-top-left').html(replace(
            getFrameHtml($('#page2'),'.flip-top-left'),
            _pathPrefix)
        )
        $('.flip-bottom-right').html(replace(
            getFrameHtml($('#page4'),'.flip-bottom-right'),
            _pathPrefix)
        )
        $('.flip-top-right').html(replace(
            getFrameHtml($('#page5'),'.flip-top-right'),
            _pathPrefix)
        )
    }

    // make div conveniently
    function makeDiv(w, h, id, className) {
        var div = $('<div>')
        if(id) div.attr('id', id)
        if(className) div.addClass(className)
        div.width(w)
        div.height(h)

        return div
    }


    // href, src, url 요소를 대치한다.
    function replace(s, prefix) {

        s = s.replace(/src=\"/gi,'src="'+prefix+'')
        s = s.replace(/href=\"/gi,'href="'+prefix+'')
        s = s.replace(/url\(\"/gi,'url("'+prefix+'')
        return s;
    }

    function startFlip(bottom, top, side) {
        bottom = bottom.fn?bottom:$(bottom)
        top = top.fn?top:$(top)

        var check = bottom[0].contentDocument.head
        && bottom[0].contentDocument.body
        && top[0].contentDocument.head
        && top[0].contentDocument.body
        if(!check) return


        $('.gradient').show()
        $('.flip-page').hide()

        if(side=='right') {
            $('.flip-top-right,.flip-bottom-right').show()
            $('#page6').parent().show()
        }
        else {
            $('.flip-top-left,.flip-bottom-left').show()
            $('#page1').parent().show()
        }
        bottom.parent().hide()
        top.parent().hide()

        _flipper.show()
    }

    function endFlip(cancel, direction) {

        _flipper.hide()

        if(direction==-1) {
            _flipper.css ('left','0')
        }
        else {
            _flipper.css ('left',_w)
        }

        _flipper.css({
            transform : ''
        })

        $('.flip-page').parent().css({
            transform:'',
            left:'0',
            top:'0',
        })

        $('.gradient').css({
            background : ''
        })
        $('.gradient').hide()


        //console.log('cancel',cancel)
        if(!cancel) {
            $('.flip-page').removeClass('loaded') // remove flicker
            $('#page1,#page6').parent().hide()
            $('.flip-page').hide()
            if(direction==-1) {
                // rotate
                $('#page1').attr('id','page-1')
                $('#page2').attr('id','page0')
                $('#page3').attr('id','page1')
                $('#page4').attr('id','page2')
                $('#page5').attr('id','page3')
                $('#page6').attr('id','page4')
                $('#page-1').attr('id','page5')
                $('#page0').attr('id','page6')
                // load next page
                //_book.next()
                _book.page+=2
                _book.loadSingle('#page5',_book.page+1, function(){loadFlipPage()})
                _book.loadSingle('#page6',_book.page+2)
            }
            else if(direction==1){
                // rotate
                $('#page6').attr('id','page8')
                $('#page5').attr('id','page7')
                $('#page4').attr('id','page6')
                $('#page3').attr('id','page5')
                $('#page2').attr('id','page4')
                $('#page1').attr('id','page3')
                $('#page8').attr('id','page2')
                $('#page7').attr('id','page1')
                // load previous page
                //_book.previous()
                _book.page-=2
                _book.loadSingle('#page1',_book.page-3)
                _book.loadSingle('#page2',_book.page-2, function(){loadFlipPage()})
            }

        }
        else {
            //$(window).trigger('resize')
        }

        $('#page1,#page2,#page5,#page6').parent().hide()
        $('#page3,#page4').parent().show()
        $('#page1,#page2,#page3').parent().css({
            'left' : 0
        })
        $('#page4,#page5,#page6').parent().css({
            'left' : _w
        })

    }

    function showBuffer() {
        $('.buffer-left').show()
        $('.buffer-right').show()

    }

    function hideBuffer() {
        $('.buffer-left').hide()
        $('.buffer-right').hide()

    }

    function getRotatedSize(w, h, angle) {
        var x1 = -w/2
        var x2 = w/2
        var y1 = -h/2
        var y2 = h/2
        var w = Math.max(x2*Math.cos(angle)-y2*Math.sin(angle),
                x2*Math.cos(angle)-y1*Math.sin(angle))*2
        var h = Math.max(x1*Math.sin(angle)+y2*Math.cos(angle),
                x2*Math.sin(angle)+y2*Math.cos(angle))*2
        return {'w':w, 'h':h }
    }


    function reformFlipper(w, h, angle, distance) {
        w = w | _w
        h = h | _h
        $('.flip-bottom').css('margin-left','0')
        //console.log(w,h,angle,distance)
        var rs = getRotatedSize(w, h, angle)
        //_flipper.removeAttr('style');

        // limit distance
        var pageWidth = Math.abs(1/Math.cos(angle)*distance)
        var sign = (distance>0)? 1:-1;
        if(pageWidth>_w) distance = sign * _w * Math.abs(Math.cos(angle))

        var fPos = _right.position()
        if(distance > 0) {
            fPos = _left.position()
        }

        _flipper.css({
            'left':(fPos.left/_zoom-(rs.w-_w)/2),
            'top':(fPos.top/_zoom-(rs.h-_h)/2)
        })

        _flipper.width(rs.w)
        _flipper.height(rs.h)
        _flipper.css({
            'transform':'rotateZ('+(angle)+'rad) translate('+(distance)+'px)',
            //'transform':'rotateZ('+rad2deg(angle)+'deg)',
        })

        reformDiv('.flip-bottom-right', rs.w, rs.h, -angle, distance)
        if(distance>0) reformFlippingDivLeft('.flip-top-right', rs.w, rs.h, -angle, distance)
        else reformFlippingDivRight('.flip-top-left', rs.w, rs.h, -angle, distance)
    }

    function reformDiv(div, dw, dh, angle, distance) {
        if(!div.fn) div = $(div)
        var top = (dh-_h)/2
        var left = (dw-_w)/2
        var wrapper = div.parent()
        wrapper.css({
            'top':'0px',
            'left': '0px',
            //'width': _w,
            //'height': _h,
            //'z-index':0,
            'transform':'translate('+(-distance+left)+'px, '+top+'px) rotateZ('+(angle)+'rad)'
            //'transform':'translate('+left+'px, '+top+'px) rotateZ('+rad2deg(angle)+'deg)',
        })
    }

    function reformFlippingDivLeft(div, rw, rh, angle, distance) {
        if(!div.fn) div = $(div)
        var topMargin = (rh-_h)/2

        var rcx = _w - (Math.cos(angle)*_w+distance)/Math.cos(angle)
        rcx = _w + rcx
        var rcy = 0
        var fdTop = -Math.tan(angle)*(Math.cos(angle)*_w-distance)
        var fdLeft = -rcx
        //console.log(distance, rcx, fdLeft, fdTop)
        if(angle>0) {
            fdTop = topMargin*2+fdTop
            rcy = _h;
        }

        var wrapper = div.parent()
        wrapper.css({
            //'z-index':6,
            //'width': _w,
            //'height': _h,
            'transform':'translate('+fdLeft+'px, '+fdTop+'px) rotateZ('+(-angle)+'rad)',
            'transform-origin':rcx+'px '+rcy+'px',
        })
        gradientFlippingDiv(wrapper, angle, distance)
    }

    function reformFlippingDivRight(div, rw, rh, angle, distance) {
        if(!div.fn) div = $(div)
        var topMargin = (rh-_h)/2

        var rcx = _w - (Math.cos(angle)*_w+distance)/Math.cos(angle)
        //var rcx = -distance
        var rcy = 0
        var fdTop = Math.tan(angle)*(Math.cos(angle)*_w+distance)
        var fdLeft = rw-rcx

        if(angle<0) {
            fdTop = topMargin*2+fdTop
            rcy = _h;
        }

        var wrapper = div.parent()
        wrapper.css({
            //'z-index':6,
            'width': _w,
            'height': _h,
            'transform':'translate('+fdLeft+'px, '+fdTop+'px) rotateZ('+(-angle)+'rad)',
            'transform-origin':rcx+'px '+rcy+'px',
        })
        gradientFlippingDiv(wrapper, angle, distance)

    }

    function gradientFlippingDiv(div, angle, distance) {
        //console.log(div, angle, distance)
        var g = div.find('.gradient')

        if(distance>0) {
            g.css({
                background : 'linear-gradient('+(angle-Math.PI/2)+'rad, transparent 0px, transparent '+(distance-100)
                +'px, rgba(0,0,0,'+(0.2*(1-distance/_w))+') '+(distance-20)+'px, transparent '+(distance)+'px)'
            })
        }
        else {
            g.css({
                background : 'linear-gradient('+(angle+Math.PI/2)+'rad, transparent 0px, transparent '+(-distance-100)
                +'px, rgba(0,0,0,'+0.2*(1+distance/_w)+') '+(-distance-20)+'px, transparent '+(-distance)+'px)'
            })
        }
    }

    function ease(easeFunc, stepFunc, endFunc,
                  msec, interval, startValue) {
        _easing = true
        if(startValue<1) {
            startValue+=interval/msec
            var result = easeFunc(startValue)
            stepFunc(result)
            setTimeout(function(){ease(easeFunc, stepFunc, endFunc,
                msec, interval, startValue)}, interval)
        }
        else {
            stepFunc(1)
            endFunc()
            //console.log('animation done')
            _easing = false;
        }
    }

    function inRect(x,y,ox,oy,width,height) {
        //console.log(x,y,ox,oy)
        if(x>=ox && x<=ox+width && y>=oy && y <=oy+height) return true
        return false
    }

    function easeEdge(angle, stepFunc, endFunc) {
        ease(EasingFunctions.easeInOutQuad,
            function (step) {
                reformFlipper(null, null, deg2rad(angle), stepFunc(step))
            },
            function () {
                if(endFunc) endFunc()
            }, 300, 15, 0
        )
    }

    $(document).bind('mousedown',function(ev){
        if(!_container) return
        if(!_edgeShown) return
        ev.preventDefault()
        ev.stopPropagation()

        var x = ev.pageX
        var y = ev.pageY
        var o = _container.offset()

        if (inRect(x, y,
                o.left, o.top,
                _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'top-left'
        }
        else if (inRect(x, y,
                o.left, o.top + zHeight(_container) - _w * _edge,
                _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'bottom-left'
        }
        else if (inRect(x, y,
                o.left + zWidth(_container) - _w * _edge, o.top,
                _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'top-right'
        }
        else if (inRect(x, y,
                o.left + zWidth(_container) - _w * _edge, o.top + zHeight(_container) - _w * _edge,
                _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'bottom-right'
        }
    })

    $(document).bind('mouseup',function(ev){
        if(!_container) return
        if(!_startPoint) return
        ev.preventDefault()
        ev.stopPropagation()

        var dx = (ev.pageX-_startPoint.x)/_zoom
        var dy = (ev.pageY-_startPoint.y)/_zoom
        var angle = Math.atan2(dy, dx)
        var distance = Math.sqrt(dx*dx + dy*dy)/2
        if (distance<10) { // just clicked

            switch(_clickedEdge) {
                case 'top-left':angle = 0.2;distance = 300;dx = 2*distance; dy=100;_startPoint.direction = 1;break;
                case 'top-right':angle = -0.2;distance = 300;dx = -2*distance; dy=100;_startPoint.direction = -1;break;
                case 'bottom-left':angle = -0.2;distance = 300;dx = 2*distance; dy=-100;_startPoint.direction = 1;break;
                case 'bottom-right':angle = 0.2;distance = 300;dx = -2*distance; dy=-100;_startPoint.direction = -1;break;
            }

            _timerID = setTimeout(function(){
                //console.log('show edge')
                if($('.loaded').length==4) {
                    console.log('show edge timed')
                    checkMousePosition(ev)
                }
            },1000)
        }
        var cancel = (distance<300)

        if(dx<0) {
            distance=-distance
            angle = Math.atan2(-dy, -dx)
        }

        var direction = _startPoint.direction
        //startPoint = undefined;
        var equation = function(d, s) {
            d=Math.abs(d)
            return direction*(d+s*(2*_w-d))
        }
        var duration = 300

        //console.log('cancel',cancel, 'distance' , distance, 'angle', angle, 'dx', dx, 'dy', dy)

        // if cancel, back page to orgin. slowdown
        if(cancel) {
            equation = function(d, s) {
                return d-s*d
            }
        }


        ease(EasingFunctions.easeInOutQuad,
            function(step){
                //console.log(angle-step*angle,equation(distance, step))
                reformFlipper(null, null, angle - step*angle, equation(distance, step))
            },function(done){
                console.log('done')
                endFlip(cancel, direction)
                _startPoint = undefined
                _edgeShown = false
            },duration,15, 0)
    })

    $(document).bind('mousemove',function(ev) {
        if($('.loaded').length==4) {
            console.log('show edge instant')
            checkMousePosition(ev)
        }
    });

    function checkMousePosition(ev) {
        if(!_container) return false
        if(_easing) return false
        if(!$('.flip-page').hasClass('loaded')) return false

        clearTimeout(_timerID)
        var x = ev.pageX
        var y = ev.pageY
        var o = _container.offset()

        //console.log(x,y,o)

        if (inRect(x, y, o.left, o.top, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            if(_book.page<=1) return
            _edgeShown = true
            _edgeAngle = 45
            _edgeSize = _w * _edge / 1.414
            startFlip('#page3', '#page2', 'left')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left, o.top + zHeight(_container) - _w * _edge, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            if(_book.page<=1) return
            _edgeShown = true
            _edgeAngle = -45
            _edgeSize = _w * _edge / 1.414
            startFlip('#page3', '#page2', 'left')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left + zWidth(_container) - _w * _edge, o.top, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            if(_book.page>=_book.totalPages) return
            _edgeShown = true
            _edgeAngle = -45
            _edgeSize = -_w * _edge / 1.414
            startFlip('#page4', '#page5', 'right')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left + zWidth(_container) - _w * _edge, o.top + zHeight(_container) - _w * _edge, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            if(_book.page>=_book.totalPages) return
            _edgeShown = true
            _edgeSize = -_w * _edge / 1.414
            _edgeAngle = 45
            startFlip('#page4', '#page5', 'right')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if(_startPoint) {
            var dx = (ev.pageX-_startPoint.x)/_zoom
            var dy = (ev.pageY-_startPoint.y)/_zoom
            var angle = Math.atan2(dy, dx)
            var distance = Math.sqrt(dx*dx + dy*dy)/2
            if(dx==0) return;

            if(_startPoint.direction) {
                if(_startPoint.direction * dx < 0) return;
            }
            else {
                _startPoint.direction = dx>0?1:-1
            }

            if(dx<0) {
                distance=-distance
                angle = Math.atan2(-dy, -dx)
            }
            //console.log(distance)
            setTimeout(function() {
                reformFlipper(_w, _h, angle, distance)
            },1)

        }
        else {
            if(!_edgeShown) return
            _edgeShown = false
            easeEdge(_edgeAngle, function(step) { return _edgeSize * (1-step*0.999) },
                function() {
                    endFlip(true, _edgeSize>0?1:-1)
                })
        }
        return true
    }

    $(window).resize(function() {
        var hr = $('body').width()/_container.width()
            vr = $('body').height()/_container.height()
        zoom(Math.min(hr,vr))
    })

    function zWidth(s) {
        s=(s.fn)?s:$(s)
        return s.width()*_zoom
    }

    function zHeight(s) {
        s=(s.fn)?s:$(s)
        return s.height()*_zoom
    }

    function _w() {
        return _w * _zoom
    }

    function _h() {
        return _h * _zoom
    }

    function zoom(z) {
        // _container.css({
        //     'transform':'scale('+zx+','+zy+')',
        //     'transform-origin':'0px 0px'
        // })
        // _w *= zx
        // _h *= zy

        z-=0.05
        _zoom = z

        _container.css({
            'transform':'scale('+z+')',
            'transform-origin':'0px 0px',
            'left':(_container.parent().width()-_container.width()*_zoom)/2,
            'top':(_container.parent().height()-_container.height()*_zoom)/2,
        })
    }

    return {
        make : make,
        startFlip : startFlip,
        endFlip : endFlip,
        reform : reformFlipper,
        ease : ease,
        made : made,
        replace : replace,
        zoom : zoom,
        loadFlipPage : loadFlipPage,
    }
    // iframe load function for event bubbling
    // 현재로서는 사용안함
    /*
     $('iframe').load(function(evt) {
     console.log(this.contentWindow)
     this.contentWindow.onmousemove=function(ev) {
     console.log('left',ev.pageX,ev.pageY)

     }
     })
     */
}

