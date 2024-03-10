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
    var V = mat4();
    var eye = vec3(0.0, 0.0, 8);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    V = lookAt(eye,at,up);
    var P = mat4();
    P = perspective(45, A, 0.1, 1000)
    var theta = 0.0;
    
    
    var lightDiffuse = vec4(1.0, 0.0, 0.0, 1.0);
    var lightPosition = vec4(0.0, 0.0, 1.0, 0.0);
    var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0); // Kd

    var Mloc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(Mloc, false, flatten(M));

    var Vloc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(Vloc, false, flatten(V));

    var Ploc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(Ploc, false, flatten(P));


    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));


    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () { 
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST + 2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

        var numSubdivs = 5;
        var numVerts = initSphere(gl, numSubdivs);

        render(numVerts);
        
    };
    image.src = 'earth.jpg';
    

    function render(numVerts) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        theta += 0.02;
        eye = vec3(Math.cos(theta) * 5.0, 0.0, Math.sin(theta) * 5.0);
        V = lookAt(eye,at,up);

        gl.uniformMatrix4fv(Vloc, false, flatten(V));

        //gl.drawArrays(gl.TRIANGLES, 0, numVerts);
        for( var i=0; i<pointsArray.length; i+=3){
            gl.drawArrays( gl.TRIANGLES, i, 3 );
        }
        window.requestAnimFrame(render);
    }   
    
    
}


function initSphere(gl, numSubdivs) {
    console.log('numSubdivs=', numSubdivs)

    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0,         0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);
    pointsArray = [];
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
    // console.log('Dentro triangle', pointsArray)
    
}