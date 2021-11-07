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
        x: 0.06,
        y: 0.0,
        kind: c.METAL,
      },
      {
        x: 0.07,
        y: 0.07,
        kind: c.TURBO,
      },
      // {
      //   x: 0.17,
      //   y: 0.00,
      //   kind: c.WATER,
      // },
    ],
  }
  c_.max_speed = 1.0 / c_.grid_width;

  return c_;
}
export {
  config
}
