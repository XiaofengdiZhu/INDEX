var $progressBar = $("#progressBar");
var $resourcesListGrid = $("#resourcesListGrid");
var $sitesList = $("#sitesList");
var bodyWidth = $("body").width();
var nowDate = new Date();
var resourcesListSortBy = "";
var resourcesListSortInAsc = false;
var resourcesListFilter = "";
var locationSearch = window.location.search;
var testedCount = -1;
var testInterval =null;

Initiate();

//初始化
function Initiate() {
    //根据表单设置搜索内容
    if (locationSearch .length > 0) {
        if(locationSearch.lastIndexOf("SearchDirectly=") != -1)resourcesListFilter = decodeURIComponent(locationSearch.substring(locationSearch.lastIndexOf("SearchDirectly=") + 7, locationSearch.length));
    }
    $("#searchInput").val(resourcesListFilter);

    //元素事件绑定
    window.onresize = function () {
        bodyWidth = $("body").width();
        $(".title").css("width", bodyWidth - 380);
    };
    $("#logo").on("click", function () {
        SearchDirectly("");
    });
    $("form").submit(function (event) {
        event.preventDefault();
        SearchDirectly($("#searchInput").val());
    });

    //更新资源和服务器列表
    SortAndUpdateResourcesList("publishDate");
    UpdateSitesList();

    //检测站点在线
    TestSitesOnline();
}

function SortAndUpdateResourcesList(orderBy) {
    switch (orderBy) {
        case resourcesListSortBy:
            if (resourcesListSortInAsc) resourcesListSortInAsc = false;
            else resourcesListSortInAsc = true;
            break;
        case "from":
            resourcesListSortInAsc = true;
            break;
        case "title":
            resourcesListSortInAsc = true;
            break;
        case "size":
            resourcesListSortInAsc = false;
            break;
        case "pulishDate":
            resourcesListSortInAsc = false;
            break;
    }
    resourcesListSortBy = orderBy;
    var order = function (x, y) {
        if (resourcesListSortInAsc) return (x[resourcesListSortBy] > y[resourcesListSortBy]) ? 1 : -1;
        else return (x[resourcesListSortBy] < y[resourcesListSortBy]) ? 1 : -1;
    };
    database_resources.sort(order);
    UpdateResourcesList();
}

