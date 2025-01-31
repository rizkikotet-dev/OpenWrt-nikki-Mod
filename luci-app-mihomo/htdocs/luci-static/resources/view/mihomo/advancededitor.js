'use strict';
'require form';
'require view';
'require fs';
'require uci';

return view.extend({
    tinyFmPaths: [
        { 
            path: '/www/tinyfilemanager', 
            urls: [
                '/tinyfilemanager/tinyfilemanager.php?p=etc%2Fmihomo',
                '/tinyfilemanager/index.php?p=etc%2Fmihomo',
            ]
        },
        { 
            path: '/www/tinyfm', 
            urls: [
                '/tinyfm/tinyfm.php?p=etc%2Fmihomo',
                '/tinyfm/index.php?p=etc%2Fmihomo',
            ]
        }
    ],

    findValidPath: function() {
        return this.tinyFmPaths.reduce((promise, pathConfig) => {
            return promise.catch(() => 
                fs.stat(pathConfig.path).then(stat => {
                    if (stat.type === 'directory') {
                        return this.testUrls(pathConfig.urls);
                    }
                    throw new Error('Invalid directory');
                })
            );
        }, Promise.reject()).catch(() => null);
    },

    testUrls: function(urls) {
        return urls.reduce((promise, url) => {
            return promise.catch(() => {
                return new Promise((resolve, reject) => {
                    // Tambahkan timestamp untuk menghindari cache
                    const testUrl = url + '?_=' + Date.now();
                    
                    // Gunakan fetch untuk memeriksa ketersediaan URL
                    fetch(testUrl, {
                        method: 'HEAD',
                        cache: 'no-store',
                        credentials: 'same-origin'
                    })
                    .then(response => {
                        if (response.ok) {
                            resolve(url);
                        } else {
                            reject(new Error('URL not accessible'));
                        }
                    })
                    .catch(() => reject(new Error('Fetch failed')));
                });
            });
        }, Promise.reject());
    },

    load: function() {
        return this.findValidPath();
    },

    render: function(iframePath) {
        const host = window.location.hostname;

        if (iframePath) {
            const iframeUrl = `http://${host}${iframePath}`;
            return this.renderIframe(iframeUrl);
        } else {
            return this.renderErrorMessage();
        }
    },

    renderIframe: function(iframeUrl) {
        return E('div', { class: 'cbi-section' }, [
            E('iframe', {
                src: iframeUrl,
                style: 'width: 100%; height: 80vh; border: none;',
                onerror: `
                    this.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.style.color = 'red';
                    errorDiv.style.padding = '20px';
                    errorDiv.innerHTML = 'Failed to load TinyFileManager. Please check installation or permissions.';
                    this.parentNode.appendChild(errorDiv);
                `,
                onload: `
                    try {
                        // Coba akses konten iframe
                        const doc = this.contentDocument || this.contentWindow.document;
                        if (!doc || doc.body.innerHTML.trim() === '') {
                            throw new Error('Empty content');
                        }
                    } catch (error) {
                        this.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.color = 'red';
                        errorDiv.style.padding = '20px';
                        errorDiv.innerHTML = 'Unable to load TinyFileManager content. Possible cross-origin issue or access restrictions.';
                        this.parentNode.appendChild(errorDiv);
                    }
                `
            }, _('Your browser does not support iframes.'))
        ]);
    },

    renderErrorMessage: function() {
        const m = new form.Map('mihomo', _('Advanced Editor | ERROR'),
            `${_('Transparent Proxy with Mihomo on OpenWrt.')} <a href="https://github.com/morytyann/OpenWrt-mihomo/wiki" target="_blank">${_('How To Use')}</a>`
        );
        m.disableResetButtons = true;
        m.disableSaveButtons = true;

        const s = m.section(form.NamedSection, 'error', 'error', _('Error'));
        s.anonymous = true;

        s.render = () => this.createErrorContent();

        return m.render();
    },

    createErrorContent: function() {
        return E('div', { 
            class: 'error-container', 
            style: 'padding: 20px; background: #fff; border: 1px solid #ccc; border-radius: 8px;' 
        }, [
            E('h4', { style: 'color: #d9534f;' }, 
                _('Advanced Editor cannot be run because <strong>TinyFileManager</strong> is not found.')
            ),
            E('p', { style: 'margin-bottom: 15px;' }, 
                _('Please install it first to use the Advanced Editor.')
            ),
            this.createInstallInstructions()
        ]);
    },

    createInstallInstructions: function() {
        return E('ul', { style: 'padding-left: 20px; list-style-type: disc;' }, [
            this.createDirectInstallSection(),
            this.createManualInstallSection()
        ]);
    },

    createDirectInstallSection: function() {
        return E('li', {}, [
            E('strong', {}, _('Install Directly in OpenWrt via the Software Menu in LuCI (<strong>If Supported</strong>):')),
            E('ul', { style: 'padding-left: 20px; list-style-type: circle;' }, [
                E('li', {}, _('Search for the package: <strong>luci-app-tinyfilemanager</strong>'))
            ])
        ]);
    },

    createManualInstallSection: function() {
        return E('li', {}, [
            E('strong', {}, _('Install Manually:')),
            E('ul', { style: 'padding-left: 20px; list-style-type: circle;' }, [
                E('li', {}, _('Download the TinyFileManager package for your OpenWrt architecture.')),
                E('li', {}, this.createDownloadLink()),
                E('li', {}, _('Go to <strong>System</strong> -> <strong>Software</strong> -> Click <strong>UPDATE LIST...</strong> -> <strong>UPLOAD PACKAGE...</strong>')),
                E('li', {}, _('Choose the downloaded TinyFileManager package file.')),
                E('li', {}, _('Click <strong>UPLOAD</strong> and then <strong>INSTALL</strong>.'))
            ])
        ]);
    },

    createDownloadLink: function() {
        return E('a', { href: 'https://github.com/morytyann/OpenWrt-mihomo/releases', target: '_blank' }, _('Download TinyFileManager'));
    },

    showError: function(message) {
        const errorDiv = E('div', { style: 'color: red; padding: 10px;' }, message);
        document.body.appendChild(errorDiv);
    }
});
