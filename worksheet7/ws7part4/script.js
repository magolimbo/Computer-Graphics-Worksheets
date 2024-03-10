var pointsArray = [];
//var colorArray = [];
var normalsArray = [];


window.onload = function init() {
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
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.vBuffer = null;
    gl.nBuffer = null;

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    
    //Matrix
    var A = canvas.width/canvas.height
    var M = mat4();
    var mvMatrix = mat4();

    var eye = vec3(0.0, 0.0, 8);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    mvMatrix = lookAt(eye,at,up);

    var P = mat4();
    P = perspective(45, A, 1, 10)
    var theta = 0.0;
    

    /* var Mloc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(Mloc, false, flatten(M)); */

    var modelViewMatrixloc = gl.getUniformLocation(program, "modelView");
    //gl.uniformMatrix4fv(Vloc, false, flatten(V));

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));

    var texLoc = gl.getUniformLocation(program, "texMatrix");
    var eyeLoc = gl.getUniformLocation(program, "eye");
    var reflectLoc = gl.getUniformLocation(program, "reflective");
    
    var lightPosition = vec4(0.0, 0.0, 1.0, 0.0);
    var Ld = vec4(1.0, 1.0, 1.0, 1.0); //light emission (Le)
    var kd = vec4(1.0, 1.0, 1.0, 1.0); //material diffuse reflection coefficient
    
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "Ld"), flatten(Ld));
    gl.uniform4fv(gl.getUniformLocation(program, "kd"), flatten(kd));
    

    //background cube
    bg = [
        vec4(-1.0, -1.0, 0.999, 1.0),
        vec4( 1.0, -1.0, 0.999, 1.0),
        vec4( 1.0,  1.0, 0.999, 1.0),
        vec4(-1.0, -1.0, 0.999, 1.0),
        vec4( 1.0,  1.0, 0.999, 1.0),
        vec4(-1.0,  1.0, 0.999, 1.0)];
    
    bg.forEach(point => { pointsArray.push(point); });

    function loadNormalMapTexture(gl){
        gl.activeTexture(gl.TEXTURE1);
             var normaltex = gl.createTexture()
             var normalmap = document.createElement('img');
             normalmap.crossorigin = 'anonymous';
             gl.bindTexture(gl.TEXTURE_2D,normaltex)
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
             normalmap.onload = function (event) {
                 var normalmap = event.target;
                 gl.activeTexture(gl.TEXTURE1);
                 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, normalmap);
                 gl.generateMipmap(gl.TEXTURE_2D);
                 //++g_tex_ready;
    
             };
             var bumpMapLoc = gl.getUniformLocation(program, "bumpMap");
             gl.uniform1i(bumpMapLoc, 1);
    
             normalmap.src = '../textures/normalmap.png';
    }

    function initTexture(gl)
    {
        var cubemap = [
            '../textures/cm_left.png', // POSITIVE_X
            '../textures/cm_right.png', // NEGATIVE_X
            '../textures/cm_top.png', // POSITIVE_Y
            '../textures/cm_bottom.png', // NEGATIVE_Y
            '../textures/cm_back.png', // POSITIVE_Z
            '../textures/cm_front.png']; // NEGATIVE_Z

        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        for(var i = 0; i < 6; ++i) {
            var image = document.createElement('img');
            image.crossorigin = 'anonymous';
            image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            image.onload = function(event)
            {
                console.log("image uploaded")
                var image = event.target;
                gl.activeTexture(gl.TEXTURE0);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            };
        image.src = cubemap[i];
        }
        
        var texMapLoc = gl.getUniformLocation(program, "texMap"); 
        gl.uniform1i(texMapLoc, 0);
        loadNormalMapTexture(gl);
    }


    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        theta += 0.02;
        eye = vec3(Math.cos(theta) * 5.0, 0.0, Math.sin(theta) * 5.0);
        mvMatrix = lookAt(eye,at,up);
        gl.uniform3fv(eyeLoc, flatten(eye))

        gl.uniform1i(reflectLoc, false)
        gl.uniformMatrix4fv(modelViewMatrixloc, false, flatten(mat4()));
        gl.uniformMatrix4fv(texLoc, false, flatten(mult(inverse(mvMatrix), inverse(P))));
        gl.drawArrays(gl.TRIANGLES, 0, bg.length);

        gl.uniform1i(reflectLoc, true)
        gl.uniformMatrix4fv(modelViewMatrixloc, false, flatten(mult(P,mvMatrix)));
        gl.uniformMatrix4fv(texLoc, false, flatten(mat4()));
        gl.drawArrays(gl.TRIANGLES, bg.length, pointsArray.length - bg.length);

        //gl.drawArrays(gl.TRIANGLES, 0, numVerts);
        /* for( var i=0; i<pointsArray.length; i+=3){
            gl.drawArrays( gl.TRIANGLES, i, 3 );
        } */
        requestAnimFrame(render);
    }
    
    var numSubdivs = 5;
    initTexture(gl);
    var numVerts = initSphere(gl, numSubdivs);

    render();
    
    
}


function initSphere(gl, numSubdivs) {
    //console.log('numSubdivs=', numSubdivs)

    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0,         0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);
    //pointsArray = [];
    //colorArray = [];
    normalsArray = [];
    theta = 0;
    // console.log('pointsArray=',pointsArray)

    tetrahedron( va, vb, vc, vd, numSubdivs);

    gl.deleteBuffer(gl.normalBuffer);
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.deleteBuffer(gl.vBuffer);
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    /* gl.deleteBuffer(gl.cBuffer);
    gl.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(colorArray), gl.STATIC_DRAW);
    var cPosition = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition); */
    
    return pointsArray.length
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}



function divideTriangle(a, b, c, count) {
    // console.log(count)
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }else {
        triangle(a, b, c);
    }
}

function triangle(a, b, c){
    normalsArray.push(a[0], a[1], a[2], 0.0);
    normalsArray.push(b[0], b[1], b[2], 0.0);
    normalsArray.push(c[0], c[1], c[2], 0.0);

    //console.log(a,b,c)
    pointsArray.push(a);    
    pointsArray.push(b);
    pointsArray.push(c);
    //colorArray.push(a.map(element => (element * 0.5) + 0.5))
    //colorArray.push(b.map(element => (element * 0.5) + 0.5))
    //colorArray.push(c.map(element => (element * 0.5) + 0.5))
    
    
}

function extractInverseRotation(matrix) {
    if (matrix.length !== 4 || matrix[0].length !== 4) {
      console.error('La matrice deve essere 4x4.');
      return null;
    }
  
    // Estrai la parte rotazionale
    const rotationMatrix = [
      [matrix[0][0], matrix[0][1], matrix[0][2]],
      [matrix[1][0], matrix[1][1], matrix[1][2]],
      [matrix[2][0], matrix[2][1], matrix[2][2]],
    ];
  
    // Calcola l'inverso della parte rotazionale
    const inverseRotationMatrix = inverse(rotationMatrix);
  
    // Costruisci la matrice risultante
    const resultMatrix = [
      [inverseRotationMatrix[0][0], inverseRotationMatrix[0][1], inverseRotationMatrix[0][2], 0],
      [inverseRotationMatrix[1][0], inverseRotationMatrix[1][1], inverseRotationMatrix[1][2], 0],
      [inverseRotationMatrix[2][0], inverseRotationMatrix[2][1], inverseRotationMatrix[2][2], 0],
      [0, 0, 0, 0],
    ];
  
    return resultMatrix;
  }
  
  
  
  

