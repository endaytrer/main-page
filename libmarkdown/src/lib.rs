use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, Options, html};
#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert(&format!("Hello, world!"));
}

#[wasm_bindgen]
pub fn parse(text: &str) -> String {
    let options = Options::all();

    let parser = Parser::new_ext(text, options);
    let mut output = String::new();
    html::push_html(&mut output, parser);

    output
}

#[cfg(test)]
mod tests; 