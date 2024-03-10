var g_tex_ready = 0;
var lightAnimationActive = true;
var isShadow = false;

var modelAnimationActive = true;
var delta_teapot = 0.03;
var tran = -0.5;
var go_up = true;

var texCoordsArray = [ ];  //to hold the texture coordinates
var colorsArray    = [ ];
var pointsArray    = [ ];
var texCoord = [     //this array is to hold the texture coordinates at the  corners of the rectangle
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0)
];

var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

window.onload = function init() {
    var canvas = document.getElementById("canvas");
    var gl = WebGLUtils.setupWebGL(canvas, {alpha: false});
    if (!gl) {
        console.error("WebGL not supported, falling back on experimental-webgl");
        gl = canvas.getContext("experimental-webgl");
    }
    if (!gl) {
        alert("Your browser does not support WebGL");
    }
    var ext = gl.getExtension('OES_element_index_uint');
    if(!ext){
        console.log('Warning: unable to use extension');
    }

    gl.clearColor(0.0, 0.0, 0.3, 1.0); // color the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.program_ground = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.program_teapot = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.useProgram(gl.program_ground);

    var toggleLight = document.getElementById("toggleLightButton");
    toggleLight.addEventListener("click", function(ev){
        lightAnimationActive = !lightAnimationActive;
        console.log(lightAnimationActive);
    });

    var toggleTeapot = document.getElementById("toggleTeapotMovement");
    toggleTeapot.addEventListener("click", function(ev){
        modelAnimationActive = !modelAnimationActive;
        console.log(modelAnimationActive);
    });

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST); //enable depth testing
    gl.enable(gl.BLEND); //enable blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var vertices = [   //GROUND!!
        vec3(-2, -1, -1),
        vec3(2, -1, -1),
        vec3(2, -1, -5),
        vec3(-2, -1, -5), 
    ];

    var vertexColors = [    //GROUND COLORS , not really useful
        vec4(0.0, 0.0, 0.0, 1.0), 
        vec4(0.0, 0.0, 0.0, 1.0), 
        vec4(0.0, 0.0, 0.0, 1.0), 
        vec4(0.0, 0.0, 0.0, 1.0),  
    ]; 

    quad(0, 1, 2, 3,  vertices, vertexColors, texCoord);

    //VERTEX BUFFER
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    vertexBuffer.num = 3;
    vertexBuffer.type = gl.FLOAT;
    //position attribute
    var vPosition = gl.getAttribLocation(gl.program_ground, "vPosition"); 

    /* TEXTURE 0 */
    var ground = new Image();
    ground.src = "../xamp23.png";
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var ground_texture = gl.createTexture();  ///load 2D texture object
    ground.crossorigin = 'anonymous';
    ground.textarget = gl.TEXTURE_2D;
    ground.onload = function(event)
    {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ground_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, ground);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Use LINEAR for better minification
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ++g_tex_ready;
    };
    gl.uniform1i(gl.getUniformLocation(gl.program_ground, "groundTex"), 0);

    var tBuffer = gl.createBuffer();   //do not need this ???
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
    tBuffer.num = 2;
    tBuffer.type = gl.FLOAT;
    var vTexCoord = gl.getAttribLocation(gl.program_ground, "vTexCoord");

    var eye; var at; var up;  //for the view matrix
    var aspect = canvas.width / canvas.height;
    var fov    = 90;
    var near   = 0.1;
    var far    = 100.0;
    var V; var P; var M;

    //point light
    var lightPos = vec3(2, 2, -2);
    var theta    = 0.0;
    var lightPosLoc = gl.getUniformLocation(gl.program_ground, "lightPos");
    gl.uniform3fv(lightPosLoc, flatten(lightPos));

    var filename = '../teapot.obj';    //teapot
    var model    = initObject(gl, filename, 0.15);  //scale 

    var shadow_m = mat4(); //shadow projection matrix
    shadow_m[3][3] = 0.0;
    shadow_m[3][1] = -1.0/(lightPos[1]-(-1.0));

    var modelPos = mult(scalem(1,1,1), translate(0, -0.3, -2.5));

    renderAll();

    function renderGround(){
        gl.useProgram(gl.program_ground);
        rotateLight();
        M = mat4();
        if(g_tex_ready > 0){
            initAttributeVariable(gl, vPosition, vertexBuffer);
            initAttributeVariable(gl, vTexCoord, tBuffer);

            gl.uniform1f(gl.getUniformLocation(gl.program_ground, "isShadow"), 0.0); // Set isShadow to false
            //view matrix
            eye = vec3(0, 0, 0);
            at  = vec3(0, 0, -1);
            up  = vec3(0.0, 1.0, 0.0);
            V   = lookAt(eye, at, up);
            var VLoc = gl.getUniformLocation(gl.program_ground, "V");
            gl.uniformMatrix4fv(VLoc, false, flatten(V));
            //projection matrix
            P = perspective(fov, aspect, near, far);
            var PLoc = gl.getUniformLocation(gl.program_ground, "P");
            gl.uniformMatrix4fv(PLoc, false, flatten(P));
            //model matrix
            M = scalem(1, 1, 1);
            var MLoc = gl.getUniformLocation(gl.program_ground, "M");
            gl.uniformMatrix4fv(MLoc, false, flatten(M));

            gl.uniform1i(gl.getUniformLocation(gl.program_ground, "groundTex"), 0);
            /*
            //shadows
            gl.uniform1f(gl.getUniformLocation(gl.program_ground, "isShadow"), 1.0); // Set isShadow to true
            modelPos = mult(modelPos, translate(lightPos[0], lightPos[1], lightPos[2]));
            modelPos = mult(modelPos, shadow_m);
            modelPos = mult(modelPos, translate(-lightPos[0], -lightPos[1], -lightPos[2]));
            gl.uniformMatrix4fv(MLoc, false, flatten(modelPos));
            gl.uniform1i(gl.getUniformLocation(gl.program_ground, "groundTex"), 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 6, 6);
            gl.drawArrays(gl.TRIANGLE_FAN, 12, 6);
            gl.uniform1f(gl.getUniformLocation(gl.program_ground, "isShadow"), 0.0); // Set isShadow to false
            M = scalem(1, 1, 1);
            */
            gl.drawArrays(gl.TRIANGLES, 0, 6);
       }
    }

    function renderObject(){
        gl.useProgram(gl.program_teapot);
        initAttributeVariable(gl, gl.program_teapot.vPosition, model.vertexBuffer); 
        initAttributeVariable(gl, gl.program_teapot.vNormal, model.normalBuffer);
        initAttributeVariable(gl, gl.program_teapot.vColor, model.colorBuffer);  
        updateTeapotPosition();

        eye = vec3(0, 0, 0);
        at  = vec3(0, 0, -1);
        up  = vec3(0.0, 1.0, 0.0);
        V   = lookAt(eye, at, up);

        VLoc  = gl.getUniformLocation(gl.program_teapot, "V");
        gl.uniformMatrix4fv(VLoc, false, flatten(V));

        P = perspective(45, 1, 0.1, 200.0); 
        PLoc  = gl.getUniformLocation(gl.program_teapot, "P");
        gl.uniformMatrix4fv(PLoc, false, flatten(P));

        modelPos = M;

        if(!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
            g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        }
        if(!g_drawingInfo) {return;}

        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
    }

    function updateTeapotPosition(){
        if (modelAnimationActive){
            if (go_up) {
                tran += delta_teapot;
            } else {
                tran -= delta_teapot;
            }
            var mLoc = gl.getUniformLocation(gl.program_teapot,'M');
            M = translate(0,tran,-2.5);
            //console.log(M);
            gl.uniformMatrix4fv(mLoc, false, flatten(M));

            if (tran > 0.5 || tran <= -0.5){
                //console.log(tran);
                go_up = !go_up;
            }
        }
        else {
            var mLoc = gl.getUniformLocation(gl.program_teapot,'M');
            M = translate(0,tran,-2.5);
            gl.uniformMatrix4fv(mLoc, false, flatten(M));
        }
    }

    function renderAll(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        rotateLight();
        renderObject();
        renderGround();
        requestAnimationFrame(renderAll);
    }

    function rotateLight(){
        if(lightAnimationActive){
            theta += 0.1;
            if (theta > 2*Math.PI) {
                theta -= 2*Math.PI;
            }
            lightPos[0] = 2.0 * Math.sin(theta);
            lightPos[2] = 2.0 * Math.cos(theta);
        }
    }
}

