let emptyInputMap;
let inputMap;
let outputMap;
let scene;
let loader;

let centerOffset;

let objects = [];
let inputObjects = [];
let floorBlocks = [];

let modules;

let allowModification;

let map;


window.onload  = function () {

    inputModules = adjacencyData;

    modules = {'air': [],
               'land': [],
               'insideLand': [],
               'flatLand': []};
    for (module of inputModules) {
        key = module['id'].slice(0, 3)
        if (key === '666') {
            modules['air'].push(module);
        } else if (key === '999') {
            modules['insideLand'].push(module);
            modules['land'].push(module);
        } else {
            modules['land'].push(module);
        }
        if (module['id'].slice(0, 2) == '0|') {
            modules['flatLand'].push(module)
        }
    }

    //grid constructor
    gridLength = 7;

    var oneDmapIn = [];
    var twoDmapIn = [];
    emptyInputMap = [];

    for (var i=0;i<gridLength;i++) {
      oneDmapIn.push(null);
    }
    for (var i=0; i<gridLength; i++) {
      twoDmapIn.push(clone(oneDmapIn));
    }
    for (var i=0;i<gridLength;i++) {
      emptyInputMap.push(clone(twoDmapIn));
    }

    inputMap = clone(emptyInputMap);
    nullMap = clone(emptyInputMap);
    inputCubeMap = clone(emptyInputMap);
    prevInputCubeMap = clone(emptyInputMap)


    var oneDmapOut = [];
    var twoDmapOut = [];
    emptyOutputMap = [];

    for (var i=0;i<gridLength+1;i++) {
      oneDmapOut.push(null);
    }
    for (var i=0; i<gridLength+1; i++) {
      twoDmapOut.push(clone(oneDmapOut));
    }
    for (var i=0;i<gridLength+1;i++) {
      emptyOutputMap.push(clone(twoDmapOut));
    }

    outputMap = clone(emptyInputMap)
    outputCubeMap = clone(emptyOutputMap);
    prevOutputCubeMap = clone(emptyOutputMap)

    centerOffset = (gridLength / 2 - .5);


    // Temp Random Cubes and nullmap
    for ([x, slice] of emptyInputMap.entries()) {
        for ([y,row] of slice.entries()) {
            for ([z,tile] of row.entries()) {
                //inputMap[x][y][z] = Math.round(Math.random())
                inputMap[x][y][z] = 0
                nullMap[x][y][z] = 0
            }
        }
    }


    // Debug

    // Canvas
    const canvas = document.querySelector('canvas.webgl');
    const renderer = new THREE.WebGLRenderer( {canvas} );

    // Scene
    scene = new THREE.Scene();
    loader = new THREE.GLTFLoader()
    scene.add(new THREE.AxesHelper(5))

    // floor
    //const geometry = new THREE.BoxGeometry(gridLength, 1, gridLength);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial()
    const floor = new THREE.Mesh(geometry, material);
    //floor.position.set(centerOffset, -1, centerOffset)
    //scene.add(floor)
    for (x=0;x<gridLength;x++) {
        for (y=0;y<gridLength;y++) {
            const floor = new THREE.Mesh(geometry, material);
            floor.position.set(x, -1, y)
            floorBlocks.push(floor)
            scene.add(floor)
        }
    }


    // Lights

    const color = 0xFFFFFF;
    const intensity = 1;
    const ambientLight = new THREE.AmbientLight(color, intensity);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight( 0xf0f0f0, 1, 100, 0);
    pointLight.position.set( -1, 2, -1 );
    pointLight.castShadow = true;
    scene.add(pointLight)

    var spheresize = 1;
    var pointLightHelper = new THREE.PointLightHelper( pointLight, spheresize );
    scene.add( pointLightHelper );

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
        var objectIntersects = raycaster.intersectObjects(inputObjects, false);
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
                        console.log('remove')
                    }
                    break;

                default:
                    alert('wacky ass mouse')

            }

            constructMap()
            wfcController(outputMap)
            refreshScene()
        }
    });


    resize()
    tick();
};

