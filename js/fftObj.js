// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2;   // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff
    

function initFFTobj() {

    $('#notesHead').html("Notes:"); 
    $('#notesTxt').html("fft mapped to scale y position of cube segment vertices"); 
    $('#fftObj').addClass('select');

    window.addEventListener('resize', handleResize, false);

    // get DOM ele & dimensions for canvas
    threeBox = document.getElementById("threeBox");
    boxW = threeBox.clientWidth; 
    boxH = threeBox.clientHeight; 
    boxAspect = boxW / boxH;

    // SCENE 
        scene = new THREE.Scene();

    // RENDERER
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0x111111, 1.0);
        renderer.setSize(boxW, boxH);
        renderer.shadowMapEnabled = true;
        
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "canvas"; // just in case
        threeBox.appendChild(canvas);

    // SHAPES 
        // ground plane
            var planeGeom = new THREE.PlaneGeometry(80,80);
            var planeMat = new THREE.MeshPhongMaterial({
                color: 0x335566
            });
            var plane = new THREE.Mesh(planeGeom, planeMat);
            plane.recieveShadow = true;

            plane.rotation.x = -0.5 * Math.PI;
            plane.position.x = 0;
            plane.position.y = -2;
            plane.position.z = 0;

            scene.add(plane);

        // cube geom for particles
            // http://threejs.org/docs/index.html#Reference/Extras.Geometries/BoxGeometry
            // new THREE.BoxGeometry(W, H, D, W-segments, H-seg, D-seg);

            var cubeGeom = new THREE.BoxGeometry(3, 6, 3, 15, 25, 15);
            // the particles are just the seg vertices of this cube


            // particle material
                var pm = new THREE.ParticleBasicMaterial();
                
                pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");

                // adds the color of the texture to the color of the pixel that is behind it
                pm.blending = THREE.AdditiveBlending;
                pm.transparent = true;
                pm.opacity = 0.6;
                pm.size = 0.5;

                var pm2 = pm.clone();
                pm2.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle2.png");

            // particle objs
                var ps = new THREE.ParticleSystem(cubeGeom, pm);
                ps.name = 'cube';
                ps.sortParticles = true; // always do this. not sure why...
                ps.position.x = 2;

                var ps2 = new THREE.ParticleSystem(cubeGeom, pm2);
                ps2.name = 'cube2';
                //ps.sortParticles = true; // always do this. not sure why...
                ps2.position.x = -2;

            scene.add(ps);
            scene.add(ps2);

        // CAMERA
            camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 1000);
            camera.position.set(5,10,20);
            camera.lookAt(scene.position);

            // This wraps the cam in an OrbitalControl obj, which allows you to bind user input to camera positions
              // render update: cameraControl.update(); 
            //cameraControl = new THREE.OrbitControls(camera);

        // LIGTHING 
            /* Notes:
                AmbientLight: A simple light whose color is added to the color of an object's material.
                    args = THREE.AmbientLight(hexColor);
                
                PointLight: A single point in space that emanates light evenly in all directions.

                SpotLight: A light with a cone effect, for instance, a spot in the ceiling or a torch.

                DirectionalLight: A light that acts like a very remote light source. All light rays run parallel to each other. The sun, for instance, can be seen as an infinite source of light.
                    args = THREE.DirectionalLight(hexColor, intensity: 0-1);
            */

            // spotlight
            var spotlight = new THREE.SpotLight(0xffffff);
            spotlight.position.set(10, 20, 20);
            spotlight.shadowCameraNear = 20;
            spotlight.shadowCameraFar = 50;
            spotlight.castShadow = true;

            scene.add(spotlight);

        // BACKGROUND SCENE

        
        // EFFECTS COMPOSER
            // Defines various render passes, which are combined into a single image shown in the browser.
        

        // GUI, STATS
            //init for gui obj
            control = new function () {
                this.rotationSpeed = 0.005;
                //this.opacity = 0.6;
            };
            addControlGui(control);
            
            
            // adds stats obj (stat obj is created below)
            initStatsObject();


        setupSound();
        
        // RENDER:  after the first render, interval is determined by requestAnimationFrame
        render(); 
        
        loadSound("../assets/audio/joplinEntertainer.ogg");
        //loadSound("../assets/audio/imperialMarch.ogg");
        //loadSound("../assets/audio/pokemon.ogg");

        console.log('the initFFTobj fx says hello!');

    } // end initGlobe()

// GUI CONTROLLER ===================================================

    function addControlGui(controlObject) {
            var gui = new dat.GUI();

            // motion
            gui.add(controlObject, 'rotationSpeed', -0.01, 0.01);

            //styles
            //gui.add(controlObject, 'opacity', 0.01, 1);

            // lighting
    }


