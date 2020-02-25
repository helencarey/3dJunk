// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2, jsNode;  // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff

    
    var scale = chroma.scale(['orange','red','white']).domain([0,255]);

    var pm = new THREE.ParticleBasicMaterial();
	pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
	pm.blending= THREE.AdditiveBlending;
	pm.transparent = true;
	pm.size=1.5;
	pm.vertexColors = true;
	//pm.color = new THREE.Color(0x00ff00);

	var systems = [];


function initPlane() {
	//$('#notesHead').html("Notes:"); 
    //$('#notesTxt').html(""); 
    $('#plane').addClass('select');
    console.log('FFT Plane clicked');

    window.addEventListener('resize', handleResize, false);

    // get DOM ele & dimensions for canvas
    	threeBox = document.getElementById("threeBox");
    	boxW = threeBox.clientWidth; 
    	boxH = threeBox.clientHeight; 
    	boxAspect = boxW / boxH;

    // CREATE SCENE & CAM OBJ
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 1000);


    // RENDERER
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0x080808, 1.0);
        renderer.setSize(boxW, boxH);
        renderer.shadowMapEnabled = true;
        
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "canvas"; // just in case
        threeBox.appendChild(canvas);


	// SHAPES 
        // ground plane
            var planeGeom = new THREE.PlaneGeometry(12,20);
            var planeMat = new THREE.MeshBasicMaterial({
                color: 0x444444
            });
            var plane = new THREE.Mesh(planeGeom, planeMat);
            plane.recieveShadow = true;

            plane.rotation.x = -0.5 * Math.PI;
            plane.position.x = 0;
            plane.position.y = -0.2;
            plane.position.z = 0;

            scene.add(plane);

        // particles
        	//setupParticleSystem(25,25);


    // CAMERA POSITION
        //camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 1000);
        camera.position.set(15,8,15);
        //camera.lookAt(new THREE.Vector3(-50,0,5));
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
            //this.rotationSpeed = 0.005;
            //this.ambientLightColor = ambientLight.color.getHex();
            //this.sunlightColor = sunlight.color.getHex();
            //this.color = cubeMaterial.color.getHex();
            //this.opacity = 0.6;
        };
        //addControlGui(control);
        
        
        // adds stats obj (stat obj is created below)
        initStatsObject();


    // AUDIO
        setupSound();
        //loadSound("../assets/audio/joplinEntertainer.ogg");
        loadSound("../assets/audio/imperialMarch.ogg");
        //loadSound("../assets/audio/MIA.m4a");
        //loadSound("../assets/audio/pokemon.ogg");
        
    // RENDER:  after the first render, interval is determined by requestAnimationFrame
        render(); 
        
        console.log('the initPlane fx says hello!');

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


// PARTICLE SYS MAKERS =========================================== 
    
    /* props for THREE.ParticleSystemMaterial 

        color: 
            pm.color = new THREE.Color(0xffffff);

        opacity: 
            alpha of each px [ex. pm.opacity = 0.4;]
            works ONLY when , ONLY when pm.transparent = true; 
        
        map: 
            pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");

        size: 
            relative size of a particle. default = 1.0
            ex.   pm.size = 0.7;
        
        blending:
            pm.blending= THREE.AdditiveBlending;
        
        vertexColors: true | false
            pm.vertexColors = true;
            Allows you to program each vertice to have a different or dynamic color. To do this you need to specify a THREE.Color object for each of the particles and add that object to the colors property, which is an array of the THREE.Geometry object. 

            pm.vertexColors = false;', 
            All particles will inherit the color set by the pm.color prop of the ps material
        
        transparent: alpha value 
    */

// AUDIO ============================
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

    //c++;
    //if (c%2 == 0 ) {
      updateWaves();  
    //} 
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
