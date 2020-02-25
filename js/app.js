$(document).ready(function() { 
  "use strict";

  //populate static content (id, class, & html)
    $('header > h1').html('');
    navBuilder();

  // attach event handlers 
  $('header > h1').on('click', function(e) {
    e.preventDefault();
    window.location = "about.html";
  });
  console.log('base loaded');
}); // end init



// Page Content ===================================================

var navContent = [
  {
    "id" : "lpc1",
    "txt" : "lpcDummy1",
    "url" : "lpcDummy1.html"
  }, {
    "id" : "lpc2",
    "txt" : "lpcDummy2",
    "url" : "lpcDummy2.html"
  }, {
    "id" : "lpc3",
    "txt" : "lpcDummy3",
    "url" : "lpcDummy3.html"
  }, {
    "id" : "bar",
    "txt" : "fft barChart",
    "url" : "fftBar.html"
  }, {
    "id" : "fftObj",
    "txt" : "fft -> object vertices",
    "url" : "fftObj.html"
  }, {
    "id" : "line",
    "txt" : "lineGraph/waveforms",
    "url" : "line.html"
  }, {
    "id" : "matrix",
    "txt" : "particle matrix",
    "url" : "matrix.html"
  }, {
    "id" : "ring",
    "txt" : "ring matrix",
    "url" : "ringMatrix.html"
  }, {
    "id" : "3Dobj",
    "txt" : "THREEobj_hcTemplate",
    "url" : "globe.html"
  }
]; // end navContent


var navBuilder = function () {
  for (i = 0; i < navContent.length; i++) {
      var item = navContent[i];  // get navContent {} at [i]
      var li = null;

      li = document.createElement('li');
      li.id = item["id"];
      li.className += 'navItem';
      li.innerHTML = item["txt"];
      li.setAttribute('data-link', item["url"]);

      var page = function() { 
        //var url = this.dataset.link;
        window.location=this.dataset.link;
      };
      
      li.addEventListener('click', page);
      
      $('nav ul').append(li);
  } // end FOR
}
