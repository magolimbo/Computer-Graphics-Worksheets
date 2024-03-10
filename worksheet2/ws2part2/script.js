 
//code inside init function is run when webpage is loaded
window.onload = function init(){ 
    var max_verts = 1000;
    var index = 0; 
    var numPoints = 0; 
    var colors = [
        vec4(0.0, 0.0, 0.0, 1.0), // black
        vec4(1.0, 0.0, 0.0, 1.0), // red
        vec4(1.0, 1.0, 0.0, 1.0), // yellow
        vec4(0.0, 1.0, 0.0, 1.0), // green
        vec4(0.0, 0.0, 1.0, 1.0), // blue
        vec4(1.0, 0.0, 1.0, 1.0), // magenta
        vec4(0.0, 1.0, 1.0, 1.0), // cyan
        vec4(1.0, 1.0, 1.0, 1.0), // white
        vec4(0.3921, 0.5843, 0.9294, 1.0) // cornflower
    ]

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl"); //creation of a WebGL Rendering Context
    if(!gl){
        console.log("webGL not supported")
    }
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //imposti il colore di sfondo che verrà utilizzato quando si cancella il buffer dei colori.
    gl.clear(gl.COLOR_BUFFER_BIT) //cancella il buffer dei colori del tuo canvas WebGL, sostituendo tutto il contenuto con il colore di sfondo specificato con gl.clearColor

    //Vertex Buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); //specifies how attributes are extracted from the buffer
    gl.enableVertexAttribArray(vPosition);

    //Color Buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    var vColors = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColors, 4, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(vColors);


    var clearMenu = document.getElementById("clearMenu");
    var clearButton = document.getElementById("clearButton");
    var changeVertexColor = document.getElementById("colorMenu")
    canvas.addEventListener("click", clickOnCanvas);
    clearButton.addEventListener("click", buttonClicked)
    changeVertexColor.addEventListener("change", clickOnChangeVertexColor)
    
    
    function buttonClicked() { //clear canvas
        console.log("button clicked")
        var bgcolor = colors[clearMenu.selectedIndex];
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        numPoints = 0;
        index = 0;
        render()
    }
    
    function clickOnCanvas(ev){
        //rimuovi offset dalle coordinate
        const rect = canvas.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        // Convert coordinates to WebGL's normalized device coordinates (-1 to 1)
        var normalizedX = (x / canvas.width) * 2 - 1;
        var normalizedY = 1 - (y / canvas.height) * 2;
        console.log("x-norm: " + normalizedX + " y-norm: " + normalizedY)
        
        //ogni volta che clicco un punto deve essere disegnato sul canvas
        var vec = vec2(normalizedX, normalizedY);
        
        //update buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER,  index*sizeof['vec2'], flatten(vec)); 
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(colors[colorMenu.selectedIndex]));
        numPoints = Math.max(numPoints, ++index); 
        index %= max_verts;
        console.log("index = " +index + " numPoints = "+numPoints)

        
        render()
    }

    function clickOnChangeVertexColor(){
        var vcolor = colors[colorMenu.selectedIndex]
        var vColorLoc = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(vColorLoc, vcolor)
    }
    
    function render(){
        gl.clear(gl.COLOR_BUFFER_BIT) //deletes background color of WebGL canvas
        gl.drawArrays(gl.POINTS, 0, numPoints);
    }

    
}