tinyMCE.init({
    selector: "textarea#template",
    // using full features, to preserve the dirty css in copied email template
    theme: "modern",
    plugins: [
        "advlist autolink lists link image charmap print preview hr anchor pagebreak",
        "searchreplace wordcount visualblocks visualchars code fullscreen",
        "insertdatetime media nonbreaking save table contextmenu directionality",
        "emoticons template paste textcolor colorpicker textpattern imagetools"
    ],
    toolbar1: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
    toolbar2: "print preview media | forecolor backcolor emoticons",
    image_advtab: true,
    templates: [
        { title: 'Test template 1', content: 'Test 1' },
        { title: 'Test template 2', content: 'Test 2' }
    ],
    init_instance_callback: restore_options // depends on a tinyMCE that has finished initialization
});

var DEFAULT_CONFIG = {
    "params": {
        "emailTo": "開発一課<avict_ssdd_1ds@ml.jp.panasonic.com>;",
        "ccTo": "",
        "bccTo": "",
        "title": "[日報] 銭あきしゃく {%yyyyMMdd%}",
        "body": "------- auto-generated from Redmine clipper --------\r\n\r\n"
    },
    "template": "" + `<div style="font-family: 'ＭＳ ゴシック'; font-size: small;">
        <p style="margin: 13px 0;">TO：渡辺さん、皆様
            <br/> CC：
        </p>
        <p style="margin: 13px 0;">開発1課1係の銭です。
            <br/> いつもお世話になっております。
            <br/> 本日の日報を提出します。
        </p>
        <p style="margin: 13px 0;">■本日の実績
            <div>{%redmine_today%}</div>
        </p>
        <p style="margin: 13px 0;">■昨日の実績
            <div>{%redmine_yesterday%}</div>
        </p>
        <p style="margin: 13px 0;">■詳細
            <div>
                <p style="margin: 13px 0;">下記Redmineの本日更新分をご参照ください。</p>
                <div>{%redmine_today_uri%}</div>
            </div>
        </p>
        <p style="margin: 13px 0;">■明日の予定
            <div>
                上記Redmine参照。
            </div>
        </p>
        <p style="margin: 13px 0;">■課題
            <div>
                上記Redmine参照。　※トラッカーを"課題"でフィルタ
            </div>
        </p>
        <p style="margin: 13px 0;">■残業申請
            <br/>なし
        </p>
        <br/>
        <p style="margin: 13px 0;">以上、よろしくお願い致します。</p>
    </div>

    <div id="signature" style="margin:0; font-family:'ＭＳ ゴシック'; font-size:10pt;">
        <div style="margin:0;">
            <span>============================================================</span>
        </div>
        <div style="margin:0;">
            Weishuo QIAN (銭 あきしゃく)
        </div>
        <div style="margin:0;">
            AV&amp;ICT Development Center
        </div>
        <div style="margin:0;">
            AVC Networks Company, Panasonic Co.
        </div>

        <div></div>

        <div style="margin:0;">
            Email：<a href='mailto://qian.weishuo@jp.panasonic.com'>qian.weishuo@jp.panasonic.com</a>
        </div>
        <div style="margin:0;">
            Internal phone: 7-974-8478
        </div>
        <div style="margin:0;">
            Mobile: +81-80-3830-0718
        </div>
        <div style="margin:0;">
            <span>============================================================</span>
        </div>
    </div>`
};

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options(editor) {
    chrome.storage.local.get(DEFAULT_CONFIG, function(config) {
        document.getElementById('params').value = JSON.stringify(config.params, null, 2);
        (editor || tinyMCE.get("template")).setContent(config.template);
    });
}

//clear chrome local storage & reload
document.getElementById('clear').addEventListener('click', function() {
    chrome.storage.local.clear();
    window.location.reload();
});

// Saves options to chrome.storage
document.getElementById('save').addEventListener('click', function() {
    var paramsJSON = JSON.parse(document.getElementById('params').value);
    var templateHTML = tinyMCE.get("template").getContent();

    chrome.storage.local.clear(); // necessary
    chrome.storage.local.set({
        params: paramsJSON,
        template: templateHTML
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1000);
    });
});
