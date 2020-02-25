// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2;   // common webAudio API stuff  
    var waveHolder, boxW, boxH, boxAspect, canvas;    // common DOM stuff


function initLPC1() {
	$('#lpc1').addClass('select');
	$('#notesHead').html("Notes:"); 
    $('#notesTxt').html("LPC w/ Dummy Data"); 
  	console.log('LPC1 Dummy clicked');

  	window.addEventListener('resize', handleResize, false);

  	// get DOM ele & dimensions for canvas
    	waveHolder = document.getElementById("waveHolder");
    	boxW = waveHolder.clientWidth; 
    	boxH = waveHolder.clientHeight; 
    	boxAspect = boxW / boxH;

    // CREATE SCENE & CAM OBJ
        scene = new THREE.Scene();
        //camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 1000);

        // flat plane with 0,0 in the center, i think...
        camera = new THREE.OrthographicCamera(boxW/-2, boxW/2, boxH/-2, boxH/2, 1, 1000);

    // RENDERER
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xc5f3ff, 1.0);
        renderer.setSize(boxW, boxH);
        
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "lpc-canvas"; // just in case
        waveHolder.appendChild(canvas);

    // SHAPES (see particle maker)
    	// Graphics are data-driven, in other words they are drawn in the update and render loops. There is no geometry to establish here. */

    // CAMERA POSITIONING
    	camera.position.set(0, 0, 100);
    	//camera.lookAt(scene.position);
		camera.lookAt(new THREE.Vector3(0, 0, 0));


    // LIGTHING (n/a)

    // BACKGROUND SCENE (n/a)

    // GUI, STATS
    	initStatsObject();

    // AUDIO (n/a)

    // EFFECTS COMPOSER

    // RENDER
    	render();

    console.log('initLPC says hello!');
} // end initLPC()


// GUI CONTROLLER ===================================================

// MATERIAL MAKERS  ===================================================


// PARTICLE SYS MAKERS ===========================================
	var peaks, points, frequencyScaling;  // prop/arrays in audio data msg obj
	var line, peakSegments; // THREE graphic elements

	// recieves dummmy data from getDummyLPCCoefficients()
	function lpcCoefficientCallback(msg) {
		points = msg.coefficients;  //#hc
		peaks = msg.freqPeaks;		//#hc
		frequencyScaling = msg.freqScale; //#hc

		if (line === undefined) {
			var material = new THREE.LineBasicMaterial({
				color: 0x53C8E9 //0x0000ff //#hc
			});
			var geometry = new THREE.Geometry();
			
			// this makes a line of points w/ x vals that go from -357 to 1213
			for (var i=0; i<points.length; i++) {
				var point = points[i];
				var px = linScale(i*frequencyScaling, 0, points.length-1, boxW/-2, boxW/2); //music math stuff i guess
				geometry.vertices.push(new THREE.Vector3(px, 0, 0)); //just an xpos
				//geometry.vertices.push(new THREE.Vector3(0, px, 0)); // #st why doesn't this work
			}

			line = new THREE.Line(geometry, material);
			line.geometry.dynamic = true; // this means that the line geom can recieve an update
			scene.add(line);
		}
		
		if (peakSegments === undefined) {
			var material = new THREE.LineBasicMaterial({
				color: 0x018B9D // 0x00ff00 #hc
			});
			var geometry = new THREE.Geometry();
			peakSegments = new THREE.LineSegments(geometry, material);
			scene.add(peakSegments);
		}
	 }

