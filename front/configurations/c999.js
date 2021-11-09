function config(c) {
  let c_ = {
    id: 'c999',
    image_width: 1024,
    image_height: 1024,
    grid_width: 1024/2,
    grid_height: 1024/2,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: 8,
    consts_count: 2,
    wait: 0,
    zoom: 7.0,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    air_resistance: 0.0,
    particles: [],
    tests: {},
    center: {
      x:0.0,
      y:0.0,
    }
  }
  c_.max_speed = 1.0 / c_.grid_width;
  const a = c_.max_speed * 0.1;
  let particle_count = c_.grid_width * c_.grid_height / 4;
  console.log(particle_count, "particles")
  for (var i = 0; i < particle_count/20; i++) {
    for (let kind of [c.ELECTRIC, c.WATER, c.FIRE]) {
      let x = Math.random();
      let y = Math.random();
      if ( Math.abs(x-0.5) < 0.47 && Math.abs(y-0.5)<0.47 ) {
        c_.particles.push({
            x: x,
            y: y,
            dx: Math.random()*a-a/2,
            dy: Math.random()*a-a/2,
            kind: kind
        })
      }
    }
  }


  const A = 0.0015*2;
  c_.particles.push({
      x: -0.5*A,
      y: -A,
      kind: c.COCKPIT
  })
  c_.particles.push({
      x: A,
      y: -A,
      kind: c.COCKPIT
  })
  c_.particles.push({
      x: A,
      y: 0,
      kind: c.COCKPIT
  })
  c_.particles.push({
      x: -A,
      y: 0,
      kind: c.COCKPIT
  })
  c_.particles.push({
      x: 0.00,
      y: 0.001,
      kind: c.COCKPIT
  })
  c_.particles.push({
      x: -2*A,
      y: 0,
      kind: c.METAL
  })
  c_.particles.push({
      x: 2*A,
      y: 0,
      kind: c.METAL
  })



  c_.particles.push({
      x: A,
      y: A,
      kind: c.METAL
  })
  c_.particles.push({
      x: -A,
      y: A,
      kind: c.METAL
  })
  c_.particles.push({
      x: 2*A,
      y: A,
      kind: c.METAL
  })
  c_.particles.push({
      x: -2*A,
      y: A,
      kind: c.METAL
  })
  c_.particles.push({
      x: -3*A,
      y: A,
      kind: c.METAL,
      mapping: 'a'
  })
  c_.particles.push({
      x: 3*A,
      y: A,
      kind: c.METAL,
      mapping: 'z'
  })



  c_.particles.push({
      x: 0,
      y: 2*A,
      kind: c.METAL
  })
  c_.particles.push({
      x: -1.5*A,
      y: 2*A,
      kind: c.TURBO,
      mapping: 'a'
  })
  c_.particles.push({
      x: 1.5*A,
      y: 2*A,
      kind: c.TURBO,
      mapping: 'z'
  })
  c_.particles.push({
      x: 2.5*A,
      y: 2*A,
      kind: c.TURBO,
      mapping: 'z'
  })
  c_.particles.push({
      x: -2.5*A,
      y: 2*A,
      kind: c.TURBO,
      mapping: 'a'
  })

  // c_.particles.push({
  //     x: 3.5*A,
  //     y: 2*A,
  //     kind: c.METAL
  // })
  // c_.particles.push({
  //     x: -3.5*A,
  //     y: 2*A,
  //     kind: c.METAL
  // })


  return c_
}
export {
  config
}
