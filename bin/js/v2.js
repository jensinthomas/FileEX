window.$ = window.jquery = require('jquery');
const win = require('electron').remote.getCurrentWindow();
const { ipcRenderer, shell } = require('electron');
const os = require('os');
const path = require('path');
const siftlib = require('../js/siftlib');
const fs = require('fs');
var home = os.homedir().replace(/\\/g, '/');
const remote = require('electron').remote
var pathString = home;
var hindex = -1;
var hist = [];

JBody = $('body');
JContext = $('#context');
JRename = $('#renbox');
JFileList = $('#filelist');

function init() {
    $('#menupanel').css('style', 'none');
    setTheme();
    goTo((remote.process.argv[2] != null ? remote.process.argv[2] : home), 1);
}
function setTheme() {
    JBody.toggleClass('dark', 'light')
    $('#themeswitch div.panelItemSubject img').attr('src', () => {
        return '../img/' + (JBody.hasClass('dark') ? 'lgt' : 'drk') + '.png'
    });
    $('#themeswitch div.panelItemText').html((JBody.hasClass('dark') ? 'Light' : 'Dark') + ' Mode')
}

win.on('closed', () => {
    win = null;
});

win.on('resize', () => {
    if (win.isMaximized() === false) {
        $('#rsz_btn img').attr('src', '../img/max.png');
    }
});

function resizeWin() {
    if (win.isMaximized() === false) {
        win.maximize();
        $('#rsz_btn img').attr('src', '../img/res.png');
    } else {
        win.restore();
    }
}

$(document).contextmenu((evt) => {
    if ($(evt.target).closest('td.item').length !== 0) {
        iscd = false;
        listItem = $(evt.target).closest('td.item')[0];
        if (!$(listItem).hasClass('select')) {
            if ($(evt.target).hasClass('itemNameText')) {
                selectItem(listItem, 1);
            } else {
                deselectAll();
                iscd = true;
            }
        } $('#context-table').html(siftlib.popCMenu(evt, iscd))
    }
    $("#context").css('left', evt.clientX - (evt.clientX > (window.innerWidth - 150) ? 150 : 0));
    JContext.css('top', evt.clientY - (evt.clientY > (window.innerWidth - 210) ? 210 : 0));
    JFileList.removeClass('hover-enabled');
    JContext.addClass('show');
});


$(window).blur((e) => resetContext(e))
$(window).click((e) => resetContext(e))


function resetContext(evt) {
    if (JContext.hasClass('show')) {
        JContext.removeClass('show');
        if (!($(evt.target).parent().id === 'ren')) {
            JFileList.addClass('hover-enabled')
        };
        siftlib.clearPMenu();
    }
}

function deselectAll() {
    l = $('.select').length;
    if (l === 0) {
        siftlib.popPMenu(true);
    } else {
        Object.entries($('.select')).forEach((entry, i) => {
            if (i < l) {
                $(entry).removeClass('select');
                $(entry).children('div.topbtn').children('img').attr('src', `../img/${entry[1].attributes.type.value === "file" ? 'fil' : 'fld'}.png`);
            }
        });
    }
}

function selectItem(item, slflag) {
    $(item).children('div.topbtn').children('img').attr('src', `../img/${$(item).hasClass('select') ? 'chk0' : 'chk1'}.png`);
    selected = $('.select');
    if (slflag === 1) {
        deselectAll();
    }
    $(item).toggleClass('select', '')
    siftlib.popPMenu($('.select').length === 0 ? true : false);
}

ipcRenderer.on('goto', (e, loc) => {
    goTo(loc, 1);
})

function goBack() {
    hindex -= (hindex > 0 ? 1 : 0)
    return hist[hindex]
}
function goForth() {
    hindex += ((hindex + 1) < hist.length ? 1 : 0)
    return hist[hindex]
}

function menuPanel() {
    $('#menupanel').toggle();
    $('#content-box-holder').css('height', `Calc(100% - ${$('#menupanel').css('display') === 'none' ? 70 : 175}px)`);
}

