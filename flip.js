/**
 * Created by spiel on 2017-03-18.
 */



var Flip = function(){
    var _w, _h, _flipper, _left, _right, _made, _container;
    var _edge=0.1, _edgeShown = false
    var _startPoint
    var _edgeAngle
    var _edgeSize
    var _clickedEdge
    var _easing

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
            container.append(_left)
            container.append(_right)
            makeFlipper(container)
            _made = true
        }

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

        // make child to have their wrapper and gradient
        var childs = container.children()
        var len=childs.length
        for(var i = 0; i<len; i++) {
            var child = $(childs[i])
            //console.log(child,child.attr('class'))
            if(child.hasClass('side-left') || child.hasClass('side-right')
                || child.parent().hasClass('fb-wrapper') || child.attr('id')=='flipper'
                || child.attr('id')=='edge-left' || child.attr('id')=='edge-right') {
                //console.log('this div will be ignored')
                continue

            }

            // make wrapper
            var wrapper = makeWrapper(child)

            // add wrapper to container
            wrapper.appendTo(container)
        }

        // move to side
        $('#page1,#page2,#page3').parent().appendTo('#side-left')
        $('#page1,#page2').parent().hide()
        $('#page6,#page5,#page4').parent().appendTo('#side-right')
        $('#page5,#page6').parent().hide()

        // hide all gradient
        $('.gradient').hide()

        // hide flipper
        $('.flipper').hide()

        //$(window).trigger('resize');
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

        var fb = makeDiv(_w, _h, '')
        fb.addClass('flip-bottom')
        var wrapper = makeWrapper(fb)
        //wrapper.css('z-index','9')
        wrapper.appendTo(_flipper)

        var ft = makeDiv(_w, _h, '')
        ft.addClass('flip-top')
        wrapper = makeWrapper(ft)
        //wrapper.css('z-index','9')
        wrapper.appendTo(_flipper)

    }

    // make div conveniently
    function makeDiv(w, h, id) {
        var div = $('<div>')
        div.attr('id', id)
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

        // copy iframe content to flipper
        $('.flip-bottom').html(replace(
            bottom[0].contentDocument.head.innerHTML+bottom[0].contentDocument.body.innerHTML,
            'epub/OEBPS/content/')
        )
        $('.flip-bottom ')

        $('.flip-top').html(replace(
            top[0].contentDocument.head.innerHTML+top[0].contentDocument.body.innerHTML,
            'epub/OEBPS/content/')
        )

        bottom.parent().hide()
        top.parent().hide()
        if(side=='right') $('#page6').parent().show()
        else $('#page1').parent().show()

        _flipper.show()

        $('.gradient').show()
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

        $('.flip-bottom').parent().css({
            transform:'',
            left:'0',
            top:'0',
        })

        $('.flip-top').parent().css({
            transform:'',
            left:'0',
            top:'0',
        })

        $('.gradient').css({
            background : ''
        })
        $('.gradient').hide()


        //$('#page1,#page2,#page3').parent().appendTo('#side-left')
        //$('#page4,#page5,#page6').parent().appendTo('#side-right')

        //$('flip-bottom').removeClass('flip-bottom')
        //$('flip-top').removeClass('flip-top')

        //$('#page1,#page2,#page5,#page6').css('visibility','hidden')
        //$('.flip-top').css('border','')

        $('#page1,#page2,#page5,#page6').parent().hide()
        $('#page3,#page4').parent().show()
        console.log('cancel',cancel)
        if(!cancel) {

            if(direction==-1) {
                // load next page
                _book.next()
            }
            else if(direction==1){
                // load previous page
                _book.previous()
            }

        }
        else {
            //$(window).trigger('resize')
        }
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
            'left':(fPos.left-(rs.w-_w)/2),
            'top':(fPos.top-(rs.h-_h)/2)
        })

        _flipper.width(rs.w)
        _flipper.height(rs.h)
        _flipper.css({
            'transform':'rotateZ('+(angle)+'rad) translate('+(distance)+'px)',
            //'transform':'rotateZ('+rad2deg(angle)+'deg)',
        })

        reformDiv('.flip-bottom', rs.w, rs.h, -angle, distance)
        if(distance>0) reformFlippingDivLeft('.flip-top', rs.w, rs.h, -angle, distance)
        else reformFlippingDivRight('.flip-top', rs.w, rs.h, -angle, distance)
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
            console.log('done')
            _easing = false;
        }
    }

    function inRect(x,y,ox,oy,width,height) {
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

        if (inRect(x, y, o.left, o.top, _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'top-left'
        }
        else if (inRect(x, y, o.left, o.top + _container.height() - _w * _edge, _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'bottom-left'
        }
        else if (inRect(x, y, o.left + _container.width() - _w * _edge, o.top, _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'top-right'
        }
        else if (inRect(x, y, o.left + _container.width() - _w * _edge, o.top + _container.height() - _w * _edge, _w * _edge, _w * _edge)) {
            _startPoint = {x:x, y:y}
            _clickedEdge = 'bottom-right'
        }
    })

    $(document).bind('mouseup',function(ev){
        if(!_container) return
        if(!_startPoint) return
        ev.preventDefault()
        ev.stopPropagation()

        var dx = ev.pageX-_startPoint.x
        var dy = ev.pageY-_startPoint.y
        var angle = Math.atan2(dy, dx)
        var distance = Math.sqrt(dx*dx + dy*dy)/2
        if (distance<10) {
            switch(_clickedEdge) {
                case 'top-left':angle = 0.2;distance = 300;dx = 2*distance; dy=100;_startPoint.direction = 1;break;
                case 'top-right':angle = -0.2;distance = 300;dx = -2*distance; dy=100;_startPoint.direction = -1;break;
                case 'bottom-left':angle = -0.2;distance = 300;dx = 2*distance; dy=-100;_startPoint.direction = 1;break;
                case 'bottom-right':angle = 0.2;distance = 300;dx = -2*distance; dy=-100;_startPoint.direction = -1;break;
            }
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

        console.log('cancel',cancel, 'distance' , distance, 'angle', angle, 'dx', dx, 'dy', dy)

        // if cancel, back page to orgin. slowdown
        if(cancel) {
            equation = function(d, s) {
                return d-s*d
            }
        }


        ease(EasingFunctions.easeInOutQuad,
            function(step){
                console.log(angle-step*angle,equation(distance, step))
                reformFlipper(null, null, angle - step*angle, equation(distance, step))
            },function(done){
                console.log('done')
                endFlip(cancel, direction)
                _startPoint = undefined
                _edgeShown = false
            },duration,15, 0)
    })

    $(document).bind('mousemove',function(ev){
        if(!_container) return;
        if(_easing) return;

        var x = ev.pageX
        var y = ev.pageY
        var o = _container.offset()

        if (inRect(x, y, o.left, o.top, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            _edgeShown = true
            _edgeAngle = 45
            _edgeSize = _w * _edge / 1.414
            startFlip('#page3', '#page2', 'left')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left, o.top + _container.height() - _w * _edge, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            _edgeShown = true
            _edgeAngle = -45
            _edgeSize = _w * _edge / 1.414
            startFlip('#page3', '#page2', 'left')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left + _container.width() - _w * _edge, o.top, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            _edgeShown = true
            _edgeAngle = -45
            _edgeSize = -_w * _edge / 1.414
            startFlip('#page4', '#page5', 'right')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if (inRect(x, y, o.left + _container.width() - _w * _edge, o.top + _container.height() - _w * _edge, _w * _edge, _w * _edge)) {
            if(_edgeShown) return
            _edgeShown = true
            _edgeSize = -_w * _edge / 1.414
            _edgeAngle = 45
            startFlip('#page4', '#page5', 'right')
            easeEdge(_edgeAngle, function(step) { return _edgeSize * step})
        }
        else if(_startPoint) {
            var dx = ev.pageX-_startPoint.x
            var dy = ev.pageY-_startPoint.y
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
    })

    function zoom(zx, zy) {
        _container.css('transform', 'scale('+zx+','+zy+')')
    }

    return {
        make : make,
        startFlip : startFlip,
        reform : reformFlipper,
        ease : ease,
        made : made,
        replace : replace,
        zoom : zoom,
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

