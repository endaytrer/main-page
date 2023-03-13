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
    body.innerHTML = json.content
    view.innerHTML = json.views
    like.innerHTML = json.likes
}