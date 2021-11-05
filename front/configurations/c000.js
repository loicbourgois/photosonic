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
    steps: 20,
    zoom: 2.0,
    center: {
      x:0.0,
      y:0.0,
    },
    particles: [
      // {
      //   x: 0.1,
      //   y: 0.1,
      //   kind: c.WATER,
      // },
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

  for (var i = 0; i < c_.grid_width/2-1; i++) {
    for (var j = 0; j < c_.grid_height/2-1; j++) {

        c_.particles.push({
            x: i / c_.grid_width * 2,
            y: j / c_.grid_height * 2,
            dx: 0.0,
            dy: 0.0,
            kind: c.WATER
        })
    }
  }

  return c_;
}
export {
  config
}
