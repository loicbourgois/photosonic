function config(c) {
  let c_ = {
    id: 'c998',
    image_width: 1024,
    image_height: 1024,
    grid_width: 64,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    wait: 0,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    center: {
      x:0,
      y:0,
    },
    zoom: 1.0,
    particles: [
      {
        x: 0.1,
        y: 0.1,
        kind: c.WATER,
      },
      {
        x: 0.4,
        y: 0.4,
        kind: c.WATER,
      },
      // {
      //   x: 0.0,
      //   y: 0.4,
      //   kind: c.WATER,
      // },
      // {
      //   x: 0.0,
      //   y: 0.0,
      //   kind: c.WATER,
      // },
      // {
      //   x: 0.4,
      //   y: 0.4,
      //   kind: c.WATER,
      // },
      // {
      //   x: 0.999,
      //   y: 0.5,
      //   //dx: 0.01,
      //   kind: c.FIRE,
      // },
    ],
    tests: {

    }
  }



  return c_;
}
export {
  config
}
