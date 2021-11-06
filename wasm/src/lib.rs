#![deny(warnings)]
mod utils;
use crate::utils::set_panic_hook;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::Window;
use web_sys::GpuBufferUsage;
use web_sys::GpuBufferDescriptor;
use web_sys::GpuDevice;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn greet() {
    log("Hello");
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just `log(..)`.
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    pub fn error(s: &str);
}
#[wasm_bindgen]
pub fn main() {
    log("Go");
    set_panic_hook();
    let window: Window = web_sys::window().expect("no global `window` exists");
    let navigator = window.navigator();
    let gpu = navigator.gpu();
    let request_adapter_closure = Closure::wrap(Box::new(|js_value: wasm_bindgen::JsValue| {
        let request_device_closure = Closure::wrap(Box::new(|js_value: wasm_bindgen::JsValue| {
            let gpu_device: web_sys::GpuDevice = web_sys::GpuDevice::from(js_value);
            go(&gpu_device);
        }) as Box<dyn FnMut(JsValue)>);
        let gpu_adapter: web_sys::GpuAdapter = web_sys::GpuAdapter::from(js_value);
        let _ = gpu_adapter.request_device().then(&request_device_closure);
        request_device_closure.forget();
    }) as Box<dyn FnMut(JsValue)>);
    let _ = gpu.request_adapter().then(&request_adapter_closure);
    request_adapter_closure.forget();
}
pub fn go(gpu_device: &GpuDevice) {
    log(&format!("{:#?}", gpu_device));
    gpu_device.label();
    let buffer_size = 2.0;
    let _gpu_buffer_a = gpu_device.create_buffer(&GpuBufferDescriptor::new(
        buffer_size,
        GpuBufferUsage::MAP_WRITE | GpuBufferUsage::COPY_SRC
    ));
}