function constructMap() {
    inputCubeMap = clone(emptyInputMap)
    outputCubeMap = clone(emptyOutputMap)
    outputMap = clone(emptyOutputMap)
    objects = [];
    inputObjects = [];
    inputObjects.push(...floorBlocks)

    objects.push(...floorBlocks)
    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    const geometry = new THREE.BoxGeometry(.9, .9, .9);

    //color,opacity,transparent
    const inputMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() * 0x808008 + 0x808080,
        transparent: true,
        opacity: 0
      })
    const outputMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() * 0x808008 + 0x808080,
        transparent: true,
        opacity: 0.2
      })

    for ([x, slice] of emptyInputMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (inputMap[x][y][z] == 1) {
                    const cube = new THREE.Mesh(geometry, inputMaterial);
                    cube.material.color.setHex( 0x00FFFF );
                    cube.position.set(x, y, z)
                    inputCubeMap[x][y][z] = cube;
                    objects.push(cube);

                    //a little more permanent:
                    for (xi=0;xi<2;xi++) {
                        for (yi=0;yi<2;yi++) {
                            for (zi=0;zi<2;zi++) {
                                const outCube = new THREE.Mesh(geometry, outputMaterial);
                                //outCube.material.color.setHex( 0xFF00FF );
                                outCube.position.set(x + xi - .5, y + yi - .5, z + zi - .5)
                                outputCubeMap[x+xi][y+yi][z+zi] = outCube
                                outputMap[x + xi][y + yi][z + zi] = 1
                            }
                        }
                    }
                    console.log("a",x,y,z)
                    console.log("b",x+1,y+1,z+1)
                    console.log("aa",outputCubeMap.length)
                }
            }
        }
    }
    //console.log(inputMap)
    //console.log(inputCubeMap)
}
//Artificial will not need all of it forever


function refreshScene() {
    //input
    for ([x, slice] of emptyInputMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {

                if (prevInputCubeMap[x][y][z] !== null) {
                    console.log(prevInputCubeMap)
                    scene.remove(prevInputCubeMap[x][y][z])
                    objects = removeItem(objects, prevInputCubeMap[x][y][z]);
                    inputObjects = removeItem(inputObjects, prevInputCubeMap[x][y][z]);
                    //console.log('Remove Block')
                }
                if (inputCubeMap[x][y][z] !== null) {
                    scene.add(inputCubeMap[x][y][z])
                    objects.push(inputCubeMap[x][y][z]);
                    inputObjects.push(inputCubeMap[x][y][z])
                    //console.log('Added Block')
                }
            }
        }
    }
    //Output
    for ([x, slice] of emptyOutputMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (prevOutputCubeMap[x][y][z] !== null) {
                    scene.remove(prevOutputCubeMap[x][y][z])
                    objects = removeItem(objects, prevOutputCubeMap[x][y][z]);
                }
                if (outputCubeMap[x][y][z] !== null) {
                    scene.add(outputCubeMap[x][y][z])
                    objects.push(outputCubeMap[x][y][z]);
                    //console.log('Added Block')
                }
            }
        }
    }
    prevInputCubeMap = inputCubeMap
    prevOutputCubeMap = outputCubeMap
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

function isCollapsed(map) {
    for ([x, slice] of map.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (map[x][y][z].length > 1) {
                    return false
                }
            }
        }
    }
    return true
}

function findLowestEntropy() {
    lowest = inputModules.length + 1
    coords = []
    for ([x, slice] of map.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (map[x][y][z].length < lowest && map[x][y][z].length != 1) {
                    coords = [[x,y,z]]
                    lowest = map[x][y][z].length
                } else if (map[x][y][z].length === lowest) {
                    coords.push([x,y,z])
                }
            }
        }
    }
    return coords[Math.floor((Math.random()*coords.length))];
    //return coords[0]
}

