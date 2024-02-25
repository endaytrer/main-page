import { parse } from "./modules/libmarkdown/libmarkdown.js"
export const apiUri = "/api/"
import { getLicense } from './license.js';

function handleClick() {
    const icon = document.getElementById('heart-icon')
    const like = document.getElementById('like-number')
    const button = document.getElementById('like-button')
    let name = button.getAttribute("name");
    if (button.getAttribute("liked")) {
        button.removeAttribute("liked");
        localStorage.removeItem(name + "#liked");
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
        like.innerHTML = parseInt(like.innerText) - 1;
        fetch(apiUri + 'blogs/unlike/' + name);
    } else {
        button.setAttribute("liked", true);
        localStorage.setItem(name + "#liked", true);
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        like.innerHTML = parseInt(like.innerText) + 1;
        fetch(apiUri + 'blogs/like/' + name);
    }
}
const SCAN_LINES = 10

const TITLE_REGEX = /^#\s(.*?)$/
const LICENSE_REGEX = /^>\s+License:\s*(.*?)$/
const TAG_REGEX = /^>\s+Tags:\s*([^\s][^,]*(,\s*[^\s][^,]*)*),?$/
function renderContent(body, content) {
    // exclude title, license and tags from content
    const lines = content.split("\n");
    const kept_lines = lines.slice(SCAN_LINES);
    const testing_lines = lines.slice(0, SCAN_LINES);
    const tested_lines = [];
    for (const line of testing_lines) {
        const line_trim = line.trim();
        if (TITLE_REGEX.test(line_trim) || LICENSE_REGEX.test(line_trim) || TAG_REGEX.test(line_trim)) {
            continue;
        }
        tested_lines.push(line)
    }
    content = tested_lines.concat(kept_lines).join("\n");
    body.innerHTML = parse(content)

    // postprocess latex
    renderMathInElement(body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
        ],
        throwOnError: false
    })

    // postprocess image blocks
    body.querySelectorAll("img").forEach((img) => {
        let url = new URL(img.src)
        img.src = url.origin + "/blogs" + url.pathname + url.search + url.hash
    })
    // postprocess code blocks
    body.querySelectorAll('.pre-wrapper').forEach((wrapper) => {
        let title = document.createElement('div');
        title.className="pre-title"

        let titleLabel = document.createElement('span');
        if (wrapper.getAttribute('lang'))
            titleLabel.innerText = "Language: " + wrapper.getAttribute('lang');
        title.appendChild(titleLabel);

        let pre = wrapper.querySelector('pre');
        pre.style = undefined;
        const lines = pre.innerHTML.split('\n').slice(0, -1);
        pre.innerHTML = '';
        lines.forEach((line, index) => {
            const lineElement = document.createElement("code");
            lineElement.innerHTML = line;
            pre.appendChild(lineElement)
            if (index != lines.length - 1)
                pre.innerHTML += '\n'
        });
        const copyButton = document.createElement("button");
        copyButton.className="copy-button"
        copyButton.innerHTML = '<i class="fa-regular fa-clipboard"></i>'
        copyButton.onclick = (_) => {
            navigator.clipboard.writeText(pre.innerText)
            pre.setAttribute("copied", "true")
            setTimeout(() => {
                pre.removeAttribute("copied");
            }, 500)
        };
        title.appendChild(copyButton)
        wrapper.insertBefore(title, wrapper.firstChild);
    })
}
const SEPARATOR = `<span class="separator">&bull;</span>`
export async function renderPost(postName) {
    const button = document.getElementById('like-button')
    const view = document.getElementById('view-number')
    const like = document.getElementById('like-number')
    const postInfo = document.getElementById('post-info')

    const icon = document.getElementById('heart-icon')
    document.querySelector("#like-button").onclick = handleClick;
    const resp = await fetch(apiUri + 'blogs/stat/' + postName);
    const json = await resp.json();
    view.innerHTML = json.reads
    like.innerHTML = json.likes
    // Date
    postInfo.innerHTML = `<i class="fa-regular fa-calendar"></i> ` + new Date(json.created).toLocaleDateString()
    // Tags
    if (json.tags.length > 0) {
        postInfo.innerHTML += SEPARATOR + json.tags.map((val) => `<span class="tag">${val.name}</span>`).join(" ")
    }
    // License
    postInfo.innerHTML += SEPARATOR + getLicense(new Date(json.created).getFullYear(), json.license);
    button.setAttribute("name", postName);

    document.getElementById("blog-title").innerText = json.title;

    if (localStorage.getItem(postName + "#liked")) {
        button.setAttribute("liked", true);
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
    } else {
        button.removeAttribute("liked");
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
    }
    document.title = json.title;
    const passwordInput = document.getElementById('password-input');
    const passwordForm = document.getElementById('password-form');
    const body = document.getElementById('markdown-body')
    if (json.need_password) {
        passwordForm.onsubmit = getProtectedContent;
        passwordInput.classList.remove("hidden");
        const passwordHintBox = document.getElementById('password-hint-box');
        const passwordHint = document.getElementById('password-hint');
        if (json.hint) {
            passwordHintBox.hidden = false;
            passwordHint.innerText = json.hint
        } else {
            passwordHintBox.hidden = true;
        }
        document.getElementById("password-input-id").value = postName;
        body.innerHTML = "";
    } else {
        passwordInput.classList.add("hidden");
        const content = await(await fetch('/blogs/' + postName)).text();
        renderContent(body, content);
    }
}

export async function getProtectedContent(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const params = new URLSearchParams();
    params.append("id", formData.get("id"));
    params.append("password", formData.get("password"));
    const resp = await fetch('/api/blogs/content?' + params.toString());
    if (resp.status != 200) {
        alert("Wrong password");
        const passwordInput = document.getElementById('password-input');
        passwordInput.value = "";
        return;
    }

    const content = await resp.text();
    const passwordInput = document.getElementById('password-input');
    const body = document.getElementById('markdown-body');
    passwordInput.classList.add("hidden");
    renderContent(body, content);
}