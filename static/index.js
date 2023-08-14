
const root = [
    {
        "type": 1,
        "user": false,
        "content": {
            ".": 0,
            "..": 0,
            "tetris": 1,
            "calculator": 2,
            "sort": 3,
            "wordle": 4,
            "phased-array": 5,
	    "path-tracing-webgl": 6
        }
    }, {
        "type": 0,
        "user": false,
        "content": "/sites/tetris"
    }, {
        "type": 0,
        "user": false,
        "content": "/sites/calculator"
    }, {
        "type": 0,
        "user": false,
        "content": "/sites/sort"
    }, {
        "type": 0,
        "user": false,
        "content": "/sites/wordle"
    }, {
        "type": 0,
        "user": false,
        "content": "/sites/phased-array"
    }, {
	"type": 0,
	"user": false,
	"content": "/sites/path-tracing-webgl"
    }
]
const systemReserve = 16;
let successStarter = '<span class="green">❯</span>&nbsp;';
let failStarter = '<span class="red">❯</span>&nbsp;';
let prompt = 'Welcome to <a href="/"><b>endaytrer</b>.com</a>. This is <b>Daniel Gu</b>&apos;s personal website, which has a command line interface. <br/>You can also use the links below to quickly access this website.<br/><br/><span class="gray"> - Play tetris?</span> <a href="/sites/tetris">Tetris</a> <br/> <span class="gray"> - Have a look at my calculator?</span> <a href="/sites/calculator">Calculator</a> <br/> <span class="gray"> - Have a look at my sorting demo?</span> <a href="/sites/sort">Sort</a> <br/> <span class="gray"> - Play Wordle?</span> <a href="/sites/wordle">Wordle</a> <br/><br/>Type <span class="green">"help"</span> to show all the available commands, type <span class="green">"start"</span> to show this prompt again.<br/><br/>';
let profile = '<div class="profile"><div class="avatar"></div><h1>Daniel Gu</h1><h2>University of Wisconsin-Madison</h2><h2>Xi&apos;an Jiaotong University</h2><h2 class="location"><i class="fa-regular fa-location-dot"></i><b>Suzhou, China</b></h2><div class="links"><a href="https://instagram.com/endaytrer?igshid=YmMyMTA2M2Y=" class="fa-brands fa-instagram"></a><a href="https://twitter.com/endaytrer" class="fa-brands fa-twitter"></a><a href="https://facebook.com/endaytrer" class="fa-brands fa-facebook"></a><a href="https://github.com/endaytrer" class="fa-brands fa-github"></a><a href="mailto:endaytrer@gmail.com" class="fa-regular fa-envelope"></a></div></div>';
const helpText = "<b>endaytrer.com</b> Help Document<br/><br/><b>Usage:</b> program [..args] ([ > file] | [ >> file])<br/><br/><br/><b>Programs:</b><br/><br/>&nbsp;&nbsp;- Information Commands:<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>help</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Show help document. <br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>start</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show starting prompt. <br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>profile</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show my profile. <br/><br/>&nbsp;&nbsp;- Filesystem Commands:<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>ls [dir]</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Show the contents in directory. If [dir] is not provided, show the contents in present working directory.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>pwd</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Show present working directory.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>cd dir</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Change directory to `dir`.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>mkdir dir</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Create a directory at `dir`. If the parent directory of `dir` does not exist, `dir` will not be created.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>touch file</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Create a file `file`. If the parent directory of `file` does not exist, `file` will not be created.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>rm file</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Remove file or directory `file`. If a directory is passed into `file`, remove it recursively.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>reset</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Reset the filesystem to default. <b>**NOTICE: THE OPERATION IS IRREVERSIBLE**</b><br/><br/>- File/IO Commands:<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>open file</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Open a website, whose URL is given by the content of `file`.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>cat file</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Put content of `file` into STDOUT.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>echo [..args]</b>&nbsp;&nbsp;&nbsp;&nbsp; Print [..args] into STDOUT.<br/><br/>- Other Commands<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>setdelay delay</b>&nbsp;&nbsp;&nbsp;&nbsp;Set the delay of each character printing to delay (Unit: <i>ms</i>)<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>clear</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear screen.<br/><br/><br/><b>Redirection System</b><br/><br/>&nbsp;&nbsp;By default, the output (STDOUT) is directly put into the CLI. However, if the following redirection is used, it will output into a file.<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>program [..args] > file</b><br/>&nbsp;&nbsp;&nbsp;&nbsp;Output will overwrite `file`. If file does not exist, an error will be returned.<br/>&nbsp;&nbsp;&nbsp;&nbsp;<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>program [..args] >> file</b><br/>&nbsp;&nbsp;&nbsp;&nbsp;Output will be append to the last of `file`. If file does not exist, an error will be returned.<br/>"
let stdin = "";
let stdout = prompt;
let delay = 20;
let busy = false;
let requestSubmit = false;
let editPosition = 0;
let filesystem;
const command = document.getElementById("command");

