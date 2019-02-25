var type_s = false;
var im_bi;
var radios = document.getElementsByName("type_s");

var dropZone = document.body;
dropZone.addEventListener("dragover", handleDragOver, false);
dropZone.addEventListener("dragleave", handleDragLeave, false);
dropZone.addEventListener("drop", handleFileSelect, false);

var sw = document.getElementById("setWidthSlider");
var sh = document.getElementById("setheightSlider");
var canvas = document.getElementById("cvs");
var ctx = canvas.getContext("2d");
var lk = true;
var zx=1;


function handleFileSelect(evt) {
  var files = evt.dataTransfer.files;
  evt.stopPropagation();
  evt.preventDefault();
  for (var i = 0, f; (f = files[i])  && i<1; i++) {
    if (!f.type.match("image.*")) {
      continue;
    }

    var reader = new FileReader();

    reader.onload = (function(theFile) {
      return function(e) {
        img_set(e.target.result);
      };
    })(f);

    handleDragLeave(evt);
     reader.readAsDataURL(f);
  }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
  document.getElementById("container").style.backgroundColor = "#aaa";
}

function handleDragLeave(evt) {
  document.getElementById("container").style.backgroundColor = "#ccc";
}


// ht to wd link
document.getElementById("cb1").addEventListener("change", function(event) {
    if (document.getElementById("cb1").checked) {
      lk = false;
    } else {
      lk = true;
      sw.value = sh.value;
      draw();
    }
  },  false);


// type selector 
for (var i = 0, max = radios.length; i < max; i++) {
  radios[i].onclick = function() {
    type_s = this.value;
    console.log(this.value);
    console.log(im_bi);
    img_set(im_bi);
    draw();
  };
}

// slider ht
sw.addEventListener(  "input",  function() {
    if (lk) {
      sh.value = sw.value;
    }
    draw();
  },  false );
// slider wd
sh.addEventListener(  "input",  function() {
    if (lk) {
      sw.value = sh.value;
    }
    draw();
  },  false );



function img_set(srco) {
  var image = new Image();
  image.src = srco;
  im_bi = srco;

  image.onload = function() {
     canvas.height = image.height * 2;
    canvas.width = image.width * 2;
    if (type_s == true || type_s == "true") {
      mirrorImage(ctx, image, 0, 0, image.width, image.height, false, false); // normal
      mirrorImage(ctx, image,  image.width,     0,    image.width,        image.height,        true,        false      ); // horizontal flip
      mirrorImage(ctx, image,    0,        image.height,        image.width,        image.height,   false,   true      ); // vertical flip
      mirrorImage(ctx, image,image.width, image.height,image.width, image.height,  true,     true   ); // both flip
     } else {
        ctx.drawImage(image, 0, 0,  image.width, image.height);
        ctx.drawImage(image, image.width, 0,  image.width, image.height);
        ctx.drawImage(image, 0, image.height,  image.width, image.height);
        ctx.drawImage(image, image.width, image.height,  image.width, image.height);
    }
       

    document.body.style.background ="#eee";
//document.body.style.background = "#"+((1<<24)*Math.random()|0).toString(16); 
document.getElementById("cvs1").src = canvas.toDataURL("image/jpg");
draw();







setTimeout(function(){
    document.body.style.backgroundImage = "url('" + canvas.toDataURL() + "')";

}, 10); 

  
  };
}


document.getElementById("cvs1").onclick = function (e) {
  document.getElementById("dlnk").href = document.getElementById("cvs1").src;

}




function draw(a = sw.value, b = sh.value) {
  a = a * 50;
  b = b * 50;

  document.body.style.backgroundSize = "" + a + "px " + b + "px";
  console.log("'" + a + "px " + b + "px'");
 
       
}


toDataURL("img/sam-1.jpg", function(dataURL) {
    im_bi=dataURL;
    sw.value = 3;
    sh.value = 3;
    img_set(dataURL);
});








draw();
/*  outer function */




function mirrorImage(  ctx,  image,  x = 0,  y = 0,  w = 100,  d = 100,  horizontal = false,  vertical = false) {
    ctx.save(); // save the current canvas state
    ctx.setTransform(
      horizontal ? -1 : 1,
      0, // set the direction of x axis
      0,
      vertical ? -1 : 1, // set the direction of y axis
      horizontal ? image.width + x : x, // set the x origin
      vertical ? image.height + y : y // set the y origin
    );
    ctx.drawImage(image, 0, 0, w, d);
    ctx.restore(); // restore the state as it was when this function was called
  }

  
function toDataURL(src, callback) {
  var image = new Image();
  image.crossOrigin = "Anonymous";

  image.onload = function() {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    context.drawImage(this, 0, 0);
    var dataURL = canvas.toDataURL("image/jpeg");
    callback(dataURL);
  };
  image.src = src;
}
