var points    = [];
var colors    = [];
var normals   = [];
var texCoords = [];
var numSubdivisions = 6;
var index = 0;
var colorAdd    = vec4(1.0, 0.5, 0.5, 0.0);
var texCoordAdd = vec2(0.5, 0.5);

var xPan = 0.0;
var yPan = 0.0;

var diff = 0.0;

// Create global variables for states
var dragging  = false; // Dragging or not
var dollyMode = false;
var panMode   = false;
var rotMode   = true;

var eye0 = vec3(0.0,0.0,-5.0);
var at0 = vec3(0.0,0.0,0.0);
var up0 = vec3(0.0,1.0,0.0);
var x0 = vec3(1.0,0.0,0.0);
var y0 = vec3(0.0,1.0,0.0);

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

    //view matrix:
    var eye = vec3(0, 0, -5);
    var at  = vec3(0, 0, 0);
    var up  = vec3(0.0, 1.0, 0.0);
    var V   = lookAt(eye, at, up);
    var VLoc = gl.getUniformLocation(program, "V");
    gl.uniformMatrix4fv(VLoc, false, flatten(V));
    //persperctive matrix
    var P = perspective(45, 1, 0.1, 10.0); 
    var PLoc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(PLoc, false, flatten(P));
    //model martrix
    var M1 = mat4();
    var MLoc = gl.getUniformLocation(program, "M");
    gl.uniformMatrix4fv(MLoc, false, flatten(M1));

    //initializing sphere
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);
    tetrahedron(numSubdivisions, va, vb, vc, vd);
    updateTexCoords();

    //coloring it red
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

    var q_rot = new Quaternion();
    var q_inc = new Quaternion();

    // Register the event handler
    initEventHandlers(canvas, q_rot, q_inc);

    var rotButton = document.getElementById("rot");
    var dollyButton = document.getElementById("dolly");
    var panButton = document.getElementById("pan");

    rotButton.addEventListener("click", function(event) { 
        rotMode = true;
        dollyMode = false;
        panMode = false;
    })
    dollyButton.addEventListener("click", function(event) { 
        rotMode = false;
        dollyMode = true;
        panMode = false;
    })
    panButton.addEventListener("click", function(event) { 
        rotMode = false;
        dollyMode = false;
        panMode = true;
    })
    

    function render(){
        updateViewMatrix();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
        requestAnimationFrame(render);
    }

    function updateViewMatrix(){        
        if (rotMode){
            up = vec3(q_rot.apply(up0));
            eye = add(vec3(q_rot.apply(eye0)),at);
            at = add(at, scale(-1.0, add(scale(xPan, vec3(q_rot.apply(x0)) ),scale(yPan , vec3(q_rot.apply(y0)) ))) );

        }
        else if (dollyMode) {
            if (eye0[2] + diff >= 0) {
                eye0[2] = 0;
            }
            else{
                eye0[2] += diff;
                diff = 0;
            }
            up = vec3(q_rot.apply(up0));
            eye = add(vec3(q_rot.apply(eye0)),at);
            at = add(at, scale(-1.0, add(scale(xPan, vec3(q_rot.apply(x0)) ),scale(yPan , vec3(q_rot.apply(y0)) ))) );

        }
        else if (panMode){
            up = vec3(q_rot.apply(up0));
            at = add(at, scale(-1.0, add(scale(xPan, vec3(q_rot.apply(x0)) ),scale(yPan , vec3(q_rot.apply(y0)) ))) );
            eye = vec3(q_rot.apply(eye0),at);
            xPan = 0; yPan = 0;
        }
        V = lookAt( eye, at, up);
        var VLoc = gl.getUniformLocation(program, "V");
        gl.uniformMatrix4fv(VLoc, false, flatten(V));
    }


    function tick(){
        updateViewMatrix(); 
        render();
        requestAnimationFrame(tick);
    }

    tick();
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

function project_to_sphere(x, y) {
    var r = 2;
    var d = Math.sqrt(x * x + y * y);
    var t = r * Math.sqrt(2);
    var z;

    if (d < r) { // Inside sphere
        z = Math.sqrt(r * r - d * d);
    } else if (d < t) {
        z = 0;
    } else {       // On hyperbola
        z = t * t / d;
    }
    return z;
}

function initEventHandlers(canvas, qrot, qinc) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse
  
    canvas.onmousedown = function (ev) {   // Mouse is pressed
      var x = ev.clientX, y = ev.clientY;
      // Start dragging if a mouse is in <canvas>
      var rect = ev.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        lastX = x; lastY = y;
        dragging = true;
      }
    };
  
    canvas.onmouseup = function (ev) {
      qinc.setIdentity();
      dragging = false;
    }; // Mouse is released
  
    canvas.onmousemove = function (ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var rect = ev.target.getBoundingClientRect();
            var s_x = ((x - rect.left) / rect.width - 0.5) * 2;
            var s_y = (0.5 - (y - rect.top) / rect.height) * 2;
            var s_last_x = ((lastX - rect.left) / rect.width - 0.5) * 2;
            var s_last_y = (0.5 - (lastY - rect.top) / rect.height) * 2;
            if (rotMode) {
                var v1 = vec3(s_x, s_y, project_to_sphere(s_x, s_y));
                var v2 = vec3(s_last_x, s_last_y, project_to_sphere(s_last_x, s_last_y));
                qinc = qinc.make_rot_vec2vec(normalize(v1), normalize(v2));
                qrot = qrot.multiply(qinc);
            }
            else if (dollyMode) {
                diff = 2*(s_y - s_last_y);
            }
            else if (panMode) {
                xPan = 2.0*(s_x - s_last_x);
                yPan = 0.5*(s_y - s_last_y);
            }  
        }
        lastX = x, lastY = y;
      };
  }


