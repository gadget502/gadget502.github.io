var config = {
  points: {
    init_number: 2,
    max_number: 20,
    break_speed: 0.1
  },
  max_speed: 1.5, //pixels
  move_distance: 200, //pixels
  chance_to_move: 10, //percent
  chance_to_split: 40, //percent
  draw_mode: "1",
  color_mutation: 10,
  split_mode: "1"
};

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var w, h;

var points = [];
var last_point_index = 0;

var lines = [];

var canvas, ctx;

window.onload = function(){
  
  w = window.innerWidth;
  h = window.innerHeight;
    
  create();
};

function create(){
  
  points.length = lines.length = last_point_index = 0;
  
  canvas = document.getElementById("c");
  ctx = canvas.getContext("2d");
  
  canvas.width = w = window.innerWidth;
  canvas.height = h = window.innerHeight;
  
  var x, y, s, c;
  
  for(var i=0;i<config.points.init_number;i++){
    x = Math.floor(Math.random() * (w/2) + w/4);
    y = Math.floor(Math.random() * (h/2) + h/4);
    s = Math.random() * config.max_speed / (-2);
    c = Math.random() * 360;
    points.push({
      index: i,
      x: x,
      y: y,
      move_dir: 0,
      speed: s,
      init_speed: s,
      color: c
    });
    lines.push({
      xi: x,
      yi: h + 100,
      linked_to: i,
      color: c
    });
    last_point_index++;
  }
  loop();
}

function getIndex(index){
  for(var i=0;i<points.length;i++)
    if(points[i].index == index) return i;
  return false;
}

function func() {
  canvas.left = 0+"px";
}

function spawn_point(parent) {
  if(points.length >= config.points.max_number - 1) return;
  var index = last_point_index++;
  var y = points[getIndex(parent)].y + points[getIndex(parent)].dist_since_last_move * Math.random();
  var s = Math.random() * config.max_speed - config.max_speed / 2;
  var raw_c = Math.random() * config.color_mutation * 2 - config.color_mutation;
  var c = points[getIndex(parent)].color + raw_c;
  if(c < 0) c = 360 + c;
  else if(c > 360) c -= 360;
  points.push({
    index: index,
    x: points[getIndex(parent)].x,
    y: points[getIndex(parent)].y,
    move_dir: 0,
    speed: s,
    init_speed: s,
    color: c
  });
  lines.push({
    xi: points[getIndex(parent)].x,
    yi: points[getIndex(parent)].y,
    linked_to: index,
    color: c
  });
  
  if(config.split_mode === "1") {
    move_line(getIndex(index));
  }else{
    var r = Math.random() * 2
  
    points[parent].color += raw_c * (-1); 
  
    move_line(getIndex(index), r > 1 ?  1 : -1);
    move_line(         parent, r > 1 ? -1 :  1);
  }
}

function break_line(index, vertical) {
  for(var i=0;i<lines.length;i++) {
    if(lines[i].linked_to == points[index].index) {
      lines[i].linked_to = -1;
      lines[i].xf = points[index].x;
      lines[i].yf = points[index].y;
      break;
    }
  }
  lines.push({
    xi: points[index].x,
    yi: points[index].y,
    linked_to: points[index].index,
    vartical: vertical,
    color: points[index].color
  });
}

function move_line(index, direction) {
  
  break_line(index, false);
  
  var nx;
  
  do{
    if(direction === undefined)
      nx = Math.floor( points[index].x + Math.random() * config.move_distance * 2 - config.move_distance );
    else
      nx = Math.floor( points[index].x + Math.random() * config.move_distance * direction );
  }while( nx < 0 || nx > w );
  
  points[index].move_dir = nx > points[index].x ? 1 : -1;
  points[index].move_to = nx;
}

function update(){
  
  var r, i;
  
  for(i=0;i<points.length;i++) {
    
    if(points[i].move_dir) {
      points[i].x += points[i].move_dir * config.max_speed;
      if( (points[i].move_dir === 1 && points[i].x > points[i].move_to) || (points[i].move_dir === -1 && points[i].x < points[i].move_to) ) {
        points[i].move_to = 0;
        points[i].move_dir = 0;
        break_line(i, true);
        points[i].dist_since_last_move = 0;
      }
    }else{
      
      r = Math.random() * 100;
    
      if(r < config.chance_to_split / 100) spawn_point(points[i].index);
      
      r = Math.random() * 100;
    
      if(r < config.chance_to_move / 100) move_line(i);
      
    }
    points[i].y += points[i].speed;
    if(points[i].init_speed < 0 && points[i].init_speed * (-1) > points[i].speed && points[i].y < 100) {
      points[i].speed += config.points.break_speed;
    }
    points[i].dist_since_last_move += Math.abs(points[i].speed);
    if(points[i].y > h + 100) {
      
      for(var j = 0;j<lines.length;j++) {
        if(lines[j].linked_to == points[i].index){
          lines.splice(j, 1);
          j--;
        }
      }
      
      points.splice(i, 1);
      i--;
    }
    
  }
  
  for(i=0;i<lines.length;i++){
    lines[i].yi += config.max_speed;
    if(lines[i].linked_to === -1) {
      lines[i].yf += config.max_speed;
      if(lines[i].yf > h + 100) {
        //console.log("DELETE!");
        lines.splice(i, 1);
        i--;
      } 
    }
  }
  
}
function render_mono_color(){
  ctx.clearRect(0, 0, w, h);
  var x, y, i;
  
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
  
  ctx.shadowColor = ctx.strokeStyle = "cyan";
  for(i=0;i<lines.length;i++) {
    ctx.beginPath();
    if(lines[i].linked_to === -1) {
      x = lines[i].xf;
      y = lines[i].yf;
    }else{
      x = points[getIndex(lines[i].linked_to)].x;
      y = points[getIndex(lines[i].linked_to)].y;
    }
    ctx.moveTo(lines[i].xi, lines[i].yi);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  
  
  
  ctx.shadowColor = ctx.fillStyle = "cyan"; 
  for(i=0;i<points.length;i++) {
   ctx.beginPath();
   ctx.arc(points[i].x, points[i].y, 5, 0, 2 * Math.PI, false);
   ctx.fill();
  }
  
}

function render_multi_color(){
  ctx.clearRect(0, 0, w, h);
  var x, y, i;
  
  ctx.shadowBlur = 10;
  ctx.globalCompositeOperation = "lighter";
  
  for(i=0;i<lines.length;i++) {
    ctx.beginPath();
    if(lines[i].linked_to === -1) {
      x = lines[i].xf;
      y = lines[i].yf;
    }else{
      x = points[getIndex(lines[i].linked_to)].x;
      y = points[getIndex(lines[i].linked_to)].y;
    }
    ctx.moveTo(lines[i].xi, lines[i].yi);
    ctx.lineTo(x, y);
    ctx.shadowColor = ctx.strokeStyle = "hsl("+ lines[i].color +", 50%, 50%)";
    ctx.stroke();
  }
  
  ctx.globalCompositeOperation = "source-over";
   
  for(i=0;i<points.length;i++) {
   ctx.shadowColor = ctx.fillStyle = "hsl("+ points[i].color +", 50%, 50%)";
   ctx.beginPath();
   ctx.arc(points[i].x, points[i].y, 5, 0, 2 * Math.PI, false);
   ctx.fill();
  }
  
}

function loop(){
  requestAnimFrame(loop);
  update();
  if(config.draw_mode === "1")
    render_multi_color();
  else
    render_mono_color();
}