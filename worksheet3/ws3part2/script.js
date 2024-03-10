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

    //------------1 point perspective--------------------------------
    // Configura la matrice di vista (View Matrix)
    var eye = vec3(0.5, 2.0, 6.0); // Posizione della telecamera
    var at = vec3(0.5, 1.0, 0.5); // Punto verso cui la telecamera è orientata (centro del cubo)
    var up = vec3(0.0, 10, 0.0); // Vettore "up" della telecamera
    // Usa la funzione lookAt per configurare la matrice di vista
    var V = lookAt(eye, at, up);
    var VLoc = gl.getUniformLocation(program,"V"); 
    gl.uniformMatrix4fv(VLoc,false, flatten(V));

    //configure perspective view (Projection Matrix)
    var fovy = 45.0;    // Campo visivo verticale di 45 gradi
    var aspect = 1.0;   // Rapporto di aspetto 1:1 (canvas quadrato)
    var near = 0.01;     // Distanza minima dalla telecamera
    var far = 100.0;    // Distanza massima dalla telecamera
    var P = perspective(fovy, aspect, near, far);
    var PLoc = gl.getUniformLocation(program, "P");
    gl.uniformMatrix4fv(PLoc, false, flatten(P));

    //convert from model frame to world/view frame (model matrix)
    var M = mat4(1);
    var MLoc = gl.getUniformLocation(program,"M");
    gl.uniformMatrix4fv(MLoc,false, flatten(M));

    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);


    //---------------------2 points perspective-------------------------------
    // Applica una trasformazione di vista per la prospettiva a due punti lungo l'asse X
    var translation = translate(-1.5, 0.0, 0.0); // Trasla l'origine lungo l'asse X
    V = mult(V, translation);
    VLoc = gl.getUniformLocation(program,"V"); 
    gl.uniformMatrix4fv(VLoc,false, flatten(V));
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);


    //------------------3 points perspective-------------------------------------
    // Applica una trasformazione di vista per la prospettiva a tre punti
    var rotationX = rotateX(35); // Ruota la vista lungo l'asse X
    var rotationY = rotateY(20); // Ruota la vista lungo l'asse Y
    var translation = translate(2.0, 1.0, 0.0); // Trasla l'origine lungo l'asse X
    // Moltiplica le trasformazioni in ordine: traslazione, rotazione X, rotazione Y
    var transformation = mult(mult(rotationX, rotationY), translation);
    V = mult(V, transformation);
    VLoc = gl.getUniformLocation(program,"V"); 
    gl.uniformMatrix4fv(VLoc,false, flatten(V));
    gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

    
}