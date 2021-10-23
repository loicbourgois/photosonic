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
- https://en.wikipedia.org/wiki/List_of_Unicode_characters#Box_Drawing