let pwInode = 0;
function toggleProfile() {
    const panel = document.getElementById("over-panel");
    const panel2 = document.getElementById("profile-container");
    if (panel.classList.contains("hidden")) {
        panel.classList.remove("hidden");
        panel2.classList.remove("hidden");
    } else {
        panel.classList.add("hidden");
        panel2.classList.add("hidden");
    }
}
function forbidClosing(e) {
    e.stopPropagation();
}
function save() {
    localStorage.setItem("filesystem", JSON.stringify(filesystem));
}
function getPwd(inode) {
    let pwd = "/";
    let cwInode = inode;
    while (cwInode !== 0) {
        const temp = filesystem[cwInode].content[".."];
        let dirname;
        for (let name in filesystem[temp].content) {
            if (filesystem[temp].content[name] == cwInode) {
                dirname = name;
            }
        }
        pwd = "/" + dirname + pwd;
        cwInode = temp;
    }
    return pwd
}

function tracePath(pathArray) {
    let cwInode = pwInode;

    if (pathArray[0] == '') {
        cwInode = 0;
    }

    for (let dir of pathArray) {
        if (dir === '') continue;
        if (filesystem[cwInode].type !== 1) {
            return [-1, dir + ": Not a directory"];
        }
        if (!(dir in filesystem[cwInode].content)) {
            return [-1, dir + ": File not found"];
        }
        cwInode = filesystem[cwInode].content[dir];
    }
    return [cwInode, ""];
}

function create(path, println, content) {
    const pathArray = path.split("/");
    const dirname = pathArray.pop();
    if (dirname === "") {
        println('<span class="red">File name could not be empty. </span>');
        return -1;
    }
    const [rt, str] = tracePath(pathArray);
    if (rt < 0) {
        println('<span class="red">' + escapeHTML(str) + '</span>');
        return -1;
    } 
    if (dirname in filesystem[rt].content) {
        println('<span class="red">File already exists</span>');
        return -1;
    }
    let inode = Math.max(systemReserve, filesystem.length);
    for (let i = systemReserve; i < inode; i++) {
        if (filesystem[i] == null) {
            inode = i;
            break;
        }
    }
    filesystem[rt].content[dirname] = inode;
    filesystem[inode] = content(inode, rt);
    save();
    return 0;
}

