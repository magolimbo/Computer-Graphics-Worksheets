window.onload = function init() {
    var textureLoc1;
    var textureLoc2;
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas); //Returns the WebGL context which is a JavaScript object that contains all the WebGL functions and parameters
    if (!gl) {
        alert("WebGL isn’t available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //setta il colore con cui pulire il buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //actually clears the buffer/framebuffer

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.vBuffer = null;
    gl.nBuffer = null;

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    
    //Matrix
    var A = canvas.width/canvas.height
    var M = mat4();
    var V = mat4();
    var P = mat4();

    var eye = vec3(0.0, 0.0, 0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    V = lookAt(eye,at,up);

    P = perspective(90, 1.0, 0.1, 100)    

    var Mloc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(Mloc, false, flatten(M));

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    /* var lightPosition = vec4(0.0, 0.0, 1.0, 0.0);
    var Ld = vec4(1.0, 1.0, 1.0, 1.0); //light emission (Le)
    var kd = vec4(1.0, 1.0, 1.0, 1.0); //material diffuse reflection coefficient

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "Ld"), flatten(Ld));
    gl.uniform4fv(gl.getUniformLocation(program, "kd"), flatten(kd)); */


    var vertices = [
        //ground
        vec3(-2, -1, -1),
        vec3(2, -1, -1),
        vec3(2, -1, -5),
        vec3(-2, -1, -5),
        //q2
        vec3(0.25, -0.5, -1.25),
        vec3(0.75, -0.5, -1.25),
        vec3(0.75, -0.5, -1.75),
        vec3(0.25, -0.5, -1.75),
        //q1
        vec3(-1, -1, -2.5),
        vec3(-1, 0, -2.5),
        vec3(-1, 0, -3),
        vec3(-1, -1, -3)
      ];
      
      texCoords = [
        //ground
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1),
        //q1
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1),
        //q2
        vec2(-1, -1),
        vec2(-1, 1),
        vec2(1, 1),
        vec2(1, -1)
      ];
      
      var indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11];


    //vertex buffer
    gl.deleteBuffer(gl.vBuffer);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //texture coordinates buffer
    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var texPosition = gl.getAttribLocation(program, 'texPosition');
    gl.vertexAttribPointer(texPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texPosition);

    //indices buffer
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    //IMAGE TEXTURE
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.src = '../textures/xamp23.png';
    image.onload = function () { 
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        textureLoc1 = gl.getUniformLocation(program, "texture"); 
        gl.uniform1i(textureLoc1, 0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };


    //RED COLOR TEXTURE
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc2 = gl.getUniformLocation(program, "texture");
    gl.uniform1i(textureLoc2, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

       
        gl.uniform1i(textureLoc1, 0);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
        //gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.uniform1i(textureLoc2, 1);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6); 
    

        requestAnimFrame(render);
    }
    
    

    render();
    
    
}
