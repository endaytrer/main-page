const apiUri = "/api/"

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

async function renderPost(postName) {
    const body = document.getElementById('markdown-body')
    const button = document.getElementById('like-button')
    const view = document.getElementById('view-number')
    const like = document.getElementById('like-number')
    const icon = document.getElementById('heart-icon')
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
    body.innerHTML = json.content
    // preprocess inline-math
    body.querySelectorAll('inline-math').forEach((val) => {
        const latex = val.innerText;
        katex.render(val.innerText, val, {displayMode: false, throwOnError: true})
        val.children[0].setAttribute('latex', latex)
        val.outerHTML = val.innerHTML
    })
    // preprocess tex-block
    body.querySelectorAll('tex-block').forEach((val) => {
        const latex = val.innerText;
        katex.render(val.innerText, val, {displayMode: true, throwOnError: true})
        val.children[0].setAttribute('latex', latex)
        val.outerHTML = val.innerHTML
    })
    // preprocess code blocks
    body.querySelectorAll('pre').forEach((val) => {
        const codeBlock = val.querySelector('code');
        const lines = codeBlock.innerHTML.split('\n').slice(0, -1);
        val.innerHTML = '';
        lines.forEach((line, index) => {
            const lineElement = document.createElement("code");
            lineElement.innerHTML = line;
            val.appendChild(lineElement)
            if (index != lines.length - 1)
                val.innerHTML += '\n'
        });
        const copyButton = document.createElement("button");
        copyButton.className="copy-button"
        copyButton.innerHTML = '<i class="fa-regular fa-clipboard"></i>'
        val.appendChild(copyButton)
        copyButton.addEventListener('click', (e) => {
            navigator.clipboard.writeText(val.innerText)
            val.setAttribute("copied", "true")
            setTimeout(() => {
                val.removeAttribute("copied");
            }, 500)
        });

    })
    view.innerHTML = json.views
    like.innerHTML = json.likes
}