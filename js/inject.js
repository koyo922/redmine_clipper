/**
 * Get HTML asynchronously
 * @param  {String}   url      The URL to get HTML from
 * @param  {Function} callback A callback funtion. Pass in "response" variable to use returned HTML.
 */
var getHTML = function(url, callback) {
    // Feature detection
    if (!window.XMLHttpRequest) return;
    // Create new request
    var xhr = new XMLHttpRequest();
    // Setup callback
    xhr.onload = function() {
            if (callback && typeof(callback) === 'function') {
                callback(this.responseXML);
            }
        }
        // Get the HTML
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.send();
};

function getElementsByText(query, searchText) {
    var searchSet = [].slice.call(document.body.querySelectorAll(query));

    return searchSet.filter(function(cur) {
        return cur.textContent.trim() == searchText; // caution, trim
    });
}

// get DOM element from HTML string
function DOMify(str) {
    var el = document.createElement('div');
    el.innerHTML = str;

    var frag = document.createDocumentFragment();
    return frag.appendChild(el.removeChild(el.firstChild));
}
// copy a specified range of the webpage to OS's clipboard
function copyRangeToClipboard(queryStart, queryEnd) {
    var range = document.createRange();
    range.setStartBefore(document.querySelector(queryStart));
    range.setEndAfter(document.querySelector(queryEnd || queryStart));

    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    // caution, it's not directly runable on Chrome dev console
    // it has to be run in an extension with 'clipBoardWrite' permission declaired
    document.execCommand('copy');
}
// util for sending email
function sendEMail(emailTo, ccTo, bccTo, subject, emailBody) {
    //separated as two lines, for debug
    var mailParamStr =
        'mailto:' + emailTo + "?" +
        (ccTo ? ('cc=' + ccTo + "&") : "") +
        (bccTo ? ('bcc=' + bccTo + "&") : "") +
        'subject=' + subject + "&" +
        'body=' + emailBody;

    window.location = encodeURI(mailParamStr);
}


var copyBtn = DOMify("<button>manually yank the table</button>");
copyBtn.style.marginLeft = "2em";
copyBtn.style.marginRight = "1em";
copyBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    copyRangeToClipboard("table.list.issues")
    console.log("Table copied to clipboard");
}

var configBtn = DOMify("<button>config daily-report params</button>");
configBtn.style.marginRight = "1em";
configBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    // chrome.runtime.openOptionsPage();
    window.open(chrome.extension.getURL('options.html'));
}

var genBtn = DOMify("<button>generate daily report</button>");
genBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    // remove old container if exists
    var oldContainer = document.getElementById("dr-container");
    if (oldContainer) {
        document.body.removeChild(oldContainer);
    }

    var container = document.createElement("div");
    container.id = "dr-container";
    container.style.height = "0.01em"; // CAUTION: diaplay:none or visibility:hidden conflicts with select/range
    container.style.overflow = "hidden";
    document.body.appendChild(container); // first append it onto the page, then we can query it.

    var configuration = null;
    new Promise((resolve, reject) => { //try get configuration
        chrome.storage.local.get({ params: "not_configured", template: null }, function(config) {
            if (config.params == "not_configured") {
                reject("You need to configure the params before using");
            } else {
                resolve(config);
            }
        });
    }).then((config) => { //got config
        // apply template & find blanks
        configuration = config;
        container.innerHTML = config.template;
        var redmine_today = getElementsByText("div, p, span", "{%redmine_today%}")[0];

        // replace redmine_today
        var table = document.querySelector("table.list.issues");
        redmine_today.parentElement.replaceChild(
            table ? table.cloneNode(true) : DOMify("<h2 style='color:red'>empty issues-list, please yank it manually</h2>"), // CAUTION: if not cloned, the original would be moved
            redmine_today
        );

        return new Promise((resolve, reject) => {
            chrome.storage.local.get("cache_last", (val) => { //try get cache
                var cache = val.cache_last;
                console.log(cache);
                if (cache.substr && (cache.substr(0, 8) != new DateFormat("yyyyMMdd").format(new Date()))) {
                    resolve(DOMify(cache.substr(8)));
                } else {
                    reject("no useful cache found");
                };
            });
        });
    }, (err) => {
        alert(err);
    }).then((cache) => { //got cache
        var redmine_yesterday = getElementsByText("div, p, span", "{%redmine_yesterday%}")[0];
        redmine_yesterday.parentElement.replaceChild( //CAUTION, replace params order
            cache,
            redmine_yesterday
        );
    }, function(err) { //no cache
        console.error("Error: " + err + "\nget redmine_yesterday from HTML");
        return new Promise((resolve, reject) => {
            getHTML(window.location.search.replace(/updated_on%5D=[^&]+&/g, "updated_on%5D=ld&"), function(response) {
                var table = response.documentElement.querySelector("table.list.issues");
                var redmine_yesterday = getElementsByText("div, p, span", "{%redmine_yesterday%}")[0];
                redmine_yesterday.parentElement.replaceChild(
                    table ? table.cloneNode(true) : DOMify("<h2 style='color:red'>empty issues-list, please yank it manually</h2>"),
                    redmine_yesterday
                );
                resolve();
            });
        });
    }).then(() => { //fill today_URI, send email
        var redmine_today_uri = getElementsByText("div, p, span", "{%redmine_today_uri%}")[0];

        //replace redmine_today_uri
        redmine_today_uri.parentElement.replaceChild(
            DOMify("<a href='" + window.location + "'>" + window.location + "</a>"),
            redmine_today_uri
        );

        copyRangeToClipboard("div#dr-container");

        //wait
        sendEMail(
            configuration.params.emailTo,
            configuration.params.ccTo,
            configuration.params.bccTo,
            new DateFormat(configuration.params.title.replace(/{%([^%]*)%}/g, "$1")).format(new Date()),
            configuration.params.body
        );

        // var redmine_today = getElementsByText("div, p, span", "{%redmine_today%}")[0];
        var redmine_today = container.querySelector("table.list.issues");  //already replaced
        chrome.storage.local.set({ "cache_last": new DateFormat("yyyyMMdd").format(new Date()) + redmine_today.outerHTML }, null); //outerHTML is property, not function
    });
}

// insert our "copy button" after the "save button"
var iconSave = document.querySelector(".icon-save");
iconSave.parentNode.appendChild(copyBtn);
iconSave.parentNode.appendChild(configBtn);
iconSave.parentNode.appendChild(genBtn);