function renameItem(itemName) {
    deselectAll();
    JFileList.removeClass('hover-enabled');
    $(`#${itemName} div.itemNameText`).html(`<input type="text" id="renbox" onkeydown="textFieldKeyHandler(event)" autofocus="autofocus"></input>`);
    JRename.val(JRename.closest('td.item').attr('id'));
    JRename.blur((evt) => { renameSubmit(evt) })
    JRename.keypress((evt) => { if (evt.key === 'Enter') { renameSubmit(evt) } })

}

function renameSubmit(evt) {
    if (JRename.closest('td.item').attr('id') !== evt.target.value) {
        fs.rename(pathString + JRename.closest('td.item').attr('id'), pathString + evt.target.value, (err) => {
            if (err) throw err;
        })
    }
    JRename.parent().html(`<div class="itemNameText">${evt.target.value}</div>`)
    JFileList.addClass('hover-enabled');
}

function textFieldKeyHandler(event) {
    if (event.key === 'Enter' && event.target.id === 'pathbox') {
        goTo(event.target.value, 1);
    }
};

function goTo(newPathString, navflag) {
    siftlib.clearPMenu();
    fs.stat(newPathString, '', (err) => {
        if (err) {
            switch (err.code) {
                case ('EPERM'): {
                    console.log('Your system restricts "' + newPathString + '".');
                    break;
                }
                case ('ENOENT'): {
                    console.log(newPathString + ' does not exist in the current filesystem.');
                    break;
                }
                case ('EACCES'): {
                    console.log('You do not have the account permissions to access "' + newPathString + '".');
                    break;
                }
                default: {
                    console.log('Whoops! I got something wrong, here. Try that again.')
                    break;
                }
            }
        } else {
            ftype = (fs.statSync(newPathString).isFile() ? 'file' : 'folder');
            if (ftype === 'folder') {
                fs.readdir(newPathString, { 'encoding': 'utf8', 'withFileTypes': true }, (err, files) => {
                    JFileList.html('');
                    files.forEach((element) => {
                        if (element.isDirectory()) {
                            JFileList.append(`<tr><td type="folder" id="${(element.name.indexOf('.') === 0 ? '\\' : '') + element.name}" class="item"><div class="topbtn" onmouseover="if(!this.parentElement.classList.contains('select')){this.children[0].src='../img/chk0.png';};" onmouseout="if(!this.parentElement.classList.contains('select')){this.children[0].src='../img/fld.png'}"><img src="../img/fld.png" onclick="selectItem(this.parentElement.parentElement, 0)"/></div><div class="itemRow" onclick="selectItem(this.parentElement, 1)" ondblclick="goTo(pathString + '${element.name}', 1)"><div class="itemNameText">${element.name}</div></div></td></tr>`)
                        }
                    })
                    files.forEach((element) => {
                        if (element.isFile()) {
                            JFileList.append(`<tr><td type="file" id="${element.name}" class="item"><div class="topbtn" onmouseover="if(!this.parentElement.classList.contains('select')){this.children[0].src='../img/chk0.png';};" onmouseout="if(!this.parentElement.classList.contains('select')){this.children[0].src='../img/fil.png'}"><img src="../img/fil.png" onclick="selectItem(this.parentElement.parentElement, 0)"/></div><div class="itemRow" onclick="selectItem(this.parentElement, 1)" ondblclick="goTo(pathString + '${element.name}', 1)"><div class="itemNameText">${element.name}</div></div></td></tr>`)
                        }
                    })
                });
                if ((newPathString.lastIndexOf('/') + 1) !== newPathString.length) {
                    newPathString += '/'
                }
                ;
                $('#pathbox').val(newPathString);
                $('#content-box-holder').scrollTop(0);
                if (pathString !== newPathString) {
                    if (navflag == 1) {
                        if (((hindex + 1) !== hist.length) && (hist[hindex] !== newPathString)) { //adapt the length of the history array
                            hist.length = hindex + 1
                        }
                        hindex++
                        hist[hindex] = newPathString;
                    }
                    pathString = newPathString;
                }
            } else {
                shell.openItem(newPathString);
            }
        }
    });
}