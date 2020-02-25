// GLOBALS 
    var renderer, scene, camera, control, cameraControl, stats, rotation;    // common 3js stuff   
    var context, sourceNode, analyser, analyser2;   // common webAudio API stuff  
    var threeBox, boxW, boxH, boxAspect, canvas;    // common DOM stuff

    

function initFFTbar() {
	$('#bar').addClass('select');
	// $('#notesHead').html("Notes:"); 
    // $('#notesTxt').html(""); 
    
	console.log('FFT Bar Chart clicked');
}