 
//code inside init function is run when webpage is loaded
window.onload = function init(){ 
    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl"); //creation of a WebGL Rendering Context
    if(!gl){
        console.log("webGL not supported")
    }
    //now we need to compile the shaders on the html file to put them on the gpu
    //to do so we need to get them into strings
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //---------------------------------------------------
    var vertices = [ vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0) ];


    //------------------------------------
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW); //function that upload the vertices in the buffer, flatten makes a flat array in order to be used by WebGL
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //specifies how attributes are extracted from the buffer
    gl.enableVertexAttribArray(vPosition);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT) //deletes background color of WebGL canvas
    gl.drawArrays(gl.POINTS, 0, vertices.length)
 }
 