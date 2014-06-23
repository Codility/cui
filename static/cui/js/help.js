/* global Log */
var num_i = 0;
var helpActive = new Array(10);

/**
 * returns offset of the center of the element
 */
function center(id) {
    var offs=$(id).offset();
    if (!offs) return undefined;
    var w=$(id).width();
    var h=$(id).height();
    offs.left+=Math.round(w/2);
    offs.top+=Math.round(h/2);
    return offs;
}

function rightEdge(id) {
    var offs=$(id).offset();
    if (!offs) return undefined;
    var w=$(id).width();
    var h=$(id).height();
    offs.left+=w;
    offs.top+=Math.round(h/2);
    return offs;
}


function shift(pos, dx, dy) {
    if (pos===undefined) return undefined;
    return { left: pos.left + dx,
             top: pos.top + dy };
}

function computePos(pos, obj, orient) {
    var res = {};
    var PADDING = 20; // niestety obj.width()/obj.height() nie wlicza padding
    var EXTRA = 5;
    switch(orient) {
    case 'ur':
        res.left = pos.left + EXTRA;
        res.top = pos.top - obj.height() - PADDING - EXTRA;
        break;
    case 'ul':
        res.left = pos.left - obj.width() - PADDING - EXTRA;
        res.top = pos.top - obj.height() - PADDING - EXTRA;
        break;
    case 'lr':
        res.left = pos.left + EXTRA;
        res.top = pos.top + EXTRA;
        break;
    case 'll':
        res.left = pos.left - obj.width() - PADDING - EXTRA;
        res.top = pos.top + EXTRA;
        break;
    default: // center
        res.left = pos.left - Math.round(obj.width()/2);
        res.top = pos.top - Math.round(obj.height()/2);
    }
    return res;
}

function addToolTip(i, pos, orient) {
    num_i = num_i + 1;

    if (pos===undefined) return;
    Log.debug("addToolTip", "i="+i+" pos"+pos+" orient="+orient);

    helpActive[i]=num_i;

    var num_obj = $('#num'+num_i);
    var help_obj = $('#help'+i);

    // console.log("num_i="+num_i+" i="+i);

    if (!num_obj || !help_obj) return;

    var num_pos = computePos(pos, num_obj, 'c');
    var help_pos = computePos(pos, help_obj, orient);

    num_obj.css({left:num_pos.left,top:num_pos.top});
    help_obj.css({left:help_pos.left,top:help_pos.top});
}

function setupHelp() {
    Log.debug("setupHelp");
    var o_e = center('#edit');
    var o_t = shift(center('#task'),0,-40);
    var o_vb = shift(center('#verify_button'),0,40);
    var o_fb = shift(center('#final_button'),0,40);
    var o_res = shift(center('#quit_button'),60,-10);
    var o_prg = shift(rightEdge('#prg_lang_list'),-30,30);
    var o_close = shift($('#header').offset(),5,5);
    var o_r = shift(center('#test_case_img'),70,-30);
    o_vb = shift(o_vb,0,-80);
    o_fb = shift(o_fb,0,-80);
    o_res = shift(o_res,0,30);

    $('#help2').css({width: "150px"});
    $('#help4').css({width: "300px"});
    $('#help5').css({width: "300px"});
    $('#help6').css({width: "150px"});
    $('#help7').css({width: "250px"});

    num_i = 0;

    addToolTip('1',o_t,'ur');
    addToolTip('2',o_prg,'ll');
    addToolTip('3',o_e,'ul');


    if ($('#verify_button').css("display")!='none')
        addToolTip('4',o_vb,'ul');

    if ($('#run_button').css("display")!='none' &&
        $('#test_case_img').length>0)
        addToolTip('5',o_r,'ur');

    if ($('#final_button').css("display")!='none')
        addToolTip('6',o_fb,'ur');

    addToolTip('7',o_res,'ll');

    num_i = 7;
    addToolTip('8',o_close,'lr');
}

var helpbox_count = 8;

function hideHelp() {
    var i;
    for(i=1;i<=helpbox_count;i++) {
        $('#num'+i).fadeOut("fast");
        $('#help'+i).fadeOut("fast");
    }
    $("#overlay").fadeOut("fast");
}

function showHelp() {
  /* $(window).resize(function(){
    setupHelp();
    var h = $(document).height();
    if (!h) h=1024;
    $('#__dimScreen').css({height: h + 'px',width: '100%'});
  }); */
    var i;
    setupHelp();

    for(i=1;i<=helpbox_count;i++) {
        if (helpActive[i])
            $('#help'+i).css({display:"block",opacity:0});
    }

    $("#overlay").fadeTo("fast",0.5, function() {
        for(i=1;i<=helpbox_count;i++) $('#help'+i).css({display:"none",opacity:1});

        var speed=300;
        var j;

        for(i=1;i<=helpbox_count;i++) {
            if (!helpActive[i]) continue;
            j = helpActive[i];
            $('#num'+j).fadeIn(speed);
            $('#help'+i).fadeIn(speed);
        }

        $('#overlay').click(hideHelp);
        for(i=1;i<=helpbox_count;i++) {
            j = helpActive[i];
            $('#num'+j).click(hideHelp);
            $('#help'+i).click(hideHelp);
        }
    });
}