// MATERIAL MAKERS  ===================================================
    //4096 is the max width for maps


// PARTICLE MATERIAL MAKERS =========================================== 
    /* props for THREE.ParticleSystemMaterial 
        color
        opacity
        map
        size
        blending
        vertexColors
        transparent
        Description
        If you don't use a texture (with the map property), this property determines the color of the particles.
        This property refers to the opacity of each pixel
        (when the transparent property has been set to true).
        This property refers to the texture to be used for each individual particle.
        This property refers to the relative size of a particle; the default value is 1.0.
        This property defines how the particle color or the texture blends together with the color of the pixels that are behind it.
        If this is set to true, you can change the color of each individual particle.
        This property determines whether the particle is transparent or not. It affects the opacity and the way textures are blended.
    */


// AUDIO TEMPLATE (web audio api) ============================
    /*
        Basically HTML5 Web Audio works by by creating an AudioContext, which provides you w/ an interface for a bunch of different nodes. You create and wire-up the nodes to do whatever.
        eg:
        AudioBufferSourceNode - to play sound
        AudioDestinationNode - output sound to speaker
        AnalyserNode - do an fft
    */

    function setupSound() {
        
        if (! window.AudioContext) {
            if (! window.webkitAudioContext) {
                alert('no audiocontext found');
            }
            window.AudioContext = window.webkitAudioContext;
        }
        context = new AudioContext();

        // ANALYSER SETUP
            /* notes: 
                .smoothingTimeConstant = Must be b/t 0-1. Default = 0.8.
                0 is NO time averaging with the last analysis's frame.
            */
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.4; 
            analyser.fftSize = 1024;

            analyser2 = context.createAnalyser();
            analyser2.smoothingTimeConstant = 0.4;
            analyser2.fftSize = 1024;

        // BUFFER & SPLITTER 
            sourceNode = context.createBufferSource();
            var splitter = context.createChannelSplitter();

        // NODE CONNECTIONS
            // connects the buffer source to the splitter
            sourceNode.connect(splitter);

            // connects one of the outputs from the splitter to an analyser
            splitter.connect(analyser,0);
            splitter.connect(analyser2,1);

            // and connects source to a destination
            sourceNode.connect(context.destination);

        context = new AudioContext();
    }


    function getAverageVolume(array) {
        var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
    }

    function playSound(buffer) {
        sourceNode.buffer = buffer;
        sourceNode.start(0);
    }


    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function() {

            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
                playSound(buffer);
            }, onError);
        }
        request.send();
    }

    function onError(e) {
        console.log(e);
    }



// UPDATE (audio data) =========================================
    function updateCubes() {
        // get the average for the first channel
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array);

        // get the average for the second channel
        var array2 =  new Uint8Array(analyser2.frequencyBinCount);
        analyser2.getByteFrequencyData(array2);
        var average2 = getAverageVolume(array2);

        //console.log(average2);

        // clear the current state
        if (scene.getObjectByName('cube')) {
            var cube = scene.getObjectByName('cube');
            var cube2 = scene.getObjectByName('cube2');
            cube.scale.y=average/20;
            cube2.scale.y=average2/20;

        }
    }

// RENDER ======================================================

    function render() {
        //var rotSpeed = 0.001;
        var rotSpeed = control.rotationSpeed;

        //object motion
            //scene.getObjectByName('earth').rotation.y += control.rotationSpeed;
            //scene.getObjectByName('clouds').rotation.y += control.rotationSpeed * 1.1;

        // camera
            //cameraControl.update(); // update from camera controller
            camera.position.x = camera.position.x * Math.cos(rotSpeed) + camera.position.z * Math.sin(rotSpeed);
            camera.position.z = camera.position.z * Math.cos(rotSpeed) - camera.position.x * Math.sin(rotSpeed);
            camera.lookAt(scene.position);

        //lighting

        // stats
            stats.update();
        

        //renderer
            renderer.render(scene, camera); // render the scene

        // data update
            updateCubes();

        requestAnimationFrame(render);  // render using requestAnimationFrame
    }


// MISC UTILS ======================================================

    function initStatsObject() {
        stats = new Stats();
        stats.setMode(0);

        stats.domElement.style.position = 'relative';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = (1-boxH) + 'px';  // 0px places it after the canvas.

        threeBox.appendChild(stats.domElement);
    }

    function handleResize() {
        threeBox = document.getElementById("threeBox");
        boxW = threeBox.clientWidth; 
        boxH = threeBox.clientHeight; 
        boxAspect = boxW / boxH;

        camera.aspect = boxAspect;
        camera.updateProjectionMatrix();
        renderer.setSize(boxW, boxH);
    }














