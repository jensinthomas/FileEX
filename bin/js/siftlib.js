const { shell } = require('electron').remote;
var fs = require('fs');
const os = require('os');
const path = require('path');
const child_proc = require('child_process');
var cindex = -1;
var clipboard = [];
var i = 0;
var j = 0;

function sift(pathString, navflag) {
    if (fs.statSync(pathString).isFile()) {
        return { 'pathString': pathString, 'type': 'file' };
    } else {
        return { 'pathString': pathString, 'type': 'folder' };
    }
}

function popCMenu(evt, iscd) {
    if (iscd) {
        return `
        <table class="itemlist hover-enabled">
            <tr><td class="context-item" onclick="siftlib.newWindow(pathString)"><img src="../img/opn.png"><div class="itemRow">New Window</div></td></tr>
            <tr><td class="context-item disable" onclick=""><img src="../img/cut.png"><div class="itemRow">Cut</div></td></tr>
            <tr><td class="context-item disable" onclick=""><img src="../img/cop.png"><div class="itemRow">Copy</div></td></tr>
            <tr><td class="context-item" onclick="siftlib.dumpItems(pathString)"><img src="../img/pst.png"><div class="itemRow">Paste</div></td></tr>
            <tr><td class="context-item disable" onclick="" id="ren"><img src="../img/edt.png"><div class="itemRow">Rename</div></td></tr>
            <tr><td class="context-item disable" onclick=""><img src="../img/dlt.png"><div class="itemRow ">Delete</div></td></tr>
            <tr><td class="context-item" onclick="siftlib.newfileItems(pathString)"><img src="../img/dlt.png"><div class="itemRow ">New File</div></td></tr>
            <tr><td class="context-item" onclick="siftlib.newfolderItems(pathString)"><img src="../img/dlt.png"><div class="itemRow ">New Folder</div></td></tr>
        </table>`
    }
    return `
    <table class="itemlist hover-enabled">
        <tr><td class="context-item" onclick="siftlib.openItems(pathString, Object.entries(document.getElementsByClassName('select')))"><img src="../img/opn.png"><div class="itemRow">Open</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.addItems(pathString, Object.entries(document.getElementsByClassName('select')), 1)"><img src="../img/cut.png"><div class="itemRow">Cut</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.addItems(pathString, Object.entries(document.getElementsByClassName('select')), 0)"><img src="../img/cop.png"><div class="itemRow">Copy</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.dumpItems(pathString + (${evt.target.parentElement.parentElement.attributes.type.value === 'folder'} ? '${evt.target.parentElement.parentElement.id}' : ''))"><img src="../img/pst.png"><div class="itemRow">Paste</div></td></tr>
        <tr><td class="context-item" onclick="renameItem('${evt.target.parentElement.parentElement.id}')" id="ren"><img src="../img/edt.png"><div class="itemRow">Rename</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.deleteItems(pathString, Object.entries(document.getElementsByClassName('select')))"><img src="../img/dlt.png"><div class="itemRow ">Delete</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.newfileItems(pathString)"><img src="../img/dlt.png"><div class="itemRow ">New File</div></td></tr>
        <tr><td class="context-item" onclick="siftlib.newfolderItems(pathString)"><img src="../img/dlt.png"><div class="itemRow ">New Folder</div></td></tr>
    </table>
    `
}

function popPMenu(iscd) {
    if (iscd) {
        $('#nWPanelButton div.panelItemText').html('New Window')
        $('#cutPanelButton').addClass('disable');
        $('#copyPanelButton').addClass('disable');
        $('#delPanelButton').addClass('disable');

    } else {
        $('#nWPanelButton div.panelItemText').html('Open')
        $('#cutPanelButton').removeClass('disable');
        $('#copyPanelButton').removeClass('disable');
        $('#delPanelButton').removeClass('disable');

    }
}

function clearPMenu() {
    popPMenu(true);
}

function openItems(pathString, items) {
    items.forEach((item) => {
        if (item[1].attributes.type.value === 'file') {
            shell.openItem(pathString + item[1].id);
        } else {
            newWindow(pathString + item[1].id, 1);
        }
    });
};

function newWindow(pathString) {
    child_proc.exec('electron ' + path.normalize(__dirname + "/../../") + ' "' + pathString + '"');
}

function addItems(pathString, items, cutflag) {
    cindex = -1
    clipboard = []
    items.forEach((item) => {
        cindex = cindex + 1;
        clipboard[cindex] = { 'path': pathString + item[1].id, 'cutflag': cutflag };
    })
}

function dumpItems(pathString) {
    Object.entries(clipboard).forEach((entry) => {
        copyItem(entry[1].path, pathString, () => {
            if (entry[1].cutflag === 1) {
                destroy(entry[1].path);
            }
        });
    });
}

function deleteItems(pathString, items) {
    items.forEach((item) => {
        destroy(pathString + item[1].id)
    });
};

function newfileItems(pathString) {

    fs.writeFile(pathString + j + 'newfile.txt', 'Add content!', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
    j = j + 1;
}

function newfolderItems(pathString) {
    console.log("Going to create directory /tmp/test");
    fs.mkdir(pathString + 'new' + i, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log("Directory created successfully!");
    });
    i = i + 1;
};

function copyItem(source, target, callback) {
    console.log(`Begin copy of ${source} to ${target}`)
    var files = [];
    console.log('source: ' + path.basename(path.normalize(source + '/..')))
    console.log('target: ' + path.basename(target))
    var targetFolder = path.join(target, path.basename(source));
    while (fs.existsSync(targetFolder)) {
        targetFolder += (fs.existsSync(path.join(target, path.basename(source))) && path.basename(target) === path.basename(path.normalize(source + '/..')) ? ' - Copy' : '') + (fs.existsSync(path.join(target, path.basename(source))) && path.basename(target) !== path.basename(path.normalize(source + '/..')) ? ' - from ' + path.basename(path.normalize(source + '/..')) : '');
        console.log(targetFolder)
    }
    if (!fs.existsSync(targetFolder) && fs.lstatSync(source).isDirectory()) {
        fs.mkdirSync(targetFolder);
    }
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach((file) => {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyItem(curSource, targetFolder, () => { });
            } else {
                console.log(`Copying ${curSource} to ${targetFolder + '/' + file}`)
                fs.copyFileSync(curSource, targetFolder + '/' + file, fs.constants.COPYFILE_EXCL);
            }
        });
    } else {
        fs.copyFileSync(source, targetFolder, fs.constants.COPYFILE_EXCL);
    }
    callback();
}

function destroy(itemPath) {
    if (fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory()) {
        files = fs.readdirSync(itemPath)
        Promise.all(files.map((file) => {
            var absPath = itemPath + "/" + file;
            if (fs.lstatSync(absPath).isDirectory()) {
                destroy(absPath);
            } else {
                fs.unlinkSync(absPath);
            }
        })).then(fs.rmdirSync(itemPath))
    } else {
        fs.unlinkSync(itemPath);
    };
};

module.exports = { sift, popCMenu, openItems, addItems, dumpItems, deleteItems, newfileItems, newfolderItems, popPMenu, clearPMenu, newWindow }
