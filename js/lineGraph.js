// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation = null;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2, jsNode = null;  // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas = null;   // common DOM stuff

    var systems = [];
    var c = 0;

function initLine() {
	$('#notesHead').html("Notes:"); 
    $('#notesTxt').html("fft time domain mapped to particle y position"); 
    $('#line').addClass('select');

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
        renderer.setClearColor(0x000, 1.0);
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

        /*
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
                pm.size = 1.0;

                var pm2 = pm.clone();
                pm2.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle2.png");

            // particle objs
                var ps = new THREE.ParticleSystem(cubeGeom, pm);
                ps.name = 'cube';
                ps.sortParticles = true; // always do this. not sure why...
                ps.position.x = 2;

                var ps2 = new THREE.ParticleSystem(cubeGeom, pm2);
                ps.name = 'cube2';
                //ps.sortParticles = true; // always do this. not sure why...
                ps2.position.x = -2;

            scene.add(ps);
            scene.add(ps2);
        */

        // CAMERA
            camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 1000);
            camera.position.set(23,40,40);
            camera.lookAt(new THREE.Vector3(-50,0,5));

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
            
            var spotlight = new THREE.SpotLight(0xcccccc);
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
                //this.rotationSpeed = 0.005;
                //this.ambientLightColor = ambientLight.color.getHex();
                //this.sunlightColor = sunlight.color.getHex();
                //this.color = cubeMaterial.color.getHex();
                //this.opacity = 0.6;
            };
            addControlGui(control);
            
            
            // adds stats obj (stat obj is created below)
            initStatsObject();


        setupSound();
        
        // RENDER:  after the first render, interval is determined by requestAnimationFrame
        render(); 
        
        //loadSound("../assets/audio/joplinEntertainer.ogg");
        //loadSound("../assets/audio/imperialMarch.ogg");
        loadSound("../assets/audio/MIA.m4a");
        //loadSound("../assets/audio/pokemon.ogg");
        //loadSound("../assets/audio/alone.mp3");

        console.log('the initLine fx says hello!');

    } // end initGlobe()

// GUI CONTROLLER ===================================================

    function addControlGui(controlObject) {
         /*   
            var gui = new dat.GUI();

            // motion
            gui.add(controlObject, 'rotationSpeed', -0.01, 0.01);

            //styles
            gui.add(controlObject, 'opacity', 0.01, 1);

            // lighting
            //gui.addColor(controlObject, 'ambientLightColor');
            //gui.addColor(controlObject, 'sunlightColor');
         */   
    }


// MATERIAL MAKERS  ===================================================
    //4096 is the max width for maps


// PARTICLE MATERIAL MAKERS =========================================== 


// AUDIO TEMPLATE (web audio api) ============================
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

            //analyser2 = context.createAnalyser();
            //analyser2.smoothingTimeConstant = 0.4;
            //analyser2.fftSize = 1024;

        // BUFFER & SPLITTER 
            sourceNode = context.createBufferSource();
            var splitter = context.createChannelSplitter();

        // NODE CONNECTIONS
            // connects the buffer source to the splitter
            sourceNode.connect(splitter);

            // connects one of the outputs from the splitter to an analyser
            splitter.connect(analyser,0,0);
            //splitter.connect(analyser2,1);

            // and connects source to a destination
            sourceNode.connect(context.destination);

        context = new AudioContext();
    }


// var systems = []; array to hold the geoms of each wave 
// UPDATE (audio data) =========================================

    function updateWaves() {

        // get the average for the first channel
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(array);  // time domain will give you the wave
        //console.log(array);

        // setup the material
        var pm = new THREE.ParticleBasicMaterial();
        //pm.color = new THREE.Color(0x53C8E9);
        pm.color = new THREE.Color(0xffffff);
        pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
        pm.blending= THREE.AdditiveBlending;
        pm.transparent = true;
        pm.opacity = 0.4;
        pm.size = 0.7;
        //pm.castShadow = true;


        // create an empty geometry (just an array of vertices)
        // array.vertices[i] to access 
        var geom = new THREE.Geometry();

        // add the vertices to the geometry based on the wavefrom 'array'
            //new THREE.Vector3(xpos, ypos, zpos);
            /*
                for the wave this will be
                x = start pos
                y = audio array val (height)
                z = iterator value distance 
            */

        for (var i = 0; i < array.length ; i++) {
            //var v = new THREE.Vector3(1, array[i]/8, (i/15));
            var v = new THREE.Vector3(0.75, array[i]/10, i/12);
            //console.log(v);
            geom.vertices.push(v);
        }

        // create a new particle system
        var ps = new THREE.ParticleSystem(geom, pm);
        ps.sortParticles = true;


        // move the existing particle systems back 
        systems.forEach(function(e) {
            e.position.x-=1.5
        });

        // and remove the oldest particle system
        if (systems.length === 40) {
            var oldPs = systems.shift();  // is this weird
            if (oldPs) {
                scene.remove(oldPs);
            }
        }

        // add the new ps to the global systems arr
        systems.push(ps);

        // add the new ps to the scene
        scene.add(ps);
    }


//var c = 0; global
// RENDER ======================================================

function render() {

    c++;
    if (c%2 == 0 ) {
      updateWaves();  
    } 
    //updateWaves();

    // update stats
    stats.update();

    // and render the scene
    renderer.render(scene, camera);

    // render using requestAnimationFrame
    requestAnimationFrame(render);
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
