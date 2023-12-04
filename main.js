import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

var renderer, scene, camera, controls;
var started = false, gameOver = false;
var staticBlocks = [];
var blockSize = 20;
var blockSpeed = -1;
var divisions = 10;

var zColors = [
	0x00FFFF, 0x0000FF, 0xFFA500,
	0xFFFF00, 0x00FF00, 0x800080,  
	0xFF0000
];

var times = {};
times.stepTime = 1000;
times.frameTime = 0;
times.currFrameTime = 0;
times.lastFrameTime = Date.now();

var Blocks = {};
Blocks.position = {};
Blocks.shapes = [
	[
		{ x: 0, y: 0, z: 0 },
		{ x: 1, y: 0, z: 0 },
		{ x: 1, y: 1, z: 0 },
		{ x: 1, y: 2, z: 0 },
	],
	[
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: 1, z: 0 },
		{ x: 0, y: 2, z: 0 },
	],
	[
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: 1, z: 0 },
		{ x: 1, y: 0, z: 0 },
		{ x: 1, y: 1, z: 0 },
	],
	[
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: 1, z: 0 },
		{ x: 0, y: 2, z: 0 },
		{ x: 1, y: 1, z: 0 },
	],
	[
		{ x: 0, y: 0, z: 0 },
		{ x: 0, y: 1, z: 0 },
		{ x: 1, y: 1, z: 0 },
		{ x: 1, y: 2, z: 0 },
	],
];

var Board = {};
Board.collision = {none: 0, wall: 1, floor: 2};
Board.field = {empty: 0, active: 1, solidified: 2};
Board.fields = [];

// initializes the fields var to 0's
// represents the 10x10x10 board and what each "cell" is
function initBoard(x, y, z) {
    for(let i = 0; i < x; i++) {
        Board.fields[i] = [];
        for(let j = 0; j < y; j++) {
            Board.fields[i][j] = [];
            for(let k = 0; k < z; k++) {
                Board.fields[i][j][k] = Board.field.empty;
            }
        }
    }
}

// deletes active block
function removeObjectScene(mesh) {
	scene.remove(mesh);
	mesh = undefined;
}

// makes a copy of a given vector
function cloneVector(v) {
	return {x: v.x, y: v.y, z: v.z};
}

// rounds vectors (useful for rounding float coords)
function roundVector(v) {
	v.x = Math.round(v.x);
	v.y = Math.round(v.y);
	v.z = Math.round(v.z);
}

// self-explanatory name
function createMultiMaterialObject( geometry, materials ) {
	const group = new THREE.Group();
	for ( let i = 0; i < materials.length; i++ ) {
		group.add( new THREE.Mesh( geometry, materials[i] ) );
	}

	return group;
}

// given a set of coordinates, creates a single static block
function createStaticBlocks(x, y, z) {
	if(staticBlocks[x] === undefined) staticBlocks[x] = [];
	if(staticBlocks[x][y] === undefined) staticBlocks[x][y] = [];

	var mesh = createMultiMaterialObject(new THREE.BoxGeometry( blockSize, blockSize, blockSize), [
		new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true}),
		new THREE.MeshBasicMaterial({color: zColors[1]})]);

	mesh.position.x = (x)*blockSize + blockSize/2;
	mesh.position.y = (y)*blockSize + blockSize/2;
	mesh.position.z = (z)*blockSize + blockSize/2;

	mesh.overdraw = true;

	scene.add(mesh);

	staticBlocks[x][y][z] = mesh;
}

// creates an active merged block at a randomized location
function create() {
	let geometries = [];

	// randomize color and type of block
	let color = Math.floor(Math.random() * zColors.length);
	let type = Math.floor(Math.random() * Blocks.shapes.length);
	Blocks.type = type;
	Blocks.shape = [];

	// updates current block with the randomly selected type
	for (let i = 0; i < Blocks.shapes[type].length; i++) {
		Blocks.shape[i] = cloneVector(Blocks.shapes[type][i]);
	}

	// create a merged object from the individual "blocks" and associated mesh
	for (let i = 0; i < Blocks.shape.length; i++) {
        let tempGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        tempGeometry.translate(blockSize * Blocks.shape[i].x, blockSize * Blocks.shape[i].y, 0);
        geometries.push(tempGeometry);
    }

    let mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
	Blocks.mesh = createMultiMaterialObject(mergedGeometry, [
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            //shading: THREE.FlatShading,
            wireframe: true,
            transparent: true,
        }),
        new THREE.MeshBasicMaterial({ color: zColors[color]}),
    ]);

	// randomize block position
	Blocks.position = {
		x: Math.floor(Math.random()*divisions), y: divisions-3, z: Math.floor(Math.random()*divisions)
	};

	// only occurs if the player loses
	if (collisionCheck(true) === Board.collision.floor) {
		gameOver = true;
	} 

	// update current block mesh position and add to scene
	Blocks.mesh.position.x = (Blocks.position.x) * blockSize + blockSize / 2;
    Blocks.mesh.position.y = (Blocks.position.y) * blockSize + blockSize / 2;
    Blocks.mesh.position.z = (Blocks.position.z) * blockSize + blockSize / 2;
	Blocks.mesh.overdraw = true;

	scene.add(Blocks.mesh);
}

