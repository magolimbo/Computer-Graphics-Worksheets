var points    = [];
var colors    = [];
var normals   = [];
var texCoords = [];
var numSubdivisions = 6;
var index = 0;
var colorAdd    = vec4(1.0, 0.5, 0.5, 0.0);
var texCoordAdd = vec2(0.5, 0.5);

window.onload = function init(){
    var canvas = document.getElementById("canvas");
    var gl     = WebGLUtils.setupWebGL(canvas);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); 

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);

    var lightPosition = vec4(0.0, 0.0, 1.0, 0.0);
    var lightPosLoc = gl.getUniformLocation(program, "lightPosition");
    gl.uniform4fv(lightPosLoc, flatten(lightPosition));

    var lightDirLoc = gl.getUniformLocation(program, "lightDir");
    gl.uniform3fv(lightDirLoc, [1.0, 1.0, 1.0]);

    //transformation:
    var eye = vec3(0, 0, -5);
    var at  = vec3(0, 0, 0);
    var up  = vec3(0.0, 1.0, 0.0);

    var V    = lookAt(eye, at, up);
    var VLoc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(VLoc, false, flatten(V));

    var P = perspective(45, 1, 0.1, 10.0); 
    var PLoc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(PLoc, false, flatten(P));

    var S  = scalem(1, 1, 1);

    var M1 = S;
    var MLoc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(MLoc, false, flatten(M1));

    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(numSubdivisions, va, vb, vc, vd);
    updateTexCoords();

    var red_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, red_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.activeTexture(gl.TEXTURE0); 
    gl.bindTexture(gl.TEXTURE_2D, red_texture);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0); 

    var tBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW); 

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW); 

    var vPosition = gl.getAttribLocation(program, "vPosition"); 
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(vPosition);

    var currentAngle = [0.0, 0.0]; // [x-axis, y-axis] degrees

    var dragging = false;   //dragging or not
    var lastX    = -1;    //last coordinates of the mouse position
    var lastY    = -1;

    canvas.onmousedown = function(ev) {  //if mouse is pressed
        var x = ev.clientX, y = ev.clientY;
            //start dragging if a mouse is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x; lastY = y;
            dragging = true;
        }
    };

    canvas.onmouseup = function(ev) {
        dragging = false;
    };

    canvas.onmousemove = function(ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        } else {
            currentAngle[0] = 0;
            currentAngle[1] = 0;

        }
        lastX = x, lastY = y;
    };

    render();
    
    function updateViewMatrix() {
        //if(!dragging) {return;}  //dont change anything
        // Update view matrix for the camera orbit
        var Rx = rotateX(currentAngle[0]);   //x-axis
        var Ry = rotateY(currentAngle[1]);
        var R = mult(Rx, Ry);
        V = mult(V, R);
        VLoc = gl.getUniformLocation(program, "V");
        gl.uniformMatrix4fv(VLoc, false, flatten(V));
    }

    function render(){
        updateViewMatrix();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
        requestAnimationFrame(render);
    }
}

function triangle(a, b, c) {
    points.push(a, b, c);
    colors.push(colorAdd, colorAdd, colorAdd);

    normals.push(a[0], a[1], a[2]);
    normals.push(b[0], b[1], b[2]);
    normals.push(c[0], c[1], c[2]);

    index += 3;
}

function divideTriangle(a, b, c, count) {
    if (count === 0) {
        triangle(a, b, c);
    } else {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
}

function tetrahedron(count, a, b, c, d) {
    divideTriangle(a, b, c, count);
    divideTriangle(d, c, b, count);
    divideTriangle(a, d, b, count);
    divideTriangle(a, c, d, count);
}

function updateTexCoords() {
    for (let i = 0; i < points.length; i++) {
        var normal = normalize(points[i]. slice(0,3)); //normal extraction
        var u = 0.5 + Math.atan2(normal[0], normal[2]) / (2 * Math.PI);
        var v = 0.5 - Math.asin(normal[1]) / Math.PI;
        texCoords.push(vec2(u, v));
    }
}


