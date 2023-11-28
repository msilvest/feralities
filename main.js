import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var renderer, scene, camera, controls;
var started = false;

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
	
	controls = new OrbitControls( camera, renderer.domElement );

	createGrid();

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
				document.getElementById("dropbtn").style.visibility = "visible";

			});
		}
        started = true;
    }


}

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	//controls.update() must be called after any manual changes to the camera's transform
	controls.update();

	renderer.render( scene, camera );

	if (inGame) {
		alert("HELP");
	}

}

function main() {
	init();
	animate();
}

main()
