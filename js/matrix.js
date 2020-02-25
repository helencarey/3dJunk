// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2, jsNode;  // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff
    
	var scale = chroma.scale(['blue', 'green', 'yellow','white']).domain([0,255]);

	var pm = new THREE.ParticleBasicMaterial();
	pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/ball.png");
	//pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
	pm.blending= THREE.AdditiveBlending;
	pm.transparent = true;
	pm.opacity = 0.9;
	pm.size= 0.6;
	pm.vertexColors = true;
	//pm.color = new THREE.Color(0x00ff00);

	var systems = [];


function initMatrix() {
	$('#notesHead').html("Notes:"); 
    $('#notesTxt').html("replay audio: cmd R <br> other notes"); 
    $('#matrix').addClass('select');
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
        renderer.setClearColor(0x111111, 1.0);
        renderer.setSize(boxW, boxH);
        renderer.shadowMapEnabled = true;
        
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "canvas"; // just in case
        threeBox.appendChild(canvas);

    // SHAPES 
        // ground plane
		    var planeGeometry = new THREE.PlaneGeometry(20, 12);
		    var planeMaterial = new THREE.MeshPhongMaterial({color: 0x444555});
		    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
		    plane.receiveShadow = true;

		    // rotate and position the plane
		    plane.rotation.x = -0.5 * Math.PI;
		    plane.position.x = 0;
		    plane.position.y = -0.2;
		    plane.position.z = 0;

		    // add the plane to the scene
		    scene.add(plane);

		// particles
		    setupParticleSystem(25,25);


    // CAMERA POSITION
    	camera.position.set(15,8,15);
    	camera.lookAt(scene.position);

    // LIGTHING 
        // spotlight
	    var spotLight = new THREE.SpotLight(0xffffff);
	    spotLight.position.set(10, 20, 20);
	    spotLight.shadowCameraNear = 20;
	    spotLight.shadowCameraFar = 50;
	    spotLight.castShadow = true;

	    scene.add(spotLight);

    // BACKGROUND SCENE

    // GUI, STATS
        //init for gui obj
        control = new function () {
        	this.rotationSpeed = 0.001;
        	//this.opacity = 0.6;
        	// this.color = cubeMaterial.color.getHex();
        };
	    addControlGui(control);

	    initStatsObject();

    // AUDIO
    	setupSound();

    	//loadSound("../assets/audio/joplinEntertainer.ogg");
        //loadSound("../assets/audio/imperialMarch.ogg");
        //loadSound("../assets/audio/MIA.m4a");
        //loadSound("../assets/audio/pokemon.ogg");
        loadSound("../assets/audio/alone.mp3");

    // EFFECTS COMPOSER

    // RENDER
    	render();

    console.log('the initPlane fx says hello!');

} // end initPlane()


// GUI CONTROLLER ===================================================

    function addControlGui(controlObject) {
            var gui = new dat.GUI();

            // motion
	            gui.add(controlObject, 'rotationSpeed', -0.01, 0.01);

            //styles
    	        //gui.add(controlObject, 'opacity', 0.01, 1);

            // lighting
        	    //gui.addColor(controlObject, 'ambientLightColor');
            	//gui.addColor(controlObject, 'sunlightColor');
    }


// MATERIAL MAKERS  ===================================================
    //4096 is the max width for maps


