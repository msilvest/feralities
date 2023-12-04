import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

var Blocks = {};
var renderer, scene, camera, controls, cube;
var blockSpeed = -0.125;
var started = false;
Blocks.position = {};
var staticBlocks = [];
//var staticBlocks = Array(10).fill().map(() => Array(10).fill(0));
let Board = {};
Board.fields = [];
var blockSize = 20;
var divisions = 10;
var storeBlock;
var usedStore = false;

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
	Blocks.type = type;

    for (var i = 0; i < Blocks.blockShapes[type].length; i++) {
        Blocks.shape[i] = cloneVector(Blocks.blockShapes[type][i]);
    }

    for (var i = 0; i < Blocks.shape.length; i++) {
        var tmpGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        tmpGeometry.translate(blockSize * Blocks.shape[i].x, blockSize * Blocks.shape[i].y, 0);
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
	Blocks.blockPosition = { x: Math.floor(Math.random()*divisions), y: divisions, z: Math.floor(Math.random()*divisions) };
	Blocks.mesh.position.x = (Blocks.blockPosition.x - 0 / 2) * blockSize + blockSize / 2;
	Blocks.mesh.position.y = (Blocks.blockPosition.y - 0 / 2) * blockSize + blockSize / 2;
	Blocks.mesh.position.z = (Blocks.blockPosition.z - 0 / 2) * blockSize + blockSize / 2;
	Blocks.mesh.overdraw = true;

	scene.add(Blocks.mesh);
}

function createMultiMaterialObject( geometry, materials ) {
	const group = new THREE.Group();
	for ( let i = 0; i < materials.length; i++ ) {
		group.add( new THREE.Mesh( geometry, materials[i] ) );
	}

	return group;
};

function cloneVector(v) {
	return {x: v.x, y: v.y, z: v.z};
};

function roundVector(v) {
	v.x = Math.round(v.x);
	v.y = Math.round(v.y);
	v.z = Math.round(v.z);
};

function addStaticBlock(x,y,z) {
	if(staticBlocks[x] === undefined) staticBlocks[x] = [];
	if(staticBlocks[x][y] === undefined) staticBlocks[x][y] = [];

	var mesh = createMultiMaterialObject(new THREE.BoxGeometry( blockSize, blockSize, blockSize), [
		new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true}),
		new THREE.MeshBasicMaterial({color: zColors[1]})
	  ] );

	mesh.position.x = (x - 0/2)*blockSize + blockSize/2;
	mesh.position.y = (y - 0/2)*blockSize + blockSize/2;
	mesh.position.z = (z - 0/2)*blockSize + blockSize/2;
	//mesh.position.x = 10;
	//mesh.position.y = 190;
	//mesh.position.z = 10;
	mesh.overdraw = true;

	scene.add(mesh);

	staticBlocks[x][y][z] = mesh;
	//Board.fields[x][y][z] = 2;
};

// Create 3d Grid
function createGrid() {
	var gridXZ = new THREE.GridHelper(200, divisions);
	gridXZ.position.set( 100,0,100 );
	scene.add(gridXZ);

	var gridXY = new THREE.GridHelper(200, divisions);
	gridXY.position.set( 100,100,0 );
	gridXY.rotation.x = Math.PI/2;
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(200, divisions);
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

	//blockGenerate();

	camera.position.set( 350, 225, 350 );
	//camera.position.set( 400, 150, 400 );
  
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
				document.getElementById("rotateZ").style.visibility = "visible";
				document.getElementById("moveLeft").style.visibility = "visible";
				document.getElementById("moveRight").style.visibility = "visible";
				document.getElementById("moveUp").style.visibility = "visible";
				document.getElementById("moveDown").style.visibility = "visible";
				document.getElementById("softDrop").style.visibility = "visible";
				document.getElementById("hardDrop").style.visibility = "visible";
				document.getElementById("store").style.visibility = "visible";
			});
    }
    started = true;
	blockGenerate();
  }

  document.getElementById("rotateZ").onclick = function() {
	rotate(0, 0, 90);
  }

  document.getElementById("moveLeft").onclick = function() {
	move(-1*blockSize, 0, 0);
  }

  document.getElementById("moveRight").onclick = function() {
	move(blockSize, 0, 0);
  }

  document.getElementById("moveUp").onclick = function() {
	move(0, 0, blockSize);
  }

  document.getElementById("moveDown").onclick = function() {
	move(0, 0, -1*blockSize);
  }

  document.getElementById("softDrop").onclick = function() {
	move(0, -1*blockSize, 0);
  }

  document.getElementById("hardDrop").onclick = function() {
	move(0, -1000, 0);
  }

  document.getElementById("store").onclick = function() {
	store();
  }
}

