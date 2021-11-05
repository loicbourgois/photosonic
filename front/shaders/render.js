function get (conf) {return `
struct Particle {
  active: u32;
  kind: u32;
  x: f32;
  y: f32;
  x_old: f32;
  y_old: f32;
  cell_id: u32;
  collisions: u32;
};
struct Cell {
  particle_id: u32;
};
[[block]] struct Data {
  step: u32;
  time: f32;
  center: vec2<f32>;
  zoom: f32;
  particles: array<Particle, ${conf.particle_max_count}>;
  cells: array<Cell, ${conf.grid_size}>;
};
struct Pixel {
  r: u32;
  g: u32;
  b: u32;
  a: u32;
};
[[block]] struct Image {
  pix: array<Pixel, ${conf.image_size}>;
};


fn random_frac (x:f32, y:f32) -> f32 {
  return fract(sin(dot(vec2<f32>(x*1000.0,y),
                       vec2<f32>(12.9898, 78.233)))*
      43758.5453123);
}
fn random_frac_3 (x:f32, y:f32, z:f32) -> f32 {
  let r = random_frac(x,y);
  return random_frac(r, z);
}
fn random_u32(z:f32, x:f32, y:f32, min:u32, max:u32) -> u32 {
  return  u32(random_frac_3(x, y, z) * f32(max-min)) + min;
}



fn right (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return (x+1u) % ${conf.grid_width}u + y * ${conf.grid_width}u;
}
fn left (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return (x + ${conf.grid_width}u - 1u) % ${conf.grid_width}u + y * ${conf.grid_width}u;
}
fn up (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return x + ( (y + ${conf.grid_width}u - 1u)%${conf.grid_width}u ) * ${conf.grid_width}u;
}
fn down (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return x + ( (y + 1u)%${conf.grid_height}u ) * ${conf.grid_width}u;
}


fn fn_cell_id(gidx: u32, gidy: u32, zoom: f32) -> u32 {
  let unit = f32(${Math.floor(conf.image_width / conf.grid_width)});
  let x = f32(gidx) ;
  let y = f32(gidy);
  return u32 ( u32(x) / u32(unit) + u32(y) / u32(unit) * u32(${conf.grid_width}) );
}


fn distance_(a:vec2<f32>, b:vec2<f32>) -> f32{
  let a2 =   fract(vec2<f32>(   (a.x + .25), (a.y + .25)  ));
  let b2 =   fract(vec2<f32>(   (b.x + .25), (b.y + .25)  ));
  let a3 =   fract(vec2<f32>(   (a.x + .5), (a.y + .5)  ));
  let b3 =   fract(vec2<f32>(   (b.x + .5), (b.y + .5)  ));
  return min( min ( distance(a,b), distance(a2,b2) ), distance(a3,b3));
}


fn color_delta(particle_center: vec2<f32>, pixel: vec2<f32>) -> f32 {
  var d = 1.0 - distance_( pixel, particle_center )*${conf.grid_width}.0;
  return d;
}


[[group(0), binding(0)]] var<storage, read>   input  : Data;
[[group(0), binding(1)]] var<storage, write>  img : Image;
[[group(0), binding(2)]] var<storage, write>  img_previous : Image;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {

  let img_width = f32(${conf.image_width});
  let img_height = f32(${conf.image_height});

  let point = vec2<f32>(
    ((f32(gid.x) - (0.5-input.center.x*input.zoom)*img_width   )/input.zoom + img_width)  % img_width ,
    ((f32(gid.y) - (0.5-input.center.y*input.zoom)*img_height )/input.zoom + img_height) % img_height
  );

  let DIAMETER: f32 = ${2.0 / conf.grid_width};
  let cell_id = fn_cell_id(u32(point.x), u32(point.y), input.zoom);

  let pixel_point = vec2<f32>(point.x/f32(${conf.image_width}), point.y/f32(${conf.image_height}));

  let center = vec2<u32>(
    u32(${conf.image_width}.0 * (input.center.x   + 0.5)),
    u32(${conf.image_height}.0 * (input.center.y  + 0.5))
  );
  let pix_id = (  (gid.x)%${conf.image_width}u )
    + (gid.y)%${conf.image_height}u * ${conf.image_width}u;


  // Coloring


  let ooo = 0.95;

  img.pix[pix_id].r = u32( f32(img_previous.pix[pix_id].r)*ooo );
  img.pix[pix_id].g = u32( f32(img_previous.pix[pix_id].g)*ooo );
  img.pix[pix_id].b = u32( f32(img_previous.pix[pix_id].b)*ooo );
  img.pix[pix_id].a = 255u;


  var coloring_cell_ids: array<u32, 9>;
  coloring_cell_ids[0] = up(left(cell_id));
  coloring_cell_ids[1] = up(cell_id);
  coloring_cell_ids[2] = right(up(cell_id));
  coloring_cell_ids[3] = left(cell_id);
  coloring_cell_ids[4] = cell_id;
  coloring_cell_ids[5] = right(cell_id);
  coloring_cell_ids[6] = left(down(cell_id));
  coloring_cell_ids[7] = down(cell_id);
  coloring_cell_ids[8] = right(down(cell_id));


  var d_max = 0.0;
  var color_kind = 0u;
  var particle_id = 0u;
  for (var i = 0 ; i < 9 ; i=i+1) {
    let particle_id_ = input.cells[ coloring_cell_ids[i] ].particle_id;
    let particle = input.particles[particle_id_];
    let particle_center = vec2<f32>(particle.x, particle.y);
    let d = 1.0 - distance_( pixel_point, particle_center )*${conf.grid_width}.0;
    if (particle_id_ != 999999999u && d > d_max) {
      d_max = d;
      color_kind = particle.kind;
      particle_id = input.cells[ coloring_cell_ids[i] ].particle_id;
    }
  }

  let collisions = input.particles[particle_id].collisions;




  // particle_id = input.cells[ cell_id ].particle_id;




  if (color_kind == ${conf.FIRE}u ) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = 100u + u32(155.0 * d_max);
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  } elseif (color_kind == ${conf.WATER}u ) {
    img.pix[pix_id].r = 0u;
    img.pix[pix_id].g = 150u + u32(155.0 * d_max);
    img.pix[pix_id].b = 255u;
    img.pix[pix_id].a = 255u;
  } elseif (color_kind == ${conf.ELECTRIC}u ) {
    img.pix[pix_id].r = 180u + u32(205.0 * d_max);
    img.pix[pix_id].g = 180u + u32(205.0 * d_max);
    img.pix[pix_id].b = u32(205.0 * d_max);
    img.pix[pix_id].a = 255u;
  }


  if (collisions == 0u && particle_id != 999999999u) {

  } elseif (collisions == 1u && color_kind != 0u) {
    // img.pix[pix_id].r = 255u;
    // img.pix[pix_id].g = 255u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  } elseif (collisions == 2u && color_kind != 0u) {
    // img.pix[pix_id].r = 255u;
    // img.pix[pix_id].g = 155u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  } else {
    // img.pix[pix_id].r = 255u;
    // img.pix[pix_id].g = 0u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  }



  // if (particle_id != 999999999u) {
  //   img.pix[pix_id].r = 0u;
  //   img.pix[pix_id].g = 200u;
  //   img.pix[pix_id].b = 0u;
  //   img.pix[pix_id].a = 255u;
  // }


  let a = 0.9;
  let b = 0.9;

  // img.pix[pix_id].r = u32( f32(img.pix[pix_id].r)*a + f32(img_previous.pix[pix_id].r)*b  );
  // img.pix[pix_id].g = u32( f32(img.pix[pix_id].g)*a + f32(img_previous.pix[pix_id].g)*b  );
  // img.pix[pix_id].b = u32( f32(img.pix[pix_id].b)*a + f32(img_previous.pix[pix_id].g)*b  );

      //
      // if (abs(pixel_point.x) <= 0.002/input.zoom || abs(pixel_point.y) <= 0.002/input.zoom ) {
      //   img.pix[pix_id].r = 250u;
      //   img.pix[pix_id].g = 150u;
      //   img.pix[pix_id].b = 100u;
      //   img.pix[pix_id].a = 255u;
      // }

}
`}
export {
  get
}