//async function wfcController(binaryMap) {
async function wfcController(binaryMap) {

    map = clone(emptyOutputMap)

    //fits map to input
    for (x=0;x<emptyOutputMap.length;x++) {
        for (y=0;y<emptyOutputMap.length;y++) {
            for (z=0;z<emptyOutputMap.length;z++) {
                if (y == 0) {
                    //if (binaryMap[x][y][z] === 1) {
                    //    map[x][y][z] = clone(modules['land'])
                    //} else {
                    //    map[x][y][z] = clone(modules['air'])
                    //}
                    map[x][y][z] = clone(modules['land'])
                } else
                    map[x][y][z] = clone(modules['air'])
            }
        }
    }

    //fit the map into "lowest denominator"
    for (y=-1;y<outputMap.length+1;y++) {
        for (x=-1;x<outputMap.length+1;x++) {
            for (z=-1;z<outputMap.length+1;z++) {
                //edge tile
                if (z == -1 || z == outputMap.length || x == -1 || x == outputMap.length || y == -1 || y == outputMap.length) {
                    if (false) {
                        if (y == -1) {
                            wfc(x, y, z, 'insideLand')
                        } else if (y == 0) {
                            wfc(x, y, z, 'land')
                        } else {
                            wfc(x, y, z, 'air')
                        }
                    }
                } else {
                    wfc(x, y, z, '')
                }
            }
        }
    }



    console.log(map)

    while (!(isCollapsed(map))){
        console.log('Doin the thing')
        coords = findLowestEntropy()
        x = coords[0]
        y = coords[1]
        z = coords[2]
        //collapse chosen tile
        map[x][y][z] = [map[x][y][z][Math.floor((Math.random()*map[x][y][z].length))]]
            //map[x][y][z] = [map[x][y][z][0]]
        //console.log(map[x][y][z])
        wfc(x, y, z, '')
    }

    //disply modules
    for ([x, slice] of outputMap.entries()) {
        for ([y, row] of slice.entries()) {
            for ([z, tile] of row.entries()) {
                if (!compareArrays(map[x][y][z], [])) {
                    baseKey = map[x][y][z][0]['id'].slice(0, 3)
                    if (baseKey !== '666' && baseKey !== '999') {
                        console.log(x, y, z, map[x][y][z][0]['id'])
                        await loadOBJ(map[x][y][z][0]['id'], x, y, z)
                        //loadOBJ(map[x][y][z][0]['id'], x, y, z)
                    }
                }
            }
        }
    }
    for (x of map) {
        console.log(x[0][0][0])
    }
}