// PARTICLE SYS MAKERS =========================================== 
	// from init:  setupParticleSystem(25,25);

	/*
		In this function, we create a new THREE.Geometry object and  ll it with a set of vertices. For each vertex that we push into the vertices array of the THREE.Geometry object, we also create a random THREE.Color object that we push into the colors array of the same THREE.Geometry object.

		The result is that Three.js will use the THREE.Color objects in the colors array to render the individual particles. We'll use the same approach in the next section to create colors based on the amplitude of a speci c frequency.
	*/


	function setupParticleSystem(width, depth) {

	    var targetGeometry = new THREE.Geometry();

	    for (var i = 0 ; i < width ; i ++) {
	        for (var j = 0 ; j < depth ; j ++) {
	        	// x pos = i/2 - (width/2)/2 
	        		/* 	i/2 = start point pos or dist from x=0
	        			width/2 = consider only dist from x=0 (abs value)
	        			- (width/2)/2 = makes the abs value either pos or neg dist from 0
	        		*/
	        	// y = 0  (y pos will be determined by volume)
	        	// z = j/2-(depth/2)/2)  (same as above)
	            var v = new THREE.Vector3(i/2-(width/2)/2, 0, j/2-(depth/2)/2);
	            targetGeometry.vertices.push(v);
	            // give each new vertice a random color obj
	            targetGeometry.colors.push(new THREE.Color(Math.random() * 0xffffff));
	        }
	    }

	    var ps = new THREE.ParticleSystem(targetGeometry,pm);
	    ps.name = 'ps';
	    scene.add(ps);
	}

	//function setupCubes(widht, depth) {
	//
	//    var targetGeometry = new THREE.Geometry();
	//
	//    for (var i = 0 ; i < widht ; i ++) {
	//        for (var j = 0 ; j < depth ; j ++) {
	//            var cubeGeometry = new THREE.BoxGeometry(1, 3, 1, 8, 8, 8);
	//
	//            cubeGeometry.applyMatrix(new THREE.Matrix4().makeTranslation( 2*i,  0 , 2*j ) );
	//
	//            THREE.GeometryUtils.merge(targetGeometry,cubeGeometry);
	//        }
	//    }
	//
	//
	//
	//    var ps = new THREE.ParticleSystem(targetGeometry, pm);
	//    ps.sortParticles = true;
	//
	//
	//    scene.add(ps);
	//    systems.push(ps);
	//}


// AUDIO ============================
    function setupSound() {
        
        if (! window.AudioContext) {
            if (! window.webkitAudioContext) {
                alert('no audiocontext found');
            }
            window.AudioContext = window.webkitAudioContext;
        }
        context = new AudioContext();

        // JS NODE
        
            // setup a js node
    		jsNode = context.createScriptProcessor(4096, 1, 1);
    		// connect to destination, else it isn't called
    		jsNode.connect(context.destination);
    		jsNode.onaudioprocess = function() {

		        // get the average for the first channel
		        var array =  new Uint8Array(analyser.frequencyBinCount);
		        analyser.getByteFrequencyData(array);

		        var ps = scene.getObjectByName('ps');
		        var geom = ps.geometry;
		        
		        // for each value in the fz array, loop thru the Vector3 gemo array and assign a y pos
		        for (var i = 0 ; i < array.length ; i++) {
		            if (geom.vertices[i]) {
		                geom.vertices[i].y=array[i]/40; // '/40' scales down the fz value to fit the scene 
		                geom.colors[i] = new THREE.Color(scale(array[i]).hex()); // look up scale fx
		            } // end IF

		        } //end FOR
		        ps.sortParticles=true;
		        geom.verticesNeedUpdate = true;
		    } 


        // ANALYSER SETUP
            /* notes: 
                .smoothingTimeConstant = Must be b/t 0-1. Default = 0.8.
                0 is NO time averaging with the last analysis's frame.
            */
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.8; 
            analyser.fftSize = 2048;

        // BUFFER & SPLITTER 
            sourceNode = context.createBufferSource();
            var splitter = context.createChannelSplitter();

        // NODE CONNECTIONS
            // connects the buffer source to the splitter
            sourceNode.connect(splitter);

            // connects one of the outputs from the splitter to an analyser
            splitter.connect(analyser,0,0);
            //splitter.connect(analyser2,1);

            // connect the splitter to the jsNode, which draws at a specific interval
		    analyser.connect(jsNode);

            // and connects source to a destination
            sourceNode.connect(context.destination);

        context = new AudioContext();
    }

// var systems = []; array to hold the geoms of each wave 
// UPDATE (audio or position data) =========================================


// RENDER ======================================================
	function render() {
		
	    // render vars
		    //var rotSpeed = 0.001;
		    var rotSpeed = control.rotationSpeed;

		// object motion

	    // camera motion
		    camera.position.x = camera.position.x * Math.cos(rotSpeed) + camera.position.z * Math.sin(rotSpeed);
		    camera.position.z = camera.position.z * Math.cos(rotSpeed) - camera.position.x * Math.sin(rotSpeed);
		    camera.lookAt(scene.position);

	    // data update
		    //c++;
		    //if (c%2 == 0 ) {
		      //updateWaves();  
		    //} 
		    //updateWaves();

	    	stats.update();

	    // render the scene
	    renderer.render(scene, camera);
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