window.addEventListener('keydown', function (event) {
	//console.log( event.key );
	
    switch (event.key) {
		case "ArrowUp":
            move(0, 0, -1*blockSize);
            break;

        case "ArrowDown":
            move(0, 0, blockSize);
            break;

        case "ArrowLeft":
            move(-1*blockSize, 0, 0);
            break;

        case "ArrowRight":
            move(blockSize, 0, 0);
            break;

        case " ": 
            move(0, -1*divisions, 0 );
            break;

        case "w":
            rotate(90, 0, 0);
            break;

        case "s":
            rotate(-90, 0, 0);
            break;

        case "a":
            rotate(0, 0, 90);
            break;

        case "d":
            rotate(0, 0, -90);
            break;

        case "q":
            rotate(0, 90, 0);
            break;

        case "e":
            rotate(0, -90, 0);
            break;

		case "r":
			store();
			break;
    }
}, false);

function isBaseFilled() {
	for(var i = 0; i < divisions; i++) {
		for(var k = 0; k < divisions; k++) {
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

function move (x,y,z) {
	var xCheck = Blocks.mesh.position.x + x;
	var yCheck = Blocks.mesh.position.y + y;
	var zCheck = Blocks.mesh.position.z + z;

	if(yCheck > (blockSize / 2)) {
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

  function rotate(x,y,z) {
	Blocks.mesh.rotation.x += x * Math.PI / 180;
	Blocks.mesh.rotation.y += y * Math.PI / 180;
	Blocks.mesh.rotation.z += z * Math.PI / 180;

	// need to cancel the rotate if the rotate collides with a block or a wall, but we don't have the code for collision checking
	// rotate(-x, -y, -z);
  };

function hitBottom() {
	freeze();
	//console.log(Blocks.mesh.position.x,Blocks.mesh.position.y, Blocks.mesh.position.z );
	//var answer = isBaseFilled();
	//console.log(answer);
	//scene.removeObject(Blocks.mesh);
	blockGenerate();
	blockSpeed *= 1.01;
	usedStore = false;
  
  };

function freeze() {
	for ( let i = 0 ; i < Blocks.shape.length; i++ ) {
		addStaticBlock(Blocks.position.x + Blocks.shape[i].x, Blocks.position.y + Blocks.shape[i].y, Blocks.position.z + Blocks.shape[i].z);
	}
	//var shape = Blocks.shape;
	//for(var i = 0 ; i < shape.length; i++) {
		//addStaticBlock(Blocks.mesh.position.x, Blocks.mesh.position.y, Blocks.mesh.position.z);
		//console.log(Blocks.mesh.position.x,Blocks.mesh.position.y,Blocks.mesh.position.z );
		//Board.fields[Blocks.position.x + shape[i].x][Blocks.position.y + shape[i].y][Blocks.position.z + shape[i].z] = Board.status.freeze;
	//}
  };

function store() {

	if (usedStore) {
		return;
	}

	if (storeBlock) {
		scene.remove(Blocks.mesh);
		let temp = storeBlock.clone();
		storeBlock = Blocks.mesh.clone();
		//let temp = JSON.parse(JSON.stringify(storeBlock));
		//let blockPos = JSON.parse(JSON.stringify(Blocks.mesh.position));
		//storeBlock = JSON.parse(JSON.stringify(Blocks.mesh));
		Blocks.mesh = temp.clone();
		scene.add(Blocks.mesh);
		Blocks.mesh.position.x = storeBlock.position.x;
		Blocks.mesh.position.y = storeBlock.position.y;
		Blocks.mesh.position.z = storeBlock.position.z;
		}
	else {
		scene.remove(Blocks.mesh);
		storeBlock = Blocks.mesh.clone();
		//let blockPos = JSON.parse(JSON.stringify(Blocks.mesh.position));
		//storeBlock = JSON.parse(JSON.stringify(Blocks.mesh));
		blockGenerate();
		Blocks.mesh.position.x = storeBlock.position.x;
		Blocks.mesh.position.y = storeBlock.position.y;
		Blocks.mesh.position.z = storeBlock.position.z;
	}

	usedStore = true;
}

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	//controls.update() must be called after any manual changes to the camera's transform
	controls.update();

	move(0,blockSpeed,0);

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
// for(var i = 0; i < divisions; i++) {
// 	for (var j = 0; j < divisions; j++) {
// 		addStaticBlock(i,0,j);
// 		//console.log(staticBlocks[i][0][j]);
// 	}
// }
//console.log(Board.fields[0][0][1]);

// var x = isBaseFilled();
// console.log(x);