function quad(a, b, c, d, v_array, vc_array, t_coords)
{
    pointsArray.push(v_array[a]);
    colorsArray.push(vc_array[a]);
    texCoordsArray.push(t_coords[0]);

    pointsArray.push(v_array[b]);
    colorsArray.push(vc_array[b]);
    texCoordsArray.push(t_coords[1]);

    pointsArray.push(v_array[c]);
    colorsArray.push(vc_array[c]);
    texCoordsArray.push(t_coords[2]);

    pointsArray.push(v_array[a]);
    colorsArray.push(vc_array[a]);
    texCoordsArray.push(t_coords[0]);

    pointsArray.push(v_array[c]);
    colorsArray.push(vc_array[c]);
    texCoordsArray.push(t_coords[2]);

    pointsArray.push(v_array[d]);
    colorsArray.push(vc_array[d]);
    texCoordsArray.push(t_coords[3]);
}

function initObject(gl, obj_filename, scale){
    gl.program_teapot.vPosition = gl.getAttribLocation(gl.program_teapot, 'vPosition');
    gl.program_teapot.vNormal   = gl.getAttribLocation(gl.program_teapot, 'vNormal');
    gl.program_teapot.vColor    = gl.getAttribLocation(gl.program_teapot, 'vColor');

    var model = initVertexBuffers(gl);

    readOBJFile(obj_filename, gl, model, scale, true);

    return model;
}

function initVertexBuffers(gl){
    var obj = new Object();
    obj.vertexBuffer = createEmptyArrayBuffer(gl, gl.program_teapot.vPosition, 3, gl.FLOAT);
    obj.vertexBuffer.num = 3;
    obj.vertexBuffer.type = gl.FLOAT;

    obj.colorBuffer  = createEmptyArrayBuffer(gl, gl.program_teapot.vColor, 4, gl.FLOAT);
    obj.colorBuffer.num = 4;
    obj.colorBuffer.type = gl.FLOAT;

    obj.normalBuffer = createEmptyArrayBuffer(gl, gl.program_teapot.vNormal, 3, gl.FLOAT);
    obj.normalBuffer.num = 3;
    obj.normalBuffer.type = gl.FLOAT;

    obj.indexBuffer  = gl.createBuffer();
    return obj;
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    buffer.num = num;
    buffer.type = type;
    return buffer;
}

function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to get file
    request.send(); // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
} 

function onReadComplete(gl, model, objDoc) {
// Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
// Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    
    console.log(drawingInfo.vertices.length);
    console.log(drawingInfo.normals.length);
    console.log(drawingInfo.colors.length);

    return drawingInfo;
}

function initAttributeVariable(gl, attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}
