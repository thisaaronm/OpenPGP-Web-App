"use strict";


/* Used in Text Encryption - START */
async function getPubKey() {
    // Used in encryptData()
    const key = `${document.getElementById("recipient").value}.pub`;
    const resp = await fetch(key);
    const data = await resp.text();
    return data;
}


async function encryptData(key) {
    const formValue = document.getElementById('inputText').value
    const publicKey = await openpgp.readKey({ armoredKey: await getPubKey(key) });
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: formValue }),
        encryptionKeys: publicKey
    });

    document.getElementById('inputText').value = encrypted;
    console.log(encrypted);
}


function eventListenerButtonTextEncrypt(key) {
    // Encrypt Button
    document.getElementById('btnTextEncrypt').addEventListener('click', () => {
        encryptData(key);
        document.getElementById('btnTextCopy').style.display = 'inline';
        document.getElementById('btnTextEncrypt').style.display = 'none';
    });
}


function eventListenerButtonTextReset() {
    // Reset Button
    document.getElementById('btnTextReset').addEventListener('click', () => {
        document.getElementById('inputText').value = null;
        document.getElementById('btnTextEncrypt').style.display = 'none';
        document.getElementById('btnTextReset').style.display = 'none';
        document.getElementById('btnTextCopy').style.display = 'none';
    });
}


function eventListenerButtonTextCopy() {
    // Copy Button
    document.getElementById('btnTextCopy').addEventListener('click', () => {
        const textValue = document.getElementById('inputText');
        textValue.select();
        document.execCommand("copy");
        document.getElementById('copymessage').style.display = 'inline';

        setTimeout(() => {
            document.getElementById('copymessage').style.display = 'none';
        }, 3000)
    });
}
/* Used in Text Encryption - END */


/*============================================================================*/
/*============================================================================*/


/* Used in File Encryption - START */
function generateFileLists(files, sizeLimit = 5000000) {
    /*
        Returns two lists:
            - includedFiles: list of files less than sizeLimit (default 1MB)
            - excludedFiles: list of files greater than sizeLimit
    */
    let includedFiles = [];
    let excludedFiles = [];

    for (let i = 0; i < files['length']; i++) {
        if (files[i]['size'] < sizeLimit) {
            includedFiles.push(files[i]);
        } else {
            excludedFiles.push(files[i]);
        }
    }
    return [includedFiles, excludedFiles];
}


function createArrayBuffer(file) {
    /*
        Returns fulfilled Promise on successful FileReader load
    */
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => { resolve(reader.result); };
        reader.onerror = () => { reject };

        reader.readAsArrayBuffer(file)
    })
}


async function getKey(keyName) {
    const resp = await fetch(keyName);
    const data = await resp.text();
    return data;
}


async function convertData(data, encrypt = true, key) {
    let msg, encrypted, decrypted;

    if (encrypt) {
        // Encrypt
        msg = await openpgp.createMessage({ binary: new Uint8Array(data) });
        const publicKey = await openpgp.readKey({ armoredKey: await getKey(key) });
        encrypted = await openpgp.encrypt({
            message: msg,
            encryptionKeys: publicKey,
            format: 'binary'
        });
        return encrypted;
    }
    // } else {
    //     // Decrypt
    //     msg              = await openpgp.readMessage({binaryMessage: data});
    //     const privateKey = await openpgp.readPrivateKey({ armoredKey: await getKey(key) });
    //     decrypted        = await openpgp.decrypt({
    //         message: msg,
    //         decryptionKeys: privateKey,
    //         format: 'binary'
    //     });
    //     return decrypted;
    // }
}


function createFileList(fileArray, elmt, type) {
    const fileList = document.getElementById(elmt);

    for (const file of fileArray) {
        const listItem = document.createElement('li');
        listItem.textContent = `${file["name"]} ----- ${file["size"] / 1000} KB`;
        // listItem.className = `${type}-file`
        fileList.appendChild(listItem)
    }
}


