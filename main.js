import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

var renderer, scene, camera, controls, cube;
var started = false;
var on_ground = 1;
var theBlockShape;
var staticBlocks = [];
var zColors = [
	0x6666ff, 0x66ffff, 0xcc68EE, 0x666633, 
	0x66ff66, 0x9966ff, 0x00ff66, 0x66EE33, 
	0x003399, 0x330099, 0xFFA500, 0x99ff00, 
	0xee1289, 0x71C671, 0x00BFFF, 0x666633, 
	0x669966, 0x9966ff
  ];
var blockShapes = [
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

var blockPosition = {};

function blockGenerate() {
	var geometry, tmpGeometry;

	var type = Math.floor(Math.random()*(blockShapes.length));

	var blockType = type;

	var theBlockShape = [];

	for(var i = 0; i < blockShapes[type].length; i++) {

		theBlockShape[i] = cloneVector(blockShapes[type][i]);

	}
  	geometry = new THREE.BoxGeometry(20, 20, 20);
  
  	for(var i = 1 ; i < theBlockShape.length; i++) {

  		tmpGeometry = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20));

  		tmpGeometry.position.x = 20 * blockShapes[i].x;

  		tmpGeometry.position.y = 20 * blockShapes[i].y;

		var mergedGeometry = BufferGeometryUtils.mergeGeometries([geometry, tmpGeometry]);
	}

	var new_mesh = createMultiMaterialObject(geometry, [
		new THREE.MeshBasicMaterial({
		  color: 0x000000,
		  //shading: THREE.FlatShading,
		  wireframe: true,
		  transparent: true
		}),
		new THREE.MeshBasicMaterial({ color: 0xfffff }),
	  ]);

	blockPosition = {x: Math.floor(0/2)-1, y: Math.floor(0/2)-1, z: 15};

	new_mesh.position.x = (blockPosition.x - 0/2)*20/2;

	new_mesh.position.y = (blockPosition.y - 0/2)*20/2;

	new_mesh.position.z = (blockPosition.z - 0/2)*20 + 20/2;

	new_mesh.overdraw = true;

	scene.add(new_mesh);
};

function blockGenerate2() {
    var geometries = [];
	// can do this manually since there are only so many types of blocks
    var type = Math.floor(Math.random() * blockShapes.length);
    var theBlockShape = [];

    for (var i = 0; i < blockShapes[type].length; i++) {
        theBlockShape[i] = cloneVector(blockShapes[type][i]);
    }

    for (var i = 0; i < theBlockShape.length; i++) {
        var tmpGeometry = new THREE.BoxGeometry(20, 20, 20);

        tmpGeometry.translate(20 * theBlockShape[i].x, 20 * theBlockShape[i].y, 0);

        geometries.push(tmpGeometry);
    }

    var mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    var new_mesh = createMultiMaterialObject(mergedGeometry, [
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            //shading: THREE.FlatShading,
            wireframe: true,
            transparent: true
        }),
        new THREE.MeshBasicMaterial({ color: 0xfffff })
    ]);

    var blockPosition = { x: Math.floor(0 / 2) - 1, y: Math.floor(0 / 2) - 1, z: 0 };
	
    new_mesh.position.x = (blockPosition.x - 0 / 2) * 20 + 180 / 2;
    new_mesh.position.y = (blockPosition.y - 0 / 2) * 20 + 420 / 2;
    new_mesh.position.z = (blockPosition.z - 0 / 2) * 20 + 180 / 2;
    new_mesh.overdraw = true;

    scene.add(new_mesh);
}



function createMultiMaterialObject( geometry, materials ) {

	const group = new THREE.Group();

	for ( let i = 0, l = materials.length; i < l; i++ ) {
		group.add( new THREE.Mesh( geometry, materials[ i ] ) );
	}

	return group;

}

function cloneVector(v) {
	return {x: v.x, y: v.y, z: v.z};
};

function addStaticBlock(x,y,z) {
	if(staticBlocks[x] === undefined) staticBlocks[x] = [];
	if(staticBlocks[x][y] === undefined) staticBlocks[x][y] = [];

	var mesh = createMultiMaterialObject(new THREE.BoxGeometry( 20, 20, 20), [
		new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true}),
		new THREE.MeshBasicMaterial({color: zColors[z]})
	  ] );

	mesh.position.x = (x - 0/2)*20 + 20/2;
	mesh.position.y = (y - 0/2)*20 + 20/2;
	mesh.position.z = (z - 0/2)*20 + 20/2;
	//mesh.position.x = 10;
	//mesh.position.y = 190;
	//mesh.position.z = 10;
	mesh.overdraw = true;

	scene.add(mesh);

	staticBlocks[x][y][z] = mesh;
};

function addBlock() {
	const geometry = new THREE.BoxGeometry( 20, 20, 20 ); 
	const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
	cube = new THREE.Mesh( geometry, material ); 
	scene.add( cube );
	cube.position.x = 10;
	cube.position.y = 190;
	cube.position.z = 10;
}

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
	
	addStaticBlock(0,0,0);

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
				sound.setVolume( 0.25 );
				sound.play();

				document.getElementById("start").remove();
				document.getElementById("rotateX").style.visibility = "visible";
				document.getElementById("rotateY").style.visibility = "visible";
				document.getElementById("drop").style.visibility = "visible";

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

	// if (cube.position.y > 10) {
	// 	cube.position.y -= 1;
	// 	on_ground = 2
	// };

	// if (on_ground == 2) {
	// 	addBlock();
	// }

	blockGenerate2();

	renderer.render( scene, camera );
  
  	// if (started) {
	// 	alert("HELP");
	// }
}

function main() {
	init();
	animate();
}

main();