
let allowedModules;


let scene, loader;

let objLoader;

let model;

let tiles;

let modules;

window.onload = async function () {

    inputModules = adjacencyData

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

    // Debug
    //const gui = new dat.GUI()

    // Canvas
    const canvas = document.querySelector('canvas.webgl');

    // Scene
    scene = new THREE.Scene();
    loader = new THREE.GLTFLoader();


    // Objects


    //await loadOBJ('11|1|1', 0, 0, 0)
    //await loadOBJ('15|1|0', 1, 1, 0)

    chosenModule = clone(modules['land'][Math.floor((Math.random()*modules['land'].length))]);
    //chosenModuleID = '13|0|0'
    //for (module of modules['land']) {
    //    if (module['id'] == chosenModuleID) {
    //        chosenModule = clone(module);
    //    }
    //}
    await loadOBJ(chosenModule['id'], 0, 0, 0)
    chosenAdjModuleID = chosenModule['PosX'][Math.floor(Math.random()*chosenModule['PosX'].length)]
    //chosenAdjModuleID = '12|0|0'
    for (module of modules['land']) {
        if (module['id'] == chosenAdjModuleID) {
            chosenAdjModule = clone(module);
        }
    }
    await loadOBJ( chosenAdjModuleID, 0, 0, 1)

    console.log(chosenModule['id'], chosenAdjModule['id'])

    scene.scale.set(1, 1, 1);

    // Lights


    scene.add(new THREE.AxesHelper(5))

    //light = new THREE.SpotLight()
    //light.position.set(20, 20, 20)
    //scene.add(light)
    const color = 0xFFFFFF;
    const intensity = 1;
    const ambientLight = new THREE.AmbientLight('white', 2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight( 0xf0f0f0, 1, 100, 0);
    pointLight.position.set( -1, 2, -1 );
    pointLight.castShadow = true;
    scene.add(pointLight)

    var spheresize = .2;
    var pointLightHelper = new THREE.PointLightHelper( pointLight, spheresize );
    //scene.add( pointLightHelper );

    const pointLight2 = new THREE.PointLight( 0xf0f0f0, 1, 100, 0);
    pointLight2.position.set( -1, 2, 1 );
    pointLight2.castShadow = true;
    scene.add(pointLight2)

    var spheresize = .2;
    var pointLightHelper2 = new THREE.PointLightHelper( pointLight2, spheresize );
    //scene.add( pointLightHelper2 );



    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    window.addEventListener('resize', function(e) {
        resize();
    });
    function resize() {
        // Update sizes
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Update camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }


    /**
     * Renderer
     */

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild (renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    /**
     * Camera
     */
    // Base camera
    camera = new THREE.PerspectiveCamera ();
    camera.position.set(4, 4, 4);
    camera.lookAt (new THREE.Vector3(0,-Math.PI/8,0));

    const controls = new THREE.OrbitControls(camera);


    /**
     * Animate
     */
    const clock = new THREE.Clock();




    const tick = () => {

        const elapsedTime = clock.getElapsedTime();


        // Update Orbital Controls
        // controls.update()

        // Render
        controls.update();
        //requestAnimationFrame ( animate );
        renderer.render(scene, camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', function () {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });


    resize()
    tick();
};

function constructor(input) {
    console.log(input)

    //sides
    objLoader.load(
        '../static/assets/experimental models/1s.glb',
        function ( gltf ) {
            for (i=0;i<input['s'].length;i++) {
                side = gltf.scene.clone();
                side.rotation.y = input['s'][i] * Math.PI / 2;
                scene.add(side);
            }
        },
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    //diagonal
    objLoader.load(
        '../static/assets/experimental models/1d.glb',
        function ( gltf ) {
            for (i=0;i<input['d'].length;i++) {
                side = gltf.scene.clone();
                side.rotation.y = (input['d'][i] - 1) * Math.PI / 2;
                scene.add(side);
            }
        },
        function ( error ) {
            console.log( 'An error happened');
        }
    );
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

let rotation;

async function loadOBJ(moduleID, x, y, z) {
    data = moduleID.split('|')
    baseID = data[0]
    rotation = data[1]
    flipped = data[2]

    const baseFilePath = 'static/assets/gltf/'
    gltf = await loader.loadAsync(baseFilePath + baseID + ".glb")
    geometry = gltf.scene.children[0].geometry;

    //console.log(gltf, geometry)

    //gltf.scene.rotation.set(0, rotation * Math.PI / 2, 0);

    geometry.rotateY( ( -rotation - 1) * Math.PI / 2 )
    //geometry.scale(.5, .5, .5)

    if (flipped == 1) {
        geometry.scale(-.5, .5, .5)
    } else {
        geometry.scale(.5, .5, .5)
    }

    //geometry.rotateY( ( ( Math.floor( Math.random() * 4 ) ) - 2 ) * Math.PI / 2 )

    //geometry.translate( -offset[0] + x, -offset[2] + y, offset[1] + z );
    //geometry.translate(x - .5, y - .5, z - .5);
    //TEMP
    geometry.translate(x, y, z);


    object = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial( {side: THREE.DoubleSide} ));

    //object.rotation.y = rotation * Math.PI / 2

    scene.add(object);
}
