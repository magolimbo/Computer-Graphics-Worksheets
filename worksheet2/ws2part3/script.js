 
//code inside init function is run when webpage is loaded
window.onload = function init(){ 
    var drawingMode = "points";
    var max_verts = 1000;
    var index = 0; 
    var numPoints = 0; 
    var points = []
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
    var triangle_array = []
    var triangle_colors = []
    var triangle_counter = 0;
    var circle_array = [];
    var circle_colors = [];
    var circle_counter = 0;
    var num_vertices = 100;

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
    var changeVertexColor = document.getElementById("colorMenu");
    var drawPoints = document.getElementById("drawPoints")
    var drawTriangles = document.getElementById("drawTriangles")
    canvas.addEventListener("click", clickOnCanvas);
    clearButton.addEventListener("click", clickButtonClearCanvas)
    changeVertexColor.addEventListener("change", clickOnChangeVertexColor)
    drawPoints.addEventListener("click", clickOnDrawPoints)
    drawTriangles.addEventListener("click", clickOnDrawTriangles)
    
    
    //clear canvas
    function clickButtonClearCanvas() {
        console.log("button clicked")
        var bgcolor = colors[clearMenu.selectedIndex];
        gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
        index = 0;
        numPoints = 0;
        render();
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
        
        if(drawingMode == "points"){
            //ogni volta che clicco un punto deve essere disegnato sul canvas come se fosse un quadrato cioè due triangoli
            var size = 0.03; var offset = size/2
            squareVertices = createPointSquare(normalizedX, normalizedY, offset) //crea array di 6 vertici per formare un quadrato
            //update buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER,  index*sizeof['vec2'], flatten(squareVertices)); 
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            let sameColors = [] //contiene i colori dei 6 vertici che costituiscono un quadrato
            for(var i = 0; i < 6; i++){
                sameColors.push(colors[colorMenu.selectedIndex])
            }
            gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(sameColors));
            numPoints += 6
            index += 6
            console.log("index = " +index + " numPoints = "+numPoints)
        }
        else if(drawingMode == "triangles"){
            if(triangle_counter < 2){
                //disegna vertice nel canvas
                triangle_array.push(vec2(normalizedX, normalizedY)) //verrà usato quando il counter arriva a 3
                var size = 0.03; var offset = size/2
                squareVertices = createPointSquare(normalizedX, normalizedY, offset) //crea array di 6 vertici per formare un quadrato
                //update buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER,  index*sizeof['vec2'], flatten(squareVertices)); 
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                let sameColors = [] //contiene i colori dei 6 vertici che costituiscono un quadrato
                for(var i = 0; i < 6; i++){
                    sameColors.push(colors[colorMenu.selectedIndex])
                }
                gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(sameColors));
                triangle_counter++;
                numPoints += 6
                index += 6
                
            }
            else{
                //pulisco buffer, disegno triangolo
                triangle_array.push(vec2(normalizedX, normalizedY))
                triangle_colors.push(colors[colorMenu.selectedIndex])
                index -= 12;
                numPoints -=12;
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec2'], flatten(triangle_array));
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(triangle_colors));
                index += 3;
                numPoints += 3;
                triangle_array = []
                triangle_colors = []
                triangle_counter = 0;

            }

            var vec = vec2(normalizedX, normalizedY);
            points.push({ position: vec, color: colors[colorMenu.selectedIndex] });
            if (points.length === 3) {
                // Sono stati cliccati tre punti, ora disegna un triangolo
                for (var i = 0; i < 3; i++) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec2'], flatten(points[i].position));
                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec4'], flatten(points[i].color));
                    numPoints = Math.max(numPoints, ++index);
                    index %= max_verts;
                    console.log("index = " + index + " numPoints = " + numPoints);
                }
                points = []; // Ripulisci l'array dei punti
            }
        }

        
        render()
    }

    function clickOnChangeVertexColor(){
        var vcolor = colors[colorMenu.selectedIndex]
        var vColorLoc = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(vColorLoc, vcolor)
    }
    
    function clickOnDrawPoints(){
        drawingMode = "points";
    }

    function clickOnDrawTriangles(){
        drawingMode = "triangles";
    }

    function createPointSquare(x, y, offset){
        var squareVertices = [vec2(x + offset, y + offset),
            vec2(x - offset, y + offset),
            vec2(x - offset, y - offset),
            vec2(x + offset, y + offset),
            vec2(x + offset, y - offset),
            vec2(x - offset, y - offset)
           ] //per disegnare un quadrato disegno due triang. quindi 6 vertici
        return squareVertices
    }

    function render(){
        gl.clear(gl.COLOR_BUFFER_BIT) //deletes background color of WebGL canvas
        gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    }

    
}