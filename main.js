import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let Blocks = {};
var renderer, scene, camera, controls, cube;
var started = false;
var on_ground = 1;
Blocks.position = {};
var theBlockShape;
var staticBlocks = [];

//var inGame = true;
var zColors = [
	0x6666ff, 0x66ffff, 0xcc68EE, 0x666633, 
	0x66ff66, 0x9966ff, 0x00ff66, 0x66EE33, 
	0x003399, 0x330099, 0xFFA500, 0x99ff00, 
	0xee1289, 0x71C671, 0x00BFFF, 0x666633, 
	0x669966, 0x9966ff
  ];
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

var blockPosition = {};

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

    Blocks.mesh = createMultiMaterialObject(mergedGeometry, [
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            //shading: THREE.FlatShading,
            wireframe: true,
            transparent: true,
        }),
        new THREE.MeshBasicMaterial({ color: 0xfffff }),
    ]);

    //Blocks.blockPosition = { x: Math.floor(0 / 2) - 1, y: Math.floor(0 / 2) - 1, z: 0 };
	Blocks.blockPosition = { x: 0, y: 10, z: 0 };

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
	
	//addStaticBlock(0,0,0);

	//addBlock();
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

function moveBlock (x,y,z) {

	Blocks.mesh.position.x += x;
	Blocks.position.x += x;
  
	Blocks.mesh.position.y += y;
	Blocks.position.y += y;
   
	Blocks.mesh.position.z += z;
	Blocks.position.z += z;
  
	if(Blocks.mesh.position.y == 0) hitBottom();
  
  };

function hitBottom() {

	freeze();
	//scene.removeObject(Blocks.mesh);
	blockGenerate();
  
  };

function freeze() {

	var shape = Blocks.shape;
	for(var i = 0 ; i < shape.length; i++) {
		addStaticBlock(Blocks.position.x + shape[i].x, Blocks.position.y + shape[i].y, Blocks.position.z + shape[i].z);
	}
  
  };

function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	//controls.update() must be called after any manual changes to the camera's transform
	controls.update();

	//if (cube.position.y > 10) {
	 	//cube.position.y -= 1;
	 	//on_ground = 2
	//};

	//if (on_ground == 2) {
	 	//addBlock();
	//}
	moveBlock(0,-1,0);
	//console.log(Blocks.position)

	//blockGenerate2();

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
