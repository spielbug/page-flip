/**
 * Created by spiel on 2017-03-18.
 */



var Flip = function(){
    var _w, _h, _flipper, _left, _right, _made;
    function make(container) {
        // metric
        container = $(container)
        var metricDiv = $('#page4')
        _w = metricDiv.width()
        _h = metricDiv.height()
        container.width(_w*2+5)
        container.height(_h)
        container.css({
            position : 'relative'
        })

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
                left:_w+'px',
            })
            container.append(_left)
            container.append(_right)
            makeFlipper(container)
            _made = true
        }

        // make child to have their wrapper and gradient
        var childs = container.children()
        var len=childs.length
        for(var i = 0; i<len; i++) {
            var child = $(childs[i])
            console.log(child,child.attr('class'))
            if(child.hasClass('side-left') || child.hasClass('side-right')
                || child.parent().hasClass('fb-wrapper') || child.attr('id')=='flipper') {
                console.log('this div will be ignored')
                continue

            }
            // make wrapper
            var wrapper=$('<DIV>').addClass('fb-wrapper')
            wrapper.css({
                position : 'absolute'
            })
            //_right.append(wrapper)
            child.appendTo(wrapper)
            wrapper.appendTo(container)
        }

        // move to side
        $('#page1,#page2,#page3').parent().appendTo('#side-left')
        $('#page4,#page5,#page6').parent().appendTo('#side-right')
        //$('#page3,#page4').css('visibility','visible')

        $(window).trigger('resize');
    }

    function made() {
        return _made
    }

    function makeFlipper(container) {
        if(!container.fn) container = $(container)
        // div for flipping
        _flipper = makeDiv(_w, _h, 'flipper')
        _flipper.css({
            'position':'absolute',
            //'left' : _w,
            'overflow':'hidden',
            'z-index' : 3
        })
        container.append(_flipper)
    }

    function makeDiv(w, h, id) {
        var div = $('<div>')
        div.attr('id', id)
        div.width(w)
        div.height(h)
        return div
    }

    function startFlip(div1, div2) {
        //div1 = div1.fn?div1:$(div1)
        //div2 = div2.fn?div2:$(div2)

        //if(!div1[0] || !div2[0]) throw 'no flip-bottom or flip-top'
        $('.flip-top').parent().appendTo(_flipper)
        $('.flip-bottom').parent().appendTo(_flipper)
        $('.flip-top').css('border','2px silver solid')

        $(window).trigger('resize');
    }

    function endFlip(div1, div2, cancel, direction) {
        div1 = div1.fn?div1:$(div1)
        div2 = div2.fn?div2:$(div2)

        div1.parent().css({
            transform:'',
            left:'0',
            top:'0',
        })

        div2.parent().css({
            transform:'',
            left:'0',
            top:'0',
        })

        $('.gradient').css({
            background : ''
        })

        _flipper.css({
            transform : ''
        })

        $('#page1,#page2,#page3').parent().appendTo('#side-left')
        $('#page4,#page5,#page6').parent().appendTo('#side-right')

        $('#page1,#page2,#page3,#page4,#page5,#page6').removeClass('flip-bottom')
        $('#page1,#page2,#page3,#page4,#page5,#page6').removeClass('flip-top')

        //$('#page1,#page2,#page5,#page6').css('visibility','hidden')
        $('.flip-top').css('border','')

        if(!cancel) {

            if(direction==-1) ViewerManager.pageLoading(
                ViewerManager.PAGE_CURRENT_NUMBER+2,
                ViewerManager.PAGE_TOTAL_NUMBER
            )
            else if(direction==1) ViewerManager.pageLoading(
                ViewerManager.PAGE_CURRENT_NUMBER-2,
                ViewerManager.PAGE_TOTAL_NUMBER
            )
        }
        else {
            $(window).trigger('resize')
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
        if(pageWidth>_w) distance = Math.sign(distance) * _w * Math.abs(Math.cos(angle))

        var fPos = {}
        if(distance > 0) {
            fPos.left = _left.css('left').replace('px','')
            fPos.top = _left.css('top').replace('px','')
        }
        else {
            fPos.left = _right.css('left').replace('px','')
            fPos.top = _right.css('top').replace('px','')

        }

        var fLeft = (fPos.left-(rs.w-_w)/2)
        var fTop = (fPos.top-(rs.h-_h)/2)
        console.log(fLeft, fTop)
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
            'width': _w,
            'height': _h,
            'z-index':1,
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
            'z-index':2,
            'width': _w,
            'height': _h,
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
//console.log(distance, rcx, fdLeft)
        if(angle<0) {
            fdTop = topMargin*2+fdTop
            rcy = _h;
        }

        var wrapper = div.parent()
        wrapper.css({
            'z-index':2,
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
                background : 'linear-gradient('+(angle-Math.PI/2)+'rad, transparent 0px, transparent '+(distance-150)
                +'px, rgba(0,0,0,0.2) '+(distance-50)+'px, transparent '+(distance)+'px)'
            })
        }
        else {
            g.css({
                background : 'linear-gradient('+(angle+Math.PI/2)+'rad, transparent 0px, transparent '+(-distance-150)
                +'px, rgba(0,0,0,0.2) '+(-distance-50)+'px, transparent '+(-distance)+'px)'
            })
        }
    }

    function ease(easeFunc, stepFunc, endFunc,
                  msec, interval, startValue) {

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
        }
    }

    //make('#fb')

    var startPoint=undefined;
    $('#fb-control').on('mousedown',function(ev){
        console.log(ev.pageX, ev.pageY)
        if(!_left|!_right) return
        ev.preventDefault()
        ev.stopPropagation()
        var x = ev.pageX
        var lx =  _left.offset().left
        var rx =  _right.offset().left

        console.log(x,lx,rx)
        if(x > lx && x < rx) {
            startPoint = {x:ev.pageX, y:ev.pageY, direction:1}
            console.log('left clicked')
//                $('#page1,#page2').css('visibility','visible')
            $('#page2').addClass('flip-top')
            $('#page3').addClass('flip-bottom')
            startFlip('.flip-bottom','.flip-top')
        }
        else if(x > rx && x < 2*rx-lx) {
            startPoint = {x:ev.pageX, y:ev.pageY, direction:-1}
            console.log('right clicked')
//                $('#page5,#page6').css('visibility','visible')
            $('#page4').addClass('flip-bottom')
            $('#page5').addClass('flip-top')
            startFlip('.flip-bottom','.flip-top')
        }
        else return;
    })
    $('#fb-control').on('mousemove',function(ev){
        ev.preventDefault()
        ev.stopPropagation()
        //console.log('control',ev.pageX,ev.pageY)
        if(startPoint) {
            //ev.preventDefault()
            //ev.stopPropagation()
            var dx = ev.pageX-startPoint.x
            var dy = ev.pageY-startPoint.y
            var angle = Math.atan2(dy, dx)
            var distance = Math.sqrt(dx*dx + dy*dy)*2
            if(dx==0) return;

            if(startPoint.direction) {
                if(startPoint.direction * dx < 0) return;
            }
            else {
                startPoint.direction = dx>0?1:-1
            }

            if(dx<0) {
                distance=-distance
                angle = Math.atan2(-dy, -dx)
            }
            reformFlipper(_w, _h, angle, distance)
        }
        //return false;
    })
    $('#fb-control').on('mouseup',function(ev) {
        if(startPoint) {
            ev.preventDefault()
            ev.stopPropagation()

            var dx = ev.pageX-startPoint.x
            var dy = ev.pageY-startPoint.y
            var angle = Math.atan2(dy, dx)
            var distance = Math.sqrt(dx*dx + dy*dy)*2
            var cancel = (distance<300)
            console.log('-------------- cancel',cancel, distance)

            if(dx<0) {
                distance=-distance
                angle = Math.atan2(-dy, -dx)
            }

            var direction = startPoint.direction
            startPoint = undefined;
            var equation = function(d, s) {
                d=Math.abs(d)
                return direction*(d+s*(2*_w-d))
            }
            if(cancel) equation = function(d, s) {
                return d-s*d

            }


            ease(EasingFunctions.easeInOutQuad,
                function(step){
                    //console.log(angle-step*angle,distance-step*distance)
                    reformFlipper(null, null, angle-step*angle, equation(distance, step))
                },function(done){
                    console.log('done')
                    endFlip('.flip-bottom', '.flip-top', cancel, direction)
                    startPoint = undefined
                },500,15, 0)

        }

    })

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
    return {
        make : make,
        startFlip : startFlip,
        reform : reformFlipper,
        ease : ease,
        made : made
    }
}
