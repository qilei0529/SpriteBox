

var Sprite = {
    init : function(){
        this.sprite = require('./lib/sprite');
        this._count = 0;
        this._result = null;
    },

    // push files
    push : function(files){
        var img = document.querySelector('#J_img');
        var code = document.querySelector('#J_code');
        var count = this._count;
        var _this = this;
        var call = function(e){
            var width  = e.properties.width;
            var height = e.properties.height;
            console.log(e);
            img.innerHTML = '<img src="tmp/sprite.png?v'+ count +'" width="'+ width +'" height="'+ height +'" >';
            code.innerHTML = e.cssStr;
            _this._result = e;
        };

        var err = function(e){
            console.log('error' , e);
            code.innerHTML = e.message;
        }

        this.S = this.sprite({
            files   : files,
            padding : 10,
            scale   : 2,
            // tmp     : true,
            cb      : call,
            error   : err,
            template: 'rem'
        });

        this._count++;

        img.innerHTML = '';

        this._code = code;
    },

    // switch rem
    rem : function(flag){
        var S = this.S;
        var result = this._result;
        console.log('rem' ,flag);
        var cssStr;
        var code = this._code;
        
        var call = function(e){
            code.innerHTML = e.cssStr;
        }
        if(result){
            S.css({
                rem : flag,
                cb  : call
            });
        }
    }
};



var Box = {
    init :function(){
        var box = document.querySelector('#J_drag_box');

        window.ondragover = function(e){
            e.preventDefault();
            box.className = "drag_box hover";
            return false;
        }

        window.ondragleave = function(e){
            box.className = "drag_box";
            return false;
        }


        window.ondrop = function(e){
            //  hello func
            e.preventDefault();

            box.className = "drag_box";

            var files = e.dataTransfer.files;
            var len = files.length;

            var images = [];

            for (var i =  0; i < len; ++i) {
                // console.log(files[i].path);
                images.push(files[i].path);
            }

            Sprite.push(images);
            return false;
        }
    }
}

Body = {
    init : function(){
        this.init_img();
        this.init_rem();
    },

    init_img : function(){
        var body = document.querySelector('.body');
        var img = document.querySelector('#J_img');
        var flag = true;
        img.addEventListener('click' ,function(){
            if (flag) {
                body.className = 'body dark';
            }else{
                body.className = 'body';
            };
            flag = !flag;
        });
    },

    init_rem : function(){
        var rem = document.querySelector('#J_rem');

        var flag = true;
        rem.addEventListener('click' ,function(){
            if (flag) {
                rem.className = 'rem on';
            }else{
                rem.className = 'rem';
            };
            Sprite.rem(flag);
            flag = !flag;
        });
        
    }
}

Sprite.init();
Box.init();
Body.init();