// rotates the block by the provided degrees
function rotate(x, y, z) {
	// convert to radians
	Blocks.mesh.rotation.x += (x * Math.PI) / 180;
	Blocks.mesh.rotation.y += (y * Math.PI) / 180;
	Blocks.mesh.rotation.z += (z * Math.PI) / 180;

	// create rotation matrix and apply to current block coordinates
	let rotMatrix = new THREE.Matrix4();
	rotMatrix.makeRotationFromEuler(Blocks.mesh.rotation);
	
	// apply rotation matrix to coordinates
	for (let i = 0; i < Blocks.shape.length; i++) {
		let vector = Blocks.shapes[Blocks.type][i];
		
		// workaround to do matrix multiplication since applyMatrix4 wasn't working (manual mult)
		Blocks.shape[i].x = vector.x * rotMatrix.elements[0] + vector.y * rotMatrix.elements[4] 
			+ vector.z * rotMatrix.elements[8] + rotMatrix.elements[12];
		Blocks.shape[i].y = vector.x * rotMatrix.elements[1] + vector.y * rotMatrix.elements[5] 
			+ vector.z * rotMatrix.elements[9] + rotMatrix.elements[13];
		Blocks.shape[i].z = vector.x * rotMatrix.elements[2] + vector.y * rotMatrix.elements[6] 
			+ vector.z * rotMatrix.elements[10] + rotMatrix.elements[14];
		roundVector(Blocks.shape[i]);
	}
	// prevent bad rotates
	if (collisionCheck(false) === Board.collision.floor || collisionCheck(false) === Board.collision.wall) {
		rotate(-x, -y, -z);
	} 
}

// moves the block by the provided units
function move(x, y, z) {
	// adjust block by x, y, and z units
	Blocks.mesh.position.x += x * blockSize;
	Blocks.position.x += x;

	Blocks.mesh.position.y += y * blockSize;
	Blocks.position.y += y;

	// ensures that no block goes past the bottom of the grid
	if (Blocks.position.y < 0) {
		Blocks.mesh.position.y = 0;
		Blocks.position.y = 0;
	}

	Blocks.mesh.position.z += z * blockSize;
	Blocks.position.z += z;

	// see if the move will collide with the wall or floor and take appropriate action
	let collisionCheckFlag = collisionCheck(y != 0);
	if (collisionCheckFlag === Board.collision.wall) {
		move(-x, 0, -z);
	} else if (collisionCheckFlag === Board.collision.floor) {
		grounded();
		checkComplete();
	}
}

// turn each active invidual block into a static block
function solidify() {
	let shape = Blocks.shape;

	for (let i = 0; i < shape.length; i++) {
		let newX = Blocks.position.x + shape[i].x;
		let newY = Blocks.position.y + shape[i].y;
		let newZ = Blocks.position.z + shape[i].z;
		createStaticBlocks(newX, newY, newZ);

		// update the fields array
		Board.fields[newX][newY][newZ] = Board.field.solidified;
	}
}

// series of actions taken when an active block should turn solid
function grounded() {
	solidify();
	removeObjectScene(Blocks.mesh);
	create();
}

// checks whether a block collids with the wall, floor, or another block
function collisionCheck(groundedFlag) {
	let fields = Board.fields;
	let posX = Blocks.position.x;
	let posY = Blocks.position.y;
	let posZ = Blocks.position.z;
	let shape = Blocks.shape;

	for (let i = 0; i < shape.length; i++) {
		let newX = shape[i].x + posX;
		let newY = shape[i].y + posY;
		let newZ = shape[i].z + posZ;

		// if block will hit either wall
		if (newX < 0 ||
			newZ < 0 ||
			newX > fields.length - 1 ||
			newZ > fields[0].length - 1) {
			return Board.collision.wall;
		}
		
		// if block will hit the floor
		if (newY <= 0) return Board.collision.floor;

		// if block will hit another block
		if (fields[Math.round(newX)][Math.round(newY) - 1][Math.round(newZ)] === Board.field.solidified) {
			return groundedFlag ? Board.collision.floor : Board.collision.wall;
		}
	}
}

