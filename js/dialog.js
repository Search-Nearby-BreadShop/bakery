const dialogHandler = {
    $dialog: document.getElementById('dialog'),
    $modals: [],

    hideModal: ($modal) => {
        const index = dialogHandler.$modals.indexOf($modal);
        if (index > -1) {
            dialogHandler.$modals.splice(index, 1);
        }
        $modal.classList.remove('visible');
        if (dialogHandler.$modals.length === 0){
            dialogHandler.$dialog.classList.remove('visible');
        } else {
            dialogHandler.$modals.at(-1).classList.remove('collapsed');
        }
        setTimeout(() => $modal.remove(), 1000);
    },

    showModal: (args) => {
        for (const $modal of dialogHandler.$modals) {
            $modal.classList.add('collapsed');
        }

        const $modal = document.createElement('div');
        const $title = document.createElement('div');
        const $content = document.createElement('div');

        $title.classList.add('title');
        $title.innerText = args['title'];

        $content.classList.add('content');
        if (args['isContentHtml'] === true) {
            $content.innerHTML = args['content'];
        } else {
            $content.innerText = args['content'];
        }

        $modal.append($title, $content);
        $modal.classList.add('modal');

        if (args['buttons'] != null && args['buttons'].length > 0) {
            const $buttonContainer = document.createElement('div');
            $buttonContainer.classList.add('button-container');
            for (const button of args['buttons']) {
                const $button = document.createElement('button');
                $button.classList.add('button');
                $button.setAttribute('type', 'button');
                $button.innerText = button['caption'];
                if (typeof button['onclick'] === 'function') {
                    $button.addEventListener('click', () => {
                        button['onclick']($modal);
                    });
                }
                $buttonContainer.append($button);
            }
            $modal.append($buttonContainer);
        }

        dialogHandler.$dialog.append($modal);
        dialogHandler.$dialog.classList.add('visible');
        dialogHandler.$modals.push($modal);
        setTimeout(() => $modal.classList.add('visible'), 50);

        return $modal;
    },

    showMOdalSimpleOk: (title, content, args = {}) => {
        args ??= {};
        return dialogHandler.showModal({
            title: title,
            content: content,
            isContentHtml: args?.isContentHtml,
            buttons: [
                {
                    caption: args['okCaption'] ?? '확인',
                    onclick: ($modal) => {
                        dialogHandler.hideModal($modal);
                        if (typeof args['onclickok'] === 'function') {
                            args['onclickok']($modal);
                        }
                    }
                }
            ]
        });
    }
};

// [10-30:추가:dialogHandler 객체를 전역(window)에 등록하여 main.js 등 외부에서 접근 가능하게 함]
window.dialogHandler = dialogHandler;
