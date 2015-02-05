
// Load in dependencies
var fs = require('fs');
var path = require('path');
var spritesmith = require('spritesmith');
var templater = require('spritesheet-templates');

var __app = './app/';

var S = {};

var Data = {};

var _Scale = 2;

var _open = false;

var _message = '';

var _time;

var _result;

var _cssCB;

var _coords;
var _coords_info;

var _path;
var _name;

var get_files = function( path ){
    var fileList = [],
        folderList = [],
        walk = function(path, fileList, folderList){
            files = fs.readdirSync(path);
            files.forEach(function(item) {  
                var tmpPath = path + '/' + item,
                    stats = fs.statSync(tmpPath);
                if (stats.isDirectory()) {  
                    // walk(tmpPath, fileList, folderList);
                    // folderList.push(tmpPath);
                } else {
                    if (is_png(tmpPath)) {
                        fileList.push(tmpPath); 
                    }else{
                        console.log('!png:' , tmpPath);
                    };
                }  
            });  
        };

    walk(path, fileList, folderList);

    console.log('search ' + path +' success');

    return {
        'files': fileList,
        'folders': folderList
    }
}

var is_dir = function(path){
    //  hello func
    var stats = fs.statSync(path);
    return stats.isDirectory();
}

var is_png = function(path){
    var reg = /png$/;
    return reg.test(path);
}

var check_files = function(){
    var d;
    var flag;

    d = Data.files[0];
    Data.path = path.dirname(d);
    Data.name = path.basename(d,'.png');
    console.log(Data.path, Data.name);

    //check if isDirectory
    if (Data.files.length == 1) {
        flag = is_dir(d);
        if (is_dir(d)) {
            console.log('is directory');
            var data = get_files(d);
            if(data.files.length == 0){
                _message = d + ' no png';
                return false;
            }
            Data.files = data.files;
        }else{
            console.log('not directory');
        };

        return true;
    };

    var len = Data.files.length;

    for(i = 0 ; i < len ; ++i){
        d = Data.files[i];
        if (is_dir(d)) {
            _message = d + ' is dir';
            return false;
        };

        if (!is_png(d)){
            _message = d + ' is not png';
            return false;
        }
    }

    return true;

}

var now_time = function(){
    var d = new Date();
    return d.getTime();
}


var map2x =  function (sprite) {
    var k = _Scale;
    sprite.total_width = sprite.total_width / k;
    sprite.total_height = sprite.total_height / k;
    sprite.x = sprite.x / k;
    sprite.y = sprite.y / k;
    sprite.width = sprite.width / k;
    sprite.height = sprite.height / k;
}

var sheet2x = function(data){
    var k = _Scale;
    data.width = data.width / k;
    data.height = data.height / k;
}

var do_css = function(){

    var coordinates = _result.coordinates;
    var properties  = _result.properties;
    var spriteName  = Data.name || 'sprite';  
    var spritePath  = spriteName + '.png';

    //for 2x
    sheet2x(properties);

    var spritesheetInfo = {
        width: properties.width,
        height: properties.height,
        image: spritePath,
        name : spriteName
    };

    var cssVarMap = Data.cssVarMap;
    var cleanCoords = [];

    // Clean up the file name of the file
    Object.getOwnPropertyNames(coordinates).sort().forEach(function (file) {
        // Extract the image name (exlcuding extension)
        var fullname = path.basename(file);
        var nameParts = fullname.split('.');

        // If there is are more than 2 parts, pop the last one
        if (nameParts.length >= 2) {
            nameParts.pop();
        }

        // Extract out our name
        var name = nameParts.join('.');
        var coords = coordinates[file];
        var k = _Scale;

        // Specify the image for the sprite
        coords.name = name;
        coords.source_image = file;
        // DEV: `image`, `total_width`, `total_height` are deprecated as they are overwritten in `spritesheet-templates`
        coords.image = spritePath;
        coords.total_width = properties.width /  k;
        coords.total_height = properties.height / k;

        // Map the coordinates through cssVarMap
        coords = cssVarMap(coords) || coords;

        // Save the cleaned name and coordinates
        cleanCoords.push(coords);
    });

    _coords = cleanCoords;
    _coords_info = spritesheetInfo;

    get_css();
}

