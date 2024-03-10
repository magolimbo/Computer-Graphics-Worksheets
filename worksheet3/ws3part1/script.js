window.onload = function init(){
    var canvas = document.getElementById("c"); 

    var gl = canvas.getContext("webgl"); 
    gl.clearColor(0.0, 1.0, 1.0, 0.0);  //Si imposta il colore di sfondo del canvas
    gl.clear(gl.COLOR_BUFFER_BIT); //Si cancella il buffer del colore del canvas

    var ext = gl.getExtension('OES_element_index_uint'); //OES_element_index_uint' che consente l'uso di indici non firmati a 32 bit.
    if(!ext){
        console.log('Warning: Unable tu use an extension');
    }    

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); 
//-------------------------------------------------------------------------------------
    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
        ];

    var wire_indices = new Uint32Array([ //Gli indici specificano quali vertici devono essere collegati per disegnare le linee del cubo.
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0 // left
        ]);

    //Indices buffer for the wireframes
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);

    //Vertex buffer
    var vBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "a_Position"); 
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(vPosition); 

    var V = lookAt(vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(1.0,0.0,0.0)); //we use an eye point e,a look-at point a, and an up vector u:
    //var P = ortho(left, right, bottom, top, near, far);

    var VLoc = gl.getUniformLocation(program,"V");
    
    gl.uniformMatrix4fv(VLoc,false, flatten(V));

    

    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);
}