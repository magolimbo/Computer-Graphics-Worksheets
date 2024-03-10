window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); //Returns the WebGL context which is a JavaScript object that contains all the WebGL functions and parameters
    if (!gl) {
        alert("WebGL isn’t available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //just sets the colour to clear the buffer to
    gl.clear(gl.COLOR_BUFFER_BIT); //actually clears the buffer/framebuffer

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    //Matrix
    var fovy = 90;
    var A = canvas.width / canvas.height
    var M = mat4();
    var V = mat4();
    // V = lookAt(vec3(0,0,0),vec3(1,1,1),vec3(0.0,1.0,0.0));
    var P = mat4();
    P = perspective(fovy, A, 0.001, 1000)

    

    function makeCheckerboard(texSize, numCols, numRows, myTexels) {
        for(var i = 0; i < texSize; ++i) {
            for(var j = 0; j < texSize; ++j){
            var patchx = Math.floor(i/(texSize/numRows));
            var patchy = Math.floor(j/(texSize/numCols));
            var c = (patchx%2 !== patchy%2 ? 255 : 0);
            var idx = 4*(i*texSize + j);
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
            myTexels[idx + 3] = 255;
            }
        }

    }
    

    var vertices = [
        vec3(-4,-1,-1),
        vec3(4,-1,-1),
        vec3(4,-1,-21),
        vec3(-4,-1,-21)
    ];

    var texCoord = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0)
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

   
    
    var texSize = 64*64;
    numCols = 8;
    numRows = 8;
    var myTexels = new Uint8Array(4*texSize*texSize);
    makeCheckerboard(texSize, numCols, numRows, myTexels);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    var Mloc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(Mloc, false, flatten(M));

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));
    //***************************************************** */
    gl.generateMipmap(gl.TEXTURE_2D);

    var wrap = document.getElementById("textureWrapMode");
    var filter = document.getElementById("textureFilterMode");

    wrap.addEventListener("click", function() {
        switch (wrap.selectedIndex) {
        case 0:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            render()
            break;
        case 1:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            render()
            break;
        }
    });


    filter.addEventListener("click", function() {
        switch (filter.selectedIndex) {
        case 0:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            render()
            break;
        case 1:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST + 1);
            render()
            break;
        case 2:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            render()
            break;
        case 3:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST+1);
            render()
            break;
        case 4:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST+2);
            render()
            break;
        case 5:
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST+3);
            render()
            break;
        }
    });


    function render() {

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
        // gl.drawElements(gl.LINES, vertices.length, gl.UNSIGNED_INT, 0);
    }

    render();
    

}