(function ($){

    function calcPositionBetweenElem(elem1, elem2){
        var $posElem1 = $(elem1).offset();
        var $posElem2 = $(elem2).offset();
        var top = $posElem2.top - $posElem1.top;
        var left = $posElem2.left - $posElem1.left;      
        return { 'top' :top, 'left' :left};
    }
    //console.log(calcPositionBetweenElem($('.rocket-section .btn-plus-circle'),));
    $(window).ready(function(){
        $('.rocket-section .btn-plus-circle').on('click',function(){
            //console.log(calcPositionBetweenElem($(this),$currentContainer));
            $currentContainer = $(this).parent();
            $desc = $('.desc',$currentContainer);
            $timeAnimation = 1000; //1sec
            if(!$currentContainer.hasClass('opened')){
                var startPositionBtn = calcPositionBetweenElem($currentContainer,$(this));
                window.localStorage.setItem("top", startPositionBtn.top);
                window.localStorage.setItem("left", startPositionBtn.left);
            }
            $currentContainer.toggleClass('opened');
            if(!$currentContainer.hasClass('opened'))
            {
                $desc.removeClass('animated').addClass('fadeOutDown');
                $currentContainer.animate({
                    "max-width" : "270px",
                },$timeAnimation - 300);
                $(this).css('position','absolute');
                $(this).animate({
                    'top' : window.localStorage.getItem("top"),
                    'left' : window.localStorage.getItem("left"),
                    'right' : "unset"
                },$timeAnimation);
                $desc.addClass('animated');
                //setTimeout($desc.hide(),$timeAnimation + 100);
            }else{
                $desc.show().toggleClass('animated');
                $currentContainer.animate({
                    "max-width" : "470px",
                },$timeAnimation - 300);
                $(this).animate({
                    'top' : "15px",
                    'right' : "15px"
                },$timeAnimation);
            }
        });
    });

})(jQuery)