function config(c) {
  let c_ = {
    id: 'c996',
    image_width: 1024,
    image_height: 1024,
    grid_width: 32*4,
    grid_height: 32*4,
    workgroup_size: 8,
    grid_attributs_count: 1,
    wait: 10,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    air_resistance: 0.0,
    zoom: 1.0,
    particles: [
      {
        x: 0.05,
        y: 0.87,
        kind: c.COCKPIT,
      },
      {
        x: 0.0,
        y: 0.92,
        kind: c.METAL,
      },
      {
        x: 0.95,
        y: 0.97,
        kind: c.METAL,
      },
      {
        x: 0.05,
        y: 0.97,
        kind: c.METAL,
      },
      {
        x: 0.95,
        y: 0.02,
        kind: c.METAL,
      },
      {
        x: 0.05,
        y: 0.02,
        kind: c.METAL,
      },



      {
        x: 0.10,
        y: 0.92,
        kind: c.METAL,
      },
      {
        x: 0.15,
        y: 0.97,
        kind: c.METAL,
      },

      {
        x: 0.15,
        y: 0.02,
        kind: c.METAL,
      },



      {
        x: 0.1,
        y: 0.0,
        kind: c.METAL,
      },
      {
        x: 0.0,
        y: 0.0,
        kind: c.METAL,
      },


      {
        x: 0.0,
        y: 0.05,
        kind: c.TURBO,
        mapping: 'a',
      },
      {
        x: 0.1,
        y: 0.05,
        kind: c.TURBO,
        mapping: 'z',
      },


      {
        x: 0.2,
        y: 0.97,
        kind: c.TURBO,
        mapping: 'z',
      },
      {
        x: 0.87,
        y: 0.97,
        kind: c.TURBO,
        mapping: 'a',
      },





      {
        x: -0.8,
        y: 0.05,
        kind: c.TURBO,
      },


    ],
  }
  c_.max_speed = 1.0 / c_.grid_width;

  for (var i = 0; i < c_.particles.length; i++) {
    c_.particles[i].x += 0.4
    c_.particles[i].x %= 1.0
    c_.particles[i].x *= 0.25

    c_.particles[i].y += 0.4
    c_.particles[i].y %= 1.0
    c_.particles[i].y *= 0.25
  }

  return c_;
}
export {
  config
}