// AUDIO SETUP ============================================================ 
/* These just generate new lpc data. It is called at every render cycle and passes the 	data to lpcCoefficientCallback(), which maps the audio data to THREE geometry. */

	var dummyPointCount = 256;
	var dummyPoints = [];
	for (var i=0; i<dummyPointCount; i++)
		dummyPoints.push(0);
	var dummyNoisiness = 0.05

	function linScale(v, inlow, inhigh, outlow, outhigh) {
		var range = outhigh - outlow;
		var domain = inhigh - inlow;
		var ov = (v - inlow) / domain;
		ov = (ov * range) + outlow;
		return ov;
	}

	function getDummyLPCCoefficients(cb) {
		var msg = {};
		msg.coefficients = [];
		msg.freqPeaks = [];
		
		var pointCount = dummyPointCount;
		for (var i=0; i<pointCount; i++) {
			if (i==0 || i==(pointCount-1))
				dummyPoints[i] = 0;
			else {
				var p = (Math.random() - 0.5) * dummyNoisiness;
				dummyPoints[i] = dummyPoints[i] + p;
			}
		}
		for (var i=0; i<pointCount; i++) {
			if (i==0 || i==(pointCount-1))
				msg.coefficients.push(dummyPoints[i])
			else {
				var vrg = dummyPoints[i-1] + dummyPoints[i] + dummyPoints[i+1]
				msg.coefficients.push(vrg/3);
			}
		}
		for (var i=0; i<pointCount; i++) {
			if (i>0 && i<(pointCount-1)) {
				if (dummyPoints[i-1] > dummyPoints[i] && dummyPoints[i] < dummyPoints[i+1]) {
					msg.freqPeaks.push({
						X: linScale(i, 0, pointCount-1, -1, 1),
						Y: msg.coefficients[i]
					});
				}
			}
		}
		msg.freqScale = 2.2;
		if (cb)
			cb(msg);
	}


// UPDATE =================================================================
/* Update() draws the waves at each render cycle  
*/
	function updateWaves() {
		//var WIDTH = renderer.getSize().width;
		//var HEIGHT = renderer.getSize().height;
		
		if (line !== undefined) {
			for (var i=0; i<points.length; i++) {
				var px = linScale(i*frequencyScaling, 0, points.length-1, boxW/-2, boxW/2);
				var py = linScale(points[i], 1, -1, boxH/-2, boxH/2);
				line.geometry.vertices[i].set(px, py, 0);
			}
			line.geometry.verticesNeedUpdate = true;
		}

		
		if (peaks !== undefined) {
			var geometry = new THREE.Geometry();
			for (var i=0; i<peaks.length; i++) {
				var peak = peaks[i];
				var px = linScale(peak.X, -1, 1, 0, frequencyScaling);
				px = linScale(px, 0, 1, boxW/-2, boxW/2);
				var py = linScale(peak.Y, 1, -1, boxH/-2, boxH/2);
				var v1 = new THREE.Vector3(px, py, 1);
				var v2 = new THREE.Vector3(px, boxH/2, 1);
				geometry.vertices.push(v1);
				geometry.vertices.push(v2);
			}
			peakSegments.geometry = geometry;
			peakSegments.geometry.verticesNeedUpdate = true;
		}
	};
	


// RENDER ======================================================
	var c = 0

	function render() {
	    // render vars (n/a)
 		// object motion (n/a)
	    // camera motion (n/a)

	    // data updates
	    stats.update();

		getDummyLPCCoefficients(lpcCoefficientCallback);
		updateWaves();
		/*
		if (c < 1) {
			updateWaves();  // #breakpoint
		}
		c++;
		*/
	    // render the scene
	    renderer.render(scene, camera);
	    requestAnimationFrame(render);
	}


// MISC UTILS ======================================================

    function initStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '10px';
        stats.domElement.style.top = '10px';  // 0px places it after the canvas.
        waveHolder.appendChild(stats.domElement);
    }

    function handleResize() {
	    waveHolder = document.getElementById("waveHolder");
	    boxW = waveHolder.clientWidth; 
	    boxH = waveHolder.clientHeight; 
	    boxAspect = boxW / boxH;

	    renderer.setSize(boxW, boxH);
	  	// camera.aspect = boxAspect; // this only works for perspective cam
		camera.left = -boxW/2;
	    camera.right = boxW/2;
	    camera.top = -boxH/2;
	    camera.bottom = boxH/2;
	    camera.updateProjectionMatrix();
	}





