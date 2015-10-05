

(function(window) {

    'use strict';

    var GLProgram = function (_settings, _scene) {
        // console.log('GLProgram');
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        
        this.type = "GLProgram";
        this.inRenderList = false;

        this.scene = _scene;
        this.gl =  this.scene.gl;
        // default settings
        this.settings = {
                renderMode: "TRIANGLE_STRIP"
            };
        
        // add passed in settings
        for(var _set in _settings) this.settings[_set] = _settings[_set];

        this.drawToCanvas = false;
        this.clearBuffer = (String(_settings.clearBuffer).toLowerCase() == "true")?true:false;
        
        //shaders
        this.vShader = {
            path: this.settings["vertexShader"]
        }

        this.fShader = {
            path: this.settings["fragmentShader"]
        }
    }

    function init(callBackFn){

        var function_arr =  [
                { fn: loadShader, vars: 'vShader' },
                { fn: loadShader, vars: 'fShader' },
                { fn: createProgram },
                { fn: setupUniforms },
                { fn: callBackFn }
            ];

        this.arrayExecuter.execute(function_arr);

    }

    function loadShader(type, callBackFn){
        console.log('loadShader: '+this[type].path);
        
        if(this.scene.data.library[this[type].path]){
            this[type].text = this.scene.data.library[this[type].path];
            callBackFn();
        } else {
            Aero.utils.XHRLoader(String(this[type].path).replace('~/', this.scene.dirPath), function (data){
                console.log(data);
                    this[type].text = data;
                    callBackFn();
                }.bind(this) );
        }
        
    }

    function createProgram(callBackFn){
        console.log('createProgram');

        var gl = this.gl;

        //create fragment shader
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fShader.text);
        gl.compileShader(fragmentShader);
        if(!checkCompile.call(this, gl, "2d-fragment-shader", fragmentShader))return;
        this.fShader.obj = fragmentShader;

        //create vertex shader
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vShader.text);
        gl.compileShader(vertexShader);
        if(!checkCompile.call(this, gl, "2d-vertex-shader", vertexShader))return;
        this.vShader.obj = vertexShader;

        //create shader program
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.log("Unable to initialize the shader program.");
        gl.useProgram(program);
        this.program = program;
        gl.program = program;

        callBackFn();
    }

    function setupUniforms(callBackFn){
        var gl = this.gl,
            uniformSettings = this.settings.uniforms,
            uniObj,
            u_loc,
            u_val,
            u_fn,
            u_apply;

        this.uniforms = [];
        this.inputs = {};
        
        for(var u in uniformSettings){
            uniObj = uniformSettings[u];
            u_loc = gl.getUniformLocation(this.program, u);
            // console.log('u_loc: '+u+' | '+u_loc);
            u_val = uniObj.val;

            switch(uniObj.type){
                case "f":
                case "1f":
                    u_fn = Aero.GLUploaders.uniform1f;
                    break;
                // case "1fv":
                //     u_fn = Aero.GLUploaders.uniform1fv;
                //     break;
                // case "1i":
                //     u_fn = Aero.GLUploaders.uniform1i;
                //     break;
                // case "1iv":
                //     u_fn = Aero.GLUploaders.uniform1iv;
                //     break;

                case "2f":
                    u_fn = Aero.GLUploaders.uniform2f;
                    break;
                // case "2fv":
                //     u_fn = Aero.GLUploaders.uniform2fv;
                //     break;
                // case "2i":
                //     u_fn = Aero.GLUploaders.uniform2i;
                //     break;
                // case "2iv":
                //     u_fn = Aero.GLUploaders.uniform2iv;
                //     break;

                case "3f":
                    u_fn = Aero.GLUploaders.uniform3f;
                    break;
                case "3m":
                    u_fn = Aero.GLUploaders.uniformMatrix3fv;
                    break;
                    
                case "4f":
                    u_fn = Aero.GLUploaders.uniform4f;
                    break;
                case "4m":
                    u_fn = Aero.GLUploaders.uniformMatrix4fv;
                    break;
                    
                case "t":
                    u_fn = Aero.GLUploaders.uniform1i;
                    break;

                default:
                    console.log("uniform type: "+uniObj.type+" not yet setup");
                    u_fn = false;
            }

            this.inputs[u] = u_val;
            this.uniforms.push({
                id: u,
                type: uniObj.type,
                loc: u_loc,
                fn: u_fn
            });
        }

        callBackFn();
    }

    function updateUniforms(){

        var gl = this.gl,
            u = this.uniforms.length,
            uObj;
        
        
        while(u--){
            uObj = this.uniforms[u];
            
            // if(this.id == 'height' && u == 1)console.log('updateUniforms! '+uObj.loc);
            if(uObj.fn)uObj.fn(gl, uObj.loc, this.inputs[uObj.id]);
        }
    }

    function render(){
        var gl = this.gl;

        gl.useProgram(this.program);
        gl.program = this.program;

        this.updateUniforms();

        gl.drawArrays(gl[this.settings.renderMode], 0, 4);
    }

    GLProgram.prototype.init = init;
    GLProgram.prototype.updateUniforms = updateUniforms;
    GLProgram.prototype.render = render;

    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLProgram = GLProgram;


/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////

UTILITY FUNCTIONS

*/ //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function checkCompile(gl, id, shader){
        var compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if(!compileStatus){
            console.log("Error compiling "+id+": " + this.gl.getShaderInfoLog(shader));
        }
        return compileStatus;
    }

}(window));
