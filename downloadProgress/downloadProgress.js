jQuery(document).ready(($) => {
  const { ipcRenderer } = require("electron");  
  
  let files = [];
  const REMOVE_TIMER = 5000;
  
  ipcRenderer.on('newFile', (event, args) => {
    addFile(args.id, args.fileName, args.extension, args.fullPath, args.bytes);
  });

  ipcRenderer.on('downloadingFile', (event, args) => {
    downloadingFile(args.id, args.perc);
  });

  ipcRenderer.on('fileDownloaded', (event, args) => {
    fileDownloaded(args.id);
  });
  
  const getTemplate = (selector) => {
    const el = $(selector);
    const contents = $(el).contents().clone();
    return contents;
  };
  
  const addFile = (id, fileName, extension, fullPath, bytes) => { 
    const contents = getTemplate("#itemRowNotFinished");
    contents.attr("id", id);
    contents.find("span.fileName").text(fileName);
    contents.find("div.icon").click(() => {
      removeFile(id);
      cancelDownload(id);
    });
    $("#container").append(contents);
    files.push({
      id,
      fileName,
      extension,
      bytes,
      fullPath,
      completed: false,
    });
  
    resizeWindow();
  };
  
  const downloadingFile = (id, perc) => {
    const el = $("#" + id);
    el.find("#percBar").css("width", perc + "%");
  };
  
  const fileDownloaded = (id) => {
    downloadingFile(id, 100);
    const file = files.find((item) => {
      return item.id === id;
    });
  
    let bytesUnit = "B";
    let bytes = file.bytes;
    let f = bytes / 1024;
    if (f >= 1) {
      bytes = f;
      f = f / 1024;
      bytesUnit = "KB";
      if (f >= 1) {
        bytes = f;
        bytesUnit = "MB";
      }
    }
    bytes = Math.round(bytes);
  
    let el = $("#" + id);
    el.find("div.icons").remove();
    let contents = getTemplate("#finishedOptions");
    el.append(contents);
    el.find("div.x").click((ev) => {
      ev.stopPropagation();
      removeFile(id);
    });
    el.find("div.folder").click((ev) => {
      ev.stopPropagation();
      openFolder();
    });
    el.click(() => {
      openFolder(id);
    });
  
    el.find("div.bar").remove();
    let conts = getTemplate("#finishedInfo");
    conts.find("span").text(bytes + " " + bytesUnit + " " + file.extension);
    el.find("div.info").append(conts);
  
    el.addClass("completed");
    file.completed = true;
    
    resizeWindow();
    setTimeout(() => removeFile(id), REMOVE_TIMER);
  };
  
  const removeFile = (id) => {
    files = files.filter((item) => {
      return item.id !== id;
    });
    
    if (files.length > 0) {
      $("#" + id).remove();
    } else {
      ipcRenderer.send('closeDownloadWindow', files.length);
    }
  
    resizeWindow();
  };
  
  const openFolder = (id) => {
    const file = files.find((item) => {
      return item.id === id;
    });
    ipcRenderer.send('openFolder', { fullPath: file.fullPath });
  };
  
  const cancelDownload = (id) => {
    const file = files.find((item) => {
      return item.id === id;
    });
  
    ipcRenderer.send('cancelDownload', { id: file.id });
  };
  
  const resizeWindow = () => {
    const el = $("body");
    $('html').height(el.height());

    ipcRenderer.send('resizeWindow', { width: el.width(), height: el.height() + 1, });
  };  
});