var get_css = function(){

    // Render the variables via `spritesheet-templates`
    var cssFormat = Data.cssFormat;
    var cssTemplate = Data.cssTemplate;

    // If there's a custom template, use it
    if (cssTemplate) {
        cssFormat = 'spritesmith-custom';
        if (typeof cssTemplate === 'function') {
            templater.addTemplate(cssFormat, cssTemplate);
        } else {
            templater.addMustacheTemplate(cssFormat, fs.readFileSync(cssTemplate, 'utf8'));
        }
    }

    // console.log('coords' ,cleanCoords);

    var cssStr = templater({
        items: _coords,
        spritesheet: _coords_info
    }, {
        format: cssFormat,
        formatOpts: Data.cssOpts || {},
        spritesheetName: Data.cssSpritesheetName || 'sprite'
    });

    // console.log('cssStr' , cssStr);
    _result.cssStr = cssStr;


    if(Data.tmp){
        //create tmp folder
        init_tmp(Data.path + '/tmp/');
        p = Data.path + '/tmp/';
        var output = p + 'sprite.scss';
        fs.writeFileSync(output, cssStr, 'binary');
    }

    // css callback
    if(_cssCB){
        _cssCB(_result);
        _cssCB = null;
    }
}

var check_rem = function(flag){
    var path;
    if(flag){
        path = __app + 'lib/template/rem.template';
    }else{
        path = __app + 'lib/template/sass.template';
    }
    Data.cssTemplate = path;
}

S.init = function(c){
    _time = now_time();
    // console.log(c);
    Data = {};

    Data.cb         = c.cb || function(){};
    Data.files      = c.files || [];
    Data.padding    = c.padding || 10;

    Data.cssVarMap     = c.cssVarMap || map2x;
    Data.cssFormat     = c.cssFormat || 'scss';
    Data.cssTemplate   = c.cssTemplate || null;

    if (Data.cssTemplate == null) {
        check_rem(0);
    };

    Data.error  = c.error || function(){};

    _Scale = c.scale || 2;

    _open = check_files();

    Data.tmp        = c.tmp || false;
    if(Data.tmp){
        //create tmp folder
        init_tmp(Data.path + '/tmp/');
    }

};

S.sprite = function(){

    if(!_open){
        console.log('wrong files' , _message);
        Data.message = _message;
        Data.error(Data);
        return;
    }

    spritesmith({
        src: Data.files,
        algorithm: 'top-down',
        // engine: require('canvassmith'),
        padding: Data.padding * 2
    }, function handleResult (err, result) {
        // If there was an error, throw it
        // Output the image

        var p = __app + 'tmp/';
        var tmp = p + 'sprite.png';
        fs.writeFileSync(tmp, result.image, 'binary');

        var name = Data.name ? '-' + Data.name : '';


        if(Data.tmp){
            p = Data.path + '/tmp/';
            var output = p + 'sprite' + name + '.png';
            fs.writeFileSync(output, result.image, 'binary');
        }

        result.time = now_time() - _time;
        _result = result;
        do_css();
        Data.cb(result);
    })
}


S.css = function(c){
    var rem = c.rem || false;
    check_rem(rem);
    _cssCB  = c.cb || null;
    process.nextTick(get_css);
}

var sprite = function(c){
    S.init(c);
    process.nextTick(S.sprite);
    return S;
}

//create tmp fold
var init_tmp = function(p){
    fs.access(p , function(x){
        if(x){
            fs.mkdirSync(p);
            console.log('mkdir tmp');
        }
    });
}

init_tmp(__app + 'tmp/');

module.exports = sprite


