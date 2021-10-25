# Photosonic


## Getting started

### Dependencies
```sh
curl https://sh.rustup.rs -sSf | sh
```

### Alias
```sh
cp $HOME/.zshrc $HOME/.zshrc.bak
path=$(pwd)/photosonic
echo "alias photosonic='cargo run --manifest-path $path/cli/Cargo.toml -- '" >> $HOME/.zshrc
source $HOME/.zshrc
photosonic
```

## Resources

- https://web.dev/gpu-compute/
- https://rustwasm.github.io/docs/wasm-bindgen/examples/web-audio.html
