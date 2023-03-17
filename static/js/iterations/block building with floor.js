let emptyMap;
let inputMap;
let scene;

let objects = [];
let floorBlocks = [];

let allowModification;


window.onload  = function () {

    //grid constructor
    const gridLength = 7;

    emptyMap = [];
    var twoDmap = [];
    var oneDmap = [];

    for (let i=0;i<gridLength;i++) {
      oneDmap.push(null);
    }
    for (var i=0; i<gridLength; i++) {
      twoDmap.push(clone(oneDmap));
    }
    for (var i=0;i<gridLength;i++) {
      emptyMap.push(clone(twoDmap));
    }

    const centerOffset = (gridLength / 2 - .5);



    // Debug
    //const gui = new dat.GUI()

    // Canvas
    const canvas = document.querySelector('canvas.webgl');
    const renderer = new THREE.WebGLRenderer( {canvas} );

    // Scene
    scene = new THREE.Scene();

    // Objects


    inputMap = clone(emptyMap);
    wfcMap = clone(emptyMap);
    nullMap = clone(emptyMap);


    for ([x, slice] of emptyMap.entries()) {
        for ([y,row] of slice.entries()) {
            for ([z,tile] of row.entries()) {
                //inputMap[x][y][z] = Math.round(Math.random())
                inputMap[x][y][z] = 0
                nullMap[x][y][z] = 0
            }
        }
    }
    prevWfcMap = nullMap

    // floor
    // add a block for every x y and z=-1 to form a platform
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial()
    for ([x, slice] of emptyMap.entries()) {
        for ([y, row] of slice.entries()) {
            const floor = new THREE.Mesh(geometry, material);
            floor.position.set(x, -1, y)
            floorBlocks.push(floor)
            scene.add(floor)
        }
    }


    // Lights
    const color = 0xFFFFFF;
    const intensity = .5;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    window.addEventListener('resize', function(e) {
        resize()
    })
    function resize() {
        // Update sizes
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Update camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        controls.target.set(centerOffset, centerOffset, centerOffset);

        // Update renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }


    /**
     * Renderer
     */


    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild (renderer.domElement);

    renderer.physicallyCorrectLights = true;
    //renderer.setClearColor( 0x87CEEB );

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    /**
     * Camera
     */
    // Base camera
    //camera = new THREE.PerspectiveCamera (45, window.width/window.height, 1, 10000);
    //camera.position.y = 160;
    //camera.position.z = 400;
    //camera.lookAt (new THREE.Vector3(0,0,0));

    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect);
    camera.position.set(0, 10, 20);

    const controls = new THREE.OrbitControls(camera);


    /**
     * Animate
     */
    const clock = new THREE.Clock();



    constructMap()
    refreshScene()

    const tick = () => {

        const elapsedTime = clock.getElapsedTime();

        //selector
        raycaster.setFromCamera(mouse, camera);
        var objectIntersects = raycaster.intersectObjects(objects, false);
        if (objectIntersects.length > 0) {
            var intersectObject = objectIntersects[0];
            //intersectObject.object.material.color = 0x00FFFF;
            delPos = clone(intersectObject.object.position)
            addPos = clone(delPos).add(intersectObject.face.normal)

            allowModification = true
        } else {
            allowModification = false
        }


        // Update Orbital Controls
        // controls.update()

        // Render
        controls.update();
        //requestAnimationFrame ( animate );
        renderer.render(scene, camera);
        camera.updateProjectionMatrix();

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', function () {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', function (event) {
        if (allowModification) {
            switch (event.which) {
                case 1: //left click
                    if (0 <= addPos.x && 0 <= addPos.y && 0 <= addPos.z) {
                        if (addPos.x <= gridLength && addPos.y <= gridLength && addPos.z <= gridLength) {
                            console.log(addPos.x)
                            inputMap[addPos.x][addPos.y][addPos.z] = 1
                        }
                    }
                    console.log('Add')
                    break;

                case 2: // middle click
                    break;

                case 3: //right click
                    console.log(delPos, addPos)
                    if (delPos.y !== -1) {
                        inputMap[delPos.x][delPos.y][delPos.z] = 0
                    }
                    break;

                default:
                    alert('wacky ass mouse')

            }

            constructMap()
            refreshScene()
        }
    });


    resize()
    tick();
};

//Artificial will not need forever
function constructMap() {
    wfcMap = clone(emptyMap)
    objects = [];
    objects.push(...floorBlocks)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    //const material = new THREE.MeshStandardMaterial();
    const material = new THREE.MeshNormalMaterial()
    for ([x, slice] of emptyMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (inputMap[x][y][z] == 1) {
                    const cube = new THREE.Mesh(geometry, material);
                    //cube.material.color.setHex( 0x00FFFF );
                    cube.position.set(x, y, z)
                    wfcMap[x][y][z] = cube;
                    objects.push(cube);
                }
            }
        }
    }

    //console.log(inputMap)
    //console.log(wfcMap)
}


function refreshScene() {
    for ([x, slice] of emptyMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (prevWfcMap[x][y][z] !== null) {
                    console.log(prevWfcMap)
                    scene.remove(prevWfcMap[x][y][z])
                    objects = removeItem(objects, prevWfcMap[x][y][z]);
                    //console.log('Remove Block')
                }
                if (wfcMap[x][y][z] !== null) {
                    scene.add(wfcMap[x][y][z])
                    objects.push(wfcMap[x][y][z]);
                    //console.log('Added Block')
                }
            }
        }
    }
    prevWfcMap = wfcMap
}


function removeItem (array, removeItem) {
    const index = array.indexOf(removeItem);
    if (index > -1) {
        array.splice(index);
    }
    return array
}


function clone(obj){
    if (obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor();
    for (var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}


function findLowestEntropy() {

}

function wfc() {

}