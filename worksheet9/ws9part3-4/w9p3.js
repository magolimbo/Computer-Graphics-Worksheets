var shadowMap;
var g_tex_ready = 0;
var lightAnimationActive = true;
var isShadow = false;

var lightPos; 
var modelAnimationActive = true;
var delta_teapot = 0.01;
var tran = -0.5;
var go_up = true;

var texCoordsArray = [ ];  //to hold the texture coordinates
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

    gl.clearColor(0.3, 0.3, 0.8, 1.0); // color the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.program_ground = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.program_teapot = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.program_shadowmap = initShaders(gl, "vertex-shader-fbo", "fragment-shader-fbo");
    gl.useProgram(gl.program_shadowmap);

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

    quad(0, 1, 2, 3,  vertices, texCoord);

    //VERTEX BUFFER
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    vertexBuffer.num = 3;
    vertexBuffer.type = gl.FLOAT;
    //position attribute
    var vPosition = gl.getAttribLocation(gl.program_ground, "vPosition"); 

    /* TEXTURE 1 */
    var marble = new Image();
    marble.src = "../xamp23.png";
    gl.activeTexture(gl.TEXTURE1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var ground_texture = gl.createTexture();  ///load 2D texture object
    marble.crossorigin = 'anonymous';
    marble.textarget = gl.TEXTURE_2D;
    marble.onload = function(event)
    {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, ground_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, marble);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Use LINEAR for better minification
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ++g_tex_ready;
    };

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
    P = perspective(fov, aspect, near, far);
    
    var theta    = 0.0;

    var filename = '../teapot.obj';    //teapot
    var model    = initObject(gl, filename, 0.35);  //scale to 1/4

    var shadow_m = mat4(); //shadow projection matrix
    shadow_m[3][3] = 0.0;

    //initialize FBO
    var fbo = initFramebufferObject(gl, canvas.width, canvas.height);
    //console.log(fbo);
    renderAll();

    function createShadowMap(){
        gl.useProgram(gl.program_shadowmap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //set uniforms
        var VLoc = gl.getUniformLocation(gl.program_shadowmap, "V");
        gl.uniformMatrix4fv(VLoc, false, flatten(V));
            //projection matrix
        var PLoc = gl.getUniformLocation(gl.program_shadowmap, "P");
        gl.uniformMatrix4fv(PLoc, false, flatten(P));
            //model matrix
        var MLoc = gl.getUniformLocation(gl.program_shadowmap, "M");
        gl.uniformMatrix4fv(MLoc, false, flatten(mat4()));
        //ground
        initAttributeVariable(gl, gl.program_shadowmap.vPosition, vertexBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        //object
        initAttributeVariable(gl, gl.program_shadowmap.vPosition, model.vertexBuffer);   
        if(!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
            g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        }
        if(!g_drawingInfo) {
            return;
        }
        gl.uniformMatrix4fv(MLoc, false, flatten(M));
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
        shadowMap = fbo.texture;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function renderGround(){
        gl.useProgram(gl.program_ground);
        rotateLight();
        if(g_tex_ready > 0){
            initAttributeVariable(gl, vPosition, vertexBuffer);
            initAttributeVariable(gl, vTexCoord, tBuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
            gl.uniform1i(gl.getUniformLocation(gl.program_ground, "shadowMap"), 0);
            
            //view matrix
            var VLoc = gl.getUniformLocation(gl.program_ground, "V");
            gl.uniformMatrix4fv(VLoc, false, flatten(V));
            //projection matrix
            var PLoc = gl.getUniformLocation(gl.program_ground, "P");
            gl.uniformMatrix4fv(PLoc, false, flatten(P));
            //model matrix
            var MLoc = gl.getUniformLocation(gl.program_ground, "M");
            gl.uniformMatrix4fv(MLoc, false, flatten(mat4()));

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, ground_texture);
            gl.uniform1i(gl.getUniformLocation(gl.program_ground, "groundTex"), 1);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
       }
    }

    function renderObject(){
        gl.useProgram(gl.program_teapot);
        initAttributeVariable(gl, gl.program_teapot.vPosition, model.vertexBuffer); 
        initAttributeVariable(gl, gl.program_teapot.vNormal, model.normalBuffer);
        initAttributeVariable(gl, gl.program_teapot.vColor, model.colorBuffer);  

        VLoc  = gl.getUniformLocation(gl.program_teapot, "V");
        gl.uniformMatrix4fv(VLoc, false, flatten(V));

        var mLoc = gl.getUniformLocation(gl.program_teapot,"M");
        gl.uniformMatrix4fv(mLoc, false, flatten(M));

        PLoc  = gl.getUniformLocation(gl.program_teapot, "P");
        gl.uniformMatrix4fv(PLoc, false, flatten(P));

        gl.uniform1f(gl.getUniformLocation(gl.program_teapot,'isShadow'), 0.0); //set isShadow to false

        if(!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
            g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        }
        if(!g_drawingInfo) {return;}
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
    }

    function updateTeapotPosition(){
        if (modelAnimationActive){
            if (go_up) {
                tran += delta_teapot;
            } else {
                tran -= delta_teapot;
            }
            M = translate(0,tran,-3);

            if (tran > 0.5 || tran <= -1.0){
                go_up = !go_up;
            }
        }
        else {
            M = translate(0,tran,-3);
        }
    }

    function renderAll(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        rotateLight();
        updateViewMat();
        updateTeapotPosition();

        createShadowMap();
        gl.useProgram(gl.program_ground);
        var lightPMat = gl.getUniformLocation(gl.program_ground, "Pl");
        gl.uniformMatrix4fv(lightPMat, false, flatten(P));

        var lightVMat = gl.getUniformLocation(gl.program_ground, "Vl");
        gl.uniformMatrix4fv(lightVMat, false, flatten(V));

        V = lookAt(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0));
        
        renderGround();
        renderObject();

        requestAnimationFrame(renderAll);
    }

    function rotateLight(){
        if(lightAnimationActive){
            theta += 0.005;
            if (theta > 2*Math.PI) {
                theta -= 2*Math.PI;
            }
            lightPos = vec4(2*Math.sin(theta), 2, 2*Math.cos(theta) -2);
        }
    }

   function updateViewMat(){
        eye = vec3(lightPos[0], lightPos[1], lightPos[2]);
        at  = vec3(0, -1, -3);
        up  = vec3(0.0, 1.0, 0.0);
        V   = lookAt(eye, at, up);
   }
}

function initFramebufferObject(gl, width, height)
{
    var framebuffer = gl.createFramebuffer(); 
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer(); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    var shadowMap = gl.createTexture();   //texture to which i need to render
    gl.activeTexture(gl.TEXTURE0); 
    gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) { 
        console.log('Framebuffer object is incomplete: ' + status.toString()); 
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width  = width; 
    framebuffer.height = height;
    return framebuffer;
}

function quad(a, b, c, d, v_array, t_coords)
{
    pointsArray.push(v_array[a]);
    texCoordsArray.push(t_coords[0]);

    pointsArray.push(v_array[b]);
    texCoordsArray.push(t_coords[1]);

    pointsArray.push(v_array[c]);
    texCoordsArray.push(t_coords[2]);

    pointsArray.push(v_array[a]);
    texCoordsArray.push(t_coords[0]);

    pointsArray.push(v_array[c]);
    texCoordsArray.push(t_coords[2]);

    pointsArray.push(v_array[d]);
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

    return drawingInfo;
}

function initAttributeVariable(gl, attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}