// PROTOTYPE, UNSURE IF WORKING 
// checks if a level has been cleared and deletes the entire level 
function checkComplete() {
	let fields = Board.fields;
	let rebuild = false;
	let sum;

	// number of a whole row of cells
	let expected = fields[0].length * fields.length;

	// find the number of solid cells in each row
	for (let z = 0; z < fields[0][0].length; z++) {
		sum = 0;
		for (let y = 0; y < fields[0].length; y++) {
			for (let x = 0; x < fields.length; x++) {
				if (fields[x][y][z] === Board.field.solidified) sum++;
			}
		}

		// if criteria has been met for row clear, row clear
		if (sum == expected) {
			for (let y2 = 0; y2 < fields[0].length; y2++) {
				for (let x2 = 0; x2 < fields.length; x2++) {
					for (let z2 = z; z2 < fields[0][0].length - 1; z2++) {
						Board.fields[x2][y2][z2] = fields[x2][y2][z2 + 1];
					}
					Board.fields[x2][y2][fields[0][0].length - 1] = 
						Board.field.empty;
				}
			}
			rebuild = true;
			z--;
		}
	}

	// push the rows that weren't cleared and are floating down one
	if (rebuild) {
		for (let z = 0; z < fields[0][0].length - 1; z++) {
			for (let y = 0; y < fields[0].length; y++) {
				for (let x = 0; x < fields.length; x++) {
					if (fields[x][y][z] === Board.field.solidified && !staticBlocks[x][y][z]) {
						createStaticBlocks(x, y, z);
					}
					if (fields[x][y][z] == Board.field.empty && staticBlocks[x][y][z]) {
						removeObjectScene(staticBlocks[x][y][z]);
						staticBlocks[x][y][z] = undefined;
					}
				}
			}
		}
	}
}

// create 3d grid for background
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

// all the functions related to user input, all pretty self-explanatory
function setupButtons() {
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
			});
		}
		started = true;
		create();
		animate();
	}

	document.getElementById("rotateX").onclick = function() {
		rotate(90, 0, 0);
	}

	document.getElementById("rotateY").onclick = function() {
		rotate(0, 90, 0);
	}

	document.getElementById("rotateZ").onclick = function() {
		rotate(0, 0, 90);
	}

	document.getElementById("moveLeft").onclick = function() {
		move(blockSpeed, 0, 0);
	}

	document.getElementById("moveRight").onclick = function() {
		move(-(blockSpeed), 0, 0);
	}

	document.getElementById("moveUp").onclick = function() {
		move(0, 0, blockSpeed);
	}

	document.getElementById("moveDown").onclick = function() {
		move(0, 0, -(blockSpeed));
	}

	document.getElementById("softDrop").onclick = function() {
		move(0, blockSpeed, 0);
	}

	document.getElementById("hardDrop").onclick = function() {
		move(0, -1000, 0);
	}
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
	
	initBoard(divisions, divisions, divisions);

	camera.position.set( 350, 225, 350 );

	setupButtons();
}

// commented out because causes game to break with rotations through walls, etc.
// haven't tested it with my revised code so maybe it works now idk
// window.addEventListener('keydown', function (event) {	
//     switch (event.key) {
// 		case "ArrowUp":
//             move(0, 0, -1*blockSize);
//             break;

//         case "ArrowDown":
//             move(0, 0, blockSize);
//             break;

//         case "ArrowLeft":
//             move(-1*blockSize, 0, 0);
//             break;

//         case "ArrowRight":
//             move(blockSize, 0, 0);
//             break;

//         case " ": 
//             move(0, -1*divisions, 0 );
//             break;

//         case "w":
//             rotate(90, 0, 0);
//             break;

//         case "s":
//             rotate(-90, 0, 0);
//             break;

//         case "a":
//             rotate(0, 0, 90);
//             break;

//         case "d":
//             rotate(0, 0, -90);
//             break;

//         case "q":
//             rotate(0, 90, 0);
//             break;

//         case "e":
//             rotate(0, -90, 0);
//             break;
//     }
// }, false);

// moves the block and updates animation based in real time
function animate() {
	let time = Date.now();
	times.frameTime = time - times.lastFrameTime;
	times.lastFrameTime = time;
	times.currFrameTime += times.frameTime;

	while (times.currFrameTime > times.stepTime) {
		times.currFrameTime -= times.stepTime;
		move(0, blockSpeed, 0);
	}

	if (!gameOver) {
		requestAnimationFrame(animate);
		controls.update();
	}
	renderer.render(scene, camera);
}

function main() {
	init();
}

main()