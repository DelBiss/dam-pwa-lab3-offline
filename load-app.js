//@ts-check

/**
 * 
 * @param {Array<string>} urls 
 */
function PreloadAllCss(urls) {
    return Promise.all(urls.map(PreloadCss))
}

/**
 * 
 * @param {string} url 
 * @returns {Promise<HTMLLinkElement>}
 */
function PreloadCss(url) {
    let head = document.head;
    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'preload';
    link.as = "style"

    const linkPromise = new Promise((resolve, reject) => {
        link.onload = function() { resolve(link) }
        link.href = url;
        head.appendChild(link);
    })

    return linkPromise
}

function FetchApp(url) {
    return fetch(url)
        .then(
            (content) => {
                return content.text()
            }
        )
}

function ShowContent(contentArray) {
    for (const content of contentArray) {
        if (Array.isArray(content)) {
            ShowContent(content)
        } else if (content instanceof HTMLLinkElement) {
            content.rel = "stylesheet"
        } else if (typeof content === "string") {
            document.body.innerHTML = content
        } else {
            console.error("Content isn'T a supported type")
        }

    }
}

function LoadApp() {
    const allContent = Promise.all([
        PreloadAllCss([
            "./bootstrap-5.1.3-dist/css/bootstrap.min.css ",
            "./icons-1.7.2/font/bootstrap-icons.css"
        ]),
        FetchApp("./index-sw.html")
    ])
    allContent.then(
        ShowContent
    )
}