var database_site = [];
var database_resources = [];

var addedSiteCount = 0;

//此处加载数据库文件
//LoadDatabaseFromFile("database_example.json");

function LoadDatabaseFromFile(name) {
    $.ajax({
        type: "get",
        url: "database/" + name ,
        async: false,
        dataType: "json",
        success: function (result) {
            database_site.push(result[0]);
            var siteInfo = database_site[addedSiteCount];
            for (var i = 1; i < result.length; i++) {
                result[i]["siteIndex"] = addedSiteCount;
                result[i]["siteStatus"] = siteInfo["status"];
                result[i]["siteName"] = siteInfo["name"];
                result[i]["siteOwner"] = siteInfo["owner"];
                result[i]["siteAddress"] = siteInfo["address"];
                result[i]["size"] = parseInt(result[i]["size"].replace(/,/g, ""));
                result[i]["resourceName"] = result[i]["resourceName"].replace(/\\/g, "/");
                database_resources.push(result[i]);
            }
            siteInfo["testedOnline"] = false;
            siteInfo["isOnline"] = false;
            addedSiteCount++;
        }
    });
}