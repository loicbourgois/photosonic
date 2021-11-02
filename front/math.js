function random_int(min, max) {
  return Math.floor(min + Math.random() * (max+1-min));
}


export {
  random_int
}
