import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let Blocks = {};
var renderer, scene, camera, controls, cube;
var started = false;
//Blocks.position = {x: 0, y: 0, z: 0};
var staticBlocks = [];
let Board = {};
//Board.collision = {none:0, wall:1, ground:2};
//Board.status = {empty:0, active:1, frozen:2};
Board.fields = [];

//var inGame = true;
var zColors = [
	0x00FFFF, 0x0000FF, 0xFFA500,
	0xFFFF00, 0x00FF00, 0x800080,  
	0xFF0000
  ];

 // 0x6666ff, 0x66ffff,0xcc68EE, 0x66ff66, 

Blocks.blockShapes = [
	[
		{x: 0, y: 0, z: 0},
		{x: 1, y: 0, z: 0},
		{x: 1, y: 1, z: 0},
		{x: 1, y: 2, z: 0}
	],
	[
		{x: 0, y: 0, z: 0},
		{x: 0, y: 1, z: 0},
		{x: 0, y: 2, z: 0},
	],
	[
		{x: 0, y: 0, z: 0},
		{x: 0, y: 1, z: 0},
		{x: 1, y: 0, z: 0},
		{x: 1, y: 1, z: 0}
	],
	[
		{x: 0, y: 0, z: 0},
		{x: 0, y: 1, z: 0},
		{x: 0, y: 2, z: 0},
		{x: 1, y: 1, z: 0}
	],
	[
		{x: 0, y: 0, z: 0},
		{x: 0, y: 1, z: 0},
		{x: 1, y: 1, z: 0},
		{x: 1, y: 2, z: 0}
	]

];

function initBoard(x,y,z) {
    for(var i = 0; i < x; i++) {
        Board.fields[i] = [];
        for(var j = 0; j < y; j++) {
            Board.fields[i][j] = [];
            for(var k = 0; k < z; k++) {
                Board.fields[i][j][k] = 0;
            }
        }
    }
};

function blockGenerate() {
    var geometries = [];

    var type = Math.floor(Math.random() * Blocks.blockShapes.length);
    Blocks.shape = [];

    for (var i = 0; i < Blocks.blockShapes[type].length; i++) {
        Blocks.shape[i] = cloneVector(Blocks.blockShapes[type][i]);
    }

    for (var i = 0; i < Blocks.shape.length; i++) {
        var tmpGeometry = new THREE.BoxGeometry(20, 20, 20);
        tmpGeometry.translate(20 * Blocks.shape[i].x, 20 * Blocks.shape[i].y, 0);
        geometries.push(tmpGeometry);
    }

    var mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

	var color = Math.floor(Math.random() * zColors.length);
    Blocks.mesh = createMultiMaterialObject(mergedGeometry, [
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            //shading: THREE.FlatShading,
            wireframe: true,
            transparent: true,
        }),
        new THREE.MeshBasicMaterial({ color: zColors[color]}),
    ]);

    //Blocks.blockPosition = { x: Math.floor(0 / 2) - 1, y: Math.floor(0 / 2) - 1, z: 0 };
	Blocks.blockPosition = { x: Math.floor(Math.random()*10), y: 10, z: Math.floor(Math.random()*10) };

    Blocks.mesh.position.x = (Blocks.blockPosition.x - 0 / 2) * 20 + 20 / 2;
    Blocks.mesh.position.y = (Blocks.blockPosition.y - 0 / 2) * 20 + 20 / 2;
    Blocks.mesh.position.z = (Blocks.blockPosition.z - 0 / 2) * 20 + 20 / 2;
    Blocks.mesh.overdraw = true;

    scene.add(Blocks.mesh);
}

function createMultiMaterialObject( geometry, materials ) {
	const group = new THREE.Group();
	for ( let i = 0; i < materials.length; i++ ) {
		group.add( new THREE.Mesh( geometry, materials[ i ] ) );
	}

	return group;
};

function cloneVector(v) {
	return {x: v.x, y: v.y, z: v.z};
};

function addStaticBlock(x,y,z) {
	if(staticBlocks[x] === undefined) staticBlocks[x] = [];
	if(staticBlocks[x][y] === undefined) staticBlocks[x][y] = [];

	var mesh = createMultiMaterialObject(new THREE.BoxGeometry( 20, 20, 20), [
		new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true}),
		new THREE.MeshBasicMaterial({color: zColors[1]})
	  ] );

	mesh.position.x = (x - 0/2)*20 + 20/2;
	mesh.position.y = (y - 0/2)*20 + 20/2;
	mesh.position.z = (z - 0/2)*20 + 20/2;
	//mesh.position.x = 10;
	//mesh.position.y = 190;
	//mesh.position.z = 10;
	mesh.overdraw = true;

	scene.add(mesh);

	//console.log(x,y,z);
	staticBlocks[x][y][z] = mesh;
	//console.log(Board.fields[x][y][z]);
	Board.fields[x][y][z] = 2;
	//console.log(Board.fields[x][y][z]);
	//console.log(Board.fields[x][y][z]);
};

// Create 3d Grid
function createGrid() {
	var gridXZ = new THREE.GridHelper(200, 10);
	gridXZ.position.set( 100,0,100 );
	scene.add(gridXZ);

	var gridXY = new THREE.GridHelper(200, 10);
	gridXY.position.set( 100,100,0 );
	gridXY.rotation.x = Math.PI/2;
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(200, 10);
	gridYZ.position.set( 0,100,100 );
	gridYZ.rotation.z = Math.PI/2;

	scene.add(gridYZ);
}

