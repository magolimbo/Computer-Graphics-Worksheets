var pointsArray = []
var gl;
var program;
var numTimesToSubdivide = 0;
var VPosition;


window.onload = function init(){
    var canvas = document.getElementById("c"); 

    gl = canvas.getContext("webgl"); 
    gl.clearColor(0.0, 1.0, 1.0, 0.0);  //Si imposta il colore di sfondo del canvas
    gl.clear(gl.COLOR_BUFFER_BIT); //Si cancella il buffer del colore del canvas

    var ext = gl.getExtension('OES_element_index_uint'); //OES_element_index_uint' che consente l'uso di indici non firmati a 32 bit.
    if(!ext){
        console.log('Warning: Unable tu use an extension');
    }    

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); 
    //-------------------------------------------------------------------------------------
    gl.vBuffer = null;

    //------------1 point perspective--------------------------------
    // Configura la matrice di vista (View Matrix)
    var eye = vec3(0.5, 1.0, 4.0); // Modifica la posizione verticale della telecamera
    var at = vec3(0.5, 0.5, 0.5); // Punto verso cui la telecamera è orientata (centro della sfera)
    var up = vec3(0.0, 1.0, 0.0); // Vettore "up" della telecamera
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

    initSphere(gl, numTimesToSubdivide);

    document.getElementById("incrementSubd").onclick = function(){
        numTimesToSubdivide++;
        pointsArray = [];
        initSphere(gl, numTimesToSubdivide)
    };

    document.getElementById("decrementSubd").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        pointsArray = [];
        initSphere(gl, numTimesToSubdivide)
    };
}

function render(){
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function initSphere(gl, numSubdivs) {
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivs);
    gl.deleteBuffer(gl.vBuffer);
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    vPosition = gl.getAttribLocation(program, "a_Position"); 
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(vPosition); 
    render()
   }


function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
}


function divideTriangle(a, b, c, count) {
   if ( count > 0 ) {

       var ab = normalize(mix( a, b, 0.5), true);
       var ac = normalize(mix( a, c, 0.5), true);
       var bc = normalize(mix( b, c, 0.5), true);

       divideTriangle( a, ab, ac, count - 1 );
       divideTriangle( ab, b, bc, count - 1 );
       divideTriangle( bc, c, ac, count - 1 );
       divideTriangle( ab, bc, ac, count - 1 );
   }
   else { // draw tetrahedron at end of recursion
       triangle( a, b, c );
   }
}

function tetrahedron(a, b, c, d, n) {
   divideTriangle(a, b, c, n);
   divideTriangle(d, c, b, n);
   divideTriangle(a, d, b, n);
   divideTriangle(a, c, d, n);
}