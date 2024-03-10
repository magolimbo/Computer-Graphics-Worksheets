 
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
    var vertices = [vec2(0.0, 0.0)]; //first vertex is the centre of the circle fan
    var psi = 0;
    var i = 0;
    for(psi; psi<=2*Math.PI+0.1; psi+=0.1){
        vertices.push(vec2(Math.cos(psi)/3.0, Math.sin(psi)/3.0));
        console.log(vertices[i++])
    }

    var theta = 0.0;
    var thetaLoc = gl.getUniformLocation(program, "theta");
    var delta = 0.01;
    var sign = 1; // 1 per incremento, -1 per decremento
    //------------------------------------
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW); //function that upload the vertices in the buffer, flatten makes a flat array in order to be used by WebGL
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //specifies how attributes are extracted from the buffer
    gl.enableVertexAttribArray(vPosition);

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    function animate(){
        theta += sign * delta; // Aggiungi o sottrai delta in base al segno        
        // Verifica se theta ha raggiunto il valore 1 o -1 per invertire il segno
        if (theta >= 2/3 || theta <= -2/3) {
            sign *= -1; // Inverti il segno
        }
        gl.uniform1f(thetaLoc, theta); //sends theta values from the application to the shader
        render(gl, vertices.length)
        requestAnimationFrame(animate)
    }
    animate()
    
}

function render(gl, numPoints){
    gl.clear(gl.COLOR_BUFFER_BIT) //deletes background color of WebGL canvas
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);    
}