function attemptRemove(parInode, filename, inode) {
    if (!filesystem[inode].user) {
        return [-1, filename + ": Permission denied"];
    }
    if (filesystem[inode].type === 1) {
        for (let fn in filesystem[inode].content) {
            if (fn !== "." && fn !== "..") {
                const [rt, str] = attemptRemove(inode, fn, filesystem[inode].content[fn]);
                if (rt < 0) {
                    return [rt, str];
                }
            }
        }
    }
    delete filesystem[parInode].content[filename];
    filesystem[inode] = null;
    return [0, ""];
}
const programs = {
    "start": (args, println) => {
        println(prompt);
        return 0;
    },
    "ls": (args, println) => {
        let path;

        if (args.length == 1) {
            path = "."
        } else {
            path = args[1];
        }
        
        const [rt, str] = tracePath(path.split("/"));
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }

        if (filesystem[rt].type !== 1) {
            println('<span class="red">Not a directory</span>');
            return -1;
        }
        for (let filename in filesystem[rt].content) {
            let ans = "";
            const inode = filesystem[rt].content[filename];
            if (filesystem[inode].type === 0) {
                ans = "-"
            } else {
                ans = "d"
            } if (filesystem[inode].user) {
                ans += "rwx";
            } else {
                ans += "r-x"
            }
            ans += " " + escapeHTML(filename);
            println(ans);
        }
        return 0;
    },
    "echo": (args, println) => {
        if (args.length < 2) {
            return 0;
        }
        const res = args.slice(1, args.length).reduce((acc, val) => {
            return acc + " " + escapeHTML(val);
        });
        println(res);
        return 0;
    },
    "setdelay": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const newDelay = parseInt(args[1]);
        if (isNaN(newDelay) || newDelay < 0) {
            println('<span class="red">Error: invalid delay amount</span>');
            return -1;
        }
        delay = newDelay;
        localStorage.setItem("delay", delay);
        return 0;
    },
    "cd": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        const [rt, str] = tracePath(path.split("/"));
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        if (filesystem[rt].type !== 1) {
            println('<span class="red">' + "Not a directory" + '</span>')
            return -1;
        }
        pwInode = rt;
        return 0;
    },
    "pwd": (args, println) => {
        println(escapeHTML(getPwd(pwInode)));
        return 0;
    },
    "mkdir": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        return create(path, println, (inode, parentInode) => ({
            "type": 1,
            "user": true,
            "content": {
                ".": inode,
                "..": parentInode
            }
        }))
    },
    "touch": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        return create(path, println, (inode, parentInode) => ({
            "type": 0,
            "user": true,
            "content": ""
        }))
    },
    "rm": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        if (path === "/") {
            println('<span class="red">Cannot remove root</span>');
            return -1;
        } 
        const pathArray = path.split("/");
        const filename = pathArray.pop();
        
        let [rt, str] = tracePath(pathArray);
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        let inode;
        for (let i in filesystem[rt].content) {
            if (i === filename) {
                inode = filesystem[rt].content[i];
            }
        }
        if (inode === undefined) {
            println('<span class="red">No such file or directory</span>');
            return -1;
        }
        [rt, str] = attemptRemove(rt, filename, inode);
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        save();
        return 0;
    },
    "cat": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        let [rt, str] = tracePath(path.split('/'));
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        if (filesystem[rt].type === 1) {
            println('<span class="red">Is a directory</span>');
            return -1;
        }
        println(filesystem[rt].content);
        return 0;
    },
    "open": (args, println) => {
        if (args.length != 2) {
            println('<span class="red">Error: incorrect number of arguments</span>');
            return -1;
        }
        const path = args[1];
        let [rt, str] = tracePath(path.split('/'));
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        if (filesystem[rt].type === 1) {
            println('<span class="red">Is a directory</span>');
            return -1;
        }
        const content = filesystem[rt].content;
        window.location.href = content;
        return 0;
    },
    "reset": (args, println) => {
        filesystem = root;
        save();
        return 0;
    },
    "profile": (args, println) => {
        println(profile);
        return 0;
    },
    "help": (args, println) => {
        println(helpText);
        return 0;
    },
}


/**
 * @param input{string}
 */
