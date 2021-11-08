function get (conf) {return `
${SHADER_COMMON}


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
[[group(0), binding(3)]] var<storage, read>  uniforms : Uniforms;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {

  let img_width = f32(${conf.image_width});
  let img_height = f32(${conf.image_height});

  let point = vec2<f32>(
    ((f32(gid.x) - (0.5-uniforms.center.x*uniforms.zoom)*img_width   )/uniforms.zoom + img_width)  % img_width ,
    ((f32(gid.y) - (0.5-uniforms.center.y*uniforms.zoom)*img_height )/uniforms.zoom + img_height) % img_height
  );

  let DIAMETER: f32 = ${2.0 / conf.grid_width};
  let cell_id = fn_cell_id(u32(point.x), u32(point.y), uniforms.zoom);

  let pixel_point = vec2<f32>(point.x/f32(${conf.image_width}), point.y/f32(${conf.image_height}));

  let center = vec2<u32>(
    u32(${conf.image_width}.0 * (uniforms.center.x   + 0.5)),
    u32(${conf.image_height}.0 * (uniforms.center.y  + 0.5))
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
    let particle_id_ = coloring_cell_ids[i];
    let particle = input.cells[particle_id_];
    let particle_center = vec2<f32>(particle.x, particle.y);
    let d = 1.0 - distance_( pixel_point, particle_center )*${conf.grid_width}.0;
    if (input.cells[particle_id_].active == 1u && d > d_max) {
      d_max = d;
      color_kind = particle.kind;
      particle_id = particle_id_;
    }
  }

  let collisions = input.cells[particle_id].collisions;




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
  } elseif (color_kind == ${conf.TURBO}u ) {
    img.pix[pix_id].r = 180u + u32(250.0 * d_max);
    img.pix[pix_id].g = 100u + u32(200.0 * d_max);
    img.pix[pix_id].b = 100u + u32(100.0 * d_max);
    img.pix[pix_id].a = 255u;
  } elseif (color_kind == ${conf.METAL}u ) {
    img.pix[pix_id].r = 150u + u32(100.0 * d_max);
    img.pix[pix_id].g = 150u + u32(100.0 * d_max);
    img.pix[pix_id].b = 150u + u32(100.0 * d_max);
    img.pix[pix_id].a = 255u;
  }


  if(collisions != 0u && color_kind != 0u) {
    //img.pix[pix_id].r = 255u;
    // img.pix[pix_id].g = 0u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  }





  let d_mouse = distance(vec2<f32>(gid.xy), vec2<f32>((uniforms.mouse.x * img_width), (uniforms.mouse.y * img_height)));
  let diameter_mouse = img_width / ${conf.grid_width}.0 * uniforms.zoom;


  if (   d_mouse < diameter_mouse &&  d_mouse > diameter_mouse*0.5 ) {
    img.pix[pix_id].r = 250u;
      img.pix[pix_id].g = 150u;
      img.pix[pix_id].b = 100u;
      img.pix[pix_id].a = 255u;
  }


  if (abs(pixel_point.x) < 0.001 || abs(pixel_point.y) < 0.001) {
    img.pix[pix_id].r = 200u;
      img.pix[pix_id].g = 50u;
      img.pix[pix_id].b = 50u;
      img.pix[pix_id].a = 255u;
  }

}
`}
export {
  get
}
