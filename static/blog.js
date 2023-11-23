import { parse } from "./modules/libmarkdown/libmarkdown.js"
export const apiUri = "/api/"

async function handleClick() {
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
        await fetch(apiUri + 'blogs/unlike/' + name);
    } else {
        button.setAttribute("liked", true);
        localStorage.setItem(name + "#liked", true);
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        like.innerHTML = parseInt(like.innerText) + 1;
        await fetch(apiUri + 'blogs/like/' + name);
    }
}

export async function renderPost(postName) {
    const body = document.getElementById('markdown-body')
    const button = document.getElementById('like-button')
    const view = document.getElementById('view-number')
    const like = document.getElementById('like-number')
    const icon = document.getElementById('heart-icon')
    document.querySelector("#like-button").addEventListener('click', handleClick)
    const resp = await fetch(apiUri + 'blogs/content/' + postName);
    const json = await resp.json();
    button.setAttribute("name", postName);

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
    body.innerHTML = parse(json.content)

    // postprocess latex
    renderMathInElement(body, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
        ],
        throwOnError: false
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
        copyButton.addEventListener('click', (_) => {
            navigator.clipboard.writeText(pre.innerText)
            pre.setAttribute("copied", "true")
            setTimeout(() => {
                pre.removeAttribute("copied");
            }, 500)
        });
        title.appendChild(copyButton)
        wrapper.insertBefore(title, wrapper.firstChild);

    })
    view.innerHTML = json.views
    like.innerHTML = json.likes
}