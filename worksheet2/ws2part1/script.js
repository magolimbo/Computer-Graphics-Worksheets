 
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

    var vertices = []
    var max_verts = 1000;
    var index = 0; 
    var numPoints = 0;
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.DYNAMIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //specifies how attributes are extracted from the buffer
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("click", function (ev) {
        //rimuovi offset dalle coordinate
        const rect = canvas.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        console.log("x: " + x + " y: " + y)
        // Convert coordinates to WebGL's normalized device coordinates (-1 to 1)
        var normalizedX = (x / canvas.width) * 2 - 1;
        var normalizedY = 1 - (y / canvas.height) * 2;
        console.log("x-norm: " + normalizedX + " y-norm: " + normalizedY)

        //ogni volta che clicco un punto deve essere disegnato sul canvas
        var vec = vec2(normalizedX, normalizedY);
        vertices.push(vec);

        //update buffer
        gl.bufferSubData(gl.ARRAY_BUFFER,  index*sizeof['vec2'], flatten(vec)); 
        numPoints = Math.max(numPoints, ++index); 
        index %= max_verts;

        render()

    });


    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //imposti il colore di sfondo che verrà utilizzato quando si cancella il buffer dei colori.
    gl.clear(gl.COLOR_BUFFER_BIT) //cancella il buffer dei colori del tuo canvas WebGL, sostituendo tutto il contenuto con il colore di sfondo specificato con gl.clearColor

    function render(){
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //imposti il colore di sfondo che verrà utilizzato quando si cancella il buffer dei colori.
        gl.clear(gl.COLOR_BUFFER_BIT) //deletes background color of WebGL canvas
        for (var i = 0; i < numPoints; i++) {
        gl.drawArrays(gl.POINTS, i, 1); // Disegna un singolo vertice alla volta
    }
        console.log(index, numPoints)
    }
    
 }
 