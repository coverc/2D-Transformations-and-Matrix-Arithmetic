
// some globals
var gl;

var theta = 0.0;
var thetaLoc, colorLoc;

var delay = 100;
var direction = true;
var vBuffer, cBuffer, cBufferDraw, vBufferDraw;
var program;
var vertices = [];
var vcolors = [];
var posX, posY;
var xv2, xv, yv2, yv, xv3, yv3, xw3, yw3, xn, yn;
var vertices2 = [];
var theta2=0.0;
var col1;
var col2;
var col3;
var col4;
var drawColor = [255, 255, 255, 1.];
var pointoffset = 0;
var pointcounter = 0;
var drawVert = [];
var scalematrix;
var translationmatrix;
var prod=0;
var worldmax = 100;
var worldmin = -100;
var xn1, yn1, xw1, yw1;
var isDrawingOn = false;
var isMouseDown = false;

var max_prims = 200, num_triangles = 0;
var tx, ty, v1, v2, sx, sy;


window.addEventListener("mousemove", draw);
function draw() {

var e = window.event;

posX = e.clientX;
posY = e.clientY;

convertVerticesDevToWorld(posX, 512 - posY);

var z = document.getElementById("textarea");
z.innerHTML = "Device Coords: (" + posX + ", " + posY + ")\n" + "World Coords: (" + xw1 + ", " + yw1 + ")\n" + "NDC Coords: (" + xn1 + ", " + yn1 + ")";
}


//window.addEventListener("mousedown", draw);
window.onload = function init() {

	// get the canvas handle from the document's DOM
    var canvas = document.getElementById( "gl-canvas" );
    button = document.getElementById("Drawing");
    button.addEventListener("click", controlDrawing);
    canvas.addEventListener("mousemove", mouseMoveFunction);
    canvas.addEventListener("mousedown", mouseDownFunction);
    canvas.addEventListener("mouseup", mouseUpFunction);
	// initialize webgl
    gl = WebGLUtils.setupWebGL( canvas );

	// check for errors
    if ( !gl ) {
		alert( "WebGL isn't available" );
	}

    // set up a viewing surface to display your image
    gl.viewport( 0, 0, canvas.width, canvas.height );

	// clear the display with a background color
	// specified as R,G,B triplet in 0-1.0 range
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders -- all work done in init_shaders.js
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

	// make this the current shader program
    gl.useProgram( program );

    thetaLoc = gl.getUniformLocation( program, "theta" );

	// we are also going manipulate the vertex color, so get its location
	colorLoc = gl.getUniformLocation(program, "vertColor");

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 3000 * 4 * 4 * 4, gl.STATIC_DRAW);

    vBufferDraw = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferDraw);
    gl.bufferData(gl.ARRAY_BUFFER, 3000 * 4 * 4 * 4, gl.STATIC_DRAW);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 3000 * 4 * 4 * 4, gl.STATIC_DRAW);

    cBufferDraw = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferDraw);
    gl.bufferData(gl.ARRAY_BUFFER, 3000 * 4 * 4 * 4, gl.STATIC_DRAW);

    updateVertices();

    render();
};

function convertVerticesDevToWorld(posX3, posY3) {

    var devtoworldvec = vec3(posX3, posY3, 1.0);
    //first translation
    var translate1 = translate2d(-512,-512);

    //first scaling
    var scale1 = scale2d(1/512, 1/512);

    var scale2 = scale2d(200, 200);

    //second translation
    var translate2 = translate2d(-100, -100);

    var multvecdevtoworld = mult(translate2, mult(scale2, scale1));

    xw1 = dotProd(multvecdevtoworld[0], devtoworldvec);
    yw1 = dotProd(multvecdevtoworld[1], devtoworldvec);
    convertVerticesWorldtoNDC(xw1, yw1);
}


