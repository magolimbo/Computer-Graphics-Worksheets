var pointsArray = []
var colorsArray = []
var normalsArray = []
var gl;
var program;
var numTimesToSubdivide = 0;
var vPosition;
var vColor;
var vNormal;
var vLoc;
//camera parameters
const radius = 3.0;
var alpha = 0.0;
var eRot
var rotation

var g_objDoc = null; // Info parsed from OBJ file
var g_drawingInfo = null; // Info for drawing the 3D model with WebGL
var model


window.onload = function init(){

    var canvas = document.getElementById("c"); 

    gl = canvas.getContext("webgl"); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.5, 0.6, 1.0);  //Si imposta il colore di sfondo del canvas
    
    var ext = gl.getExtension('OES_element_index_uint'); //OES_element_index_uint' che consente l'uso di indici non firmati a 32 bit.
    if(!ext){
        console.log('Warning: Unable tu use an extension');
    }    

    gl.enable(gl.DEPTH_TEST); //per garantire che si stia visualizzando la parte più vicina della superficie della sfera.
    gl.enable(gl.CULL_FACE); //per rimuovere le facce nascoste e migliorare l'efficienza.

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); 

    gl.vBuffer = null;
    gl.cBuffer = null;

    model = initObject(gl, '../suzanne.obj', 1) //getAttribLocation for position, normal, color + initVertexBuffer + readOBJfile

    //------------1 point perspective--------------------------------
    // Configura la matrice di vista (View Matrix)
    var eye = vec3(0.0,0.0,3.0); // Modifica la posizione verticale della telecamera
    var at = vec3(0.0,0.0,0); // Punto verso cui la telecamera è orientata (centro della sfera)
    var up = vec3(0.0,1.0,0.0); // Vettore "up" della telecamera 

    // Usa la funzione lookAt per configurare la matrice di vista
    var V = lookAt(eye, at, up);
    VLoc = gl.getUniformLocation(program,"V"); 
    gl.uniformMatrix4fv(VLoc,false, flatten(V));

    //configure perspective view (Projection Matrix)
    var fovy = 90.0;    // Campo visivo verticale di 45 gradi
    var aspect = 1.0;   // Rapporto di aspetto 1:1 (canvas quadrato)
    var near = 1;     // Distanza minima dalla telecamera
    var far = 100.0;    // Distanza massima dalla telecamera
    var P = perspective(fovy, aspect, near, far);
    var PLoc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(PLoc, false, flatten(P));

    //convert from model frame to world/view frame (model matrix)
    var M = mat4(1);
    var MLoc = gl.getUniformLocation(program,"M");
    gl.uniformMatrix4fv(MLoc,false, flatten(M));

    //configuration of light parameters
    var lightDirection = vec4(0.0, 0.0, 1.0, 0.0); // Distanza della luce (quarto parm. è w)
    var lightDirectionLoc = gl.getUniformLocation(program, "lightDirection");
    gl.uniform4fv(lightDirectionLoc, flatten(lightDirection));

    //sliders
    var Le = vec4(0.5, 0.5, 0.5, 0.5); //light emission
    var LeLoc = gl.getUniformLocation(program , "Le");
    gl.uniform4fv(LeLoc, flatten(Le));

    var kd = vec4(1.0, 1.0, 1.0, 1.0); //diffuse coefficient
    var kdLoc = gl.getUniformLocation(program , "kd");
    gl.uniform4fv(kdLoc, flatten(kd));

    var ka = vec4(0.4, 0.4, 0.4, 1.0); //ambient coefficient
    var kaLoc = gl.getUniformLocation(program, "ka");
    gl.uniform4fv(kaLoc, flatten(ka));

    var ks = vec4(1.0, 1.0, 1.0, 1.0); //specular coefficient
    var ksLoc = gl.getUniformLocation(program , "ks");
    gl.uniform4fv(ksLoc, flatten(ks));

    var s = 80.0; //shininess
    var sLoc = gl.getUniformLocation(program, "s");
    gl.uniform1f(sLoc, s);

    render();

    document.getElementById("sphereRotation").onclick = function(){
        if(!rotation){
            rotation = true;
        }
        else rotation = false;
        cameraRotation()
    };

    document.getElementById("slide_le").addEventListener("input", function(event) 
    { 
        Le = vec4(event.target.value,event.target.value,event.target.value,1.0);
        gl.uniform4fv(LeLoc, flatten(Le));
        render();
    });

    document.getElementById("slide_kd").addEventListener("input", function(event) 
    { 
        kd =  vec4(event.target.value,event.target.value,event.target.value,1.0); 
        gl.uniform4fv(kdLoc, flatten(kd));
        render();
    });

    document.getElementById("slide_ka").addEventListener("input", function(event) 
    { 
        ka =  vec4(event.target.value,event.target.value,event.target.value,1.0); 
        gl.uniform4fv(kaLoc, flatten(ka));
        render();
    });

    document.getElementById("slide_ks").addEventListener("input", function(event) 
    { 
        ks =  vec4(event.target.value,event.target.value,event.target.value,1.0); 
        gl.uniform4fv(ksLoc, flatten(ks));
        render();
    });

    document.getElementById("slide_s").addEventListener("input", function(event) 
    {   
        s =  event.target.value; 
        gl.uniform1f(sLoc, s);
        render();
    });
    
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        console.log("g_drawingInfo set!");
        console.log(g_drawingInfo.indices.length);
    }

    if (!g_drawingInfo) {
        console.log('waiting');
        window.requestAnimationFrame(render);
        return;
    };

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
    //window.requestAnimationFrame(render);
}



function cameraRotation(){
    if(rotation){
        alpha = alpha + 0.02;
        eRot = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));
        var V = lookAt(eRot, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        gl.uniformMatrix4fv(VLoc,false, flatten(V));
        render();
        requestAnimationFrame(cameraRotation);   
    } 
}



function initObject(gl, obj_filename, scale)
{
    vPosition = gl.getAttribLocation(program, 'a_Position');
    vNormal = gl.getAttribLocation(program, 'a_Normal');
    //vColor = gl.getAttribLocation(program, 'a_Color');
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, program);

    // Start reading the OBJ file
    readOBJFile(obj_filename, gl, model, scale, true);

    return model;
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program)
{
    return {
        vertexBuffer : createEmptyArrayBuffer(gl, vPosition, 3, gl.FLOAT),
        normalBuffer : createEmptyArrayBuffer(gl, vNormal, 3, gl.FLOAT),
        //colorBuffer : createEmptyArrayBuffer(gl, vColor, 4, gl.FLOAT),
        indexBuffer : gl.createBuffer()

    }
}

function createEmptyArrayBuffer(gl, a_attribute, num, type)
{
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0); 
    gl.enableVertexAttribArray(a_attribute);
    return buffer;
}

// Asynchronous file loading (request, parse, send to GPU buffers)
async function readOBJFile(fileName, gl, model, scale, reverse)
{
    fetch(fileName).then(x => x.text()).then(x => {
        onReadOBJFile(x, fileName, scale, reverse);
    }).catch(err => console.log(err));
}

function onReadOBJFile(fileString, fileName, scale, reverse)
{
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
        var result = objDoc.parse(fileString, scale, reverse);

        if (!result) {
            g_objDoc = null;
            g_drawingInfo = null;
            console.log("OBJ file parsing error");
        } else {
            g_objDoc = objDoc;
        }
}

function onReadComplete(gl, model, objDoc)
{
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    //gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