function execute(input, println) {
    let program;
    let args;
    let fn = println;
    let newInput = input.trim();
    let redirection = newInput.split(">>");
    if (redirection.length > 1) {
        if (redirection.length > 2) {
            println('<span class="red">Syntax error</span>');
            return -1;
        }
        newInput = redirection[0].trim();
        const path = redirection[1].trim();
        let [rt, str] = tracePath(path.split('/'));
        if (rt < 0) {
            println('<span class="red">' + escapeHTML(str) + '</span>');
            return -1;
        }
        if (filesystem[rt].type === 1) {
            println('<span class="red">Is a directory</span>');
            return -1;
        }
        
        if (!filesystem[rt].user) {
            println('<span class="red">Permission denied</span>');
            return -1;
        }
        args = newInput.trim().split(/\s/);
        program = args[0];
        fn = (str) => {
            filesystem[rt].content += str + "\n";
            save();
        }
    } else {
        redirection = newInput.split(">");
        if (redirection.length > 1) {
            if (redirection.length > 2) {
                println('<span class="red">Syntax error</span>');
                return -1;
            }
            newInput = redirection[0].trim();
            const path = redirection[1].trim();
            let [rt, str] = tracePath(path.split('/'));
            if (rt < 0) {
                println('<span class="red">' + escapeHTML(str) + '</span>');
                return -1;
            }
            if (filesystem[rt].type === 1) {
                println('<span class="red">Is a directory</span>');
                return -1;
            }

            if (!filesystem[rt].user) {
                println('<span class="red">Permission denied</span>');
                return -1;
            }
            args = newInput.trim().split(/\s/);
            program = args[0];
            let trigger = false;
            fn = (str) => {
                if (!trigger) {
                    trigger = true;
                    filesystem[rt].content = "";
                }
                filesystem[rt].content += str + "\n";
                save();
            };
        } else {
            args = newInput.split(/\s/);
            program = args[0];
        }
    }
    if (program === "") {
        return 0;
    }
    if (!(program in programs)) {
        println('<span class="red">Unknown program: ' + escapeHTML(program) + "</span>");
        return -1;
    }
    return programs[program](args, fn);
}
/**
 * @param target{HTMLElement}
 */
function submit(target) {
    if (stdin == "clear") {
        target.setAttribute("buffer", "");
        target.setAttribute("pointer", 0);
        stdout = successStarter;
        editPosition = 0;
        stdin = "";
        output(target);
    } else {
        const println = (str) => {
            if (busy) {
                stdout += str + "<br/>";
            } else {
                stdout = str + "<br/>";
                output(target);
            }
        }
        const printf = (str) => {
            if (busy) {
                stdout += str;
            } else {
                stdout = str;
                output(target);
            }
        }

        editPosition = 0;
        let execution = stdin;
        stdin = "";
        let ptr = parseInt(target.getAttribute("pointer"));
        println('<span class="gray">' + escapeHTML(execution) + "</span>");

        rt = execute(execution, println);
        let starter;
        if (rt === 0) {
            starter = successStarter;
        } else {
            starter = failStarter;
        }

        printf(starter);
    }
}

function output(target) {
    if (delay) {
        timedOutput(target);
    } else {
        fastOutput(target);
    }
}
/**
 * @param target{HTMLElement}
 */
