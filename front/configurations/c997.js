function config(c) {
  let c_ = {
    id: 'c000',
    image_width: 1024,
    image_height: 1024,
    grid_width: 32,
    grid_height: 32,
    workgroup_size: 8,
    grid_attributs_count: 1,
    wait: 0,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    air_resistance: 0.0,
    zoom: 1.0,
    particles: [
      {
        x: 0.0,
        y: 0.0,
        kind: c.METAL,
      },
      {
        x: 0.05,
        y: 0.0,
        kind: c.METAL,
      },
      {
        x: 0.10,
        y: 0.0,
        kind: c.METAL,
      },


      {
        x: 0.97,
        y: 0.05,
        kind: c.METAL,
      },
      {
        x: 0.02,
        y: 0.05,
        kind: c.METAL,
      },
      {
        x: 0.07,
        y: 0.05,
        kind: c.METAL,
      },
      {
        x: 0.12,
        y: 0.05,
        kind: c.METAL,
      },

      {
        x: 0.00,
        y: 0.10,
        kind: c.TURBO,
      },
      {
        x: 0.05,
        y: 0.10,
        kind: c.METAL,
      },
      {
        x: 0.10,
        y: 0.10,
        kind: c.TURBO,
      },
      // {
      //   x: 0.12,
      //   y: 0.0,
      //   kind: c.METAL,
      // },
      // {
      //   x: 0.03,
      //   y: 0.07,
      //   kind: c.TURBO,
      // },
      // {
      //   x: 0.03,
      //   y: 0.97,
      //   kind: c.METAL,
      // },
      //
      //
      //
      //
      // {
      //   x: 0.0,
      //   y: 0.7,
      //   kind: c.WATER,
      // },
    ],
  }
  c_.max_speed = 1.0 / c_.grid_width;

  // for (var i = 0; i < c_.particles.length; i++) {
  //   c_.particles[i].x += 0.1
  // }

  return c_;
}
export {
  config
}