function init() {
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	scene.add(camera);

	const canvas = document.getElementById('canvas');

	renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setSize( window.innerWidth, window.innerHeight*.95 );
	document.body.appendChild( renderer.domElement );
	
	controls = new OrbitControls( camera, renderer.domElement );

	createGrid();
	
	initBoard(200, 200, 200);

	blockGenerate();

	camera.position.set( 350, 225, 350 );
  
	document.getElementById("start").onclick = function() {
		if (!started) {
			const listener = new THREE.AudioListener();
			camera.add( listener );

			const sound = new THREE.Audio( listener );

			const audioLoader = new THREE.AudioLoader();
			audioLoader.load('sounds/korobeiniki.mp3', function( buffer ) {
				sound.setBuffer( buffer );
				sound.setLoop( true );
				sound.setVolume( 0.5 );
				sound.play();

				document.getElementById("start").remove();
				document.getElementById("rotateX").style.visibility = "visible";
				document.getElementById("rotateY").style.visibility = "visible";
				//document.getElementById("dropbtn").style.visibility = "visible";

			});
	}
	started = true;
  }
}

window.addEventListener('keydown', function (event) {
	//console.log( event.key );
	
    switch (event.key) {
        case "ArrowDown":
            moveBlock(0, -10, 0);
            break;

        case "ArrowLeft":
            moveBlock(-20, 0, 0);
            break;

        case "ArrowRight":
            moveBlock(20, 0, 0);
            break;

        case " ": 
            moveBlock(0, -10, 0 );
            break;

        case "w":
            rotateBlock(90, 0, 0);
            break;

        case "s":
            rotateBlock(-90, 0, 0);
            break;

        case "a":
            rotateBlock(0, 0, 90);
            break;

        case "d":
            rotateBlock(0, 0, -90);
            break;

        case "q":
            rotateBlock(0, 90, 0);
            break;

        case "e":
            rotateBlock(0, -90, 0);
            break;
    }
}, false);

function isBaseFilled() {
	for(var i = 0; i < 10; i++) {
		for(var k = 0; k < 10; k++) {
			//console.log(Board.fields[i][0][k]);
			//console.log(i, k);
			if (Board.fields[i][0][k] == 0) {
				//console.log(Board.fields[i][0][k]);
				return false
			}
		}
	}

	return true;
}

function moveBlock (x,y,z) {
	var xCheck = Blocks.mesh.position.x + x;
	var yCheck = Blocks.mesh.position.y + y;
	var zCheck = Blocks.mesh.position.z + z;

	if(yCheck > 10) {
		Blocks.mesh.position.y += y;
		//Blocks.position.y += y;
	} 
	else {
		hitBottom();
	}

	if (xCheck > 0 && xCheck < 200) {		
		Blocks.mesh.position.x += x;
		//Blocks.position.x += x;
	}

	if (zCheck < 200 && zCheck > 0) {
		Blocks.mesh.position.z += z;
		//Blocks.position.z += z;
	}
  
	//if(Blocks.mesh.position.y <= 10) hitBottom();

	//if(staticBlocks[Blocks.mesh.position.x][Blocks.mesh.position.y][Blocks.mesh.position.z] !== undefined) {
		//hitBottom();
	//}

	//checkCollision();
  };

  function rotateBlock(x,y,z) {
	Blocks.mesh.rotation.x += x * Math.PI / 180;
	Blocks.mesh.rotation.y += y * Math.PI / 180;
	Blocks.mesh.rotation.z += z * Math.PI / 180;
  };

function hitBottom() {
	freeze();
	//console.log(Blocks.mesh.position.x,Blocks.mesh.position.y, Blocks.mesh.position.z );
	//var answer = isBaseFilled();
	//console.log(answer);
	//scene.removeObject(Blocks.mesh);
	blockGenerate();
  
  };

function freeze() {
	//var shape = Blocks.shape;
	//for(var i = 0 ; i < shape.length; i++) {
		addStaticBlock(Blocks.mesh.position.x, Blocks.mesh.position.y, Blocks.mesh.position.z);
		//console.log(Blocks.mesh.position.x,Blocks.mesh.position.y,Blocks.mesh.position.z );
		//Board.fields[Blocks.position.x + shape[i].x][Blocks.position.y + shape[i].y][Blocks.position.z + shape[i].z] = Board.status.freeze;
	//}
  };

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	//controls.update() must be called after any manual changes to the camera's transform
	controls.update();

	moveBlock(0,-1,0);

	renderer.render( scene, camera );
  
  //if (inGame) {
		//alert("HELP");
	//}
}

function main() {
	init();
	animate();
}

main()
//var i = 0, j = 0, k = 0, interval = setInterval(function() {if(i==10) {i=0;j++;} if(j==10) {j=0;k++;} if(k==10) {clearInterval(interval); return;} addStaticBlock(i,j,k); i++;},30);
for(var i = 0; i < 10; i++) {
	for (var j = 0; j < 10; j++) {
		addStaticBlock(i,0,j);
		//console.log(staticBlocks[i][0][j]);
	}
}
//console.log(Board.fields[0][0][1]);

var x = isBaseFilled();
console.log(x);

// addStaticBlock(0,0,0);
// addStaticBlock(1,0,0);
// addStaticBlock(0,0,1);
// addStaticBlock(1,0,1);