function UpdateResourcesList() {
    $resourcesListGrid.empty();
    CreatTitleNode("category", "分类").appendTo($resourcesListGrid);
    CreatTitleNode("from", "压制", 'sortAndUpdateResourcesList("from");').appendTo($resourcesListGrid);
    CreatTitleNode("title", "标题", 'sortAndUpdateResourcesList("title");').appendTo($resourcesListGrid);
    CreatTitleNode("size", "大小", 'sortAndUpdateResourcesList("size");').appendTo($resourcesListGrid);
    CreatTitleNode("path", "下载").appendTo($resourcesListGrid);
    CreatTitleNode("publisher", "发布", 'sortAndUpdateResourcesList("publishDate");').appendTo($resourcesListGrid);
    switch (resourcesListSortBy) {
        case "from":
            if (resourcesListSortInAsc) $(".from.listTitle").addClass("sortedAsc");
            else $(".from.listTitle").addClass("sortedDesc");
            break;
        case "title":
            if (resourcesListSortInAsc) $(".title.listTitle").addClass("sortedAsc");
            else $(".title.listTitle").addClass("sortedDesc");
            break;
        case "size":
            if (resourcesListSortInAsc) $(".size.listTitle").addClass("sortedAsc");
            else $(".size.listTitle").addClass("sortedDesc");
            break;
        case "publishDate":
            if (resourcesListSortInAsc) $(".publisher.listTitle").addClass("sortedAsc");
            else $(".publisher.listTitle").addClass("sortedDesc");
            break;
    }
    for (var i = 0; i < database_resources.length; i++) {
        var info_resource = database_resources[i];
        if(info_resource["hidden"])continue;
        var isSiteOnline = database_site[info_resource["siteIndex"]]["isOnline"];
        var testedSiteOnline = database_site[info_resource["siteIndex"]]["testedOnline"];
        if (JSON.stringify(info_resource).indexOf(resourcesListFilter) == -1) continue;
        var categoryNode = $("<div></div>", {
            "class": "category listItem searchable textCenter"
        });
        $("<div></div>", {
            "class": "multilineInGrid",
            "text": info_resource["category"],
            "title": "搜索“" + info_resource["category"] + "”",
            "onclick": "SearchDirectly(\"" + info_resource["category"] + "\");"
        }).appendTo(categoryNode);
        $("<div></div>", {
            "class": "multilineInGrid",
            "text": info_resource["subcategory"],
            "title": "搜索“" + info_resource["subcategory"] + "”",
            "onclick": "SearchDirectly(\"" + info_resource["subcategory"] + "\");"
        }).appendTo(categoryNode);
        categoryNode.appendTo($resourcesListGrid);
        var fromNode = $("<div></div>", {
            "class": "from listItem searchable textCenter"
        });
        for(var j = 0;j<info_resource["from"].length;j++){
            $("<div></div>", {
                "class": "multilineInGrid",
                "text": info_resource["from"][j],
                "title": "搜索“" + info_resource["from"][j] + "”",
                "onclick": "SearchDirectly(\"" + info_resource["from"][j] + "\");"
            }).appendTo(fromNode);
        }
        fromNode.appendTo($resourcesListGrid);
        /*$("<div></div>", {
            "class": "from listItem searchable",
            "text": info_resource["from"],
            "title": "搜索“" + info_resource["from"] + "”",
            "onclick": "SearchDirectly(\"" + info_resource["from"] + "\");"
        }).appendTo($resourcesListGrid);*/
        var titleNode = $("<div></div>", {
            "class": "title listItem"
        });
        $("<div></div>", {
            "class": "multilineInGrid",
            "text": info_resource["title"],
            "title": info_resource["title"]
        }).appendTo(titleNode);
        $("<div></div>", {
            "class": "multilineInGrid resourceName",
            "text": info_resource["resourceName"],
            "title": info_resource["resourceName"]
        }).appendTo(titleNode);
        titleNode.appendTo($resourcesListGrid);
        $("<div></div>", {
            "class": "size listItem",
            "text": bytesToSize(info_resource["size"])
        }).appendTo($resourcesListGrid);
        var downloadNode = $("<div></div>", {
            "class": "download listItem"
        });
        if((info_resource["magnet"] || "").length > 0)downloadNode.append($("<a/>", {
            "class": "magnet multilineInGrid",
            "text": "磁力链接",
            "title": "使用BT下载工具从互联网下载该资源",
            "href": info_resource["magnet"],
            "target": "_blank"
        }));
        var isSiteAvailable = info_resource["siteStatus"] == "normal" && info_resource["status"] == "normal";
        var unavailableReason = (info_resource["siteStatus"] == "dead") ? "站点永久关闭" : ((info_resource["siteStatus"] == "maintenance") ? "站点维护中" : ((info_resource["status"] == "deleted") ? "已删除" : "未知原因"));
        downloadNode.append($("<a/>", {
            "class": "ftp multilineInGrid" + ((info_resource["siteStatus"] == "normal" && testedSiteOnline && isSiteOnline) ? " online" : (testedSiteOnline)?" offline":"") + ((info_resource["status"] == "normal") ? "" : " deleted"),
            "text": info_resource["siteName"],
            //"title": isSiteAvailable ? (isSiteOnline ? "使用FTP客户端从校园网下载该资源" : "尝试连接站点失败，请自行验证") : "该资源现在不可用：" + unavailableReason,
            "title": isSiteAvailable ? (testedSiteOnline?(isSiteOnline ? "使用FTP客户端从校园网下载该资源" : "尝试连接站点失败，请自行验证"):"使用FTP客户端从校园网下载该资源（站点在线状态未知）") : "该资源现在不可用：" + unavailableReason,
            "href": isSiteAvailable ? ("ftp://" + info_resource["siteAddress"] + "/" + info_resource["path"]) : "",
            "target": "_blank"
        }));
        downloadNode.appendTo($resourcesListGrid);
        var publisherNode = $("<div></div>", {
            "class": "publisher listItem textCenter"
        });
        $("<div></div>", {
            "class": "multilineInGrid searchable ",
            "text": info_resource["siteOwner"],
            "title": "搜索“" + info_resource["siteOwner"] + "”",
            "onclick": "SearchDirectly(\"" + info_resource["siteOwner"] + "\");"
        }).appendTo(publisherNode);
        var date = new Date(info_resource["publishDate"]);
        $("<div></div>", {
            "class": "multilineInGrid",
            "text": DateToString(date),
            "title": date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
        }).appendTo(publisherNode);
        publisherNode.appendTo($resourcesListGrid);
    }
    $(".title").css("width", $("body").width() - 500);
}

