import * as THREE from 'three';
import * as MATH from 'mathjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var renderer, scene, camera, controls;
var started = false;
var game;

var blockData = [];

// Block class
class Block {
	constructor(data) {
		this.data = data;
	}
}

// Game controller class
class Game {
	constructor() {
		this.over = false;
		this.grid = new Array(12).fill(new Array(4).fill(new Array(4).fill(0)));
		this.curr = null;
		this.next = null;
		this.store = null;
	}

	clearRows() {
	}

	storeBlock() {
		if (this.store) {
			var temp = this.store;
			this.store = this.curr;
			this.curr = temp;
		}
		else {
			this.store = this.curr;
			this.curr = this.next;
			this.next = randomBlock();
		}
	}
}

function randomBlock() {
	var rand = Math.floor(Math.random() * blockData.length);
	return new Block(blockData[rand]);
}

// Create 3d Grid
function createGrid() {
	var gridXZ = new THREE.GridHelper(100, 4);
	gridXZ.position.set( 100,-150,100 );
	scene.add(gridXZ);

	var gridXY = new THREE.GridHelper(100, 4);
	gridXY.position.set( 100,-100,50 );
	gridXY.rotation.x = Math.PI/2;
	scene.add(gridXY);
	var gridXY2 = new THREE.GridHelper(100, 4);
	gridXY2.rotation.x = Math.PI/2;
	gridXY2.position.set( 100,0,50 );
	scene.add(gridXY2);
	var gridXY3 = new THREE.GridHelper(100, 4);
	gridXY3.rotation.x = Math.PI/2;
	gridXY3.position.set( 100,100,50 );
	scene.add(gridXY3);

	var gridYZ = new THREE.GridHelper(100, 4);
	gridYZ.position.set( 50,-100,100 );
	gridYZ.rotation.z = Math.PI/2;
	var gridYZ2 = new THREE.GridHelper(100, 4);
	gridYZ2.rotation.z = Math.PI/2;
	gridYZ2.position.set( 50,0,100 );
	scene.add(gridYZ2);
	var gridYZ3 = new THREE.GridHelper(100, 4);
	gridYZ3.rotation.z = Math.PI/2;
	gridYZ3.position.set( 50,100,100 );
	scene.add(gridYZ3);
	

	scene.add(gridYZ);
}

function init() {

	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
	scene.add(camera);

	const canvas = document.getElementById('canvas');

	renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setSize( window.innerWidth, window.innerHeight*.95 );
	
	controls = new OrbitControls( camera, renderer.domElement );

	createGrid();

	camera.position.set( 375, 100, 375 );

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
				document.getElementById("drop").style.visibility = "visible";
				document.getElementById("store").style.visibility = "visible";

			});
		}
        started = true;
    }

	game = new Game();
}

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	//controls.update() must be called after any manual changes to the camera's transform
	controls.update();

	renderer.render( scene, camera );

}

function main() {
	init();
	animate();
}

main()