function timedOutput(target) {
    if (stdout == "") {
        target.setAttribute("buffer", target.innerHTML);
        target.setAttribute("pointer", target.innerHTML.length);
        busy = false;
        echo(target);
        if (requestSubmit) {
            requestSubmit = false;
            submit(target);
        }
        return;
    }
    busy = true;
    let buffer = target.getAttribute("buffer");
    let ptr = parseInt(target.getAttribute("pointer"));

    let length = 1;
    let latency = 0;
    if (stdout[0] == "<" && stdout[length] != "/") {
        length += 1;
        let tagName = "";
        while (length <= stdout.length && (stdout[length - 1] != " " && stdout[length - 1] != "/" && stdout[length - 1] != ">")) length++;
        tagName = stdout.substring(1, length - 1);
        while (length <= stdout.length && stdout[length - 1] != ">") length++;
        if (stdout[length - 2] != "/") {
            buffer = buffer.substring(0, ptr) + stdout.substring(0, length) + "</"+tagName + ">" + buffer.substring(ptr);
        } else {
            buffer = buffer.substring(0, ptr) + stdout.substring(0, length) + buffer.substring(ptr);
        }
    } else if (stdout[0] == "<" && stdout[length] == "/") {
        while (length <= stdout.length && stdout[length - 1] != ">") length++;
    } else if (stdout[0] == "&") {
        while (length <= stdout.length && stdout[length - 1] != ";") length++;
        buffer = buffer.substring(0, ptr) + stdout.substring(0, length) + buffer.substring(ptr);
        latency = delay;
    } else {
        buffer = buffer.substring(0, ptr) + stdout.substring(0, length) + buffer.substring(ptr);
        latency = delay;
    }
    ptr += length;
    target.innerHTML = buffer;
    target.setAttribute("buffer", buffer);
    target.setAttribute("pointer", ptr);
    stdout = stdout.substring(length);
    setTimeout(() => timedOutput(target), latency);
}
function fastOutput(target) {
    let buffer = target.getAttribute("buffer");
    buffer += stdout;
    target.innerHTML = buffer;
    target.setAttribute("buffer", target.innerHTML);
    target.setAttribute("pointer", target.innerHTML.length);
}
/**
 * @param input{string}
 */
function escapeHTML(input, isInput = false) {
    let ans = ""
    for (let i = 0; i < input.length; i++) {
        let temp = input[i];
        if (temp == "<") {
            temp = "&lt;"
        } else if (temp == ">") {
            temp = "&gt;"
        } else if (temp == "&") {
            temp = "&amp;"
        } else if (temp == "&") {
            temp = "&amp;"
        } else if (temp == '"') {
            temp = "&quot;"
        } else if (temp == " ") {
            temp = "&nbsp;"
        }
        if (isInput && i == editPosition) {
            temp = '<span class="cursor">' + temp + "</span>"
        }  
        ans += temp;
    }
    if (isInput && editPosition == input.length) {
        ans += '<span class="cursor">&nbsp;</span>'
    }
    return ans;
}
/**
 * @param target{HTMLElement}
 */
function echo(target) {
    let ptr = parseInt(target.getAttribute("pointer"));
    target.innerHTML = target.innerHTML.substring(0, ptr) + escapeHTML(stdin, true);
}

/**
 * @param key{string}
 * @param target{HTMLElement}
 */
function handleInput(key, target) {
    if (key == "Backspace") {
        // stdin = stdin.substring(0, editPosition - 1) + stdin.substring(editPosition);
        // editPosition -= 1;
        // if (editPosition < 0) editPosition = 0;
    } else if (key == "Enter") {
        requestSubmit = true;
    } else {
        stdin = stdin.substring(0, editPosition) + key + stdin.substring(editPosition);
        editPosition += key.length;
    }
    if (!busy) {
        echo(target);
        if (requestSubmit) {
            requestSubmit = false;
            submit(target);
        }
    }
}