function convertVerticesWorldtoNDC(xw3, yw3){
//console.log(xw3);
//console.log(yw3);
    var w2nvec = vec3(xw3, yw3, 1.0);
//console.log(w2nvec);
    var w2ntrans1 = translate2d(worldmin, worldmin);
//console.log(w2ntrans1);
    var w2nscale1 = scale2d((2.0/(worldmax-worldmin)), (2.0/(worldmax-worldmin)));
//console.log(w2nscale1);
    var w2ntrans2 = translate2d(1,1);
   //var w2ntrans2 = translate2d(-1,-1);
//console.log(w2ntrans2);
    var matvecw2n = mult(w2ntrans2, mult(w2nscale1,w2ntrans1));
//console.log(matvecw2n);
    xn1 = dotProd(matvecw2n[0], w2nvec);
    //console.log(xn1);
    yn1 = dotProd(matvecw2n[1], w2nvec);
 //var   xyz = vec3(dotProd(matvecw2n[0],w2nvec),dotProd(matvecw2n[1],w2nvec),dotProd(matvecw2n[2],w2nvec))
}

function drawPic(xx, yy) {
    drawVert.push([xx, yy]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferDraw);
    gl.bufferSubData(gl.ARRAY_BUFFER, 2 * pointoffset, flatten(drawVert));

    pointcounter++;
    pointoffset += 32;


    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferDraw);
    gl.bufferSubData(gl.ARRAY_BUFFER, pointoffsetcolor, flatten(drawColor));

    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    pointoffsetcolor += 16;
    //render();
}

function updateVertices() {
	// add a square at the center of the view (0, 0) of a fixed size
	// triangle 1
    var xw = 0;
    var yw = 100;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);
    xw = -100;
    yw = 0;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);
    xw = 0;
    yw = -100;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);
    xw = 0;
    yw = 100;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);
    xw = 0;
    yw = -100;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);
    xw = 100;
    yw = 0;
    convertVerticesWorldtoNDC(xw, yw);
    vertices.push(xn1, yn1);


    col1 = [1.0, 0.0, 0.0, 1.0];
    col2 = [0.0, 1.0, 0.0, 1.0];
    col3 = [0.0, 0.0, 1.0, 1.0];

    vcolors.push(col1);
    vcolors.push(col2);
    vcolors.push(col3);
    vcolors.push(col1);
    vcolors.push(col3);
    vcolors.push(col2);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vcolors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    pointoffset = 48;
    pointoffsetcolor = 96;
}


function render() {
	// this is render loop

	// clear the display with the background color
    gl.clear( gl.COLOR_BUFFER_BIT );

	num_triangles = 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

	// draw the square as a set of triangles
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vcolors), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.TRIANGLES, 0, num_triangles*3);


    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferDraw);
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

     gl.bindBuffer(gl.ARRAY_BUFFER, cBufferDraw);

     var vColor = gl.getAttribLocation( program, "vColor");
     gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(vColor);

    for(let i = 0; i < drawVert.length; i++){
        gl.drawArrays(gl.POINTS, i*5, pointcounter*5+4);
    }
    //console.log("Here");

    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
}

function controlDrawing(){
    if(isDrawingOn){
        isDrawingOn = false;
        button.textContent = "Draw Off";
    }
    else{
        isDrawingOn = true;
        button.textContent = "Draw On";
    }
}

function mouseMoveFunction() {

    if(isDrawingOn && isMouseDown)
    {
        //convertVerticesDevToWorld(mouseX, mouseY);
        drawVert.push(xn1, yn1);
        drawPic(xn1, yn1);
    }
}

function mouseDownFunction() {

    isMouseDown = true;
    if(isDrawingOn){
        //convertVerticesDevToWorld(mouseX, mouseY);
        drawVert.push(xn1, yn1);
        drawPic(xn1, yn1);

    }
}

function mouseUpFunction() {
    // make sure you're not drawing when not clicking
    isMouseDown = false;
}

function translate2d(tx, ty) {

translationmatrix = mat3(vec3(1, 0, tx),
                         vec3(0, 1, ty),
                         vec3(0, 0, 1))
return translationmatrix;

}

function scale2d(sx, sy) {

scalematrix = mat3(vec3(sx, 0, 0),
                   vec3(0, sy, 0),
                   vec3(0, 0, 1))
return scalematrix;

}

function dotProd(v1, v2) {

//for(var i = 0; i < v1.length; i++) {
        //prod += v1[i] * v2[i];
        prod = ((v1[0] * v2[0]) + (v1[1] * v2[1]) + (v1[2] * v2[2]));
        //console.log(prod);
//}
return prod;
}


