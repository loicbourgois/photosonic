use std::fs;
use std::io::Write;
pub fn generate(generated_path: String) -> std::io::Result<()> {
    println!("[start] Generating");
    fs::create_dir_all(&generated_path)?;
    let mut file = std::fs::File::create(generated_path + "/particles.js").expect("create failed");
    file.write_all("yolo".as_bytes()).expect("write failed");
    println!("[ end ] Generating done");
    return Ok(());
}