function createDownloadLink(file, data) {
    const includedFilesList = document.getElementById("includedFilesList");
    const includedFile = document.createElement('li');

    const blob = new Blob([data], { type: file['type'] });
    const downloadLink = document.createElement("a");

    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${file['name']}.gpg`;
    downloadLink.textContent = `${file['name']}.gpg`;
    downloadLink.className = 'download-link';

    includedFile.appendChild(downloadLink)
    includedFilesList.appendChild(includedFile);
}


function eventListenerButtonFileSelector() {
    document.getElementById("fileSelector").addEventListener("change", () => {
        const listOfFiles = document.getElementById("fileSelector").files;
        const [included, excluded] = generateFileLists(listOfFiles);
        const key = `${document.getElementById("recipient").value}.pub`;

        if (included["length"] > 0) {
            for (const includedFile of included) {
                createArrayBuffer(includedFile)
                    .then(res => { return convertData(res, true, key); })
                    .then(res => { createDownloadLink(includedFile, res); })
            };
            document.getElementById('includedFiles').style.display = 'inline';
        }

        if (excluded["length"] > 0) {
            createFileList(excluded, "excludedFilesList", "excluded");
            document.getElementById('excludedFiles').style.display = 'inline';
        }

        document.getElementById("btnFileReset").style.display = "inline";
    })
}


function eventListenerButtonFileReset() {
    document.getElementById("btnFileReset").addEventListener('click', () => {
        document.getElementById("fileSelector").value = null;

        const includedFiles = document.getElementById('includedFiles')
        const excludedFiles = document.getElementById('excludedFiles')
        includedFiles.style.display = 'none';
        excludedFiles.style.display = 'none';

        const includedFilesList = document.getElementById('includedFilesList')
        const excludedFilesList = document.getElementById('excludedFilesList')

        while (includedFilesList.firstChild) {
            includedFilesList.removeChild(includedFilesList.lastChild)
        }
        while (excludedFilesList.firstChild) {
            excludedFilesList.removeChild(excludedFilesList.lastChild)
        }
    })
    document.getElementById("btnFileReset").style.display = "none";
}


function recipientInfo(action, recipient) {
    if (action === 'add') {
        const orderedLists = document.querySelectorAll('.ordered-list');
        orderedLists.forEach(orderedList => {
            const listItem = document.createElement('li');
            listItem.className   = "email";
            listItem.textContent = `Email the encrypted information to ${recipient}@outlook.com`;
            orderedList.appendChild(listItem);
        })
    }

    if (action === 'remove') {
        try {
            const emailItems = document.querySelectorAll('.email');
            emailItems.forEach(emailItem => {
                emailItem.remove();
            })
        } catch (err) {
            console.error(err)
        }
    }
}


function eventListenerRecipientSelector() {
    const recipient = document.getElementById("recipient");
    recipient.addEventListener("change", () => {
        document.getElementById('inputText').value = null;
        recipientInfo('remove', null);

        if (recipient.value !== "") {
            recipientInfo('add', recipient.value);
            document.getElementById("textToEncrypt").style.display = "inline";
            document.getElementById("fileSelector").style.display = "inline";
        } else {
            recipientInfo('remove', null);
            document.getElementById("textToEncrypt").style.display = "none";
            document.getElementById("fileSelector").style.display = "none";
        }
    })
}


function eventListenerTextArea() {
    document.getElementById("inputText").addEventListener("input", () => {
        document.getElementById('btnTextCopy').style.display = "none";
        if (document.getElementById("inputText").value.length > 0) {
            document.getElementById("btns-text").style.display = "inline";
            document.getElementById("btnTextEncrypt").style.display = "inline";
            document.getElementById('btnTextReset').style.display = "inline";
        } else {
            document.getElementById("btns-text").style.display = "none";
            document.getElementById("btnTextEncrypt").style.display = "none";
            document.getElementById('btnTextReset').style.display = "none";
        }
    })
}
/* Used in File Encryption - END */


function toggleBoxes() {
    const h2 = document.querySelectorAll('h2')
    h2.forEach(item => {
        item.addEventListener('click', () => {
            const ds = document.querySelectorAll(`[data-toggle=${item.dataset.toggle}]`)[1]
            ds.classList.toggle('visible')
        })
    })
}


/*============================================================================*/
/*============================================================================*/


window.onload = () => {
    eventListenerButtonTextEncrypt();
    eventListenerButtonTextReset();
    eventListenerButtonTextCopy();

    eventListenerButtonFileSelector();
    eventListenerButtonFileReset();

    eventListenerTextArea();
    eventListenerRecipientSelector();

    toggleBoxes();
}
