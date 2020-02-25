// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2, jsNode;  // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff
    
	var scale = chroma.scale(['cyan', 'violet']).domain([0,255]);

	var pm = new THREE.ParticleBasicMaterial();
	//pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/particle.png");
	pm.color = new THREE.Color(0xffffff);
	pm.map = THREE.ImageUtils.loadTexture("../assets/textures/particles/ball.png");
	//pm.blending= THREE.AdditiveBlending;
	pm.transparent = true;
	pm.opacity = 0.5;
	pm.size= 0.8;
	pm.vertexColors = true;
	

	var particleWidth = 100; // 10,000 particle matrix!!!

	var spacing = 0.26;
	var centerParticle;
	var fallOffParticlesLow1;

	var systems = [];


function initRingMatrix() {
	$('#notesHead').html("Notes:"); 
    //var notesTxt = document.getElementById('notesTxt');
    /* NOTES TXT
    	Pseudocode
		- create a 100x100 matrix of particle objs (omg 10,000 particles!!!)
		- bin the volume data from the fzAnalyzer into High, Mid, & Low and get the avg for each bin
			low = 0-299 frequencies
			mid = 300-599 fz entries
			high = 600-1000 fz
    */

    $('#ring').addClass('select');
    console.log('FFT Pie clicked');

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
        renderer.setClearColor(0xeeeeee, 1.0);
        renderer.setSize(boxW, boxH);
        renderer.shadowMapEnabled = true;
        
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "canvas"; // just in case
        threeBox.appendChild(canvas);

    // SHAPES 
        /* ground plane
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
		*/
		// particles
		    setupParticleSystem(particleWidth,particleWidth);


    // CAMERA POSITION
    	camera.position.set(18,14,12);
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
        loadSound("../assets/audio/moloko.mp3");
        //loadSound("../assets/audio/alone.mp3");

    // EFFECTS COMPOSER

    // RENDER
    	render();

    console.log('the initPie fx says hello!');

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
		// var spacing = 0.26;   (in Globals)

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
	            
	            // position. First part determines spacing, second is offset
            	var v = new THREE.Vector3(spacing*(i)-spacing*(width/2), 0, spacing*(j)-spacing*(depth/2));
	            
	            //var v = new THREE.Vector3(i/2-(width/2)/2, 0, j/2-(depth/2)/2); // from unbinned matrix1

	            targetGeometry.vertices.push(v);
	            // give each new vertice a random color obj
	            targetGeometry.colors.push(new THREE.Color(0xffffff));
	        } // end for j
	    } // end for i

	    var ps = new THREE.ParticleSystem(targetGeometry,pm);
	    ps.name = 'ps';
	    scene.add(ps);

	    centerParticle = getCenterParticle();
	}

	function getCenterParticle() {
	    var center = Math.ceil(particleWidth /2);
	    var centerParticle = center+(center*particleWidth);

	    return centerParticle;
	}

	function getFallOffParticles(center, radiusStart, radiusEnd) {
	    var result = [];
	    var ps = scene.getObjectByName('ps');
	    var geom = ps.geometry;
	    var centerParticle = geom.vertices[center];

	    var dStart = Math.sqrt(radiusStart*radiusStart + radiusStart*radiusStart);
	    var dEnd = Math.sqrt(radiusEnd*radiusEnd + radiusEnd*radiusEnd);

	    for (var i = 0 ; i < geom.vertices.length ; i++) {
	        var point = geom.vertices[i];

	        var xDistance = Math.abs(centerParticle.x - point.x);
	        var zDistance = Math.abs(centerParticle.z - point.z);

	        var dParticle = Math.sqrt(xDistance*xDistance + zDistance*zDistance);
	        if (dParticle < dStart && dParticle >= dEnd && i!=center) result.push(i);
	    }

	    return result;
	}


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

		        var lowValue = getAverageVolume(array,0,300);
        		var midValue = getAverageVolume(array,301,600);
        		var highValue = getAverageVolume(array,601,1000);

		        var ps = scene.getObjectByName('ps');
		        var geom = ps.geometry;
		        

		        var lowOffsets = []; 
		        var midOffsets = []; 
		        var highOffsets = [];
		       
		        var lowRings = 10; 
		        var midRings = 10; 
		        var highRings = 10;
		        
		        var midFrom = 12; 
		        var highFrom = 24;
		        
		        var lowVolumeDownScale = 35; 
		        var midVolumeDownScale = 35; 
		        var highVolumeDownScale = 35;

		        // -------------------------
		        // calculate the rings and offsets for the low sounds, rannge from
		        // 0.5 to 0 pi
		        for (var i = lowRings ; i > 0 ; i--) {
		            lowOffsets.push(Math.sin(Math.PI*(0.5*(i/lowRings))));
		        }
		        var lowParticles = [];
		        for (var i = 0 ; i < lowRings ; i++) {
		            lowParticles.push(getFallOffParticles(centerParticle,(i+1)*spacing,i*spacing));
		        }

		        // calculate the rings and offsets for the mid sounds
		        // range from 0 to 0.5PI to 0
		        for (var i = 0 ; i < midRings/2 ; i++) {
		            midOffsets.push( Math.sin(Math.PI*(0.5*(i/(midRings/2)))));
		        }

		        for (var i = midRings/2 ; i < midRings ; i++) {
		            midOffsets.push( Math.sin(Math.PI*(0.5*(i/(midRings/2)))));
		        }

		        var midParticles = [];
		        for (var i = 0 ; i < midRings ; i++) {
		            midParticles.push(getFallOffParticles(centerParticle,(i+1+midFrom)*spacing,(i+midFrom)*spacing));
		        } 

		        // calculate the rings and offsets for the high sounds
		        // range from 0 to 0.5PI to 0
		        for (var i = 0 ; i < midRings/2 ; i++) {
		            highOffsets.push( Math.sin(Math.PI*(0.5*(i/(highRings/2)))));
		        }

		        for (var i = highRings/2 ; i < highRings ; i++) {
		            highOffsets.push( Math.sin(Math.PI*(0.5*(i/(highRings/2)))));
		        }

		        var highParticles = [];
		        for (var i = 0 ; i < highRings ; i++) {
		            highParticles.push(getFallOffParticles(centerParticle,(i+1+highFrom)*spacing,(i+highFrom)*spacing));
		        }

		        // render the center ring
		        renderRing(geom,[centerParticle],lowValue,1,lowVolumeDownScale);
		        // render the other rings for the lowvalue
		        for (var i = 0 ; i < lowRings ; i++) {
		            renderRing(geom,lowParticles[i],lowValue,lowOffsets[i],lowVolumeDownScale);
		        }

		        // render the mid ring
		        for (var i = 0 ; i < midRings ; i++) {
		            renderRing(geom,midParticles[i],midValue,midOffsets[i],midVolumeDownScale);
		        }

		        // render the high ring
		        for (var i = 0 ; i < highRings ; i++) {
		            renderRing(geom,highParticles[i],highValue,highOffsets[i],highVolumeDownScale);
		        }


		        /* from matrix sketch
		        // for each value in the fz array, loop thru the Vector3 gemo array and assign a y pos
		        for (var i = 0 ; i < array.length ; i++) {
		            if (geom.vertices[i]) {
		                geom.vertices[i].y=array[i]/40; // '/40' scales down the fz value to fit the scene 
		                geom.colors[i] = new THREE.Color(scale(array[i]).hex()); // look up scale fx
		            } // end IF

		        } //end FOR
		        */

		        ps.sortParticles=true;
		        geom.verticesNeedUpdate = true;

		    } // END jsNode.onaudioprocess = function()


        // ANALYSER SETUP
            /* notes: 
                .smoothingTimeConstant = Must be b/t 0-1. Default = 0.8.
                0 is NO time averaging with the last analysis's frame.
            */
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.1; 
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

    function getAverageVolume(array, start, end) {
	    var values = 0;
	    var average;

	    var length = end-start;
	    for (var i = start; i < end; i++) {
	        values += array[i];
	    }

	    average = values / length;
	    return average;
	}

	function renderRing(geom, particles, value, distanceOffset, volumeDownScale) {

	    for (var i = 0; i < particles.length; i++) {
	        if (geom.vertices[i]) {
	            geom.vertices[particles[i]].y=distanceOffset*value/volumeDownScale;
	            geom.colors[particles[i]] = new THREE.Color(scale(distanceOffset*value).hex());
	        }
	    }
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