function Search(str) {
    window.location.href = "index.html?SearchDirectly=" + str;
}

function SearchDirectly(str) {
    $("#searchInput").val(str);
    resourcesListFilter = str;
    UpdateResourcesList();
}

function UpdateSitesList() {
    $sitesList.width(database_site.length * 144 - 4);
    $sitesList.empty();
    for(var i=0;i<database_site.length;i++){
        var siteInfo = database_site[i];
        $("<div></div>",{
           "class":"site searchable" + ((siteInfo["status"] == "normal" && siteInfo["testedOnline"] && siteInfo["isOnline"]) ? " online" : siteInfo["testedOnline"]?" offline":""),
           "text":siteInfo["name"],
            "title":(siteInfo["status"] == "dead") ? "站点永久关闭" : ((siteInfo["status"] == "maintenance") ? "站点维护中" : ((siteInfo["status"] == "normal") ? ((siteInfo["isOnline"]) ? "在线" : "离线"):"未知状态")),
            "onclick": "SearchDirectly(\"" + siteInfo["name"] + "\");"
        }).appendTo($sitesList);
        if(i < database_site.length - 1)$sitesList.append("<span>|</span>");
    }
}

function TestSitesOnline(){
    testedCount = -1;
    testInterval = setInterval(function () {
        if(testedCount == -1){
            testedCount++;
        }
        else if(testedCount<database_site.length){
            var siteInfo = database_site[testedCount];
            siteInfo["isOnline"] = false;
            if (siteInfo["status"] == "normal") $.ajax({
                type: "get",
                url: siteInfo["addressForTestOnline"],
                timeout: 120,
                dataType: "jsonp",
                complete: function (response) {
                    siteInfo["testedOnline"] = true;
                    console.log(response.status);
                    siteInfo["isOnline"] = (response.status == 200);
                }
            });
            testedCount++;
            setProgessBar(testedCount/database_site.length);
        }else {
            clearInterval(testInterval);
            UpdateResourcesList();
            UpdateSitesList();
        }
    },150);
}

function CreatTitleNode(css, text, onclick) {
    return $("<div></div>", {
        "class": css + " listTitle" + ((onclick == null) ? "" : " orderable"),
        "text": text,
        "onclick": onclick
    });
}

function setProgessBar(number) {
    $progressBar.stop(true);
    //$progressBar.animate({"opacity":"1"},0,"linear");
    $progressBar.css("opacity","1");
    var time = Math.abs(bodyWidth * number - $progressBar.width())/bodyWidth *500;
    $progressBar.animate({"width":(number*100) + "%"},time,"easeInExpo");
    if(number == 1){
        $progressBar.animate({"opacity":"0"},200,"linear",function () {
            $progressBar.css("width","0%");
        });
    }
}

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';

    var k = 1024;

    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function DateToString(date) {
    if (date.getFullYear() != nowDate.getFullYear()) return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    var timeString = date.getHours() + ":" + date.getMinutes();
    if (date.getMonth() != nowDate.getMonth()) return date.getMonth() + "-" + date.getDate() + " " + timeString;
    if (date.getDate() != nowDate.getDate()) {
        if (nowDate.getDate() - date.getDate() == 2) return "前天 " + timeString;
        else if (nowDate.getDate() - date.getDate() == 1) return "昨天 " + timeString;
        else return date.getMonth() + "-" + date.getDate() + " " + timeString;
    }
    if (date.getHours() != nowDate.getHours()) return "今天" + timeString;
    if (date.getMinutes() != nowDate.getMinutes()) return (nowDate.getMinutes() - date.getMinutes()) + "分钟前"
    return "刚刚";
}