async function load() {
    const code = document.getElementById('console');
    const header = document.getElementById('header');
    const list =  document.getElementById('list');
    const url = new URL(window.location.href)
    const postName = url.hash.substring(1)
    if (postName) {
        const post = document.getElementById('post');
        code.classList.add('hidden');
        header.classList.add('hidden');
        list.classList.add('hidden');
        post.classList.remove('hidden');
        await renderPost(postName);
        document.onscroll = undefined;
        document.onkeydown = undefined;
        return;
    }
    code.classList.remove('hidden');
    header.classList.remove('hidden');
    list.classList.remove('hidden')
    post.classList.add('hidden');
    // clear input, 
    stdout = prompt
    stdin = ""
    command.innerHTML = "";
    command.setAttribute("buffer", "")
    command.setAttribute("pointer", "0")
    let serialized = localStorage.getItem("filesystem");
    if (serialized == null) {
        filesystem = root;
        stdout += successStarter;
    } else {
        filesystem = JSON.parse(serialized);
        // check integrity; and update
        integrate = true;
        for (let i = 0; i < root.length; i++) {
            if (!filesystem[i]) {
                filesystem[i] = root[i];
                continue;
            }
            if (filesystem[i].type === 0 && filesystem[i].content !== root[i].content) {
                filesystem[i].content = root[i].content;
                continue;
            }
            if (filesystem[i].type !== root[i].type || filesystem[i].user) {
                integrate = false;
                break;
            }
        }
        for (let i = root.length; i < systemReserve; i++) {
            if (filesystem[i]) {
                filesystem[i] = null;
            }
        }
        // check hierarchical integrity;
        if (integrate) {
            for (let i in root[0].content) {
                if (!(i in filesystem[0].content)) {
                    filesystem[0].content[i] = root[0].content[i];
                    continue;
                }
                if (filesystem[0].content[i] !== root[0].content[i])  {
                    integrate = false;
                    break;
                }
            }
            for (let i in filesystem[0].content) {
                if (filesystem[0].content[i] >= root.length && filesystem[0].content[i] < systemReserve) {
                    delete filesystem[0].content[i];
                }
            }
        }
        if (!integrate) {
            stdout += '<span class="red">It seems like the filesystem is broken. Use "reset" to reset.</span><br/>' + failStarter;
        } else {
            stdout += successStarter;
        }
    }
    let savedDelay = localStorage.getItem("delay");
    if (savedDelay !== null) {
        delay = parseInt(savedDelay);
    }
    document.onscroll = (e) => {
        if (window.scrollY > 40) {
            code.classList.add("hidden");
            list.classList.add("show-profile");
        } else {
            code.classList.remove("hidden")
            list.classList.remove("show-profile");
        }
    }
    document.onkeydown = (e) => {
        if (e.key == 'ArrowLeft' && editPosition > 0) {
            editPosition -= 1;
            if (!busy) {
                echo(command);
            }
        } else if (e.key == 'ArrowRight' && editPosition < stdin.length) {
            editPosition += 1;
            if (!busy) {
                echo(command);
            }
        } else if (e.key == 'Delete') {
            stdin = stdin.substring(0, editPosition) + stdin.substring(editPosition + 1);
            if (!busy) {
                echo(command);
            }
        } else if (e.key == "Backspace") {
            stdin = stdin.substring(0, editPosition - 1) + stdin.substring(editPosition);
            editPosition -= 1;
            if (editPosition < 0) editPosition = 0;
            if (!busy) {
                echo(command);
            } 
        } else {
            handleInput(e.key, command);
        }
    }
    loadBlogList();
    output(command);
}
async function loadBlogList() {
    // get blog list
    const resp = await fetch(apiUri + 'blogs/list');
    const blogList = await resp.json();
    blogList.sort((a, b) => a.lastModified < b.lastModified)
    const titleList = list.querySelector('#title-list')
    titleList.innerHTML = '';
    let totalLikeCount = 0, totalViewCount = 0;

    for (let blog of blogList) {
        const {name, title, lastModified, views, likes} = blog;
        const date = new Date(lastModified * 1000).toLocaleDateString();

        const link = document.createElement('a');
        link.className = "post-link";
        link.href = `#${name}`;
        link.innerHTML = `
            <h4 class="title">${title}</h4>
            <p class="date">${date} · ${likes} likes · ${views} views</p>
        `
        titleList.appendChild(link);
        totalLikeCount += likes;
        totalViewCount += views;
    }
    const blogCount = blogList.length
    const readElement = document.getElementById("read-count")
    const likeElement = document.getElementById("like-count")
    const postElement = document.getElementById("post-count")
    readElement.innerText = totalViewCount
    likeElement.innerText = totalLikeCount
    postElement.innerText = blogCount

}
window.addEventListener('load', load)
window.addEventListener('hashchange', load)