dirs = ['PosX', 'PosY', 'PosZ', 'NegX', 'NegY', 'NegZ']
numDirs = [[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]]
//numDirs = [[1,0,0],[0,0,1],[0,1,0],[-1,0,0],[0,0,-1],[0,-1,0]]
//map global or local!!!???!!!
function wfc(x, y, z, moduleType) {
    examine = [0, 0, 0]
    //console.log('start')
    //console.log('x, y, z : ', x, y, z)
    for ([index, direction] of dirs.entries()) {
        numdir = numDirs[index]
        //check neighbour is within bounds
        if (0 <= x+numdir[0] && x+numdir[0] <= gridLength && 0 <= y+numdir[1] && y+numdir[1] <= gridLength && 0 <= z+numdir[2] && z+numdir[2] <= gridLength) {
            //console.log(map)
            //console.log(moduleType)
            neighbourCoords = [x + numdir[0], y + numdir[1], z + numdir[2]]
            if (moduleType) {
                //console.log('retrieve data from vars')
                allowedNeighbourIDs = getAllowedNeighboursIDs(clone(modules[moduleType]), direction)
                //console.log(x,y,z, moduleType)
                if (compareArrays(neighbourCoords, examine) && false) {
                    console.log('direction : ', direction)
                    console.log('me', x,y,z, moduleType)
                    console.log('me allows', allowedNeighbourIDs)
                }
            } else {
                //console.log('retrieve data from map')
                if (compareArrays(neighbourCoords, examine) && false) {
                    //console.log('me but before : ', map[x][y][z]);
                }
                allowedNeighbourIDs = clone(getAllowedNeighboursIDs(map[x][y][z], direction, compareArrays(neighbourCoords, examine)))
                //console.log('me' ,x,y,z, getIDs(map[x][y][z]))
                if (compareArrays(neighbourCoords, examine) && false) {
                    console.log('START')
                    console.log('direction : ', direction)
                    console.log('constrictor IDs', x,y,z, getIDs(clone(map[x][y][z])));
                    console.log('constrictor: ', map[x][y][z]);
                    console.log('constrictor allows', allowedNeighbourIDs)
                }
            }
            //console.log(neighbourCoords[0], neighbourCoords[1], neighbourCoords[2])
            neighbourIDs = getIDs(map[neighbourCoords[0]][neighbourCoords[1]][neighbourCoords[2]])
            constrainedNeighbourIDs = intersection(clone(neighbourIDs), clone(allowedNeighbourIDs));

            //console.log(map[x][y][z])
            //console.log(allowedNeighbourIDs,neighbourIDs, constrainedNeighbourIDs)

            //construct new neighbour data
            newNeighbourData = []
            newIds = [] // for testing
            for (module of map[neighbourCoords[0]][neighbourCoords[1]][neighbourCoords[2]]) {
                if (constrainedNeighbourIDs.includes(module['id'])) {
                    newNeighbourData.push(module)
                    newIds.push(module['id'])
                }
            }
            if (compareArrays(neighbourCoords, examine) && false) {
                console.log('constricted', neighbourCoords, neighbourIDs, newIds)
            }
            //console.log('dir :', direction)
            //console.log('newIDs : ', newIds)
            //console.log('you', neighbourCoords, neighbourIDs, newIds)
            if (compareArrays(newNeighbourData, [])) {
                console.log('SOMETHING WENT VERY VERY WRONG')
                console.log('x, y, z : ', x, y, z)
                console.log('examine coords : ', neighbourCoords)
                console.log(moduleType)
                console.log(map[neighbourCoords[0]][neighbourCoords[1]][neighbourCoords[2]])
                console.log('what we allow, what we have, what we will have')
                console.log(allowedNeighbourIDs, neighbourIDs, constrainedNeighbourIDs)
                console.log('something has finished going very very wrong')
            }
            //console.log(allowedNeighbourIDs,neighbourIDs, constrainedNeighbourIDs)
            map[neighbourCoords[0]][neighbourCoords[1]][neighbourCoords[2]] = newNeighbourData
            //console.log(map)
            if (!compareArrays(constrainedNeighbourIDs, neighbourIDs)) {
                //modification had been made
                //console.log(neighbourIDs, constrainedNeighbourIDs)
                //console.log('NEW WFC ',neighbourCoords[0], neighbourCoords[1], neighbourCoords[2], neighbourIDs, constrainedNeighbourIDs.length)
                //console.log('NEW WFC')
                wfc(neighbourCoords[0], neighbourCoords[1], neighbourCoords[2])
            }
        }
    }
}


function getAllowedNeighboursIDs(tile, dir, yes) {
    allowedNeighbours = []
    for (module of tile) {
        for (item of module[dir]) {
            allowedNeighbours.push(item)
        }
    }

    //return allowedNeighbours
    return [...new Set(allowedNeighbours)];
}

function getIDs(tile) {
    ids = []
    //console.log('tile : ', tile)
    for (module of tile) {
        ids.push(module["id"])
    }
    return ids;
}

function intersection(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}

function compareArrays(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

async function loadOBJ(moduleID, x, y, z) {
    //decode the moduleID
    data = moduleID.split('|')
    baseID = data[0]
    rotation = data[1]
    flipped = data[2]

    //load the module and its geometry
    const baseFilePath = 'static/assets/gltf/'
    gltf = await loader.loadAsync(baseFilePath + baseID + ".glb")
    geometry = gltf.scene.children[0].geometry;

    // rotate the modules by the correct amount
    geometry.rotateY( ( -rotation - 1) * Math.PI / 2 )

    // if the modules is flipped, flip it
    if (flipped == 1) {
        geometry.scale(-.5, .5, .5)
    } else {
        geometry.scale(.5, .5, .5)
    }

    //move the object to its correct location
    geometry.translate(x - .5, y - .5, z - .5);

    //ensures that both sides are visible
    object = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial( {side: THREE.DoubleSide} ));

    scene.add(object);
}