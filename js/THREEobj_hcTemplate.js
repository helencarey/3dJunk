// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2;   // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff

  // milleu
  var cameraBG, sceneBG, composer, clock;

function initGlobe() {

    //$('#notesHead').html("Notes:"); 
    // $('#notesTxt').html(""); 
    $('#3obj').addClass('select');

    // get DOM ele & dimensions for canvas
    threeBox = document.getElementById("threeBox");
    boxW = threeBox.clientWidth; 
    boxH = threeBox.clientHeight; 
    boxAspect = boxW / boxH;

    // CLOCK
        clock = new THREE.Clock();

    // SCENE 
        scene = new THREE.Scene();

    // RENDERER
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0x363636, 1.0);
        renderer.setSize(boxW, boxH);
        renderer.shadowMapEnabled = true;
        // Add the output of the renderer to the html
        canvas = renderer.domElement; // create an ele to hold the renderer
        canvas.id = "canvas"; // just in case
        threeBox.appendChild(canvas);

    // SHAPES 
        // earth
            // THREE.SphereGeometry(radius, # of width segments, # of height segments);
            var sphereGeom = new THREE.SphereGeometry(15, 50, 50);

            // THREE.MeshNormalMaterial = color of mesh is NOT determined by lighting, its determined by its normal vector or the angle of each face. This material is best for positioning the camera and geometry when designing.
            //var sphereMat = new THREE.MeshNormalMaterial();
            var sphereMat = makeEarthMat();

            var earthMesh = new THREE.Mesh(sphereGeom, sphereMat);
            earthMesh.name = 'earth';
            scene.add(earthMesh);

        // clouds
            var cloudGeom = new THREE.SphereGeometry(15.25, 50, 50); // needs to be slightly bigger than 'earth'
            /* same as doing: 
                var cloudGeometry = new THREE.SphereGeometry(sphereGeometry.parameters.radius*1.01, sphereGeometry.parameters.widthSegments, sphereGeometry.parameters.heightSegments);
            */
            
            //var cloudMat = new THREE.MeshNormalMaterial();
            var cloudMat = makeCloudMat();

            var cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
            cloudMesh.name = 'clouds';
            scene.add(cloudMesh);
        
    // CAMERA
        camera = new THREE.PerspectiveCamera(45, boxAspect, 1, 100);
        camera.position.set(15,30,25);
        /* or
            camera.position.x = 35;
            camera.position.y = 36;
            camera.position.z = 33;
        */
        camera.lookAt(scene.position);


        // This wrap the camera in an OrbitalControl obj, which allows you to bind user input to camera positions
          // render update: cameraControl.update(); 
        cameraControl = new THREE.OrbitControls(camera);

    // LIGTHING 
        /* Notes:
            AmbientLight: A simple light whose color is added to the color of an object's material.
                args = THREE.AmbientLight(hexColor);
            
            PointLight: A single point in space that emanates light evenly in all directions.

            SpotLight: A light with a cone effect, for instance, a spot in the ceiling or a torch.

            DirectionalLight: A light that acts like a very remote light source. All light rays run parallel to each other. The sun, for instance, can be seen as an infinite source of light.
                args = THREE.DirectionalLight(hexColor, intensity: 0-1);
        */

        // base lighting
        var ambientLight = new THREE.AmbientLight(0x222222);
        ambientLight.name = 'ambient';
        scene.add(ambientLight);

        // sun
        var sunlight = new THREE.DirectionalLight(0xffffff, 1);
        sunlight.position = new THREE.Vector3(100,10,-50);
        sunlight.name = 'sunlight';
        scene.add(sunlight);

    // BACKGROUND PLANE

        sceneBG = new THREE.Scene();

        cameraBG = new THREE.OrthographicCamera(-boxW, boxW, boxH, -boxH, -10000, 10000);
        cameraBG.position.z = 50;

        var bgGeom = new THREE.PlaneGeometry(1,1);
        var bgMat = makeStarMat();

        var bgPlane = new THREE.Mesh(bgGeom, bgMat);
        bgPlane.position.z = -100;
        bgPlane.scale.set(boxW*2, boxH*2, 1);   

        sceneBG.add(bgPlane);
        
    // EFFECTS COMPOSER
        /*  Notes:
            Defines various render passes, which are combined into a single image shown in the browser.
        */

        // render passes
            var bgPass = new THREE.RenderPass(sceneBG, cameraBG);

            var renderPass = new THREE.RenderPass(scene, camera);
            renderPass.clear = false; // keeps current output

        // screen render #q #hc-learn more about this
            var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
            effectCopy.renderToScreen = true;
        
        // effect composer
            composer = new THREE.EffectComposer(renderer);
            composer.addPass(bgPass);
            composer.addPass(renderPass);
            composer.addPass(effectCopy);


    // GUI, STATS
        /* init for gui obj
        control = new function () {
            this.rotationSpeed = 0.001;
            this.ambientLightColor = ambientLight.color.getHex();
            this.sunlightColor = sunlight.color.getHex();
            //this.opacity = 0.6;
        };
        addControlGui(control);
      */  
        // adds stats obj (stat obj is created below)
        initStatsObject();


        // RENDER:  after the first render, the render interval is determined by requestAnimationFrame
        render(); 
        
    } // end initGlobe()

// GUI CONTROLLER ===================================================

    function addControlGui(controlObject) {
            var gui = new dat.GUI();

            // motion
            gui.add(controlObject, 'rotationSpeed', -0.01, 0.01);

            // lighting
            gui.addColor(controlObject, 'ambientLightColor');
            gui.addColor(controlObject, 'sunlightColor');
    }


// MATERIAL MAKERS  ===================================================

    function makeEarthMat() {
        //4096 is the max width for maps
        var earthTexture = THREE.ImageUtils.loadTexture("../assets/textures/planets/earthmap4k.jpg");

        var earthMat =new THREE.MeshPhongMaterial();
        earthMat.map = earthTexture;

        return earthMat;
    }

    function makeCloudMat() {
        var cloudTexture = THREE.ImageUtils.loadTexture("../assets/textures/planets/fair_clouds_4k.png");

        var cloudMat = new THREE.MeshPhongMaterial();
        cloudMat.map = cloudTexture;
        cloudMat.transparent = true;

        return cloudMat;  
    }

    function makeStarMat() {
        var starTexture = THREE.ImageUtils.loadTexture("../assets/textures/planets/starry_background.jpg");
        var bgMat = new THREE.MeshBasicMaterial();
        bgMat.map = starTexture;
        bgMat.depthTest = false;

        return bgMat;
    }


// RENDER ======================================================

    function render() {
        stats.update();  // update stats
        cameraControl.update(); // update from camera controller

        //object motion
        var rotationSpeed = 0.001;
        scene.getObjectByName('earth').rotation.y += rotationSpeed;
        scene.getObjectByName('clouds').rotation.y += rotationSpeed * 2;
        //scene.getObjectByName('earth').rotation.y += control.rotationSpeed;
        //scene.getObjectByName('clouds').rotation.y += control.rotationSpeed * 2;

        //lighting
        //scene.getObjectByName('ambient').color = new THREE.Color(control.ambientLightColor);
        //scene.getObjectByName('sunlight').color = new THREE.Color(control.sunlightColor);


        //
        //renderer.render(scene, camera); // render the scene
        //renderer.render(sceneBG, cameraBG); 
        
        renderer.autoClear = false; // the render shouldn't autoClear, b/c the composer now in charge of this (building the render process)
        composer.render();

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













